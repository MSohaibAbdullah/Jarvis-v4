
export interface FileDoc {
  id: string;
  name: string;
  type: string;
  content: string; // Text content or base64
  timestamp: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  images?: string[]; // Base64 strings for generated images
}

export interface Thread {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  icon: string; // just a char or emoji
  description: string;
  files: FileDoc[];
  threads: Thread[];
  activeThreadId: string | null;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  isGuest: boolean;
  provider: 'email' | 'google' | 'guest';
}

export interface AppState {
  projects: Project[];
  activeProjectId: string | null;
}

export type ModelType = 'gemini-3-flash-preview' | 'gemini-3-pro-preview';

export enum JarivisStatus {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  RECORDING = 'RECORDING',
  ERROR = 'ERROR'
}
