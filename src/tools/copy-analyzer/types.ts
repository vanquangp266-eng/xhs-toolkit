
export interface MindMapLeaf {
  text: string;
}

export interface MindMapElement {
  name: string; // The structural element name (e.g., "Pain Point", "Contrast")
  details: string[]; // Detailed content points/formulas
}

export interface MindMapPhase {
  phaseName: string; // e.g., "Opening", "Body"
  elements: MindMapElement[];
}

export interface StructureData {
  rootTheme: string;
  phases: MindMapPhase[];
}

export interface SentenceDetail {
  text: string;
  technique: string; // Micro-technique for this specific sentence
  effect: string;    // The psychological effect or function
}

export interface ParagraphAnalysis {
  excerpt: string;
  sentences: SentenceDetail[]; // New granular breakdown
  style: string;
  logic: string;
  tone: string;
  rhythm: string;
  transition: string;
  purpose: string;
}

export interface AnalysisResult {
  fullText: string;
  summary: string;
  structure: StructureData;
  breakdown: ParagraphAnalysis[];
}

// --- PATTERN & GENERATION TYPES ---

export interface StyleFeature {
  featureName: string; // e.g. "Short Staccato Sentences"
  description: string; // e.g. "Uses 3-5 word sentences to build urgency."
}

export interface PatternExample {
  textIndex: number;
  excerpt: string;
  explanation: string;
}

export interface PatternStep {
  stepName: string;
  abstractLogic: string;
  examples: PatternExample[];
}

export interface PatternAnalysisResult {
  frameworkName: string;
  coreLogic: string;
  styleDNA: {
    tone: string; 
    rhythm: string; 
    vocabulary: string; 
    sentenceStructure: string; 
    keyFeatures: StyleFeature[]; 
  };
  steps: PatternStep[];
  suggestedPrompt: string; 
}

export interface LoadingState {
  status: 'idle' | 'analyzing' | 'complete' | 'error' | 'generating';
  message?: string;
}

// --- NEW VIDEO GENERATION TYPES ---

export interface VideoScene {
  id: number;
  textSegment: string;      // The narration text for this scene
  imagePrompt: string;      // The visual description for AI
  imageUrl?: string;        // The generated image URL (Base64 or Blob)
  audioUrl?: string;        // The generated audio URL (Blob)
  duration?: number;        // Duration in seconds (derived from audio)
  status: 'pending' | 'generating' | 'done' | 'error';
}

export interface VideoStoryboard {
  voiceName: string;        // The selected voice (e.g. 'Kore', 'Fenrir')
  scenes: VideoScene[];
}

// --- HISTORY TYPES ---

export type HistoryType = 'single' | 'pattern' | 'video';

export interface HistoryItem {
  id: string;
  timestamp: number;
  type: HistoryType;
  title: string; // Short summary or first few words
  data: {
    inputText?: string;       // For Single & Video
    inputTexts?: string[];    // For Pattern
    analysisResult?: AnalysisResult;
    patternResult?: PatternAnalysisResult;
    videoStoryboard?: VideoStoryboard;
    videoTone?: string;
  };
}
