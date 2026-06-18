import type { BatchItem } from '../types';
import { callImageGeneration } from '../../../shared/utils/imageApiConfig';
import { enhanceImagePromptWithDeepSeek } from '../../../shared/utils/imagePromptLinker';

export const generateSingle = async (
    prompt: string,
    style: string,
    size: string,
    quality: string
): Promise<string> => {
    const fullPrompt = style ? `${prompt}\n\n统一风格：${style}` : prompt;
    const enhancedPrompt = await enhanceImagePromptWithDeepSeek(fullPrompt);
    const results = await callImageGeneration(enhancedPrompt, { size, quality });
    return results[0];
};

export type ProgressCallback = (id: string, update: Partial<BatchItem>) => void;

export const runBatchGeneration = async (
    items: BatchItem[],
    style: string,
    size: string,
    quality: string,
    concurrency: number,
    onProgress: ProgressCallback,
    abortSignal?: { aborted: boolean }
): Promise<void> => {
    const pending = items.filter(i => i.status === 'pending');
    let idx = 0;

    const worker = async () => {
        while (idx < pending.length) {
            if (abortSignal?.aborted) return;
            const current = pending[idx++];
            onProgress(current.id, { status: 'generating', startTime: Date.now() });

            try {
                const url = await generateSingle(current.prompt, style, size, quality);
                onProgress(current.id, { status: 'success', resultUrl: url, endTime: Date.now() });
            } catch (err: any) {
                onProgress(current.id, { status: 'error', error: err.message, endTime: Date.now() });
            }
        }
    };

    const workers = Array.from({ length: Math.min(concurrency, pending.length) }, () => worker());
    await Promise.all(workers);
};
