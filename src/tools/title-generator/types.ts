export interface ViralCase {
    id: string;
    content: string;
}

export interface GeneratedTopic {
    title: string;
    score: number;
    grade: 'S' | 'A' | 'B' | 'C';
    reason: string;
}

export interface ExpandedAngle {
    angle: string;
    score: number;
    reason: string;
}

export interface HistoryItem {
    id: string;
    timestamp: number;
    metaTopic: string;
    results: GeneratedTopic[];
}

export enum AppTab {
    GENERATOR = 'GENERATOR',
    LIBRARY = 'LIBRARY',
    HISTORY = 'HISTORY'
}

export interface BatchResult {
    metaTopic: string;
    status: 'pending' | 'loading' | 'completed' | 'error';
    data: GeneratedTopic[];
}
