import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TitlePair, ProcessingStats, DomainType } from './types';
import InputSection from './components/InputSection';
import PatternTable from './components/PatternTable';
import { extractPatternsBatch } from './services/geminiService';
import { Wand2, RefreshCw, AlertCircle, Clock, Trash2, X } from 'lucide-react';
import { ToolHeader } from '../../shared/components/ToolHeader';
import { ExportButton } from '../../shared/components/ExportButton';
import { exportAsCSV } from '../../shared/utils/exportUtils';

const CHUNK_SIZE = 20;
const STORAGE_KEY = 'pattern_extractor_history';

interface PatternHistoryItem {
    id: string;
    timestamp: number;
    domain: DomainType;
    rawInput: string;
    results: TitlePair[];
}

const PatternExtractor: React.FC = () => {
    const [rawInput, setRawInput] = useState<string>('');
    const [domain, setDomain] = useState<DomainType>(DomainType.PARENTING);
    const [results, setResults] = useState<TitlePair[]>([]);
    const [stats, setStats] = useState<ProcessingStats>({
        total: 0, processed: 0, isProcessing: false, currentChunk: 0, totalChunks: 0
    });
    const [error, setError] = useState<string | null>(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
    const abortRef = useRef<boolean>(false);

    const [history, setHistory] = useState<PatternHistoryItem[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
    }, [history]);

    const addToHistory = useCallback((nextResults: TitlePair[]) => {
        if (nextResults.length === 0) return;
        const item: PatternHistoryItem = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            domain,
            rawInput,
            results: nextResults,
        };
        setHistory(prev => [item, ...prev.filter(h => h.rawInput !== rawInput)].slice(0, 50));
        setCurrentHistoryId(item.id);
    }, [domain, rawInput]);

    const processTitles = useCallback(async () => {
        const titles = rawInput.split('\n').map(t => t.trim()).filter(t => t.length > 0);

        if (titles.length === 0) {
            setError('请至少输入一个标题');
            return;
        }

        setError(null);
        setResults([]);
        setCurrentHistoryId(null);
        abortRef.current = false;

        const chunks = [];
        for (let i = 0; i < titles.length; i += CHUNK_SIZE) {
            chunks.push(titles.slice(i, i + CHUNK_SIZE));
        }

        setStats({ total: titles.length, processed: 0, isProcessing: true, currentChunk: 0, totalChunks: chunks.length });

        try {
            const allResults: TitlePair[] = [];
            for (let i = 0; i < chunks.length; i++) {
                if (abortRef.current) break;
                setStats(prev => ({ ...prev, currentChunk: i + 1 }));
                const chunkResults = await extractPatternsBatch(chunks[i], domain);
                allResults.push(...chunkResults);
                setResults([...allResults]);
                setStats(prev => ({ ...prev, processed: prev.processed + chunks[i].length }));
            }
            addToHistory(allResults);
        } catch (err: any) {
            setError(err.message || '处理过程中发生错误，请稍后重试。');
        } finally {
            setStats(prev => ({ ...prev, isProcessing: false }));
        }
    }, [rawInput, domain, addToHistory]);

    const handleExport = async () => {
        if (results.length === 0) return;
        await new Promise(resolve => setTimeout(resolve, 50));
        const csvContent = "原标题,句式结构\n" + results.map(r => `"${r.original.replace(/"/g, '""')}","${r.pattern.replace(/"/g, '""')}"`).join("\n");
        exportAsCSV(csvContent, `title_patterns_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    const handleHistorySelect = (item: PatternHistoryItem) => {
        setRawInput(item.rawInput);
        setDomain(item.domain);
        setResults(item.results);
        setStats({ total: item.results.length, processed: item.results.length, isProcessing: false, currentChunk: 0, totalChunks: 0 });
        setCurrentHistoryId(item.id);
        setError(null);
        setHistoryOpen(false);
    };

    const handleHistoryDelete = (id: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setHistory(prev => prev.filter(item => item.id !== id));
        if (currentHistoryId === id) {
            setCurrentHistoryId(null);
        }
    };

    const progressPercentage = stats.total > 0 ? Math.round((stats.processed / stats.total) * 100) : 0;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans relative">
            {historyOpen && (
                <div className="fixed inset-0 z-[80] flex justify-end bg-slate-900/20 backdrop-blur-sm">
                    <aside className="w-full max-w-md h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-800">链路提取历史</h3>
                                <p className="text-xs text-slate-400 mt-0.5">{history.length} 条记录</p>
                            </div>
                            <button onClick={() => setHistoryOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-3 flex-1 overflow-y-auto space-y-2">
                            {history.length === 0 ? (
                                <div className="text-sm text-slate-400 text-center py-10">暂无历史记录</div>
                            ) : history.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleHistorySelect(item)}
                                    className={`w-full text-left p-3 rounded-xl border transition ${currentHistoryId === item.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-indigo-600 mb-1">{item.domain}</div>
                                            <p className="text-sm font-semibold text-slate-800 line-clamp-2">{item.results[0]?.original || '未命名记录'}</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {new Date(item.timestamp).toLocaleString()} · {item.results.length} 条
                                            </p>
                                        </div>
                                        <span
                                            onClick={(event) => handleHistoryDelete(item.id, event)}
                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md"
                                        >
                                            <Trash2 size={14} />
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        {history.length > 0 && (
                            <div className="p-3 border-t border-slate-100">
                                <button
                                    onClick={() => {
                                        if (confirm('确定清空链路提取历史吗？')) setHistory([]);
                                    }}
                                    className="w-full py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                                >
                                    清空历史
                                </button>
                            </div>
                        )}
                    </aside>
                </div>
            )}

            <ToolHeader
                icon={Wand2}
                iconBgClass="bg-indigo-600"
                title="爆款标题"
                titleHighlight="句式提取器"
                subtitle="AI 驱动的文案教练 · 爆款结构归纳"
                rightContent={
                    <>
                        {stats.total > 0 && (
                            <div className="hidden md:flex flex-col items-end mr-4">
                                <span className="text-[11px] font-semibold text-slate-500 mb-1 tracking-wide">
                                    处理进度 {stats.processed} / {stats.total}
                                </span>
                                <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setHistoryOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors text-[13px] font-medium"
                        >
                            <Clock size={16} />
                            <span>历史记录</span>
                            {history.length > 0 && (
                                <span className="bg-indigo-100 text-indigo-600 text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center font-bold">
                                    {history.length}
                                </span>
                            )}
                        </button>
                        {!stats.isProcessing && results.length > 0 && (
                            <ExportButton
                                onExport={handleExport}
                                label="导出 CSV"
                                className="!py-1.5 !px-3"
                            />
                        )}
                    </>
                }
            />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4">
                        <InputSection
                            rawInput={rawInput}
                            setRawInput={setRawInput}
                            domain={domain}
                            setDomain={setDomain}
                            isProcessing={stats.isProcessing}
                            onClear={() => { setRawInput(''); setResults([]); setCurrentHistoryId(null); setStats({ total: 0, processed: 0, isProcessing: false, currentChunk: 0, totalChunks: 0 }); }}
                        />

                        <button
                            onClick={processTitles}
                            disabled={stats.isProcessing || !rawInput.trim()}
                            className={`mt-4 w-full py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 text-white font-semibold text-lg shadow-lg shadow-indigo-200 transition-all transform active:scale-95 ${stats.isProcessing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                        >
                            {stats.isProcessing ? (
                                <>
                                    <RefreshCw size={20} className="animate-spin" />
                                    <span>AI 正在拆解中...</span>
                                </>
                            ) : (
                                <>
                                    <Wand2 size={20} />
                                    <span>开始批量提取 ({rawInput.trim() ? rawInput.trim().split('\n').filter(Boolean).length : 0})</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="lg:col-span-8">
                        {results.length > 0 ? (
                            <PatternTable data={results} />
                        ) : (
                            <div className="w-full h-full min-h-[400px] bg-white rounded-xl shadow-sm border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400 p-8">
                                <div className="bg-slate-50 p-4 rounded-full mb-4">
                                    <Wand2 size={48} className="text-slate-300" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-600 mb-2">等待开始</h3>
                                <p className="text-center max-w-sm">
                                    在左侧粘贴爆款标题，点击开始提取。AI 会自动分析并生成高度挖空的填空句式框架。
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PatternExtractor;
