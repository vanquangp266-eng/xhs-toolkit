import { GenerationRequest, GeneratedImage } from '../types';
import {
    getImageApiConfig,
    callImageGeneration,
    callImageEdit as apiCallImageEdit,
} from '../../../shared/utils/imageApiConfig';
import { enhanceImagePromptWithDeepSeek } from '../../../shared/utils/imagePromptLinker';

const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

export const generateImage = async (request: GenerationRequest): Promise<GeneratedImage> => {
    const cfg = getImageApiConfig();
    if (!cfg.imageKey) throw new Error('请先在设置中配置 Image API Key。');

    const { mode, prompt, sourceImage, referenceImages, style, size, quality } = request;
    const fullPrompt = style ? `${prompt}\n\n风格要求：${style}` : prompt;

    let linkedPrompt = fullPrompt;
    if (referenceImages.length > 0) {
        const refDescs = referenceImages.map(r => {
            const labelText = r.label === 'product' ? '产品图' : r.label === 'style' ? '风格参考' : '素材图';
            return `已提供${labelText}`;
        }).join('，');
        linkedPrompt += `\n\n${refDescs}，请基于参考图的风格、材质和主体元素进行创作。`;
    }

    const enhancedPrompt = await enhanceImagePromptWithDeepSeek(linkedPrompt);

    let result: string;
    if (mode === 'image' && sourceImage) {
        result = await editImageWithSource(sourceImage, enhancedPrompt, size, referenceImages, quality);
    } else {
        result = await textToImage(enhancedPrompt, size, quality, referenceImages);
    }

    return {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        url: result,
        prompt: enhancedPrompt,
        size,
        mode,
        style,
    };
};

async function textToImage(
    prompt: string,
    size: string,
    quality: string,
    refs: { file: File }[]
): Promise<string> {
    if (refs.length > 0) {
        const files = refs.map(r => r.file);
        const results = await apiCallImageEdit(prompt, files, { size, quality });
        return results[0];
    }

    const results = await callImageGeneration(prompt, { size, quality });
    return results[0];
}

async function editImageWithSource(
    sourceImage: string,
    prompt: string,
    size: string,
    refs: { file: File }[],
    quality?: string
): Promise<string> {
    const files: File[] = [];

    if (sourceImage.startsWith('data:')) {
        const resp = await fetch(sourceImage);
        const blob = await resp.blob();
        files.push(new File([blob], 'source.png', { type: blob.type || 'image/png' }));
    }

    for (const ref of refs) {
        files.push(ref.file);
    }

    const results = await apiCallImageEdit(prompt, files, { size, quality });
    return results[0];
}

export { fileToBase64 };
