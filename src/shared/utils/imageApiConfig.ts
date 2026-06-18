export const IMAGE_CONFIG_DEFAULTS = {
    IMAGE_API_BASE: (import.meta as any).env?.VITE_IMAGE_API_BASE || 'https://aipaiai.cn',
    IMAGE_API_KEY: (import.meta as any).env?.VITE_IMAGE_API_KEY || '',
    IMAGE_MODEL: 'gpt-image-2',
    DEEPSEEK_API_BASE: 'https://api.deepseek.com',
    DEEPSEEK_API_KEY: '',
    DEEPSEEK_MODEL: 'deepseek-v4-flash',
    POE_API_BASE: 'https://api.poe.com/v1',
    POE_API_KEY: '',
    POE_VISION_MODEL: 'gpt-5.5',
} as const;

const STORAGE_KEYS = {
    IMG_API_BASE: 'img_api_base',
    IMG_API_KEY: 'img_api_key',
    IMG_MODEL: 'img_model',
    DS_API_BASE: 'ds_api_base',
    DS_API_KEY: 'ds_api_key',
    POE_API_BASE: 'poe_api_base',
    POE_API_KEY: 'poe_api_key',
    POE_VISION_MODEL: 'poe_vision_model',
} as const;

export interface ImageApiConfig {
    imageBase: string;
    imageKey: string;
    imageModel: string;
    dsBase: string;
    dsKey: string;
    dsModel: string;
    poeBase: string;
    poeKey: string;
    poeModel: string;
}

type ImageApiOptions = { size?: string; quality?: string; n?: number };

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');

const normalizeImageModel = (model: string) => {
    if (model.toLowerCase() === 'gpt-image-2') return 'gpt-image-2';
    return model.trim();
};

const normalizeImageQuality = (quality?: string) => {
    if (!quality) return undefined;
    if (quality === 'standard') return 'medium';
    if (quality === 'hd') return 'high';
    return quality;
};

const parseImageResults = (data: any): string[] => {
    const results = (data.data || [])
        .map((item: any) => {
            if (item.b64_json) return 'data:image/png;base64,' + item.b64_json;
            if (item.url) return item.url;
            return null;
        })
        .filter(Boolean) as string[];

    if (results.length === 0) {
        throw new Error('Image API did not return image data.');
    }

    return results;
};

export function getImageApiConfig(): ImageApiConfig {
    const keysStr = localStorage.getItem(STORAGE_KEYS.IMG_API_KEY) || IMAGE_CONFIG_DEFAULTS.IMAGE_API_KEY;
    const keys = keysStr.split(',').map(k => k.trim()).filter(Boolean);
    const randomKey = keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : '';

    return {
        imageBase: normalizeBaseUrl(localStorage.getItem(STORAGE_KEYS.IMG_API_BASE) || IMAGE_CONFIG_DEFAULTS.IMAGE_API_BASE),
        imageKey: randomKey,
        imageModel: normalizeImageModel(localStorage.getItem(STORAGE_KEYS.IMG_MODEL) || IMAGE_CONFIG_DEFAULTS.IMAGE_MODEL),
        dsBase: normalizeBaseUrl(localStorage.getItem(STORAGE_KEYS.DS_API_BASE) || IMAGE_CONFIG_DEFAULTS.DEEPSEEK_API_BASE),
        dsKey: localStorage.getItem(STORAGE_KEYS.DS_API_KEY) || IMAGE_CONFIG_DEFAULTS.DEEPSEEK_API_KEY,
        dsModel: IMAGE_CONFIG_DEFAULTS.DEEPSEEK_MODEL,
        poeBase: normalizeBaseUrl(localStorage.getItem(STORAGE_KEYS.POE_API_BASE) || IMAGE_CONFIG_DEFAULTS.POE_API_BASE),
        poeKey: localStorage.getItem(STORAGE_KEYS.POE_API_KEY) || IMAGE_CONFIG_DEFAULTS.POE_API_KEY,
        poeModel: localStorage.getItem(STORAGE_KEYS.POE_VISION_MODEL) || IMAGE_CONFIG_DEFAULTS.POE_VISION_MODEL,
    };
}

export function saveImageApiConfig(settings: {
    imageBase?: string;
    imageKeys?: string;
    imageModel?: string;
    dsBase?: string;
    dsKey?: string;
    poeBase?: string;
    poeKey?: string;
    poeModel?: string;
}) {
    if (settings.imageBase !== undefined) localStorage.setItem(STORAGE_KEYS.IMG_API_BASE, settings.imageBase);
    if (settings.imageKeys !== undefined) localStorage.setItem(STORAGE_KEYS.IMG_API_KEY, settings.imageKeys);
    if (settings.imageModel !== undefined) localStorage.setItem(STORAGE_KEYS.IMG_MODEL, settings.imageModel);
    if (settings.dsBase !== undefined) localStorage.setItem(STORAGE_KEYS.DS_API_BASE, settings.dsBase);
    if (settings.dsKey !== undefined) localStorage.setItem(STORAGE_KEYS.DS_API_KEY, settings.dsKey);
    if (settings.poeBase !== undefined) localStorage.setItem(STORAGE_KEYS.POE_API_BASE, settings.poeBase);
    if (settings.poeKey !== undefined) localStorage.setItem(STORAGE_KEYS.POE_API_KEY, settings.poeKey);
    if (settings.poeModel !== undefined) localStorage.setItem(STORAGE_KEYS.POE_VISION_MODEL, settings.poeModel);
}

export function getRawImageSettings() {
    return {
        imageBase: localStorage.getItem(STORAGE_KEYS.IMG_API_BASE) || IMAGE_CONFIG_DEFAULTS.IMAGE_API_BASE,
        imageKeys: localStorage.getItem(STORAGE_KEYS.IMG_API_KEY) || IMAGE_CONFIG_DEFAULTS.IMAGE_API_KEY,
        imageModel: normalizeImageModel(localStorage.getItem(STORAGE_KEYS.IMG_MODEL) || IMAGE_CONFIG_DEFAULTS.IMAGE_MODEL),
        dsBase: localStorage.getItem(STORAGE_KEYS.DS_API_BASE) || IMAGE_CONFIG_DEFAULTS.DEEPSEEK_API_BASE,
        dsKey: localStorage.getItem(STORAGE_KEYS.DS_API_KEY) || '',
        poeBase: localStorage.getItem(STORAGE_KEYS.POE_API_BASE) || IMAGE_CONFIG_DEFAULTS.POE_API_BASE,
        poeKey: localStorage.getItem(STORAGE_KEYS.POE_API_KEY) || '',
        poeModel: localStorage.getItem(STORAGE_KEYS.POE_VISION_MODEL) || IMAGE_CONFIG_DEFAULTS.POE_VISION_MODEL,
    };
}

export async function callImageGeneration(
    prompt: string,
    options: ImageApiOptions = {}
): Promise<string[]> {
    const cfg = getImageApiConfig();
    if (!cfg.imageKey) throw new Error('请先在设置中配置 Image API Key。');

    const requestedSize = options.size || '1024x1024';
    const apiSize = requestedSize === '1024x1365' ? '1024x1536' : requestedSize;
    const finalPrompt = requestedSize === '1024x1365'
        ? `${prompt}\n\n画幅要求：小红书 3:4 竖图封面。标题文字必须完整可读，按 3:4 手机瀑布流封面比例排版。`
        : prompt;

    const body = {
        model: cfg.imageModel,
        prompt: finalPrompt,
        size: apiSize,
        quality: normalizeImageQuality(options.quality) || 'auto',
        n: options.n || 1,
    };

    const resp = await fetch(`${cfg.imageBase}/v1/images/generations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cfg.imageKey}`,
        },
        body: JSON.stringify(body),
    });

    if (!resp.ok) {
        const err = await resp.text().catch(() => '');
        throw new Error(`图片生成失败 (${resp.status}): ${err}`);
    }

    const data = await resp.json();
    if (data.error) throw new Error(data.error.message || '图片接口返回未知错误。');
    return parseImageResults(data);
}

export async function callImageEdit(
    prompt: string,
    imageFiles: File | File[],
    options: ImageApiOptions = {}
): Promise<string[]> {
    const cfg = getImageApiConfig();
    if (!cfg.imageKey) throw new Error('请先在设置中配置 Image API Key。');

    const formData = new FormData();
    formData.append('model', cfg.imageModel);
    const requestedSize = options.size;
    const apiSize = requestedSize === '1024x1365' ? '1024x1536' : requestedSize;
    const finalPrompt = requestedSize === '1024x1365'
        ? `${prompt}\n\n画幅要求：小红书 3:4 竖图封面。标题文字必须完整可读，按 3:4 手机瀑布流封面比例排版。`
        : prompt;

    formData.append('prompt', finalPrompt);

    const files = Array.isArray(imageFiles) ? imageFiles : [imageFiles];
    files.forEach(file => {
        formData.append('image[]', file);
        formData.append('image', file);
    });

    if (apiSize) formData.append('size', apiSize);
    const normalizedQuality = normalizeImageQuality(options.quality);
    if (normalizedQuality) formData.append('quality', normalizedQuality);
    if (options.n) formData.append('n', String(options.n));

    const resp = await fetch(`${cfg.imageBase}/v1/images/edits`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${cfg.imageKey}`,
        },
        body: formData,
    });

    if (!resp.ok) {
        const err = await resp.text().catch(() => '');
        throw new Error(`参考图生成失败 (${resp.status}): ${err}`);
    }

    const data = await resp.json();
    if (data.error) throw new Error(data.error.message || '图片接口返回未知错误。');
    return parseImageResults(data);
}
