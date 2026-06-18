import { TitlePair } from "../types";
import {
    buildDeepSeekError,
    getDeepSeekApiKey,
    getDeepSeekAuthHeaders,
    getDeepSeekModel,
} from "../../../shared/utils/deepseekConfig";

const extractJsonArray = (text: string) => {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start < 0 || end < 0 || end <= start) {
        throw new Error("DeepSeek 返回内容里没有找到 JSON 数组。");
    }
    return cleaned.slice(start, end + 1);
};

const normalizePattern = (pattern: string) =>
    pattern
        .replace(/\.{4,}/g, "...")
        .replace(/\s+/g, " ")
        .trim();

const repairJsonArray = async (rawText: string, errorMessage: string) => {
    const prompt = `
下面是一段格式损坏的 JSON 数组。请只修复 JSON 语法，不要新增解释，不要改写字段含义。
字段必须是 original 和 pattern。

解析错误：${errorMessage}

损坏内容：
${rawText}
`;

    const response = await fetch('/api/deepseek/chat/completions', {
        method: 'POST',
        headers: getDeepSeekAuthHeaders(),
        body: JSON.stringify({
            model: getDeepSeekModel(),
            response_format: { type: "json_object" },
            messages: [
                {
                    role: 'user',
                    content: `请返回 {"items":[...]}，items 是修复后的数组。\n${prompt}`,
                },
            ],
        }),
    });

    if (!response.ok) throw new Error(await buildDeepSeekError(response));
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(content.replace(/```json|```/g, "").trim());
    return parsed.items || [];
};

export const extractPatternsBatch = async (
    titles: string[],
    domain: string
): Promise<TitlePair[]> => {
    if (!getDeepSeekApiKey()) {
        throw new Error("请先配置 DeepSeek API Key。可以在作图/批量作图设置里填写，或写入 .env.local 的 VITE_API_KEY。");
    }

    const prompt = `
你是小红书爆款标题的“句式骨架提取器”，不是总结器。

任务：把每个标题改写成“高度挖空的填空句式”。你的目标是让这个句式可以跨品类复用，所以要大胆挖空，宁可挖多，不要挖少。

领域背景：${domain}

【必须挖空的内容】
1. 所有名词、具体对象、产品名、品类名、品牌名、工具名。
2. 所有人群身份、关系身份、职业身份、年龄阶段。
3. 所有场景、地点、时间、季节、节日、平台。
4. 所有数字、价格、比例、时长、次数、排名。
5. 所有具体问题、症状、痛点、结果、收益、方法名。
6. 所有形容词里只要承载具体卖点或审美风格，也要挖空。

【尽量保留的内容】
1. 句式连接词：如何、为什么、原来、不是、而是、别再、终于、只要、就、竟然、建议、一定要。
2. 语气和结构：疑问、反转、对比、递进、因果、清单、避坑、经验总结。
3. 标题的爆款骨架和顺序。

【挖空标记规则】
1. 统一用 "..." 表示一个可替换槽位。
2. 相邻多个具体词可以合并成一个 "..."，但标题里的每个核心名词短语都应被挖空。
3. 不要用【人群】、{产品} 这类标签，只用 "..."。
4. 输出必须比原标题更抽象，不能保留具体名词。

【好例子】
输入：孩子拖延如何应对？
输出：...如何应对？

输入：35岁，我用一张纸拯救了我们的亲子时光
输出：...，我用...拯救了我们的...

输入：油皮粉底液别再乱买了，这3款夏天不脱妆
输出：...别再乱买了，这...不...

输入：新手妈妈一定要知道的6个辅食误区
输出：...一定要知道的...个...误区

输入：为什么你越护肤皮肤越差？真相是屏障坏了
输出：为什么你越...越...？真相是...了

【坏例子】
“孩子...如何应对？” 这是挖空太少，因为“孩子”也是名词，应改成“...如何应对？”
“油皮...别再乱买了” 这是挖空太少，因为“油皮”也是身份/肤质，应改成“...别再乱买了”

请处理下面标题，必须一一对应，不要遗漏。
只返回 JSON 数组，不要 markdown，不要解释。
格式：
[{"original":"原标题","pattern":"高度挖空后的句式"}, ...]

标题列表：
${titles.map((title, index) => `${index + 1}. ${title}`).join('\n')}
`;

    try {
        const response = await fetch('/api/deepseek/chat/completions', {
            method: 'POST',
            headers: getDeepSeekAuthHeaders(),
            body: JSON.stringify({
                model: getDeepSeekModel(),
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: 'user',
                        content: `请返回 {"items":[...]}，items 内每项包含 original 和 pattern。\n\n${prompt}`,
                    },
                ],
            }),
        });

        if (!response.ok) {
            throw new Error(await buildDeepSeekError(response));
        }

        const result = await response.json();
        const content = result.choices?.[0]?.message?.content || "";
        let parsedData: any[];

        try {
            const parsed = JSON.parse(content.replace(/```json|```/g, "").trim());
            parsedData = Array.isArray(parsed) ? parsed : (parsed.items || []);
        } catch (error: any) {
            try {
                parsedData = JSON.parse(extractJsonArray(content));
            } catch {
                parsedData = await repairJsonArray(content, error.message);
            }
        }

        return titles.map((title, index) => {
            const item = parsedData[index] || {};
            return {
                id: crypto.randomUUID(),
                original: item.original || title,
                pattern: normalizePattern(item.pattern || "解析失败"),
            };
        });

    } catch (error) {
        console.error("DeepSeek API Error:", error);
        return titles.map(t => ({
            id: crypto.randomUUID(),
            original: t,
            pattern: "API Error: Could not extract"
        }));
    }
};
