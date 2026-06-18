import React, { useState, useEffect } from 'react';
import { AnalysisResult, PatternAnalysisResult, LoadingState, HistoryItem } from './types';
import { analyzeCopy, extractPattern } from './services/geminiService';
import { TreeVisualizer } from './components/TreeVisualizer';
import { AnalysisCard } from './components/AnalysisCard';
import { PatternResult } from './components/PatternResult';
import { HistorySidebar } from './components/HistorySidebar';
import { getHistory, saveHistoryItem, deleteHistoryItem, generateTitle } from './services/historyService';
import { ToolHeader } from '../../shared/components/ToolHeader';
import { Microscope, History } from 'lucide-react';
import { ExportButton } from '../../shared/components/ExportButton';
import { exportAsMarkdown } from '../../shared/utils/exportUtils';

// Sample text for quick testing
const SAMPLE_TEXT = `你写PPT时，阿拉斯加的鳕鱼正跃出水面；
你看报表时，梅里雪山的金丝猴刚好爬上树尖；
你挤进地铁时，西藏的山鹰一直盘旋云端；
你在会议中吵架时，尼泊尔的背包客一起端起酒杯坐在火堆旁。
有一些穿高跟鞋走不到的路，有一些喷着香水闻不到的空气，有一些在写字楼里永远遇不见的人。`;

type AppMode = 'single' | 'pattern';

const CopyAnalyzer: React.FC = () => {
    const [mode, setMode] = useState<AppMode>('single');

    // State for Single Mode
    const [inputText, setInputText] = useState('');
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [singlePatternResult, setSinglePatternResult] = useState<PatternAnalysisResult | null>(null);
    const [singlePatternLoading, setSinglePatternLoading] = useState<boolean>(false);

    // State for Pattern Mode
    const [multiTexts, setMultiTexts] = useState<string[]>(['', '']);
    const [patternResult, setPatternResult] = useState<PatternAnalysisResult | null>(null);

    const [loading, setLoading] = useState<LoadingState>({ status: 'idle' });

    // History State
    const [showHistory, setShowHistory] = useState(false);
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

    // Load history on mount
    useEffect(() => {
        setHistoryItems(getHistory());
    }, []);

    // Update history list helper
    const updateHistoryList = (newItem: HistoryItem) => {
        const updated = saveHistoryItem(newItem);
        setHistoryItems(updated);
    };

    const handleDeleteHistory = (id: string) => {
        const updated = deleteHistoryItem(id);
        setHistoryItems(updated);
    };

    const handleRestoreHistory = (item: HistoryItem) => {
        if (item.type === 'single') {
            setMode('single');
            setInputText(item.data.inputText || '');
            setResult(item.data.analysisResult || null);
            setSinglePatternResult(null);
        } else if (item.type === 'pattern') {
            setMode('pattern');
            setMultiTexts(item.data.inputTexts || ['', '']);
            setPatternResult(item.data.patternResult || null);
        }
        setShowHistory(false);
    };

    const handleExport = async () => {
        if (!result) return;
        await new Promise(resolve => setTimeout(resolve, 50));
        const mdContent = [
            `# 文案拆解分析报告\n`,
            `## 全篇总结\n${result.summary}\n`,
            `## 架构思维导图\n${JSON.stringify(result.structure, null, 2)}\n`,
            `## 逐段深度拆解\n`
        ];
        
        result.breakdown.forEach((item, i) => {
            mdContent.push(`### 段落 ${i + 1} (${item.role})`);
            mdContent.push(`**原文**: ${item.originalText}`);
            mdContent.push(`**意图**: ${item.intent}`);
            mdContent.push(`**受众心理**: ${item.audiencePsychology}`);
            mdContent.push(`**情绪能量**: ${item.emotionalEnergy}`);
            mdContent.push(`**高亮词**: ${item.highlights.join(', ')}\n`);
        });

        exportAsMarkdown(mdContent.join('\n'), `文案深度拆解报告_${new Date().toISOString().slice(0, 10)}.md`);
    };

    // Handlers for Single Mode
    const handleAnalyze = async () => {
        if (!inputText.trim()) return;
        setLoading({ status: 'analyzing', message: '正在拆解文案架构...' });
        setResult(null);
        setSinglePatternResult(null);
        try {
            const data = await analyzeCopy(inputText);
            setLoading({ status: 'complete' });
            setResult(data);

            // Save to History
            updateHistoryList({
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                type: 'single',
                title: generateTitle(inputText),
                data: { inputText, analysisResult: data }
            });

        } catch (err) {
            setLoading({ status: 'error', message: '分析失败，请稍后重试。' });
        }
    };

    const handleSingleRewrite = async () => {
        if (!inputText) return;
        setSinglePatternLoading(true);
        try {
            const data = await extractPattern([inputText]);
            setSinglePatternResult(data);
        } catch (e) {
            console.error(e);
            alert("风格提取失败");
        } finally {
            setSinglePatternLoading(false);
        }
    };

    // Handlers for Pattern Mode
    const handlePatternAnalyze = async () => {
        const validTexts = multiTexts.filter(t => t.trim().length > 0);
        if (validTexts.length < 2) {
            alert("请至少输入两段文案以进行共性提炼。");
            return;
        }
        setLoading({ status: 'analyzing', message: '正在对比并提炼共性框架...' });
        setPatternResult(null);
        try {
            const data = await extractPattern(validTexts);
            setLoading({ status: 'complete' });
            setPatternResult(data);

            // Save to History
            updateHistoryList({
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                type: 'pattern',
                title: `共性提炼: ${generateTitle(validTexts[0])}`,
                data: { inputTexts: multiTexts, patternResult: data }
            });

        } catch (err) {
            setLoading({ status: 'error', message: '共性提炼失败，请稍后重试。' });
        }
    };

    const updateMultiText = (index: number, value: string) => {
        const newTexts = [...multiTexts];
        newTexts[index] = value;
        setMultiTexts(newTexts);
    };

    const addTextInput = () => {
        setMultiTexts([...multiTexts, '']);
    };

    const removeTextInput = (index: number) => {
        if (multiTexts.length <= 2) return;
        const newTexts = multiTexts.filter((_, i) => i !== index);
        setMultiTexts(newTexts);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
            {/* Header */}
            <ToolHeader
                icon={Microscope}
                iconBgClass="bg-indigo-600"
                title="文案拆解器"
                titleHighlight="旗舰版"
                subtitle="结构拆解 · 句式提取 · 爆款复制"
                rightContent={
                    <div className="flex items-center gap-2">
                        {result && mode === 'single' && (
                            <ExportButton
                                onExport={handleExport}
                                label="导出报告"
                                className="!py-1.5 !px-3"
                            />
                        )}
                        <button
                            onClick={() => setShowHistory(true)}
                            className="text-[13px] font-medium text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg"
                        >
                            <History className="w-4 h-4" />
                            历史记录
                        </button>
                    </div>
                }
            />

            <HistorySidebar
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                items={historyItems}
                onSelect={handleRestoreHistory}
                onDelete={handleDeleteHistory}
            />

            <main className="max-w-6xl mx-auto px-6 py-8">

                {/* Mode Switcher */}
                <div className="flex justify-center mb-10">
                    <div className="bg-slate-200 p-1 rounded-xl inline-flex shadow-inner">
                        <button
                            onClick={() => setMode('single')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'single' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            单篇深度拆解
                        </button>
                        <button
                            onClick={() => setMode('pattern')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'pattern' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            多篇共性提炼
                        </button>
                    </div>
                </div>

                {/* --- SINGLE MODE --- */}
                {mode === 'single' && (
                    <>
                        <section className="mb-12">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
                                <textarea
                                    className="w-full h-48 p-6 text-lg text-slate-700 placeholder:text-slate-300 border-none outline-none resize-none rounded-xl focus:bg-slate-50 transition-colors"
                                    placeholder="请在此粘贴您想分析的文案..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                />
                                <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 rounded-b-xl flex justify-between items-center">
                                    <button
                                        onClick={() => setInputText(SAMPLE_TEXT)}
                                        className="text-sm text-slate-500 hover:text-indigo-600 transition-colors font-medium"
                                    >
                                        试用示例文案
                                    </button>
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={loading.status === 'analyzing' || !inputText.trim()}
                                        className={`
                      flex items-center space-x-2 px-6 py-2.5 rounded-lg font-semibold text-white transition-all transform active:scale-95
                      ${loading.status === 'analyzing' || !inputText.trim()
                                                ? 'bg-slate-300 cursor-not-allowed'
                                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:shadow-indigo-300'}
                    `}
                                    >
                                        {loading.status === 'analyzing' ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                <span>正在分析...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>拆解文案结构</span>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                            {loading.status === 'error' && (
                                <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {loading.message}
                                </div>
                            )}
                        </section>

                        {result && (
                            <div className="space-y-12">
                                <section>
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
                                        <h2 className="text-2xl font-bold text-slate-800">架构思维导图</h2>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                        <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-900">
                                            <span className="font-bold uppercase text-xs tracking-wider text-indigo-500 block mb-1">全篇总结 (Executive Summary)</span>
                                            {result.summary}
                                        </div>
                                        <TreeVisualizer data={result.structure} />
                                    </div>
                                </section>

                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-8 w-1 bg-purple-500 rounded-full"></div>
                                            <h2 className="text-2xl font-bold text-slate-800">逐段深度拆解</h2>
                                        </div>
                                        <span className="text-sm font-medium text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                                            {result.breakdown.length} 个分析节点
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {result.breakdown.map((item, index) => (
                                            <AnalysisCard key={index} item={item} index={index} />
                                        ))}
                                    </div>
                                </section>

                                {/* Rewrite Section */}
                                <section className="pt-8 border-t border-slate-200">
                                    <div className="bg-gradient-to-r from-slate-100 to-slate-50 p-6 rounded-2xl border border-slate-200">
                                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                                            <div>
                                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    风格仿写与二次创作
                                                </h2>
                                                <p className="text-sm text-slate-500 mt-1">基于当前文案的风格基因，生成新的爆款文案。</p>
                                            </div>
                                            {!singlePatternResult && (
                                                <button
                                                    onClick={handleSingleRewrite}
                                                    disabled={singlePatternLoading}
                                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
                                                >
                                                    {singlePatternLoading ? (
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                                    )}
                                                    <span>{singlePatternLoading ? '正在提取风格...' : '开启AI仿写模式'}</span>
                                                </button>
                                            )}
                                        </div>

                                        {singlePatternResult && (
                                            <div>
                                                <PatternResult data={singlePatternResult} inputTexts={[inputText]} />
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}
                    </>
                )}

                {/* --- PATTERN MODE --- */}
                {mode === 'pattern' && (
                    <>
                        <section className="mb-12">
                            <div className="space-y-4 mb-6">
                                {multiTexts.map((text, idx) => (
                                    <div key={idx} className="relative group">
                                        <div className="absolute top-4 left-4 z-10 bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded">
                                            文案 {idx + 1}
                                        </div>
                                        <textarea
                                            className="w-full h-32 p-6 pt-12 text-base text-slate-700 placeholder:text-slate-300 border border-slate-200 rounded-xl focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none"
                                            placeholder={`输入第 ${idx + 1} 篇爆款文案...`}
                                            value={text}
                                            onChange={(e) => updateMultiText(idx, e.target.value)}
                                        />
                                        {multiTexts.length > 2 && (
                                            <button
                                                onClick={() => removeTextInput(idx)}
                                                className="absolute top-4 right-4 text-slate-300 hover:text-red-400 p-1 rounded-full hover:bg-red-50 transition-colors"
                                                title="删除此文案"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center">
                                <button
                                    onClick={addTextInput}
                                    className="flex items-center space-x-2 text-indigo-600 font-bold text-sm hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    <span>添加更多文案</span>
                                </button>

                                <button
                                    onClick={handlePatternAnalyze}
                                    disabled={loading.status === 'analyzing' || multiTexts.filter(t => t.trim()).length < 2}
                                    className={`
                      flex items-center space-x-2 px-8 py-3 rounded-lg font-semibold text-white transition-all transform active:scale-95 shadow-lg
                      ${loading.status === 'analyzing' || multiTexts.filter(t => t.trim()).length < 2
                                            ? 'bg-slate-300 cursor-not-allowed shadow-none'
                                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:shadow-indigo-300'}
                    `}
                                >
                                    {loading.status === 'analyzing' ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            <span>正在寻找共性...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                            <span>提炼核心框架</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {loading.status === 'error' && (
                                <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {loading.message}
                                </div>
                            )}
                        </section>

                        {patternResult && (
                            <PatternResult data={patternResult} inputTexts={multiTexts} />
                        )}
                    </>
                )}

            </main>
        </div>
    );
};

export default CopyAnalyzer;
