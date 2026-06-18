import { BASE_PERSONA, NOTE_TYPE_INSTRUCTIONS } from '../constants';
import { CopyRequest, GeneratedCopy, NoteType } from '../types';

const API_KEY = import.meta.env.VITE_API_KEY || '';

const stripMarkdown = (text: string): string => {
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/#{1,6}\s?/g, '')
        .replace(/`{3}[\s\S]*?`{3}/g, '')
        .replace(/`/g, '')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/^\s*[-*+]\s+/gm, '')
        .trim();
};

const parseResponse = (text: string, request?: CopyRequest): GeneratedCopy => {
    const cleanText = stripMarkdown(text || '');

    let title = '未命名笔记';
    let content = cleanText;

    const titleMatch = cleanText.match(/(?:标题|Title)[：:]?\s*(.*?)(?:\n|$)/) || cleanText.match(/【(.*?)】/);

    if (titleMatch) {
        title = titleMatch[1].trim();
        content = cleanText.replace(titleMatch[0], '').trim();
    } else {
        const lines = cleanText.split('\n');
        if (lines.length > 0 && lines[0].length < 50) {
            title = lines[0].trim();
            content = lines.slice(1).join('\n').trim();
        }
    }

    return {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        title,
        content,
        originalRequest: request || { topic: '', targetAudience: '', noteType: 'SEARCH' as NoteType }
    };
};

let chatHistory: { role: string; content: string }[] = [];

export const startNewSession = async (request: CopyRequest): Promise<GeneratedCopy> => {
    if (!API_KEY) {
        throw new Error('API Key is missing');
    }

    const { topic, targetAudience, productFocus, noteType, customPrompt, customProduct } = request;
    const basePersona = customPrompt || BASE_PERSONA;
    const fullSystemInstruction = `${basePersona}\n\n${NOTE_TYPE_INSTRUCTIONS[noteType]}`;

    let userPrompt = `请为我写一篇小红书笔记。\n【目标人群】：${targetAudience}`;

    const actualProduct = customProduct || productFocus || '指定产品';
    
    if (noteType === 'SALES') {
        userPrompt += `\n【重点推荐产品/卖点资料】：\n${actualProduct}\n注意：这是商销硬广，直接根据产品特性和目标人群痛点撰写。`;
    } else if (noteType === 'TRAFFIC') {
        userPrompt += `\n【选题/吐槽点】：${topic}\n注意：这是流量型笔记，重点是情绪共鸣，不要带货。`;
    } else {
        userPrompt += `\n【选题】：${topic}\n【重点推荐产品/卖点资料】：\n${actualProduct}\n注意：这是搜索型笔记，重点是干货+软广。`;
    }

    userPrompt += `\n\n**排版要求**：\n1. 一句话占一行。\n2. 段落之间必须空一行。\n3. 每句尽量20字以内。\n\n输出格式要求：\n第一行：【标题】这里是标题\n第二行开始：正文内容...`;

    chatHistory = [
        { role: 'system', content: fullSystemInstruction },
        { role: 'user', content: userPrompt }
    ];

    try {
        const response = await fetch('/api/deepseek/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: localStorage.getItem('deepseek_model_preference') || 'deepseek-v4-flash',
                messages: chatHistory
            })
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API Error: ${response.status}`);
        }

        const result = await response.json();
        const responseText = result.choices[0].message.content;

        chatHistory.push({ role: 'assistant', content: responseText });

        return parseResponse(responseText || '', request);
    } catch (error) {
        console.error('Error starting session:', error);
        throw new Error('生成文案失败，请检查网络或API Key配置');
    }
};

export const modifyCopy = async (instruction: string, currentContext: GeneratedCopy): Promise<GeneratedCopy> => {
    if (!API_KEY) {
        throw new Error('API Key is missing');
    }

    const modifyPrompt = `当前文案：\n标题：${currentContext.title}\n内容：${currentContext.content}\n\n修改指令：${instruction}。\n请重写整篇文案，保持没有Markdown格式字符，并严格遵守手机端排版（短句、一句话一行、段间空行）。保持相同的输出结构（第一行标题）。`;
    
    // Check if chatHistory has system prompt, if not, recreate it
    if (chatHistory.length === 0 || chatHistory[0].role !== 'system') {
        const originalType = currentContext.originalRequest?.noteType || 'SEARCH';
        const basePersona = currentContext.originalRequest?.customPrompt || BASE_PERSONA;
        const fullSystemInstruction = `${basePersona}\n\n${NOTE_TYPE_INSTRUCTIONS[originalType]}`;
        chatHistory = [{ role: 'system', content: fullSystemInstruction }];
    }

    chatHistory.push({ role: 'user', content: modifyPrompt });

    try {
        const response = await fetch('/api/deepseek/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: localStorage.getItem('deepseek_model_preference') || 'deepseek-v4-flash',
                messages: chatHistory
            })
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API Error: ${response.status}`);
        }

        const result = await response.json();
        const responseText = result.choices[0].message.content;

        chatHistory.push({ role: 'assistant', content: responseText });

        return parseResponse(responseText || '', currentContext.originalRequest);
    } catch (error) {
        console.error('Error modifying copy:', error);
        throw new Error('修改文案失败');
    }
};
