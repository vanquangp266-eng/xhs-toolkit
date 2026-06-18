import type { GlobalContextState } from '../store/globalStore';
import { getImageApiConfig } from './imageApiConfig';

type GlobalAssets = Pick<
    GlobalContextState,
    'currentPainPoint' | 'currentPersona' | 'currentProductContext' | 'currentTitle' | 'currentPattern' | 'currentCopy'
>;

export const hasLinkedImageAssets = (assets: GlobalAssets) =>
    Boolean(
        assets.currentPainPoint ||
        assets.currentPersona ||
        assets.currentProductContext ||
        assets.currentTitle ||
        assets.currentPattern ||
        assets.currentCopy
    );

const getCoverTitle = (assets: GlobalAssets, fallback = '') =>
    (assets.currentTitle || fallback || '').trim();

export const buildLinkedImagePrompt = (params: {
    userPrompt?: string;
    sourceText?: string;
    stylePrompt?: string;
    assets: GlobalAssets;
}) => {
    const { userPrompt = '', sourceText = '', stylePrompt = '', assets } = params;
    const title = getCoverTitle(assets, userPrompt);
    const sections: string[] = [];

    sections.push('生成一张小红书封面图，3:4 竖版手机瀑布流构图。核心不是氛围配图，而是“文字标题海报”。标题文字必须是画面第一主体，图片元素只做辅助。');

    if (title) {
        sections.push(`必须渲染在封面上的主标题文字：${title}`);
    }

    sections.push('文字版式要求：大标题占画面 45%-65% 视觉权重，粗体中文大字，高对比度，手机小图也能一眼读清；允许标题分成 2-4 行；关键词可用描边、色块、荧光笔、贴纸、下划线、圆圈重点标注。');
    sections.push('视觉风格参考：小红书爆款封面常见的大字报/信息卡片式/左文右图/上方大标题/中心大字加辅助元素。背景简洁，2-3 个主色，避免杂乱。');

    if (assets.currentProductContext) sections.push(`辅助产品/卖点背景：${assets.currentProductContext}`);
    if (assets.currentPersona) sections.push(`目标人群/账号人设：${assets.currentPersona}`);
    if (assets.currentPainPoint) sections.push(`标题要击中的用户痛点：${assets.currentPainPoint}`);
    if (assets.currentPattern) sections.push(`内容结构/爆款句式参考：${assets.currentPattern}`);
    if (sourceText || assets.currentCopy) sections.push(`笔记正文参考，用来决定辅助画面元素：${sourceText || assets.currentCopy}`);
    if (userPrompt) sections.push(`额外创作要求：${userPrompt}`);
    if (stylePrompt) sections.push(`辅助视觉风格：${stylePrompt}`);

    sections.push('辅助画面要求：可以有产品、人物、场景、图标、贴纸、箭头等，但不能抢标题；不要水印，不要多余正文段落，不要把标题改写成别的句子。');
    return sections.join('\n\n');
};

export const buildBatchPromptsFromContext = (assets: GlobalAssets): string[] => {
    if (!hasLinkedImageAssets(assets)) return [];

    const title = getCoverTitle(assets, '小红书笔记');
    const base = buildLinkedImagePrompt({ assets, userPrompt: title });

    return [
        `${base}\n\n版式方案：大字报封面，标题居中偏上，底部少量辅助信息卡片。`,
        `${base}\n\n版式方案：左侧 60% 大标题，右侧 40% 产品/人物/场景辅助图。`,
        `${base}\n\n版式方案：信息卡片式封面，标题分行排列，关键词用色块和手绘标记突出。`,
    ];
};

export async function enhanceImagePromptWithDeepSeek(prompt: string): Promise<string> {
    const cfg = getImageApiConfig();
    const apiKey = cfg.dsKey || import.meta.env.VITE_API_KEY || '';
    if (!apiKey) return prompt;

    try {
        const response = await fetch(`${cfg.dsBase}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: cfg.dsModel,
                messages: [
                    {
                        role: 'system',
                        content: '你是小红书封面设计提示词导演。改写输入为适合 GPT Image 的封面 prompt。必须保留并强调“主标题文字要渲染进图片，文字是第一主体”，不要把标题删掉或改写。只输出 prompt 本身。',
                    },
                    { role: 'user', content: prompt },
                ],
                stream: false,
            }),
        });

        if (!response.ok) {
            const detail = await response.text().catch(() => '');
            console.warn(`DeepSeek prompt enhancement failed (${response.status}): ${detail}`);
            return prompt;
        }

        const data = await response.json();
        const enhanced = data.choices?.[0]?.message?.content?.trim();
        return enhanced || prompt;
    } catch (error) {
        console.warn('DeepSeek prompt enhancement failed:', error);
        return prompt;
    }
}
