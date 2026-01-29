import React from 'react';
import { Project, Thread, User } from '../types';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  activeThreadId: string | null;
  isOpen: boolean;
  user: User | null;
  onSelectProject: (id: string) => void;
  onSelectThread: (id: string) => void;
  onCreateProject: () => void;
  onCreateThread: () => void;
  onOpenKnowledge: () => void;
  onEditProject: () => void;
  onDeleteThread: (threadId: string) => void;
  onDeleteFile: (fileId: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  activeProjectId,
  activeThreadId,
  isOpen,
  user,
  onSelectProject,
  onSelectThread,
  onCreateProject,
  onCreateThread,
  onOpenKnowledge,
  onEditProject,
  onDeleteThread,
  onDeleteFile,
  onLogout
}) => {
  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <>
      {/* Root Container: Fixed off-screen on mobile, Static on Desktop */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 h-[100dvh] flex font-sans bg-black border-r border-neutral-900 shadow-2xl md:shadow-none
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:relative md:translate-x-0
        `}
      >
        {/* Node Rail - Always visible within the sidebar container */}
        <div className="w-16 bg-[#050505] flex flex-col items-center py-6 border-r border-neutral-900 gap-4 flex-shrink-0 z-20">
          
          {/* LOGO */}
          <div className="flex flex-col items-center gap-1.5 mb-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
              </div>
              <span className="text-[8px] font-bold tracking-[0.2em] text-gray-500 uppercase">JARVIS</span>
          </div>

          <div className="w-8 h-[1px] bg-neutral-900 mb-2"></div>

          <div className="flex-1 flex flex-col gap-3 w-full items-center overflow-y-auto no-scrollbar">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className={`w-10 h-10 flex items-center justify-center font-medium text-sm transition-all duration-200 rounded-xl border flex-shrink-0 ${
                  activeProjectId === p.id 
                    ? 'bg-white text-black border-white shadow-lg scale-105' 
                    : 'bg-neutral-900/50 text-gray-500 border-neutral-800 hover:border-gray-600 hover:text-gray-300 hover:bg-neutral-900'
                }`}
                title={p.name}
              >
                {p.icon}
              </button>
            ))}
            <button
              onClick={onCreateProject}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-transparent border border-neutral-800 text-gray-600 hover:text-white hover:border-gray-500 transition-colors flex-shrink-0 mt-2"
              title="Create New Node"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>

          {/* User / Logout Section */}
          <div className="mt-auto flex flex-col items-center gap-3 w-full pt-4 border-t border-neutral-900">
             <div 
               className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-gray-300 border border-neutral-700 cursor-help"
               title={`Logged in as ${user?.name || 'Guest'}`}
             >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
             </div>
             <button
               onClick={onLogout}
               className="text-gray-600 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-neutral-900"
               title="Disconnect Session"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
             </button>
          </div>
        </div>

        {/* Project Context Rail - Collapsible on Desktop, full width in drawer on mobile */}
        <div 
          className={`
            bg-matte-black flex flex-col transition-all duration-300 ease-in-out overflow-hidden
            ${isOpen ? 'w-[75vw] md:w-64 opacity-100' : 'w-0 opacity-0'}
          `}
        >
          <div className="w-full h-full flex flex-col min-w-[16rem]"> 
            {activeProject ? (
              <>
                <div className="p-5 border-b border-neutral-900 flex-shrink-0">
                  <div className="flex justify-between items-start mb-1">
                    <h1 className="text-white font-semibold tracking-tight truncate max-w-[170px] text-base" title={activeProject.name}>{activeProject.name}</h1>
                    <button 
                      onClick={onEditProject}
                      className="text-gray-600 hover:text-white transition-colors p-1"
                      title="Node Settings"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mb-4 truncate">{activeProject.description}</p>
                  
                  <button 
                    onClick={onOpenKnowledge}
                    className="w-full py-2.5 px-3 rounded-lg border border-neutral-800 bg-neutral-900/40 text-xs font-medium text-gray-400 hover:bg-neutral-800 hover:text-white hover:border-neutral-700 transition-all flex items-center justify-between group"
                  >
                    <span>Upload Knowledge</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-5">
                  
                  {/* Knowledge Base Section */}
                  <div>
                      <div className="flex justify-between items-center px-2 mb-2">
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Context Data</span>
                          <span className="text-[10px] text-gray-500 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded-md font-mono">{activeProject.files.length}</span>
                      </div>
                      
                      {activeProject.files.length === 0 ? (
                          <div className="px-3 py-6 border border-dashed border-neutral-800/50 rounded-lg text-center bg-neutral-900/20">
                              <p className="text-[10px] text-gray-600 italic">No data ingested.</p>
                          </div>
                      ) : (
                          <div className="space-y-1">
                              {activeProject.files.map(file => (
                                  <div key={file.id} className="group flex items-center justify-between py-2 px-3 rounded-lg text-sm bg-neutral-900/30 border border-transparent hover:border-neutral-800 hover:bg-neutral-900 transition-all cursor-default">
                                      <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                          <span className="truncate text-gray-400 group-hover:text-gray-200 text-xs" title={file.name}>{file.name}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  {/* Threads Section */}
                  <div className="border-t border-neutral-900/50 pt-4">
                    <div className="flex justify-between items-center mb-2 px-2">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Sessions</span>
                      <button onClick={onCreateThread} className="text-gray-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </button>
                    </div>
                    
                    <div className="space-y-1">
                      {activeProject.threads.map(thread => (
                          <div
                              key={thread.id}
                              className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-sm transition-all group ${
                                  activeThreadId === thread.id
                                  ? 'bg-neutral-800 text-white shadow-sm'
                                  : 'text-gray-400 hover:bg-neutral-900 hover:text-gray-200'
                              }`}
                          >
                              <button
                                  onClick={() => onSelectThread(thread.id)}
                                  className="flex-1 text-left truncate min-w-0 focus:outline-none"
                                  title={thread.title}
                              >
                                  {thread.title}
                              </button>
                          </div>
                      ))}
                    </div>
                  </div>

                </div>
                
              </>
            ) : (
              <div className="p-8 text-gray-600 text-sm text-center flex items-center justify-center h-full">Select a Node</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};