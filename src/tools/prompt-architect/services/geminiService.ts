import { UserInput, AssistantResponse } from '../types';
import { MASTER_TEMPLATE, SYSTEM_INSTRUCTION } from '../constants';

const API_KEY = import.meta.env.VITE_API_KEY || '';

export const generatePersonaPrompt = async (input: UserInput): Promise<string> => {
    if (!API_KEY) {
        throw new Error('API Key is missing');
    }

    const userContent = `
  Here is the "Master Template" (Guo Dou Cheng Ma) that defines the structure and quality I want:
  
  """
  ${MASTER_TEMPLATE}
  """

  --------------------------------------------------

  Now, generate a NEW PROMPT using the same structure, depth, and logic, but applied to the following details:

  [New Persona Role]: ${input.roleName}
  [Role Background]: ${input.roleBackground}
  [Role Values]: ${input.roleValues}
  [Family/Personal Context]: ${input.familyDetails}
  [Product Name]: ${input.productName}
  [Product Features/Manuals]: ${input.productFeatures}
  [Target Audience]: ${input.targetAudience}
  [Pain Points]: ${input.painPoints}

  Instructions for the generated prompt:
  1. **Structure:** The output prompt must follow the Master Template's structure exactly:
     - Role/System Settings
     - Product Definition (make it sound like a system/library/solution set)
     - Writing Goals (Click, Resonance, Dry Goods, Conversion, Temperature)
     - Core Writing Mindset
     - Writing Structure (5 paragraphs)
     
  2. **Case Studies (CRITICAL):** 
     You MUST generate two full example posts, labeled "案例1" and "案例2", at the bottom of the prompt (just before the style guide).
     - These cases must be about the NEW product/persona.
     - They must strictly follow the 5-paragraph structure.
     - They must be high-quality, emotional, and persuasive.

  3. **Style & Content Direction (CRITICAL):**
     You MUST append the "Content Direction" and "Language Style" at the very end.
     - Keep the **intensity**, the **"weak posture, strong means"** philosophy, and the **emotional triggering** instructions exactly as they are in the Master Template.

  4. **Tone:** Ensure the tone of the generated prompt itself is professional and instructional, but the *content* it describes is emotional and "XiaoHongShu" native.
  
  Output the final prompt text in Markdown format.
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
                messages: [
                    { role: 'system', content: SYSTEM_INSTRUCTION },
                    { role: 'user', content: userContent }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API Error: ${response.status}`);
        }

        const result = await response.json();
        return result.choices[0].message.content || 'Failed to generate prompt. Please try again.';
    } catch (error) {
        console.error('DeepSeek API Error:', error);
        throw new Error('Failed to communicate with the AI service.');
    }
};

export const extractInfoFromContext = async (
    message: string,
    fileBase64?: string,
    mimeType?: string
): Promise<AssistantResponse> => {
    if (!API_KEY) {
        throw new Error('API Key is missing');
    }

    const userMessage: any = { role: 'user', content: [] };
    
    if (fileBase64 && mimeType) {
        userMessage.content.push({
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${fileBase64}` }
        });
    }

    userMessage.content.push({
        type: "text",
        text: `User Message: "${message}"\n\nAnalyze the user's message and any attached files. 
    Your goal is to extract information to fill a XiaoHongShu Copywriting Form.
    The fields we need are: Role Name, Role Background, Values, Family Details, Product Name, Product Features, Target Audience, Pain Points.
    
    If the user provides a document (PDF, Image, Text), strictly analyze it to extract these details.
    
    Return a JSON object with:
    1. 'conversationalResponse': A natural language reply confirming what you found or asking for missing info.
    2. 'extractedData': The structured data mapping to the fields. If a field is missing, leave it as empty string.`
    });

    try {
        const response = await fetch('/api/deepseek/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: localStorage.getItem('deepseek_model_preference') || 'deepseek-v4-flash',
                messages: [userMessage]
            })
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API Error: ${response.status}`);
        }

        const result = await response.json();
        const jsonText = result.choices[0].message.content;

        if (!jsonText) throw new Error('No response from AI');

        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid response format');

        return JSON.parse(jsonMatch[0]) as AssistantResponse;
    } catch (error) {
        console.error('Smart Assistant Error:', error);
        throw new Error('Failed to analyze content.');
    }
};
