import React, { useState, useEffect } from 'react';
import { InputForm } from './components/InputForm';
import { ResultDisplay } from './components/ResultDisplay';
import { HistoryList } from './components/HistoryList';
import { CopyRequest, GeneratedCopy, GenerationStatus } from './types';
import { startNewSession, modifyCopy } from './services/geminiService';
import { PenTool, Sparkles } from 'lucide-react';
import { ToolHeader } from '../../shared/components/ToolHeader';

const CopyGenerator: React.FC = () => {
    const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
    const [result, setResult] = useState<GeneratedCopy | null>(null);
    const [history, setHistory] = useState<GeneratedCopy[]>([]);

    // Load history from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('copy_history');
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    // Save history to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('copy_history', JSON.stringify(history));
    }, [history]);

    const addToHistory = (item: GeneratedCopy) => {
        setHistory(prev => {
            const filtered = prev.filter(h => h.id !== item.id);
            return [item, ...filtered].slice(0, 50);
        });
    };

    const handleGenerate = async (request: CopyRequest) => {
        setStatus(GenerationStatus.LOADING);
        setResult(null);

        try {
            const generatedData = await startNewSession(request);
            setResult(generatedData);
            addToHistory(generatedData);
            setStatus(GenerationStatus.SUCCESS);
        } catch (error) {
            console.error(error);
            setStatus(GenerationStatus.ERROR);
        }
    };

    const handleModify = async (instruction: string) => {
        if (!result) return;
        setStatus(GenerationStatus.MODIFYING);
        try {
            const modifiedData = await modifyCopy(instruction, result);
            setResult(modifiedData);
            setHistory(prev => prev.map(item => item.id === result.id ? modifiedData : item));
            setStatus(GenerationStatus.SUCCESS);
        } catch (error) {
            console.error(error);
            alert("修改失败，请重试");
            setStatus(GenerationStatus.SUCCESS);
        }
    };

    const handleSelectHistory = (item: GeneratedCopy) => {
        setResult(item);
        setStatus(GenerationStatus.SUCCESS);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleClearHistory = () => {
        if (confirm('确定要清空所有历史记录吗？')) {
            setHistory([]);
        }
    };

    return (
        <div className="min-h-screen bg-transparent text-slate-900 pb-12">
            {/* Navbar */}
            <ToolHeader
                icon={PenTool}
                iconBgClass="bg-indigo-600"
                title="万能文案引擎"
                subtitle="全场景智能写作"
                rightContent={
                    <div className="text-[11px] font-medium tracking-wide text-indigo-600 bg-indigo-50/80 px-3 py-1.5 rounded-full border border-indigo-100/50 hidden sm:flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        由私有提示词强力驱动
                    </div>
                }
            />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">

                    {/* Left Column: Input & History */}
                    <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
                        <div className="space-y-3 mb-2 px-1">
                            <h1 className="text-3xl font-black text-slate-800 leading-tight tracking-tight">
                                打造专属<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">全能爆款</span> 文案库
                            </h1>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                输入您的独家提示词与产品资料，一键生成极具转化率的定制文案。
                            </p>
                        </div>

                        <InputForm
                            isLoading={status === GenerationStatus.LOADING}
                            onSubmit={handleGenerate}
                        />

                        <HistoryList
                            history={history}
                            onSelect={handleSelectHistory}
                            onClear={handleClearHistory}
                            currentId={result?.id}
                        />
                    </div>

                    {/* Right Column: Output */}
                    <div className="lg:col-span-7 xl:col-span-8">
                        <ResultDisplay
                            status={status}
                            result={result}
                            onModify={handleModify}
                        />
                    </div>

                </div>
            </main>
        </div>
    );
};

export default CopyGenerator;
