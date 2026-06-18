import React, { useState, useEffect } from 'react';
import { AppStep, UserInput, GeneratedResult, HistoryItem } from './types';
import { generatePersonaPrompt } from './services/geminiService';
import InputForm from './components/InputForm';
import PromptResult from './components/PromptResult';
import HistoryDrawer from './components/HistoryDrawer';
import SmartAssistant from './components/SmartAssistant';
import { PenTool, Sparkles, History as HistoryIcon, Bot } from 'lucide-react';
import { ToolHeader } from '../../shared/components/ToolHeader';
import { useGlobalStore } from '../../shared/store/globalStore';

const INITIAL_INPUT: UserInput = {
    roleName: '',
    roleBackground: '',
    roleValues: '',
    familyDetails: '',
    productName: '',
    productFeatures: '',
    targetAudience: '',
    painPoints: ''
};

const PromptArchitect: React.FC = () => {
    const [step, setStep] = useState<AppStep>(AppStep.INPUT);
    const [input, setInput] = useState<UserInput>(INITIAL_INPUT);
    const [result, setResult] = useState<GeneratedResult>({ prompt: '', isGenerating: false });

    // History State
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    // Assistant State
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);

    // Global Store
    const { currentProductContext } = useGlobalStore();

    // Load history from localStorage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('xhs_prompt_history');
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    const saveToHistory = (newInput: UserInput, promptText: string) => {
        const newItem: HistoryItem = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            input: { ...newInput },
            prompt: promptText
        };
        const updatedHistory = [newItem, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('xhs_prompt_history', JSON.stringify(updatedHistory));
    };

    const clearHistory = () => {
        if (window.confirm('确定要清空所有历史记录吗？')) {
            setHistory([]);
            localStorage.removeItem('xhs_prompt_history');
        }
    };

    const handleSelectHistory = (item: HistoryItem) => {
        setInput(item.input);
        setResult({ prompt: item.prompt, isGenerating: false });
        setStep(AppStep.RESULT);
        setIsHistoryOpen(false);
    };

    const handleAssistantApply = (data: Partial<UserInput>) => {
        setInput(prev => ({ ...prev, ...data }));
    };

    const handleGenerate = async () => {
        if (!input.roleName || !input.productName) {
            alert("请至少填写角色名称和产品名称。");
            return;
        }

        setStep(AppStep.GENERATING);
        setResult(prev => ({ ...prev, isGenerating: true, error: undefined }));

        try {
            const promptText = await generatePersonaPrompt(input);
            setResult({ prompt: promptText, isGenerating: false });
            setStep(AppStep.RESULT);
            saveToHistory(input, promptText);
        } catch (error: any) {
            setResult({ prompt: '', isGenerating: false, error: error.message });
            setStep(AppStep.INPUT);
            alert("生成失败: " + error.message);
        }
    };

    const handleReset = () => {
        setStep(AppStep.INPUT);
    };

    const handleImportProduct = () => {
        if (!currentProductContext) {
            alert("暂无全局产品洞察数据。请先在「产品全案洞察仪」中生成报告。");
            return;
        }
        // Basic extraction attempt. Since currentProductContext is text/markdown
        setInput(prev => ({
            ...prev,
            productFeatures: currentProductContext.slice(0, 500) + (currentProductContext.length > 500 ? '...' : '') // Just pre-fill features with the report text to let AI synthesize it
        }));
        alert("已成功导入产品洞察数据至「产品核心卖点」中，AI 生成时会自动参考！");
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
            {/* Header */}
            <ToolHeader
                icon={PenTool}
                iconBgClass="bg-rose-500"
                title="提示词"
                titleHighlight="构筑师"
                subtitle="全场景智能文案系统"
                rightContent={
                    <>
                        <button
                            onClick={() => setIsAssistantOpen(true)}
                            className="flex items-center gap-2 text-[13px] font-medium text-slate-600 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-full transition-all"
                        >
                            <Bot size={16} />
                            <span className="hidden sm:inline">AI 助手</span>
                        </button>

                        <button
                            onClick={() => setIsHistoryOpen(true)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all relative"
                            title="历史记录"
                        >
                            <HistoryIcon size={18} />
                            {history.length > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                            )}
                        </button>
                    </>
                }
            />

            {/* Main Content */}
            <main className="flex-grow py-12 px-6">
                <div className="max-w-4xl mx-auto">

                    {step === AppStep.INPUT || step === AppStep.GENERATING ? (
                        <div className="space-y-4">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
                                    打造你的小红书 <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">爆款人设</span> 提示词
                                </h2>
                                <p className="text-slate-500 max-w-xl mx-auto">
                                    输入你的产品背景和人设信息，我们将基于千万级爆款逻辑，为你生成专属的 AI 写作指令。
                                    <br />
                                    <span className="text-xs text-indigo-500 font-medium cursor-pointer hover:underline" onClick={() => setIsAssistantOpen(true)}>✨ 也可以试试右上角的 AI 助手，帮你自动填表</span>
                                </p>
                                {currentProductContext && (
                                    <div className="mt-4 flex justify-center">
                                        <button
                                            onClick={handleImportProduct}
                                            className="text-xs px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full font-bold hover:bg-yellow-100 transition-colors flex items-center gap-1.5 shadow-sm"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            一键导入全局产品洞察数据
                                        </button>
                                    </div>
                                )}
                            </div>
                            <InputForm
                                input={input}
                                setInput={setInput}
                                onGenerate={handleGenerate}
                                isGenerating={step === AppStep.GENERATING}
                            />
                        </div>
                    ) : (
                        <PromptResult
                            prompt={result.prompt}
                            onReset={handleReset}
                        />
                    )}

                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-slate-400 text-sm">
                <p>© 2024 XHS Prompt Architect. Designed for High-Conversion Copy.</p>
            </footer>

            {/* History Drawer */}
            <HistoryDrawer
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                history={history}
                onSelect={handleSelectHistory}
                onClear={clearHistory}
            />

            {/* Smart Assistant */}
            <SmartAssistant
                isOpen={isAssistantOpen}
                onClose={() => setIsAssistantOpen(false)}
                onApply={handleAssistantApply}
            />
        </div>
    );
};

export default PromptArchitect;
