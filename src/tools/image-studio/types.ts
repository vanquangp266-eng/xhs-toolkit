export type SourceMode = 'image' | 'text' | 'blank';

export type ImageSize = '1024x1024' | '1024x1365' | '1024x1536' | '1536x1024';

export type ImageQuality = 'standard' | 'hd';

export interface StylePreset {
    id: string;
    name: string;
    prompt: string;
    color: string;
}

export interface ReferenceImage {
    id: string;
    file: File;
    preview: string;
    label: 'product' | 'style' | 'material';
}

export interface GenerationRequest {
    mode: SourceMode;
    prompt: string;
    sourceImage?: string; // base64 or URL
    referenceImages: ReferenceImage[];
    style: string;
    size: ImageSize;
    quality: ImageQuality;
}

export interface GeneratedImage {
    id: string;
    timestamp: number;
    url: string; // base64 data URL
    prompt: string;
    size: ImageSize;
    mode: SourceMode;
    style: string;
}

export enum GenerationStatus {
    IDLE = 'idle',
    LOADING = 'loading',
    SUCCESS = 'success',
    ERROR = 'error',
}
