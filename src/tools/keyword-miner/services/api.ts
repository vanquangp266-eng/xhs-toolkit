import { AnalysisResult, SubField } from "../types";
import {
  buildDeepSeekError,
  getDeepSeekApiKey,
  getDeepSeekAuthHeaders,
  getDeepSeekModel,
} from "../../../shared/utils/deepseekConfig";

const BASE_PROMPT_INSTRUCTIONS = `
核心目标：生成符合小红书真实搜索习惯的 SEO 关键词库。

关键词要求：
1. 模拟小红书下拉联想词和用户真实搜索词，优先给高频、口语化、具体词。
2. 必须包含大词、场景词、痛点词、身份词、任务词、知识词、购买决策词。
3. 拒绝空泛词，比如“焦虑情绪”“生活困扰”；要给症状、场景、产品、动作、决策细节。
4. 每个子领域都要先给 logic，再按 groups 输出关键词数组。
5. problem 每个子领域尽量 35-50 个，scene 20 个以上，其他类型 12-20 个。
`;

const REQUIRED_SCHEMA = `
{
  "niche": "赛道名称",
  "subFields": [
    {
      "name": "子领域名称",
      "description": "子领域描述",
      "keywords": {
        "scene": { "logic": "拆解逻辑", "groups": [{ "groupName": "分组名", "items": ["关键词"] }] },
        "problem": { "logic": "拆解逻辑", "groups": [{ "groupName": "分组名", "items": ["关键词"] }] },
        "identity": { "logic": "拆解逻辑", "groups": [{ "groupName": "分组名", "items": ["关键词"] }] },
        "task": { "logic": "拆解逻辑", "groups": [{ "groupName": "分组名", "items": ["关键词"] }] },
        "knowledge": { "logic": "拆解逻辑", "groups": [{ "groupName": "分组名", "items": ["关键词"] }] },
        "purchase": { "logic": "拆解逻辑", "groups": [{ "groupName": "分组名", "items": ["关键词"] }] }
      }
    }
  ]
}
`;

const extractJsonObject = (text: string) => {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("DeepSeek 返回内容里没有找到 JSON 对象。");
  }
  return cleaned.slice(start, end + 1);
};

const parseJsonStrict = <T>(text: string): T => JSON.parse(extractJsonObject(text)) as T;

async function callDeepSeek(prompt: string, jsonMode = true): Promise<string> {
  if (!getDeepSeekApiKey()) {
    throw new Error("请先配置 DeepSeek API Key。可以在作图/批量作图的设置面板里填写，或写入 .env.local 的 VITE_API_KEY。");
  }

  const body: Record<string, unknown> = {
    model: getDeepSeekModel(),
    messages: [{ role: "user", content: prompt }],
    stream: false,
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  let response = await fetch("/api/deepseek/chat/completions", {
    method: "POST",
    headers: getDeepSeekAuthHeaders(),
    body: JSON.stringify(body),
  });

  // Some compatible gateways do not support response_format. Retry once without it.
  if (!response.ok && jsonMode && response.status === 400) {
    delete body.response_format;
    response = await fetch("/api/deepseek/chat/completions", {
      method: "POST",
      headers: getDeepSeekAuthHeaders(),
      body: JSON.stringify(body),
    });
  }

  if (!response.ok) {
    throw new Error(await buildDeepSeekError(response));
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek 没有返回可解析内容。");
  }
  return content;
}

async function parseOrRepairJson<T>(rawText: string, schemaHint: string): Promise<T> {
  try {
    return parseJsonStrict<T>(rawText);
  } catch (error: any) {
    const brokenJson = extractJsonObject(rawText);
    const repairPrompt = `
下面是一段格式损坏的 JSON。请只修复语法，不要新增解释文字，不要删减业务内容。
必须返回一个合法 JSON 对象，结构必须符合：
${schemaHint}

解析错误：
${error.message}

损坏 JSON：
${brokenJson}
`;

    const repaired = await callDeepSeek(repairPrompt, true);
    try {
      return parseJsonStrict<T>(repaired);
    } catch (repairError: any) {
      throw new Error(`DeepSeek 返回了内容，但 JSON 格式仍然损坏：${repairError.message}`);
    }
  }
}

export const generateKeywords = async (niche: string): Promise<AnalysisResult> => {
  const prompt = `
你是小红书 RedNote 的搜索算法工程师和 SEO 专家。
目标赛道：${niche}

${BASE_PROMPT_INSTRUCTIONS}

请将赛道 MECE 拆解为 3-5 个核心子领域。
必须严格输出 JSON 对象，不要输出 markdown，不要输出解释。
所有字符串必须用双引号包裹；数组元素之间必须有逗号；不要使用尾随逗号。

JSON 结构：
${REQUIRED_SCHEMA}
`;

  const text = await callDeepSeek(prompt, true);
  return parseOrRepairJson<AnalysisResult>(text, REQUIRED_SCHEMA);
};

export const expandSubFields = async (
  niche: string,
  existingSubFields: string[],
  direction?: string
): Promise<SubField[]> => {
  const directionPrompt = direction
    ? `用户指定扩展方向：“${direction}”。请基于这个方向生成 1-2 个新的子领域。`
    : "请基于搜索蓝海逻辑，自动发现 1-2 个该赛道尚未覆盖的高价值子领域。";

  const schema = `{ "newSubFields": ${REQUIRED_SCHEMA.match(/"subFields": ([\s\S]*?)\n}/)?.[1] || "[]"} }`;
  const prompt = `
你是小红书 RedNote 的搜索算法工程师。
目标赛道：${niche}
已有子领域：${JSON.stringify(existingSubFields)}

任务：在现有子领域之外进行扩展挖掘。新子领域必须与已有领域互斥，不要重复。
${directionPrompt}

${BASE_PROMPT_INSTRUCTIONS}

必须严格输出 JSON 对象，不要输出 markdown，不要输出解释。
返回结构：
{
  "newSubFields": [
    {
      "name": "子领域名称",
      "description": "子领域描述",
      "keywords": {
        "scene": { "logic": "拆解逻辑", "groups": [{ "groupName": "分组名", "items": ["关键词"] }] },
        "problem": { "logic": "拆解逻辑", "groups": [{ "groupName": "分组名", "items": ["关键词"] }] },
        "identity": { "logic": "拆解逻辑", "groups": [{ "groupName": "分组名", "items": ["关键词"] }] },
        "task": { "logic": "拆解逻辑", "groups": [{ "groupName": "分组名", "items": ["关键词"] }] },
        "knowledge": { "logic": "拆解逻辑", "groups": [{ "groupName": "分组名", "items": ["关键词"] }] },
        "purchase": { "logic": "拆解逻辑", "groups": [{ "groupName": "分组名", "items": ["关键词"] }] }
      }
    }
  ]
}
`;

  const text = await callDeepSeek(prompt, true);
  const data = await parseOrRepairJson<{ newSubFields: SubField[] }>(text, schema);
  return data.newSubFields;
};
