import React, { useState, useEffect } from 'react';
import { ViralCase, HistoryItem, GeneratedTopic, AppTab } from './types';
import { DEFAULT_CASES, STORAGE_KEYS } from './constants';
import { TopicGenerator } from './components/TopicGenerator';
import { CaseLibrary } from './components/CaseLibrary';
import { HistoryView } from './components/HistoryView';
import { Sparkles, BookOpen, Clock, Type } from 'lucide-react';
import { ToolHeader } from '../../shared/components/ToolHeader';

const TitleGenerator: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AppTab>(AppTab.GENERATOR);
    const [cases, setCases] = useState<ViralCase[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        try {
            const savedCases = localStorage.getItem(STORAGE_KEYS.CASES);
            setCases(savedCases ? JSON.parse(savedCases) : DEFAULT_CASES);

            const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
            if (savedHistory) setHistory(JSON.parse(savedHistory));
        } catch (e) {
            console.error('Failed to load title generator storage:', e);
            setCases(DEFAULT_CASES);
        }
    }, []);

    useEffect(() => {
        if (cases.length > 0) {
            localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
        }
    }, [cases]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    }, [history]);

    const handleGenerateSuccess = (metaTopic: string, results: GeneratedTopic[]) => {
        const newItem: HistoryItem = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            metaTopic,
            results
        };
        setHistory(prev => [newItem, ...prev].slice(0, 50));
    };

    const tabs = [
        { id: AppTab.GENERATOR, label: '生成器', icon: Sparkles },
        { id: AppTab.LIBRARY, label: '案例库', icon: BookOpen },
        { id: AppTab.HISTORY, label: '历史记录', icon: Clock }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <ToolHeader
                icon={Type}
                iconBgClass="bg-rose-500"
                title="爆款标题"
                titleHighlight="生成器"
                subtitle="由智能引擎驱动的标题工厂"
                rightContent={
                    <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    px-3 py-1.5 rounded-lg font-medium text-[13px] transition-all flex items-center gap-1.5
                                    ${activeTab === tab.id
                                        ? 'bg-white text-rose-600 shadow-sm border border-slate-200/60'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                                `}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                                {tab.id === AppTab.LIBRARY && (
                                    <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 rounded-full font-bold ml-0.5">
                                        {cases.length}
                                    </span>
                                )}
                                {tab.id === AppTab.HISTORY && history.length > 0 && (
                                    <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 rounded-full font-bold ml-0.5">
                                        {history.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                }
            />

            <main className="max-w-5xl mx-auto px-6 py-8">
                {activeTab === AppTab.GENERATOR && (
                    <TopicGenerator
                        cases={cases}
                        onGenerateSuccess={handleGenerateSuccess}
                    />
                )}

                {activeTab === AppTab.LIBRARY && (
                    <CaseLibrary
                        cases={cases}
                        setCases={setCases}
                    />
                )}

                {activeTab === AppTab.HISTORY && (
                    <HistoryView
                        history={history}
                        setHistory={setHistory}
                    />
                )}
            </main>
        </div>
    );
};

export default TitleGenerator;
