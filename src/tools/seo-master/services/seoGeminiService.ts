import { SeoResult } from '../types';

const API_KEY = import.meta.env.VITE_API_KEY || '';

export const generateSeoMatrix = async (
    keyword: string,
    templates: string,
    globalContext: {
        product: string;
        persona: string;
        painPoint: string;
    }
): Promise<SeoResult[]> => {
    if (!API_KEY) {
        throw new Error('API Key is missing. Please check your environment variables.');
    }

    const prompt = `
你是一位顶级的“小红书SEO矩阵操盘手”。
我将给你一个赛道关键词，以及目前我们手头的“链路模板”、“产品背景”和“专属人设”。
你需要针对这个关键词，分别生成【流量型】、【搜准型】、【转化型】三种类型的笔记标题，每种类型严格生成 3 条。

【输入数据】
- 当前关键词：${keyword}
- 可参考的标题链路模板：
${templates || '无模板，请自行发挥'}
- 产品背景：${globalContext.product || '无特定产品'}
- 专属人设：${globalContext.persona || '无特定人设'}
- 全局痛点参考：${globalContext.painPoint || '无特定痛点'}

【生成要求】
1. 流量型 (TRAFFIC)：结合隐性的“元问题/核心痛点”，标题要引发猎奇、共鸣、情绪波动。不要太硬广。
2. 搜准型 (SEARCH)：强行包含关键词 "${keyword}" 并尽量前置。标题呈现出高度结构化、干货、直给利益点的风格。
3. 转化型 (SALES)：结合产品背景和专属人设，直接带出产品卖点，从痛点切入直接过渡到产品推荐种草。

【输出格式】
必须输出合法的 JSON 数组（不要包含 Markdown 代码块标记），数组中每个对象包含：
- noteType: 必须是 "TRAFFIC", "SEARCH", 或 "SALES"
- title: 笔记标题
- reason: 为什么这么写，用了什么心理学或逻辑结构
- score: 预估爆款评分（0-100）

例如：
[
    {
        "noteType": "TRAFFIC",
        "title": "熬夜也想要发光肌？这招让你悄悄惊艳所有人！",
        "reason": "引发猎奇心理与共鸣",
        "score": 95
    }
]
`;

    try {
        const response = await fetch('/api/deepseek/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: localStorage.getItem('deepseek_model_preference') || 'deepseek-v4-flash',
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API Error: ${response.status}`);
        }

        const result = await response.json();
        const text = result.choices[0].message.content;
        
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return [];
        
        const parsed = JSON.parse(jsonMatch[0]);
        
        return parsed.map((item: any, index: number) => ({
            id: `${keyword}-${item.noteType}-${index}-${Date.now()}`,
            keyword,
            noteType: item.noteType,
            title: item.title,
            reason: item.reason,
            score: item.score || 90
        }));
    } catch (e) {
        console.error("SEO Matrix Generation Error:", e);
        throw new Error("生成SEO矩阵失败，请稍后重试");
    }
};
