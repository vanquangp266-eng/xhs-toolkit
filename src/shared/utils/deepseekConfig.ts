export const getDeepSeekApiKey = () =>
    localStorage.getItem('ds_api_key') || import.meta.env.VITE_API_KEY || '';

export const getDeepSeekModel = () => {
    const saved = localStorage.getItem('deepseek_model_preference');
    if (saved === 'deepseek-reasoner') return 'deepseek-v4-pro';
    return saved || 'deepseek-v4-flash';
};

export const getDeepSeekAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getDeepSeekApiKey()}`,
});

export const buildDeepSeekError = async (response: Response) => {
    const detail = await response.text().catch(() => '');
    return `DeepSeek API Error: ${response.status}${detail ? ` - ${detail}` : ''}`;
};
