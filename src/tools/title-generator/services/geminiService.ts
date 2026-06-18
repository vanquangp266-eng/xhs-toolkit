import { GeneratedTopic, ViralCase, ExpandedAngle } from '../types';

const API_KEY = import.meta.env.VITE_API_KEY || '';

// Helper to shuffle array for randomness
function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

export const generateTopics = async (
    metaTopic: string,
    cases: ViralCase[]
): Promise<GeneratedTopic[]> => {
    if (!API_KEY) {
        throw new Error('API Key is missing. Please check your environment variables.');
    }

    // Shuffle cases to ensure variety
    const shuffledCases = shuffleArray(cases);
    const caseExamples = shuffledCases.map(c => `- ${c.content}`).join('\n');

    const prompt = `
    You are an expert social media strategist specializing in "Xiaohongshu" (Little Red Book).
    
    My "Meta Topic" is: "${metaTopic}"

    Here is my "Viral Case Library" (proven high-performing title templates):
    ${caseExamples}

    **Process:**
    1. **Global Scan:** First, read and analyze **ALL** provided templates in the Case Library. Do not just use the first few.
    2. **Deep Brainstorming:** Internally generate 50 different title variations by combining the Meta Topic with the structure/tone of the templates.
       - Try to find the *best matching* templates for this specific topic.
       - Ensure variety in the selected templates.
    3. **Selection (Best of the Best):** From your 50 internal drafts, select the **Top 20 absolute best** titles.
    
    **Requirements:**
    1. **Strict Adherence:** You MUST follow the sentence structures and tones of the Case Library.
    2. **Variety:** The 20 output titles should use different templates/angles from the library.
    3. **Grading System:**
       - **Grade S (Top 5):** The absolute best, most viral, high-click-through rate titles.
       - **Grade A (Next 5):** Strong contenders, very good.
       - **Grade B (Next 5):** Good, safe choices.
       - **Grade C (Last 5):** Decent but less explosive.
    4. **Score:** 1-100 based on viral potential.
    5. **Reason:** Short explanation (under 10 words) of why this template fits the topic.
    6. **No Emojis:** Do not add emojis yourself.

    **Output Format:** Strictly JSON Array.
    **Language:** Simplified Chinese.
    
    Example output format:
    [{"title":"标题1","score":95,"grade":"S","reason":"理由1"},{"title":"标题2","score":88,"grade":"A","reason":"理由2"}]
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

        const data = JSON.parse(jsonMatch[0]) as GeneratedTopic[];
        return data.sort((a, b) => b.score - a.score);
    } catch (error) {
        console.error('Error generating topics:', error);
        throw error;
    }
};

export const expandMetaTopic = async (
    metaTopic: string
): Promise<ExpandedAngle[]> => {
    if (!API_KEY) {
        throw new Error('API Key is missing.');
    }

    const prompt = `
    You are a viral content consultant. The user wants to brainstorm directions for the topic: "${metaTopic}" for Xiaohongshu (Little Red Book).

    **Task:**
    Perform an "Explosive Brainstorming" session. Break this topic down into 8-12 distinct, high-potential viral sub-angles.
    
    Think in these dimensions:
    1. **Contrarian/Reverse Psychology** (e.g., "Don't do X")
    2. **Specific Pain Points** (e.g., "Saves money/time")
    3. **Niche Target Audience** (e.g., "For students/moms")
    4. **Emotional Resonance** (e.g., Anxiety, Joy, FOMO)
    5. **Tutorial/Utility** (e.g., "Nanny-level guide")
    
    **Requirements:**
    - The "angle" should be a short phrase (not a full title, but a direction).
    - Score: 1-100 based on market demand and viral potential.
    - Reason: Why this angle works.
    - Language: Simplified Chinese.
    - Output: JSON Array.

    Example output format:
    [{"angle":"角度1","score":90,"reason":"理由1"},{"angle":"角度2","score":85,"reason":"理由2"}]
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

        const data = JSON.parse(jsonMatch[0]) as ExpandedAngle[];
        return data.sort((a, b) => b.score - a.score);
    } catch (error) {
        console.error('Error expanding topic:', error);
        throw error;
    }
};
