import React, { useState, useRef } from 'react';
import { GeneratedTopic, ViralCase, ExpandedAngle, BatchResult } from '../types';
import { generateTopics, expandMetaTopic } from '../services/geminiService';
import { Sparkles, Copy, Loader2, Trophy, TrendingUp, Lightbulb, Zap, Download, Layers, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { useGlobalStore } from '../../../shared/store/globalStore';
import { ExportButton } from '../../../shared/components/ExportButton';
import { exportAsCSV } from '../../../shared/utils/exportUtils';
import { useImageJobStore } from '../../../shared/store/imageJobStore';
import { useNavigate } from 'react-router-dom';

interface TopicGeneratorProps {
    cases: ViralCase[];
    onGenerateSuccess: (topic: string, results: GeneratedTopic[]) => void;
}

export const TopicGenerator: React.FC<TopicGeneratorProps> = ({ cases, onGenerateSuccess }) => {
    const [metaTopicsInput, setMetaTopicsInput] = useState('');

    // Batch Processing State
    const [isProcessing, setIsProcessing] = useState(false);
    const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    // Brainstorming State
    const [loadingExpansion, setLoadingExpansion] = useState(false);
    const [expandedAngles, setExpandedAngles] = useState<ExpandedAngle[]>([]);

    // UI State
    const [expandedResultIds, setExpandedResultIds] = useState<Set<string>>(new Set());
    const [error, setError] = useState('');
    const resultsRef = useRef<HTMLDivElement>(null);
    const importBatchPrompts = useImageJobStore(state => state.importBatchPrompts);
    const navigate = useNavigate();

    const toggleResultExpand = (topic: string) => {
        const newSet = new Set(expandedResultIds);
        if (newSet.has(topic)) {
            newSet.delete(topic);
        } else {
            newSet.add(topic);
        }
        setExpandedResultIds(newSet);
    };

    const handleBatchGenerate = async () => {
        const topics = metaTopicsInput.split('\n').map(t => t.trim()).filter(t => t.length > 0);

        if (topics.length === 0) {
            setError('请输入至少一个元话题');
            return;
        }
        if (cases.length === 0) {
            setError('案例库为空，请先添加一些爆款案例');
            return;
        }

        setIsProcessing(true);
        setError('');
        setExpandedAngles([]);
        setProgress({ current: 0, total: topics.length });

        const initialBatch: BatchResult[] = topics.map(t => ({
            metaTopic: t,
            status: 'pending',
            data: []
        }));
        setBatchResults(initialBatch);

        if (topics.length > 0) {
            setExpandedResultIds(new Set([topics[0]]));
        }

        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);

        for (let i = 0; i < topics.length; i++) {
            const topic = topics[i];

            setBatchResults(prev => prev.map((item, idx) =>
                idx === i ? { ...item, status: 'loading' } : item
            ));

            try {
                const generated = await generateTopics(topic, cases);

                setBatchResults(prev => prev.map((item, idx) =>
                    idx === i ? { ...item, status: 'completed', data: generated } : item
                ));

                onGenerateSuccess(topic, generated);
            } catch (e) {
                console.error(e);
                setBatchResults(prev => prev.map((item, idx) =>
                    idx === i ? { ...item, status: 'error' } : item
                ));
            }

            setProgress(prev => ({ ...prev, current: i + 1 }));
        }

        setIsProcessing(false);
    };

    const handleBrainstorm = async () => {
        const topic = metaTopicsInput.split('\n')[0]?.trim();
        if (!topic) {
            setError('请输入一个元话题进行发散');
            return;
        }

        setLoadingExpansion(true);
        setError('');
        setExpandedAngles([]);

        try {
            const angles = await expandMetaTopic(topic);
            setExpandedAngles(angles);
        } catch (e) {
            setError('发散失败，请重试');
        } finally {
            setLoadingExpansion(false);
        }
    };

    const handleUseAngle = (angle: string) => {
        setMetaTopicsInput(prev => {
            const lines = prev.split('\n').map(l => l.trim()).filter(l => l);
            if (!lines.includes(angle)) {
                return [...lines, angle].join('\n');
            }
            return prev;
        });
    };

    const handleExportCSV = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        const headers = ['Meta Topic', 'Generated Title', 'Grade', 'Score', 'Reason'];
        const rows: string[] = [];

        batchResults.forEach(res => {
            if (res.status === 'completed') {
                res.data.forEach(item => {
                    const cleanTitle = item.title.replace(/"/g, '""');
                    const cleanReason = item.reason.replace(/"/g, '""');
                    rows.push(`"${res.metaTopic}","${cleanTitle}","${item.grade}","${item.score}","${cleanReason}"`);
                });
            }
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        exportAsCSV(csvContent, `rednote_viral_topics_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'S': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'A': return 'bg-red-50 text-red-600 border-red-200';
            case 'B': return 'bg-blue-50 text-blue-600 border-blue-200';
            default: return 'bg-gray-100 text-gray-500 border-gray-200';
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const sendTitlesToBatchImage = (onlyS = false) => {
        const prompts = batchResults
            .filter(batch => batch.status === 'completed')
            .flatMap(batch => batch.data)
            .filter(item => !onlyS || item.grade === 'S')
            .map(item => `小红书 3:4 竖版封面图。必须把标题文字「${item.title}」完整渲染在画面中，标题是第一主体，占画面 45%-65% 视觉权重，粗体中文大字，手机信息流中清晰可读。图片/人物/产品/贴纸只做辅助，不要抢标题。`);

        if (prompts.length === 0) return;
        importBatchPrompts(prompts);
        navigate('/batch-image');
    };

    const sendTitleToImageStudio = (title: string) => {
        useGlobalStore.getState().setTitle(title);
        navigate('/image-studio');
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            {/* Input Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <Layers className="w-5 h-5 text-red-500" />
                    <h2 className="text-xl font-bold text-gray-800">批量选题生成</h2>
                </div>

                <div className="relative">
                    <textarea
                        value={metaTopicsInput}
                        onChange={(e) => setMetaTopicsInput(e.target.value)}
                        placeholder={`输入元话题（每行一个）。\n例如：\n新手学摄影\n低卡减脂餐\n杭州周末去哪玩`}
                        className="w-full h-40 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-y placeholder:text-gray-400 font-medium"
                    />
                    {loadingExpansion && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
                            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                            <span className="ml-2 font-medium text-gray-600">正在发散爆款角度...</span>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mt-3 flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <div className="flex flex-wrap gap-3 mt-4 justify-between items-center">
                    <button
                        onClick={handleBrainstorm}
                        disabled={isProcessing || loadingExpansion || !metaTopicsInput.trim()}
                        className="px-5 py-2.5 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-900 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <Lightbulb className="w-4 h-4" />
                        思维发散
                    </button>

                    <button
                        onClick={handleBatchGenerate}
                        disabled={isProcessing || loadingExpansion || !metaTopicsInput.trim()}
                        className={`
                    px-8 py-2.5 rounded-xl font-bold text-white shadow-lg shadow-red-500/20 transition-all flex items-center gap-2
                    ${isProcessing
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-red-500 hover:bg-red-600 hover:translate-y-[-1px]'}
                `}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                生成中 ({progress.current}/{progress.total})...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                批量生成爆款
                            </>
                        )}
                    </button>
                </div>

                {/* Brainstorming Results */}
                {expandedAngles.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-3 text-sm font-bold text-gray-700">
                            <TrendingUp className="w-4 h-4 text-orange-500" />
                            高潜切入角度推荐（点击添加到输入框）
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {expandedAngles.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleUseAngle(item.angle)}
                                    className="group flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm border border-orange-100 hover:bg-orange-100 transition-colors text-left"
                                    title={item.reason}
                                >
                                    <span>{item.angle}</span>
                                    <span className="text-xs bg-white/50 px-1 rounded text-orange-800/70 font-mono">
                                        {item.score}分
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Results Section */}
            <div ref={resultsRef} className="space-y-4">
                {batchResults.length > 0 && (
                    <div className="flex justify-between items-center px-2">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            生成结果
                        </h3>
                        {batchResults.some(r => r.status === 'completed') && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => sendTitlesToBatchImage(true)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100">S级发往批量作图</button>
                                <button onClick={() => sendTitlesToBatchImage(false)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100">全部发往批量作图</button>
                            </div>
                        )}                        {batchResults.some(r => r.status === 'completed') && (
                            <ExportButton
                                onExport={handleExportCSV}
                                label="导出CSV"
                                className="!px-3 !py-1.5"
                            />
                        )}
                    </div>
                )}

                {batchResults.map((batch, index) => {
                    const isExpanded = expandedResultIds.has(batch.metaTopic);
                    const hasData = batch.status === 'completed' && batch.data.length > 0;
                    const sTier = hasData ? batch.data.filter(i => i.grade === 'S') : [];
                    const others = hasData ? batch.data.filter(i => i.grade !== 'S') : [];

                    return (
                        <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm transition-all">
                            {/* Result Header */}
                            <div
                                onClick={() => toggleResultExpand(batch.metaTopic)}
                                className={`
                            p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors
                            ${isExpanded ? 'bg-gray-50/80 border-b border-gray-100' : ''}
                        `}
                            >
                                <div className="flex items-center gap-3">
                                    {batch.status === 'loading' && <Loader2 className="w-5 h-5 text-red-500 animate-spin" />}
                                    {batch.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-gray-200" />}
                                    {batch.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                    {batch.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}

                                    <span className="font-bold text-gray-800">{batch.metaTopic}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    {batch.status === 'completed' && (
                                        <span className="text-xs text-gray-400 font-mono">
                                            {batch.data.length} 个标题
                                        </span>
                                    )}
                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                </div>
                            </div>

                            {/* Result Body */}
                            {isExpanded && batch.status === 'completed' && (
                                <div className="p-6 space-y-8 bg-gray-50/30">

                                    {/* S Tier Section */}
                                    {sTier.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-yellow-600 font-bold px-1">
                                                <Trophy className="w-5 h-5" />
                                                S级爆款预测
                                            </div>
                                            <div className="grid gap-3">
                                                {sTier.map((item, idx) => (
                                                    <div key={idx} className="bg-gradient-to-r from-yellow-50 to-white p-4 rounded-xl border border-yellow-100 shadow-sm flex justify-between items-start group hover:shadow-md transition-all">
                                                        <div className="flex-1">
                                                            <div className="font-bold text-lg text-gray-900 mb-1 leading-snug">
                                                                {item.title}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold border border-yellow-200">
                                                                    S级 / {item.score}分
                                                                </span>
                                                                <span className="text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                                    {item.reason}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                            <button
                                                                onClick={() => copyToClipboard(item.title)}
                                                                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                                                title="复制标题"
                                                            >
                                                                <Copy className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => useGlobalStore.getState().setTitle(item.title)}
                                                                className="p-2 text-gray-300 hover:text-blue-500 transition-colors"
                                                                title="发送至全局中枢（作为目标标题）"
                                                            >
                                                                <Send className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Other Tiers Section */}
                                    {others.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-gray-600 font-bold px-1">
                                                <Zap className="w-4 h-4" />
                                                优质候补（A-C级）
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {others.map((item, idx) => (
                                                    <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 hover:border-red-200 transition-colors group">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="text-gray-800 font-medium leading-relaxed text-sm">
                                                                {item.title}
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-end">
                                                            <div className="flex gap-2">
                                                                <span className={`text-xs px-1.5 py-0.5 rounded border ${getGradeColor(item.grade)}`}>
                                                                    {item.grade} / {item.score}
                                                                </span>
                                                            </div>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                                <button
                                                                    onClick={() => copyToClipboard(item.title)}
                                                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                                                    title="复制标题"
                                                                >
                                                                    <Copy className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => useGlobalStore.getState().setTitle(item.title)}
                                                                    className="text-gray-300 hover:text-blue-500 transition-colors ml-1"
                                                                    title="发送至全局中枢（作为目标标题）"
                                                                >
                                                                    <Send className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

