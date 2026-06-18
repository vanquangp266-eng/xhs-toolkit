import { DimensionCategory, DeepAnalysisReport } from '../types';

const API_KEY = import.meta.env.VITE_API_KEY || '';

export const analyzeTopics = async (inputText: string): Promise<DimensionCategory[]> => {
  if (!API_KEY) {
    throw new Error('API Key is missing');
  }

  // Clean up input
  const cleanInput = inputText.split('\n').filter(line => line.trim() !== '').join('\n');
  const inputLineCount = cleanInput.split('\n').length;

  const prompt = `
你是一个元问题拆解大师。

你的任务是分析并归类用户提供的原始选题。

当前输入共有 ${inputLineCount} 条原始选题。

*** 核心指令 (CRITICAL INSTRUCTIONS) ***
1. **全量覆盖 (100% Coverage)**: 你必须处理输入中的**每一条**选题。绝对禁止采样、抽样或遗漏。
2. **数量一致**: 最终输出的所有元问题下的 'originalTopics' 列表中的选题总数，必须严格等于 ${inputLineCount}。
3. **禁止省略**: 在 'originalTopics' 列表中，必须完整返回原始文本。严禁使用 "..."、"等"、"etc" 代替。
4. **归类逻辑**: 
   - 提取选题背后的内核（User Job / Meta-Problem）。
   - 将语义相似的选题合并到同一个元问题下。
   - 即使某些选题很独特，也必须为它创建一个类别或归入最接近的类别，不能丢弃。
5. **输出结构**:
   - 按照不同维度（如：亲子沟通、行为习惯等）分类。
   - 提炼出约 30-80 个元问题（数量根据内容自动调整，但必须覆盖所有输入）。
   - 元问题格式统一为："如何[动作/处理][对象/场景]"。

--- 原始选题列表开始 (${inputLineCount}条) ---
${cleanInput}
--- 原始选题列表结束 ---

请返回JSON数组，格式如下：
[
  {
    "dimensionName": "维度名称",
    "description": "维度描述",
    "questions": [
      {
        "metaQuestion": "如何...",
        "originalTopics": ["原始选题1", "原始选题2", ...]
      }
    ]
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
    if (!jsonMatch) {
      throw new Error('无法解析响应');
    }

    return JSON.parse(jsonMatch[0]) as DimensionCategory[];
  } catch (error) {
    console.error('DeepSeek Analysis Error:', error);
    throw error;
  }
};

export const generateMetaQuestionReport = async (
  metaQuestion: string,
  originalTopics: string[]
): Promise<DeepAnalysisReport> => {
  if (!API_KEY) {
    throw new Error('API Key is missing');
  }

  const prompt = `
请针对以下元问题及其包含的原始用户选题，生成一份深度的内容策略分析报告。

**元问题**: ${metaQuestion}

**包含的原始选题**:
${originalTopics.join('\n')}

请分析上述信息，并以JSON格式提供以下 5 个维度的深度洞察：
{
  "targetAudience": "目标人群画像分析（遇到此问题的典型用户画像、心理状态）",
  "scenario": "典型发生场景（问题通常在什么具体的环境、时间或诱因下触发）",
  "painPoints": "核心痛点与阻碍（用户深层的焦虑、恐惧，以及解决此问题的核心难点）",
  "desiredOutcome": "期待达成的状态（用户解决问题后希望达到的理想画面或效果）",
  "solutions": "解决方案与干货建议（针对此问题，可以提供的具体方法论、工具、步骤或思维模型建议，列举3-5点干货）"
}
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

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('报告生成失败');
    }

    return JSON.parse(jsonMatch[0]) as DeepAnalysisReport;
  } catch (error) {
    console.error('DeepSeek Report Error:', error);
    throw error;
  }
};
