export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
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

// AI Provider types
export enum AIProvider {
  GEMINI = 'gemini',
  OPENAI = 'openai',
  CUSTOM = 'custom'
}

export enum SearchProvider {
  NONE = 'none',
  GEMINI = 'gemini', // Built-in Gemini search
  TAVILY = 'tavily',
  SERPAPI = 'serpapi'
}

export interface SearchProviderConfig {
  provider: SearchProvider;
  apiKey?: string;
  isDefault?: boolean;
}

export interface ProviderConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string; // For OpenAI-compatible providers
  customName?: string; // Display name for custom providers
  models: string[]; // Available models for this provider
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  providerConfig: ProviderConfig;
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
