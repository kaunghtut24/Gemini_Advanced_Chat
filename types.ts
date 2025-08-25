export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant',
}

export interface Source {
  title: string;
  uri: string;
}

export interface Message {
  role: Role;
  content: string;
  sources?: Source[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

// Authentication types
export interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  token: string | null;
  expiresAt: number | null;
}

export interface LoginCodeRequest {
  email: string;
}

export interface LoginCodeVerification {
  email: string;
  code: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  email?: string;
  expiresAt?: number;
}
