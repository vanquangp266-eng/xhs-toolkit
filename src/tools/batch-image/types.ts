export interface BatchItem {
    id: string;
    prompt: string;
    status: 'pending' | 'generating' | 'success' | 'error';
    resultUrl?: string;
    error?: string;
    startTime?: number;
    endTime?: number;
}

export interface BatchConfig {
    style: string;
    size: '1024x1024' | '1024x1365' | '1024x1536' | '1536x1024';
    quality: 'standard' | 'hd';
    concurrency: number; // how many parallel requests
}
