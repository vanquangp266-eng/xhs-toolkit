export interface UserInput {
  roleName: string;
  roleBackground: string;
  roleValues: string;
  familyDetails: string; // e.g., "3 kids, oldest loves coding..."
  productName: string;
  productFeatures: string;
  targetAudience: string;
  painPoints: string;
}

export interface GeneratedResult {
  prompt: string;
  isGenerating: boolean;
  error?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  input: UserInput;
  prompt: string;
}

export enum AppStep {
  INPUT = 'INPUT',
  GENERATING = 'GENERATING',
  RESULT = 'RESULT'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  extractedData?: Partial<UserInput>;
  file?: {
    name: string;
    type: string;
  };
}

export interface AssistantResponse {
  conversationalResponse: string;
  extractedData: Partial<UserInput>;
}