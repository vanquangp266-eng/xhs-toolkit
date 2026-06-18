export interface TitlePair {
    id: string;
    original: string;
    pattern: string;
}

export interface ProcessingStats {
    total: number;
    processed: number;
    isProcessing: boolean;
    currentChunk: number;
    totalChunks: number;
}

export enum DomainType {
    PARENTING = '亲子教育',
    GROWTH = '个人成长',
    EMOTION = '情感关系',
    CAREER = '职场发展',
    HEALTH = '健康养生',
    WEALTH = '搞钱理财',
    OTHER = '通用领域'
}
