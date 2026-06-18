import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GeneratedImage, GenerationStatus, ImageQuality, ImageSize } from '../../tools/image-studio/types';
import type { BatchConfig, BatchItem } from '../../tools/batch-image/types';
import { STYLE_PRESETS } from '../../tools/batch-image/constants';

if (typeof window !== 'undefined') {
    try {
        localStorage.removeItem('xhs-image-job-storage');
        localStorage.removeItem('image_studio_history');
    } catch {
        // Ignore storage cleanup failures.
    }
}

const stripGeneratedImageForStorage = (image: GeneratedImage | null) => {
    if (!image) return null;
    return {
        ...image,
        url: image.url.startsWith('data:') ? '' : image.url,
    };
};

const stripBatchItemForStorage = (item: BatchItem): BatchItem => ({
    ...item,
    status: item.status === 'generating' ? 'pending' : item.status,
    resultUrl: item.resultUrl?.startsWith('data:') ? undefined : item.resultUrl,
});

interface ImageJobState {
    studioStatus: GenerationStatus;
    studioResult: GeneratedImage | null;
    studioError: string | null;
    studioStartedAt: number | null;
    studioHistory: GeneratedImage[];

    batchItems: BatchItem[];
    batchConfig: BatchConfig;
    batchIsRunning: boolean;
    batchStartedAt: number | null;
    batchHistory: { id: string; timestamp: number; items: BatchItem[]; config: BatchConfig }[];

    setStudioJob: (state: Partial<Pick<ImageJobState, 'studioStatus' | 'studioResult' | 'studioError' | 'studioStartedAt'>>) => void;
    setStudioHistory: (history: GeneratedImage[]) => void;
    addStudioHistory: (image: GeneratedImage) => void;
    clearStudioHistory: () => void;

    setBatchItems: (items: BatchItem[]) => void;
    updateBatchItem: (id: string, update: Partial<BatchItem>) => void;
    setBatchConfig: (config: BatchConfig) => void;
    setBatchRunning: (isRunning: boolean, startedAt?: number | null) => void;
    addBatchHistory: (items: BatchItem[], config: BatchConfig) => void;
    clearBatchHistory: () => void;
    importBatchPrompts: (prompts: string[]) => void;
}

export const useImageJobStore = create<ImageJobState>()(
    persist(
        (set, get) => ({
            studioStatus: 'idle' as GenerationStatus,
            studioResult: null,
            studioError: null,
            studioStartedAt: null,
            studioHistory: [],

            batchItems: [],
            batchConfig: {
                style: STYLE_PRESETS[0].prompt,
                size: '1024x1024' as ImageSize,
                quality: 'standard' as ImageQuality,
                concurrency: 1,
            },
            batchIsRunning: false,
            batchStartedAt: null,
            batchHistory: [],

            setStudioJob: (state) => set(state),
            setStudioHistory: (history) => set({ studioHistory: history }),
            addStudioHistory: (image) => set({
                studioHistory: [image, ...get().studioHistory.filter(item => item.id !== image.id)].slice(0, 50),
            }),
            clearStudioHistory: () => set({ studioHistory: [] }),

            setBatchItems: (items) => set({ batchItems: items }),
            updateBatchItem: (id, update) => set({
                batchItems: get().batchItems.map(item => item.id === id ? { ...item, ...update } : item),
            }),
            setBatchConfig: (config) => set({ batchConfig: config }),
            setBatchRunning: (isRunning, startedAt = isRunning ? Date.now() : null) => set({
                batchIsRunning: isRunning,
                batchStartedAt: startedAt,
            }),
            addBatchHistory: (items, config) => {
                if (!items.some(item => item.status === 'success')) return;
                const historyItem = {
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    items,
                    config,
                };
                set({ batchHistory: [historyItem, ...get().batchHistory].slice(0, 30) });
            },
            clearBatchHistory: () => set({ batchHistory: [] }),
            importBatchPrompts: (prompts) => {
                const nextItems = prompts
                    .map(prompt => prompt.trim())
                    .filter(Boolean)
                    .map(prompt => ({
                        id: crypto.randomUUID(),
                        prompt,
                        status: 'pending' as const,
                    }));
                set({ batchItems: [...get().batchItems, ...nextItems] });
            },
        }),
        {
            name: 'xhs-image-job-storage-v2',
            partialize: (state) => ({
                studioStatus: state.studioStatus === 'loading' ? 'idle' : state.studioStatus,
                studioResult: stripGeneratedImageForStorage(state.studioResult),
                studioError: state.studioError,
                studioStartedAt: null,
                studioHistory: state.studioHistory.map(stripGeneratedImageForStorage).filter(Boolean),
                batchItems: state.batchItems.map(stripBatchItemForStorage),
                batchConfig: state.batchConfig,
                batchIsRunning: false,
                batchStartedAt: null,
                batchHistory: state.batchHistory.map(item => ({
                    ...item,
                    items: item.items.map(stripBatchItemForStorage),
                })),
            }),
        }
    )
);
