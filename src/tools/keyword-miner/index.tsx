import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Sparkles, Clock } from 'lucide-react';
import SearchInput from './components/SearchInput';
import KeywordGroup from './components/KeywordGroup';
import Analytics from './components/Analytics';
import ExpansionPanel from './components/ExpansionPanel';
import HistorySidebar from './components/HistorySidebar';
import { ToolHeader } from '../../shared/components/ToolHeader';
import { generateKeywords, expandSubFields } from './services/api';
import { AnalysisResult, CategoryKey, CATEGORY_LABELS, HistoryItem } from './types';
import { ExportButton } from '../../shared/components/ExportButton';
import { exportAsCSV } from '../../shared/utils/exportUtils';

const STORAGE_KEY = 'rednote_miner_history';

const KeywordMiner: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [expanding, setExpanding] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [currentHistoryId, setCurrentHistoryId] = useState<string | undefined>(undefined);
    const [activeSubFieldIndex, setActiveSubFieldIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const [history, setHistory] = useState<HistoryItem[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    });
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }, [history]);

    const addToHistory = (data: AnalysisResult) => {
        const newItem: HistoryItem = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            data: data
        };
        setHistory(prev => [newItem, ...prev]);
        setCurrentHistoryId(newItem.id);
    };

    const handleSearch = async (term: string) => {
        setLoading(true);
        setError(null);
        setResult(null);
        setCurrentHistoryId(undefined);
        setActiveSubFieldIndex(0);

        try {
            const data = await generateKeywords(term);
            setResult(data);
            addToHistory(data);
        } catch (err: any) {
            setError(err.message || "深度挖掘失败，请重试。");
        } finally {
            setLoading(false);
        }
    };

    const handleExpand = async (direction?: string) => {
        if (!result) return;
        setExpanding(true);
        setError(null);

        try {
            const existingNames = result.subFields.map(s => s.name);
            const newFields = await expandSubFields(result.niche, existingNames, direction);

            if (newFields && newFields.length > 0) {
                const updatedResult = {
                    ...result,
                    subFields: [...result.subFields, ...newFields]
                };
                setResult(updatedResult);

                if (currentHistoryId) {
                    setHistory(prev => prev.map(item =>
                        item.id === currentHistoryId ? { ...item, data: updatedResult } : item
                    ));
                }
                setActiveSubFieldIndex(result.subFields.length);
            }
        } catch (err) {
            setError("扩展失败，请稍后重试。");
        } finally {
            setExpanding(false);
        }
    };

    const handleHistorySelect = (item: HistoryItem) => {
        setResult(item.data);
        setCurrentHistoryId(item.id);
        setActiveSubFieldIndex(0);
        setIsHistoryOpen(false);
        setError(null);
    };

    const handleHistoryDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setHistory(prev => prev.filter(item => item.id !== id));
        if (currentHistoryId === id) {
            setResult(null);
            setCurrentHistoryId(undefined);
        }
    };

    const handleClearHistory = () => {
        if (confirm('确定要清空所有历史记录吗？')) {
            setHistory([]);
            setCurrentHistoryId(undefined);
        }
    };

    const handleExportCSV = async () => {
        if (!result) return;

        // Ensure we yield to the UI thread slightly to show loading state if it takes long
        await new Promise(resolve => setTimeout(resolve, 50));

        let csvContent = "赛道,细分领域,关键词类型,拆解逻辑,分组名称,关键词\n";

        result.subFields.forEach(sub => {
            (Object.keys(CATEGORY_LABELS) as CategoryKey[]).forEach(catKey => {
                const categoryData = sub.keywords[catKey];
                if (categoryData && categoryData.groups) {
                    categoryData.groups.forEach(group => {
                        group.items.forEach(kw => {
                            const safeLogic = categoryData.logic.replace(/"/g, '""');
                            const safeGroup = group.groupName.replace(/"/g, '""');
                            const safeKw = kw.replace(/"/g, '""');
                            csvContent += `"${result.niche}","${sub.name}","${CATEGORY_LABELS[catKey].label}","${safeLogic}","${safeGroup}","${safeKw}"\n`;
                        });
                    });
                }
            });
        });

        exportAsCSV(csvContent, `${result.niche}_小红书MECE关键词库.csv`);
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] text-gray-900 pb-20 relative">
            <HistorySidebar
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                history={history}
                onSelect={handleHistorySelect}
                onDelete={handleHistoryDelete}
                onClear={handleClearHistory}
                currentResultId={currentHistoryId}
            />

            <ToolHeader
                icon={BookOpen}
                iconBgClass="bg-red-500"
                title="红书"
                titleHighlight="挖掘机"
                badgeText="专业版"
                subtitle="小红书赛道 · 痛点穷举 · MECE拆解"
                rightContent={
                    <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors text-[13px] font-medium"
                    >
                        <Clock size={16} />
                        <span>历史记录</span>
                        {history.length > 0 && (
                            <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center font-bold">
                                {history.length}
                            </span>
                        )}
                    </button>
                }
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {!result && !loading && (
                    <div className="pt-10 pb-6 text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
                            海量挖掘用户<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">真实痛点与场景</span>
                        </h2>
                        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                            基于 DeepSeek AI，对赛道进行 MECE 全景拆解。
                            <br className="hidden sm:block" />
                            重点穷举用户吐槽、避雷、焦虑等高价值"问题词"。
                        </p>
                    </div>
                )}

                <SearchInput onSearch={handleSearch} isLoading={loading} />

                {error && (
                    <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-center">
                        {error}
                    </div>
                )}

                {result && (
                    <div id="results-section">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                            <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                                {result.subFields.map((sub, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveSubFieldIndex(idx)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${activeSubFieldIndex === idx
                                                ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {sub.name}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 ml-auto md:ml-0">
                                {currentHistoryId && (
                                    <span className="text-xs text-gray-400 mr-2 flex items-center gap-1">
                                        <Clock size={12} />
                                        历史回溯模式
                                    </span>
                                )}
                                <ExportButton
                                    onExport={handleExportCSV}
                                    label="导出 Excel"
                                />
                            </div>
                        </div>

                        <div className="mb-6 bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-start space-x-3">
                            <Sparkles className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
                            <p className="text-sm text-blue-800 leading-relaxed">
                                <span className="font-semibold">赛道洞察：</span>
                                {result.subFields[activeSubFieldIndex].description}
                            </p>
                        </div>

                        <Analytics subField={result.subFields[activeSubFieldIndex]} />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((key) => (
                                <KeywordGroup
                                    key={key}
                                    categoryKey={key}
                                    data={result.subFields[activeSubFieldIndex].keywords[key]}
                                />
                            ))}
                        </div>

                        <ExpansionPanel onExpand={handleExpand} isExpanding={expanding} />

                        <div className="mt-12 text-center text-gray-400 text-sm pb-8">
                            数据由 DeepSeek AI 生成，包含深度推理与扩展。
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default KeywordMiner;
