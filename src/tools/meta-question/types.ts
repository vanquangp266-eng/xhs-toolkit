export interface MetaQuestion {
  id: string;
  text: string;
}

export interface MetaQuestionDetail {
  metaQuestion: string;
  originalTopics: string[];
}

export interface DimensionCategory {
  dimensionName: string;
  description: string;
  questions: MetaQuestionDetail[];
}

export interface AnalysisResult {
  totalInputLines: number;
  totalMetaQuestions: number;
  categories: DimensionCategory[];
}

export interface DeepAnalysisReport {
  targetAudience: string;
  scenario: string;
  painPoints: string;
  desiredOutcome: string;
  solutions: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  inputText: string;
  result: DimensionCategory[];
}

export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}