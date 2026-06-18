import React, { useState, useRef } from 'react';
import { useGlobalStore } from '../../shared/store/globalStore';
import { SeoResult, SeoBatchStats } from './types';
import { generateSeoMatrix } from './services/seoGeminiService';
import { ToolHeader } from '../../shared/components/ToolHeader';
import { ExportButton } from '../../shared/components/ExportButton';
import { exportAsCSV } from '../../shared/utils/exportUtils';
import { 
    Database, 
    Upload, 
    Sparkles, 
    Loader2, 
    Download, 
    Layers,
    TrendingUp,
    Search,
    ShoppingBag,
    CheckCircle2,
    AlertCircle,
    DatabaseZap,
    Wand2
} from 'lucide-react';

const CHUNK_SIZE = 5;

const SeoMaster: React.FC = () => {
    const [keywordsInput, setKeywordsInput] = useState('');
    const [templatesInput, setTemplatesInput] = useState('');
    const [results, setResults] = useState<SeoResult[]>([]);
    const [stats, setStats] = useState<SeoBatchStats>({
        totalKeywords: 0,
        processedKeywords: 0,
        isProcessing: false
    });
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<boolean>(false);

    const { currentProductContext, currentPersona, currentPainPoint, currentPattern } = useGlobalStore();

    // Auto-fill templates from global state if available
    React.useEffect(() => {
        if (currentPattern && !templatesInput) {
            setTemplatesInput(currentPattern);
        }
    }, [currentPattern]);

    const handleGenerate = async () => {
        const keywords = keywordsInput.split('\n').map(k => k.trim()).filter(k => k.length > 0);
        if (keywords.length === 0) {
            setError('请至少输入一个赛道关键词');
            return;
        }

        setError(null);
        setResults([]);
        abortRef.current = false;
        setStats({
            totalKeywords: keywords.length,
            processedKeywords: 0,
            isProcessing: true
        });

        try {
            for (let i = 0; i < keywords.length; i++) {
                if (abortRef.current) break;
                
                const kwResults = await generateSeoMatrix(
                    keywords[i], 
                    templatesInput, 
                    {
                        product: currentProductContext || '',
                        persona: currentPersona || '',
                        painPoint: currentPainPoint || ''
                    }
                );

                setResults(prev => [...prev, ...kwResults]);
                setStats(prev => ({ ...prev, processedKeywords: i + 1 }));
            }
        } catch (err: any) {
            setError(err.message || '处理过程中发生错误');
        } finally {
            setStats(prev => ({ ...prev, isProcessing: false }));
        }
    };

    const handleStop = () => {
        abortRef.current = true;
    };

    const handleExport = async () => {
        if (results.length === 0) return;
        await new Promise(resolve => setTimeout(resolve, 50));

        const headers = ['关键词', '笔记类型', '推荐标题', '爆款评分', '创作逻辑'];
        const csvContent = headers.join(',') + '\n' + results.map(r => {
            const typeStr = r.noteType === 'TRAFFIC' ? '流量型' : r.noteType === 'SEARCH' ? '搜准型' : '转化型';
            return `"${r.keyword.replace(/"/g, '""')}","${typeStr}","${r.title.replace(/"/g, '""')}","${r.score}","${r.reason.replace(/"/g, '""')}"`;
        }).join('\n');

        exportAsCSV(csvContent, `SEO赛道内容矩阵_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    const progressPercentage = stats.totalKeywords > 0 ? Math.round((stats.processedKeywords / stats.totalKeywords) * 100) : 0;

    const trafficResults = results.filter(r => r.noteType === 'TRAFFIC');
    const searchResults = results.filter(r => r.noteType === 'SEARCH');
    const salesResults = results.filter(r => r.noteType === 'SALES');

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <ToolHeader
                icon={Database}
                iconBgClass="bg-blue-600"
                title="SEO 赛道大师"
                titleHighlight="内容矩阵生成"
                subtitle="一键生成 流量/搜准/转化 三型搜索流笔记库"
                rightContent={
                    <>
                        {stats.totalKeywords > 0 && (
                            <div className="hidden md:flex flex-col items-end mr-4">
                                <span className="text-[11px] font-semibold text-slate-500 mb-1 tracking-wide">
                                    生成进度 {stats.processedKeywords} / {stats.totalKeywords}
                                </span>
                                <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
                                </div>
                            </div>
                        )}
                        {!stats.isProcessing && results.length > 0 && (
                            <ExportButton
                                onExport={handleExport}
                                label="导出完整报告"
                                className="!py-1.5 !px-3"
                            />
                        )}
                    </>
                }
            />

            <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Left Column: Inputs */}
                    <div className="xl:col-span-3 space-y-6">
                        {/* Global Context Indicators */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-500" />
                                全局资产挂载状态
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs font-medium">
                                    <span className="text-slate-500 flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${currentProductContext ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                        产品背景
                                    </span>
                                    {currentProductContext ? <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded">已挂载</span> : <span className="text-slate-400">未挂载</span>}
                                </div>
                                <div className="flex items-center justify-between text-xs font-medium">
                                    <span className="text-slate-500 flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${currentPersona ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                        专属人设
                                    </span>
                                    {currentPersona ? <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded">已挂载</span> : <span className="text-slate-400">未挂载</span>}
                                </div>
                                <div className="flex items-center justify-between text-xs font-medium">
                                    <span className="text-slate-500 flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${currentPainPoint ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                        核心痛点
                                    </span>
                                    {currentPainPoint ? <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded">已挂载</span> : <span className="text-slate-400">未挂载</span>}
                                </div>
                            </div>
                            <p className="mt-4 text-[11px] text-slate-400 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                                SEO大师会自动读取上述信息作为上下文生成矩阵。若未挂载，可前往看板对应车间生成。
                            </p>
                        </div>

                        {/* Keyword Input */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                            <div className="flex justify-between items-end mb-3">
                                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Search className="w-4 h-4 text-blue-500" />
                                    赛道挖掘词库
                                </label>
                                <span className="text-[10px] text-slate-400">支持多行批量</span>
                            </div>
                            <textarea
                                value={keywordsInput}
                                onChange={(e) => setKeywordsInput(e.target.value)}
                                placeholder="粘贴挖掘到的赛道关键词，每行一个...&#10;例如：&#10;平替眼霜&#10;熬夜护肤&#10;敏感肌早C晚A"
                                className="w-full h-40 text-sm p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y"
                            />
                        </div>

                        {/* Templates Input */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                            <div className="flex justify-between items-end mb-3">
                                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <Wand2 className="w-4 h-4 text-indigo-500" />
                                    链路句式模板库
                                </label>
                                <span className="text-[10px] text-slate-400">可选填</span>
                            </div>
                            <textarea
                                value={templatesInput}
                                onChange={(e) => setTemplatesInput(e.target.value)}
                                placeholder="输入您收集的爆款标题句式模板，或直接由AI自动读取全局缓存句式..."
                                className="w-full h-32 text-sm p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            {!stats.isProcessing ? (
                                <button
                                    onClick={handleGenerate}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <DatabaseZap className="w-5 h-5" />
                                    生成赛道 SEO 矩阵
                                </button>
                            ) : (
                                <button
                                    onClick={handleStop}
                                    className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    停止生成
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Output Matrix */}
                    <div className="xl:col-span-9 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Database className="w-5 h-5 text-blue-600" />
                                赛道矩阵大屏
                            </h2>
                            <div className="flex items-center gap-4 text-sm font-medium">
                                <div className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-purple-500" /> 流量型: {trafficResults.length}</div>
                                <div className="flex items-center gap-1.5"><Search className="w-4 h-4 text-emerald-500" /> 搜准型: {searchResults.length}</div>
                                <div className="flex items-center gap-1.5"><ShoppingBag className="w-4 h-4 text-orange-500" /> 转化型: {salesResults.length}</div>
                            </div>
                        </div>

                        {results.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                                <DatabaseZap size={48} className="mb-4 text-slate-200" />
                                <p className="text-lg font-medium text-slate-500">矩阵大屏等待数据载入</p>
                                <p className="text-sm mt-2 max-w-md text-center">输入赛道词汇，系统将自动结合产品卖点、痛点和爆款句式，裂变生成覆盖全链路搜索意图的庞大笔记库。</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-auto p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Traffic Column */}
                                    <div className="space-y-4">
                                        <div className="sticky top-0 bg-white pb-2 border-b border-purple-100 flex items-center gap-2 z-10">
                                            <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg"><TrendingUp size={16} /></div>
                                            <h3 className="font-bold text-purple-900">流量型笔记池</h3>
                                        </div>
                                        {trafficResults.map(r => (
                                            <div key={r.id} className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 hover:shadow-md transition-shadow">
                                                <div className="text-[10px] font-bold text-purple-400 uppercase mb-1">KW: {r.keyword}</div>
                                                <div className="font-bold text-sm text-slate-800 mb-2 leading-relaxed">{r.title}</div>
                                                <div className="text-xs text-slate-500 bg-white p-2 rounded border border-purple-50">{r.reason}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Search Column */}
                                    <div className="space-y-4">
                                        <div className="sticky top-0 bg-white pb-2 border-b border-emerald-100 flex items-center gap-2 z-10">
                                            <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg"><Search size={16} /></div>
                                            <h3 className="font-bold text-emerald-900">搜准型笔记池</h3>
                                        </div>
                                        {searchResults.map(r => (
                                            <div key={r.id} className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 hover:shadow-md transition-shadow">
                                                <div className="text-[10px] font-bold text-emerald-400 uppercase mb-1">KW: {r.keyword}</div>
                                                <div className="font-bold text-sm text-slate-800 mb-2 leading-relaxed">{r.title}</div>
                                                <div className="text-xs text-slate-500 bg-white p-2 rounded border border-emerald-50">{r.reason}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Sales Column */}
                                    <div className="space-y-4">
                                        <div className="sticky top-0 bg-white pb-2 border-b border-orange-100 flex items-center gap-2 z-10">
                                            <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg"><ShoppingBag size={16} /></div>
                                            <h3 className="font-bold text-orange-900">转化型笔记池</h3>
                                        </div>
                                        {salesResults.map(r => (
                                            <div key={r.id} className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 hover:shadow-md transition-shadow">
                                                <div className="text-[10px] font-bold text-orange-400 uppercase mb-1">KW: {r.keyword}</div>
                                                <div className="font-bold text-sm text-slate-800 mb-2 leading-relaxed">{r.title}</div>
                                                <div className="text-xs text-slate-500 bg-white p-2 rounded border border-orange-50">{r.reason}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SeoMaster;
