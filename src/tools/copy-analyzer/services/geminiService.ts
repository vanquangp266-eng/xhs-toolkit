import { AnalysisResult, PatternAnalysisResult } from '../types';

const API_KEY = import.meta.env.VITE_API_KEY || '';

export const analyzeCopy = async (text: string): Promise<AnalysisResult> => {
  if (!API_KEY) {
    throw new Error('API Key is missing');
  }

  const prompt = `
请深度拆解以下文案，直到逐句分析的颗粒度。你的核心目标是**提取可复刻的文案共性特点和底层逻辑**。
1. **架构思维导图（宏观骨架）**：
   将文案结构进行三层拆解：
   - **第一层（Phases）**：文案的逻辑阶段。
   - **第二层（Elements - 核心手法）**：提取出抽象的、可复刻的文案技巧（如：强对比、损失规避、悬念设置等）。
   - **第三层（Details - 逻辑公式）**：解释该手法在此处的**应用逻辑公式**。
2. **逐段与逐句微观分析（Micro-Analysis）**：
   按原文顺序拆解每一个自然段。
   **必须包含逐句拆解**。
   - **Technique**: 这句话用了什么修辞或技巧（如：排比、通感、反问、白描、数据锚定）。
   - **Effect**: 这句话在读者心中产生了什么具体的化学反应。
待分析的文本："""
${text}
"""

请返回JSON格式，结构如下：
{
  "summary": "一句话总结",
  "structure": {
    "rootTheme": "核心主题",
    "phases": [
      {
        "phaseName": "阶段名称",
        "elements": [
          {
            "name": "技巧名称",
            "details": ["逻辑公式1", "逻辑公式2"]
          }
        ]
      }
    ]
  },
  "breakdown": [
    {
      "excerpt": "原文段落",
      "sentences": [
        {"text": "句子", "technique": "技巧", "effect": "效果"}
      ],
      "style": "语言风格",
      "logic": "段落逻辑",
      "tone": "情感基调",
      "rhythm": "节奏",
      "transition": "承接关系",
      "purpose": "战略目的"
    }
  ]
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
    const responseText = result.choices[0].message.content;

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response format');

    const data = JSON.parse(jsonMatch[0]) as AnalysisResult;
    data.fullText = text;
    return data;
  } catch (error) {
    console.error('Analysis failed:', error);
    throw error;
  }
};

export const extractPattern = async (texts: string[]): Promise<PatternAnalysisResult> => {
  if (!API_KEY) {
    throw new Error('API Key is missing');
  }

  const combinedInput = texts.map((t, i) => `[案例宝典 ${i + 1}]:\n${t}\n---`).join('\n');
  const isSingle = texts.length === 1;

  const contextPrompt = isSingle
    ? `我将提供 1 篇爆款文案。深度剖析这篇文案的**结构框架 (Master Framework)** 和**文风基因 (Style DNA)**。`
    : `我将提供 ${texts.length} 篇不同的爆款文案。找出这些文案背后的**共同结构框架 (Master Framework)** 和**文风基因 (Style DNA)**。寻找它们的**交集**。`;

  const prompt = `
${contextPrompt}

最重要的是：基于你的分析，**撰写一个超级详细的AI写作指令 (Prompt)**。
### Part 1: 文风基因 (Style DNA) - 必须极其细腻
分析共同的语气、节奏、用词、句式特征。
### Part 2: 结构框架 (Master Framework)
提炼出一个通用的、可复刻的**步骤公式**。
### Part 3: 提示词生成(Prompt Generation)
请基于上述分析，撰写一个**完整的、可以直接发给AI的指令(Prompt)**。
输入文案列表："""
${combinedInput}
"""

请返回JSON格式：
{
  "frameworkName": "框架名称",
  "coreLogic": "核心逻辑",
  "styleDNA": {
    "tone": "情感人设",
    "rhythm": "节奏特征",
    "vocabulary": "用词特征",
    "sentenceStructure": "句式特征",
    "keyFeatures": [{"featureName": "特征名", "description": "描述"}]
  },
  "steps": [
    {
      "stepName": "步骤名",
      "abstractLogic": "抽象逻辑",
      "examples": [{"textIndex": 0, "excerpt": "摘录", "explanation": "解释"}]
    }
  ],
  "suggestedPrompt": "完整的AI写作提示词"
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
    const responseText = result.choices[0].message.content;

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response format');

    const data = JSON.parse(jsonMatch[0]) as PatternAnalysisResult;
    return data;
  } catch (error) {
    console.error('Pattern extraction failed:', error);
    throw error;
  }
};

export const generateDeepCopy = async (
  systemInstruction: string,
  userContent: string
): Promise<string> => {
  if (!API_KEY) {
    throw new Error('API Key is missing');
  }

  try {
    const response = await fetch('/api/deepseek/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: localStorage.getItem('deepseek_model_preference') || 'deepseek-v4-flash',
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: userContent }
            ]
        })
    });

    if (!response.ok) {
        throw new Error(`DeepSeek API Error: ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
  } catch (error) {
    console.error('Deep copy generation failed:', error);
    throw error;
  }
};

// Video Storyboard Functions

export interface VideoScene {
  sceneId: number;
  description: string;
  visualElements: string;
  audioScript: string;
  duration: number;
}

export interface VideoStoryboard {
  title: string;
  totalDuration: number;
  scenes: VideoScene[];
}

export const planVideo = async (
  copyText: string,
  styleContext?: string
): Promise<VideoStoryboard> => {
  if (!API_KEY) {
    throw new Error('API Key is missing');
  }

  const prompt = `
基于以下文案，规划一个短视频故事板。${styleContext ? `风格提示: ${styleContext}` : ''}

文案内容："""
${copyText}
"""

请返回JSON格式的视频故事板：
{
  "title": "视频标题",
  "totalDuration": 总秒数,
  "scenes": [
    {
      "sceneId": 1,
      "description": "场景描述",
      "visualElements": "视觉元素描述",
      "audioScript": "旁白/音频脚本",
      "duration": 秒数
    }
  ]
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
    const responseText = result.choices[0].message.content;

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response format');

    return JSON.parse(jsonMatch[0]) as VideoStoryboard;
  } catch (error) {
    console.error('Video planning failed:', error);
    throw error;
  }
};

export const generateSceneImage = async (
  sceneDescription: string,
  visualElements: string
): Promise<string> => {
  // Placeholder: In production, this would call an image generation API
  // For now, return a data URL placeholder or description
  console.log('generateSceneImage called with:', sceneDescription, visualElements);
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23ddd" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="%23666">${encodeURIComponent(sceneDescription.slice(0, 30))}</text></svg>`;
};

export const generateSceneAudio = async (
  audioScript: string
): Promise<string> => {
  // Placeholder: In production, this would call a TTS API
  // For now, return the script as a "data URL" placeholder
  console.log('generateSceneAudio called with:', audioScript);
  return `audio://placeholder/${encodeURIComponent(audioScript.slice(0, 50))}`;
};
