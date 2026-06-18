export interface SeoResult {
    id: string;
    keyword: string;
    noteType: 'TRAFFIC' | 'SEARCH' | 'SALES';
    title: string;
    reason: string;
    score: number;
}

export interface SeoBatchStats {
    totalKeywords: number;
    processedKeywords: number;
    isProcessing: boolean;
}
