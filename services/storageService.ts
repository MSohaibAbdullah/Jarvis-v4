
import { AppState, Project, User } from '../types';
import { db } from './firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const USER_KEY = 'jarvis_user_session';

const getInitialState = (): AppState => {
  const initialProject: Project = {
    id: 'default-node-01',
    name: 'Genesis Node',
    icon: 'G',
    description: 'Primary sovereign interface initialization.',
    files: [],
    threads: [],
    activeThreadId: null,
    createdAt: Date.now(),
  };

  return {
    projects: [initialProject],
    activeProjectId: 'default-node-01',
  };
};

// --- Local Storage (Fallback/Cache) ---

export const loadStateLocal = (userId: string): AppState => {
  try {
    const key = `jarvis_data_${userId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load JARVIS state locally", e);
  }
  return getInitialState();
};

export const saveStateLocal = (state: AppState, userId: string) => {
  try {
    const key = `jarvis_data_${userId}`;
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save JARVIS state locally", e);
  }
};

// --- Firestore (Remote) ---

export const loadStateRemote = async (userId: string): Promise<AppState> => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as AppState;
    }
  } catch (e) {
    console.error("Failed to load JARVIS state from cloud", e);
  }
  // Fallback to local if cloud fails or doesn't exist yet
  return loadStateLocal(userId);
};

export const saveStateRemote = async (state: AppState, userId: string) => {
  // Always save local first for speed/offline
  saveStateLocal(state, userId);
  
  try {
    const docRef = doc(db, "users", userId);
    await setDoc(docRef, state);
  } catch (e) {
    console.error("Failed to save JARVIS state to cloud", e);
  }
};

// --- User Management ---

export const clearUserData = (userId: string) => {
    try {
        const key = `jarvis_data_${userId}`;
        localStorage.removeItem(key);
    } catch (e) {
        console.error("Failed to clear user data", e);
    }
};

export const loadUser = (): User | null => {
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load User", e);
  }
  return null;
};

export const saveUser = (user: User) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error("Failed to save User", e);
  }
};

export const logoutUser = () => {
  localStorage.removeItem(USER_KEY);
};

export const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
