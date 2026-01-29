
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { KnowledgeModal } from './components/KnowledgeModal';
import { ProjectSettingsModal } from './components/ProjectSettingsModal';
import { VoiceOverlay } from './components/VoiceOverlay';
import { AuthScreen } from './components/AuthScreen';
import { AppState, JarivisStatus, Message, Project, Thread, FileDoc, User } from './types';
import { loadStateLocal, saveStateRemote, loadStateRemote, generateId, loadUser, saveUser, logoutUser, clearUserData } from './services/storageService';
import { streamChatResponse, generateImage, processVoiceCommand, generateTitle } from './services/geminiService';
import { auth } from './services/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(loadUser());
  const [isLoadingState, setIsLoadingState] = useState(false);
  
  // Initial state is empty or local, updated via effect
  const [state, setState] = useState<AppState>(() => {
    if (user) {
        return loadStateLocal(user.id);
    }
    return loadStateLocal('temp'); 
  });

  const [status, setStatus] = useState<JarivisStatus>(JarivisStatus.IDLE);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Responsive Init
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Persist state on change ONLY if user is logged in
  useEffect(() => {
    if (user) {
      saveStateRemote(state, user.id);
    }
  }, [state, user]);

  // Auth Listener and Remote Data Loading
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const appUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          isGuest: false, // If using Firebase, they aren't a guest in our internal logic
          provider: firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email'
        };
        
        setUser(appUser);
        saveUser(appUser);

        // Load remote data
        setIsLoadingState(true);
        const remoteState = await loadStateRemote(appUser.id);
        setState(remoteState);
        setIsLoadingState(false);

      } else {
        // Check if we have a Guest user stored locally
        const storedUser = loadUser();
        if (storedUser && storedUser.isGuest) {
            setUser(storedUser);
            // Guest data is local only
            const localState = loadStateLocal(storedUser.id);
            setState(localState);
        } else {
            // No user
            setUser(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (newUser: User) => {
    // This is primarily for Guest login now, as Firebase listener handles the others
    if (newUser.isGuest) {
        setUser(newUser);
        saveUser(newUser);
        const localState = loadStateLocal(newUser.id);
        setState(localState);
    }
  };

  const handleLogout = async () => {
    if (user) {
        if (user.isGuest) {
            clearUserData(user.id);
            setUser(null);
            logoutUser();
        } else {
            try {
                await signOut(auth);
                logoutUser();
                setUser(null);
            } catch (e) {
                console.error("Logout failed", e);
            }
        }
    }
  };

  const activeProject = state.projects.find(p => p.id === state.activeProjectId);
  const activeThread = activeProject?.threads.find(t => t.id === activeProject.activeThreadId);

  // Auto-initialize chat if none exists
  useEffect(() => {
    if (user && activeProject && !activeThread && !isLoadingState) {
      if (activeProject.threads.length > 0) {
        // Switch to the most recent thread
        handleSelectThread(activeProject.threads[0].id);
      } else {
        // Create a default thread immediately
        const newThread: Thread = {
          id: generateId(),
          title: 'New Session',
          messages: [],
          createdAt: Date.now()
        };
        const updatedProject = {
          ...activeProject,
          threads: [newThread],
          activeThreadId: newThread.id
        };
        updateProject(updatedProject);
      }
    }
  }, [activeProject?.id, user, isLoadingState]); 

  const handleSelectProject = (id: string) => {
    setState(prev => ({ ...prev, activeProjectId: id }));
  };

  const handleCreateProject = () => {
    const newProject: Project = {
      id: generateId(),
      name: `Node ${state.projects.length + 1}`,
      icon: String.fromCharCode(65 + (state.projects.length % 26)), 
      description: 'Uninitialized Data Node',
      files: [],
      threads: [],
      activeThreadId: null,
      createdAt: Date.now()
    };
    setState(prev => ({
      ...prev,
      projects: [...prev.projects, newProject],
      activeProjectId: newProject.id
    }));
  };

  const handleUpdateProject = (id: string, name: string, description: string) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, name, description } : p)
    }));
  };

  const handleDeleteProject = (id: string) => {
    setState(prev => {
      const remaining = prev.projects.filter(p => p.id !== id);
      return {
        ...prev,
        projects: remaining,
        activeProjectId: remaining.length > 0 ? remaining[0].id : null
      };
    });
    setShowProjectSettings(false);
  };

  const handleCreateThread = () => {
    if (!activeProject) return;
    const newThread: Thread = {
      id: generateId(),
      title: 'New Session',
      messages: [],
      createdAt: Date.now()
    };
    const updatedProject = {
      ...activeProject,
      threads: [newThread, ...activeProject.threads],
      activeThreadId: newThread.id
    };
    updateProject(updatedProject);
    // On mobile, close sidebar after creating new session for immediate typing
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleDeleteThread = (threadId: string) => {
    setState(prev => {
        const projectIndex = prev.projects.findIndex(p => p.id === prev.activeProjectId);
        if (projectIndex === -1) return prev;

        const activeProj = prev.projects[projectIndex];
        const newThreads = activeProj.threads.filter(t => t.id !== threadId);

        // Calculate new active thread ID
        let newActiveThreadId = activeProj.activeThreadId;
        if (activeProj.activeThreadId === threadId) {
            newActiveThreadId = newThreads.length > 0 ? newThreads[0].id : null; 
        }

        const newProject = {
            ...activeProj,
            threads: newThreads,
            activeThreadId: newActiveThreadId
        };

        // Create new projects array
        const newProjects = [...prev.projects];
        newProjects[projectIndex] = newProject;

        return { ...prev, projects: newProjects };
    });
  };

  const handleDeleteFile = (fileId: string) => {
    setState(prev => {
        // We use map to create a new array and update only the matching project
        const newProjects = prev.projects.map(project => {
            if (project.id === prev.activeProjectId) {
                // Filter out the file with the matching ID
                const newFiles = project.files.filter(f => f.id !== fileId);
                return { ...project, files: newFiles };
            }
            return project;
        });

        return { ...prev, projects: newProjects };
    });
  };

  const handleSelectThread = (id: string) => {
    if (!activeProject) return;
    updateProject({ ...activeProject, activeThreadId: id });
    // On mobile, close sidebar on selection
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const updateProject = (updated: Project) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === updated.id ? updated : p)
    }));
  };

  const handleUploadFiles = (files: FileDoc[]) => {
    if (!activeProject) return;
    const updatedProject = {
      ...activeProject,
      files: [...activeProject.files, ...files]
    };
    updateProject(updatedProject);
  };

  const handleSendMessage = async (text: string) => {
    if (!activeProject) return;
    
    // Ensure thread exists
    let currentThread = activeThread;
    if (!currentThread) {
      const newThread: Thread = {
        id: generateId(),
        title: 'New Session',
        messages: [],
        createdAt: Date.now()
      };
      currentThread = newThread;
    }
    
    if(!currentThread) return;

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    let updatedThread = {
      ...currentThread,
      messages: [...currentThread.messages, userMsg]
    };
    
    // Check for Image Gen command
    const isImageGen = text.trim().startsWith('/gen');
    
    if (isImageGen) {
      const prompt = text.replace('/gen', '').trim();
      updateProjectWithThread(activeProject, updatedThread);
      setStatus(JarivisStatus.THINKING);

      try {
         const imageBase64 = await generateImage(prompt);
         const modelMsg: Message = {
            id: generateId(),
            role: 'model',
            content: `Schematic generated for: "${prompt}"`,
            timestamp: Date.now(),
            images: [imageBase64]
         };
         updatedThread = {
            ...updatedThread,
            messages: [...updatedThread.messages, modelMsg]
         };
         updateProjectWithThread(activeProject, updatedThread);
      } catch (e) {
         console.error(e);
         // Error handling msg
         const errorMsg: Message = { id: generateId(), role: 'model', content: "VISUAL_CORE_FAILURE: Unable to generate schematic.", timestamp: Date.now()};
         updatedThread = { ...updatedThread, messages: [...updatedThread.messages, errorMsg]};
         updateProjectWithThread(activeProject, updatedThread);
      } finally {
        setStatus(JarivisStatus.IDLE);
      }
      return;
    }

    // Normal Chat Stream
    updateProjectWithThread(activeProject, updatedThread);
    setStatus(JarivisStatus.THINKING);

    // Placeholder for stream
    const modelMsgId = generateId();
    const modelMsgPlaceholder: Message = {
      id: modelMsgId,
      role: 'model',
      content: '', // Start empty
      timestamp: Date.now(),
      isStreaming: true
    };
    
    updatedThread = {
      ...updatedThread,
      messages: [...updatedThread.messages, modelMsgPlaceholder]
    };
    updateProjectWithThread(activeProject, updatedThread);

    try {
      let accumulatedText = "";
      
      const model = activeProject.files.length > 0 ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

      await streamChatResponse(
        model,
        currentThread.messages, 
        activeProject.files,
        text,
        (chunk) => {
          accumulatedText += chunk;
          
          setState(current => {
             const proj = current.projects.find(p => p.id === activeProject.id);
             if(!proj) return current;
             const th = proj.threads.find(t => t.id === updatedThread.id);
             if(!th) return current;
             
             const updatedMsgs = th.messages.map(m => 
                m.id === modelMsgId ? { ...m, content: accumulatedText } : m
             );
             
             const newTh = { ...th, messages: updatedMsgs };
             const newProj = { ...proj, threads: proj.threads.map(t => t.id === newTh.id ? newTh : t)};
             
             return {
               ...current,
               projects: current.projects.map(p => p.id === newProj.id ? newProj : p)
             };
          });
        }
      );

      // MARK AS DONE STREAMING
      setState(current => {
         const proj = current.projects.find(p => p.id === activeProject.id);
         if(!proj) return current;
         const th = proj.threads.find(t => t.id === updatedThread.id);
         if(!th) return current;
         
         const updatedMsgs = th.messages.map(m => 
            m.id === modelMsgId ? { ...m, isStreaming: false } : m
         );
         
         const newTh = { ...th, messages: updatedMsgs };
         const newProj = { ...proj, threads: proj.threads.map(t => t.id === newTh.id ? newTh : t)};
         
         return {
           ...current,
           projects: current.projects.map(p => p.id === newProj.id ? newProj : p)
         };
      });
      
      // Dynamic Title Generation
      if (updatedThread.messages.length === 2) { 
         const messagesForTitle = [
            userMsg,
            { ...modelMsgPlaceholder, content: accumulatedText }
         ];
         
         generateTitle(messagesForTitle).then(newTitle => {
            setState(current => {
               const proj = current.projects.find(p => p.id === activeProject.id);
               if(!proj) return current;
               const th = proj.threads.find(t => t.id === updatedThread.id);
               if(!th) return current;
               
               const titleTh = { ...th, title: newTitle };
               const newProj = { ...proj, threads: proj.threads.map(t => t.id === titleTh.id ? titleTh : t)};
               return {
                 ...current,
                 projects: current.projects.map(p => p.id === newProj.id ? newProj : p)
               };
            });
         });
      }

    } catch (e) {
      console.error(e);
       setState(current => {
             const proj = current.projects.find(p => p.id === activeProject.id);
             if(!proj) return current;
             const th = proj.threads.find(t => t.id === updatedThread.id);
             if(!th) return current;
             
             const updatedMsgs = th.messages.map(m => 
                m.id === modelMsgId ? { ...m, content: "NEURAL_CORE_ERROR: CONNECTION SEVERED OR API KEY INVALID.", isStreaming: false } : m
             );
             return {
                ...current,
                projects: current.projects.map(p => p.id === proj.id ? {...proj, threads: proj.threads.map(t => t.id === th.id ? {...th, messages: updatedMsgs} : t)} : p)
             };
       });
    } finally {
      setStatus(JarivisStatus.IDLE);
    }
  };

  const handleVoiceSend = async (audioBlob: Blob) => {
    setShowVoice(false);
    setStatus(JarivisStatus.THINKING);
    if (!activeProject) return;

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
       const base64data = (reader.result as string).split(',')[1];
       
       try {
         const responseText = await processVoiceCommand(base64data, activeProject.files);
         
         let currentThread = activeThread;
         if (!currentThread) {
            const newThread: Thread = { id: generateId(), title: 'Voice Session', messages: [], createdAt: Date.now() };
            currentThread = newThread;
            updateProjectWithThread(activeProject, newThread);
         }

         const userMsg: Message = { id: generateId(), role: 'user', content: "[ENCRYPTED AUDIO TRANSMISSION]", timestamp: Date.now() };
         const modelMsg: Message = { id: generateId(), role: 'model', content: responseText, timestamp: Date.now() };
         
         const updatedThread = {
            ...currentThread,
            messages: [...currentThread.messages, userMsg, modelMsg]
         };
         updateProjectWithThread(activeProject, updatedThread);

       } catch (e) {
          console.error(e);
       } finally {
          setStatus(JarivisStatus.IDLE);
       }
    };
  };

  const updateProjectWithThread = (project: Project, thread: Thread) => {
     setState(prev => {
        const pIndex = prev.projects.findIndex(p => p.id === project.id);
        if(pIndex === -1) return prev;
        
        const newProj = { ...prev.projects[pIndex] };
        const tIndex = newProj.threads.findIndex(t => t.id === thread.id);
        
        if (tIndex > -1) {
           newProj.threads[tIndex] = thread;
        } else {
           newProj.threads = [thread, ...newProj.threads];
           newProj.activeThreadId = thread.id;
        }
        
        const newProjects = [...prev.projects];
        newProjects[pIndex] = newProj;
        return { ...prev, projects: newProjects };
     });
  };

  // If no user is logged in, show Auth Screen
  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden text-gray-800 font-sans relative">
      
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        projects={state.projects}
        activeProjectId={state.activeProjectId}
        activeThreadId={activeProject?.activeThreadId || null}
        isOpen={isSidebarOpen}
        user={user}
        onSelectProject={handleSelectProject}
        onSelectThread={handleSelectThread}
        onCreateProject={handleCreateProject}
        onCreateThread={handleCreateThread}
        onOpenKnowledge={() => setShowKnowledge(true)}
        onEditProject={() => setShowProjectSettings(true)}
        onDeleteThread={handleDeleteThread}
        onDeleteFile={handleDeleteFile}
        onLogout={handleLogout}
      />
      
      {isLoadingState ? (
         <div className="flex-1 bg-white flex flex-col items-center justify-center text-gray-400 font-medium">
             <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-xs uppercase tracking-widest">Syncing with Node...</p>
         </div>
      ) : activeProject && activeThread ? (
        <ChatArea 
          messages={activeThread.messages} 
          status={status}
          onSendMessage={handleSendMessage}
          onVoiceStart={() => setShowVoice(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      ) : (
        <div className="flex-1 bg-white flex flex-col items-center justify-center text-gray-400 font-medium">
          <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mb-6 shadow-xl animate-pulse">
             <div className="w-8 h-8 border-2 border-white rounded-full"></div>
          </div>
          <p className="tracking-wide text-sm font-semibold text-gray-800">INITIALIZING...</p>
        </div>
      )}

      <KnowledgeModal 
        isOpen={showKnowledge} 
        onClose={() => setShowKnowledge(false)} 
        onUpload={handleUploadFiles} 
      />
      
      <ProjectSettingsModal 
        isOpen={showProjectSettings}
        project={activeProject}
        onClose={() => setShowProjectSettings(false)}
        onSave={handleUpdateProject}
        onDelete={handleDeleteProject}
      />

      <VoiceOverlay 
        isActive={showVoice} 
        onCancel={() => setShowVoice(false)}
        onSendAudio={handleVoiceSend}
      />
    </div>
  );
};

export default App;
