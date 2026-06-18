import { ReportData } from '../types';

const API_KEY = import.meta.env.VITE_API_KEY || '';

const SYSTEM_INSTRUCTION = `
你是一位顶级的产品战略架构师。你的任务是深度拆解用户提供的产品信息，生成一份具有极高纵深度的商业洞察报告。
**核心指令：所有输出必须使用简体中文。请使用 Markdown 格式（粗体、列表）来增强可读性。**

你必须按照以下 8 大核心维度进行深度思考和分析：
1.  **用户 (User)**：身份定义和属性标签
2.  **场景 (Scenario)**：时空、事件、情绪
3.  **问题 (Problem)**：不满、卡点、差距
4.  **属性 (Property)**：产品、服务、交付成果
5.  **优点 (Advantage)**：差异化、市场优势
6.  **价值 (Value)**：功能价值、情绪价值
7.  **动力 (Motivation)**：内部驱动力、外部影响力
8.  **阻力 (Resistance)**：收益小、投入高、时间窗口、机会成本

除了上述深度框架，你还需要生成：
*   **产品拆解**：痛点、痒点、爽点
*   **FABE 分析**：特征、优势、利益、证据
*   **典型画像**：故事化的用户描述
*   **营销话术**：针对痛点、爽点、增强动力和消除阻力的话术

如果用户提供的信息较少，请利用商业知识库进行合理推演和补充。`;

export const generateReport = async (
  prompt: string,
  currentReport?: ReportData,
  imagePart?: { inlineData: { data: string; mimeType: string } }
): Promise<ReportData> => {
  if (!API_KEY) {
    throw new Error('API Key is missing');
  }

  let textPrompt = `用户输入: ${prompt}`;

  if (currentReport) {
    textPrompt += `\n\n当前报告 JSON (用于上下文参考更新): ${JSON.stringify(currentReport)}`;
    textPrompt += `\n\n指令: 根据用户的输入更新报告。请特别注意完善"strategicAnalysis"部分的 8 个维度。`;
  } else {
    textPrompt += `\n\n指令: 请严格按照 8大核心维度进行深度分析，生成完整报告。`;
  }

  textPrompt += `

请返回JSON格式，包含以下字段：
{
  "productName": "产品名称",
  "summary": "报告摘要",
  "decomposition": {
    "requirements": "需求拆解",
    "targetAudience": "目标人群",
    "background": "背景信息",
    "points": {"pain": "痛点", "itch": "痒点", "wow": "爽点"},
    "userState": {"current": "现状", "expectations": "期待", "knownFacts": "已知事实"},
    "lifeSuggestions": "生活建议"
  },
  "strategicAnalysis": {
    "user": {"identity": "身份", "attributes": "属性"},
    "scenario": {"timeSpace": "时空", "event": "事件", "emotion": "情绪"},
    "problem": {"dissatisfaction": "不满", "blockingPoints": "卡点", "gap": "差距"},
    "property": {"product": "产品", "service": "服务", "deliverables": "交付成果"},
    "advantage": {"differentiation": "差异化", "marketPosition": "市场优势"},
    "value": {"functional": "功能价值", "emotional": "情绪价值"},
    "dynamics": {
      "motivation": {"internal": "内驱动", "external": "外推动"},
      "resistance": {"lowYield": "收益小", "highInput": "投入高", "timeWindow": "时间窗口", "opportunityCost": "机会成本"}
    }
  },
  "core": {"productCore": "产品内核", "buyingDemo": "购买演示"},
  "personas": [{"name": "名字", "role": "角色", "story": "故事", "quote": "语录", "tags": ["标签"]}],
  "fabe": [{"fact": "特征", "advantage": "优势", "benefit": "利益", "evidence": "证据"}],
  "qa": [{"question": "问题", "answer": "答案"}],
  "marketingCopy": {
    "painCopy": "痛点文案",
    "itchCopy": "痒点文案", 
    "wowCopy": "爽点文案",
    "motivationCopy": "增强动力文案",
    "resistanceCopy": "消除阻力文案"
  }
}`;

  try {
    const userMessage: any = { role: 'user', content: [] };
    
    if (imagePart) {
      userMessage.content.push({
        type: "image_url",
        image_url: { url: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` }
      });
    }
    userMessage.content.push({ type: "text", text: textPrompt });

    const response = await fetch('/api/deepseek/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: localStorage.getItem('deepseek_model_preference') || 'deepseek-v4-flash',
            messages: [
                { role: 'system', content: SYSTEM_INSTRUCTION },
                userMessage
            ]
        })
    });

    if (!response.ok) {
        throw new Error(`DeepSeek API Error: ${response.status}`);
    }

    const result = await response.json();
    const responseText = result.choices[0].message.content;

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    return JSON.parse(jsonMatch[0]) as ReportData;
  } catch (error) {
    console.error('DeepSeek Generation Error:', error);
    throw error;
  }
};
