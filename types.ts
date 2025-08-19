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
