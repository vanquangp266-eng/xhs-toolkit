export type NoteType = 'SEARCH' | 'TRAFFIC' | 'SALES';

export interface CopyRequest {
  topic: string;
  targetAudience: string;
  noteType: NoteType;
  customPrompt?: string;
  customProduct?: string;
}

export interface GeneratedCopy {
  id: string;
  timestamp: number;
  title: string;
  content: string;
  // Store the request parameters to rebuild context if needed
  originalRequest: CopyRequest; 
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  MODIFYING = 'MODIFYING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface ProductManual {
  id: string;
  name: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}