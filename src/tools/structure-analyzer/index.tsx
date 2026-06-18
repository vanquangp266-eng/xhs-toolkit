import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2, Copy, Check, Trash2, PieChart, Clock, X } from 'lucide-react';
import { ToolHeader } from '../../shared/components/ToolHeader';
import { ExportButton } from '../../shared/components/ExportButton';
import { exportAsMarkdown } from '../../shared/utils/exportUtils';
import {
    buildDeepSeekError,
    getDeepSeekApiKey,
    getDeepSeekAuthHeaders,
    getDeepSeekModel,
} from '../../shared/utils/deepseekConfig';

interface StructureAnalysis {
    structure: string;
    framework: 'FABE' | 'SCQA' | 'PAS' | 'AIDA' | 'OTHER';
    breakdown: { section: string; content: string; purpose: string }[];
    summary: string;
}

const STORAGE_KEY = 'structure_analyzer_history';

interface StructureHistoryItem {
    id: string;
    timestamp: number;
    inputText: string;
    results: StructureAnalysis[];
}

const splitCopies = (text: string) => {
    const normalized = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/[ \t]{6,}/g, '\n\n')
        .replace(/^\s*(?:-{3,}|={3,}|_{3,}|#{3,}|——+|\*{3,})\s*$/gm, '\n\n')
        .replace(/^\s*(?:文案|案例|笔记)\s*[\d一二三四五六七八九十]+(?:篇|条|则)?[：:、.)）-]?\s*$/gm, '\n\n')
        .replace(/^\s*第\s*[\d一二三四五六七八九十]+\s*(?:篇|条|则)[：:、.)）-]?\s*$/gm, '\n\n');

    return normalized
        .split(/\n\s*\n+/)
        .map(copy => copy.trim())
        .filter(copy => copy.length >= 12);
};

const parseStructureJson = (content: string): StructureAnalysis => {
    const cleaned = content.replace(/```json|```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start < 0 || end < 0 || end <= start) {
        throw new Error('DeepSeek 返回内容里没有找到 JSON 对象。');
    }
    return JSON.parse(cleaned.slice(start, end + 1));
};

const StructureAnalyzer: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<StructureAnalysis[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<number | null>(null);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
    const [history, setHistory] = useState<StructureHistoryItem[]>(() => {
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

    const handleAnalyze = async () => {
        if (!inputText.trim()) return;
        if (!getDeepSeekApiKey()) {
            setError('请先配置 DeepSeek API Key。');
            return;
        }

        setLoading(true);
        setError(null);
        setCurrentHistoryId(null);

        try {
            const copies = splitCopies(inputText);
            if (copies.length === 0) {
                throw new Error('没有识别到有效文案。请粘贴正文，或用空行 / 大空格 / --- / 分隔线分隔多篇文案。');
            }

            const analysisResults: StructureAnalysis[] = [];

            for (const copy of copies) {
                const prompt = `
分析以下小红书文案的结构模型。

文案：
${copy}

识别使用的结构框架（FABE/SCQA/PAS/AIDA/OTHER），并拆解各部分。
只返回 JSON 对象，不要 markdown，不要解释。
返回格式：
{
  "structure": "结构描述",
  "framework": "FABE|SCQA|PAS|AIDA|OTHER",
  "breakdown": [
    {"section": "部分名称", "content": "对应内容", "purpose": "作用说明"}
  ],
  "summary": "结构总结"
}
`;

                const response = await fetch('/api/deepseek/chat/completions', {
                    method: 'POST',
                    headers: getDeepSeekAuthHeaders(),
                    body: JSON.stringify({
                        model: getDeepSeekModel(),
                        response_format: { type: 'json_object' },
                        messages: [{ role: 'user', content: prompt }]
                    })
                });

                if (!response.ok) {
                    throw new Error(await buildDeepSeekError(response));
                }

                const result = await response.json();
                analysisResults.push(parseStructureJson(result.choices?.[0]?.message?.content || ''));
            }

            setResults(analysisResults);
            if (analysisResults.length > 0) {
                const item: StructureHistoryItem = {
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    inputText,
                    results: analysisResults,
                };
                setHistory(prev => [item, ...prev.filter(h => h.inputText !== inputText)].slice(0, 50));
                setCurrentHistoryId(item.id);
            }
        } catch (err: any) {
            setError(err.message || '分析失败');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (idx: number) => {
        navigator.clipboard.writeText(JSON.stringify(results[idx], null, 2));
        setCopied(idx);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleHistorySelect = (item: StructureHistoryItem) => {
        setInputText(item.inputText);
        setResults(item.results);
        setCurrentHistoryId(item.id);
        setError(null);
        setHistoryOpen(false);
    };

    const handleHistoryDelete = (id: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setHistory(prev => prev.filter(item => item.id !== id));
        if (currentHistoryId === id) setCurrentHistoryId(null);
    };

    const handleExportAll = async () => {
        if (results.length === 0) return;
        await new Promise(resolve => setTimeout(resolve, 50));
        const mdContent = results.map((r, i) => {
            const lines = [];
            lines.push(`## 文案 #${i + 1} (${r.framework})`);
            lines.push(`**结构描述**: ${r.structure}\n`);
            lines.push('### 深度拆解');
            r.breakdown.forEach(b => {
                lines.push(`- **${b.section}**\n  - 内容: ${b.content}\n  - 作用: ${b.purpose}`);
            });
            lines.push(`\n**总结**: ${r.summary}\n`);
            return lines.join('\n');
        }).join('\n---\n\n');

        exportAsMarkdown(mdContent, `结构拆解报告_${new Date().toISOString().slice(0, 10)}.md`);
    };

    const frameworkColors: Record<string, string> = {
        FABE: 'bg-blue-500',
        SCQA: 'bg-purple-500',
        PAS: 'bg-orange-500',
        AIDA: 'bg-green-500',
        OTHER: 'bg-gray-500'
    };

    const detectedCount = inputText.trim() ? splitCopies(inputText).length : 0;

    return (
        <div className="min-h-screen bg-slate-50 pb-20 relative">
            {historyOpen && (
                <div className="fixed inset-0 z-[80] flex justify-end bg-slate-900/20 backdrop-blur-sm">
                    <aside className="w-full max-w-md h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-800">结构分析历史</h3>
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
                                    className={`w-full text-left p-3 rounded-xl border transition ${currentHistoryId === item.id ? 'bg-teal-50 border-teal-200' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                                                {item.inputText.split('\n').find(Boolean) || '未命名记录'}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {new Date(item.timestamp).toLocaleString()} · {item.results.length} 篇
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
                                        if (confirm('确定清空结构分析历史吗？')) setHistory([]);
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
                icon={PieChart}
                iconBgClass="bg-teal-600"
                title="文案结构"
                titleHighlight="拆解器"
                subtitle="FABE / SCQA / PAS 结构分析"
                rightContent={
                    <>
                        <button
                            onClick={() => setHistoryOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors text-[13px] font-medium"
                        >
                            <Clock size={16} />
                            <span>历史记录</span>
                            {history.length > 0 && (
                                <span className="bg-teal-100 text-teal-600 text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center font-bold">
                                    {history.length}
                                </span>
                            )}
                        </button>
                        {results.length > 0 && (
                            <ExportButton
                                onExport={handleExportAll}
                                label="导出 Markdown"
                                className="!py-1.5 !px-3"
                            />
                        )}
                    </>
                }
            />

            <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <span className="text-sm text-slate-600">
                            粘贴文案（支持 ---、空行、大空格、分隔线自动分隔多篇）
                            {detectedCount > 0 && <span className="ml-2 text-teal-600 font-semibold">已识别 {detectedCount} 篇</span>}
                        </span>
                        <button onClick={() => { setInputText(''); setResults([]); setCurrentHistoryId(null); }} className="text-xs px-3 py-1 text-slate-500 hover:bg-slate-100 rounded flex items-center gap-1">
                            <Trash2 className="h-3 w-3" />清空
                        </button>
                    </div>
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="粘贴 3-5 篇同主题小红书正文。可以用 --- 分隔，也可以直接用大空行、大段空格、分隔线或“文案1/案例1”分隔。"
                        className="w-full h-48 p-4 text-sm focus:outline-none resize-none"
                    />
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                        <button
                            onClick={handleAnalyze}
                            disabled={loading || !inputText.trim()}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white ${loading || !inputText.trim() ? 'bg-slate-400' : 'bg-teal-600 hover:bg-teal-700'
                                }`}
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                            {loading ? '分析中...' : '开始分析'}
                        </button>
                    </div>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">{error}</div>}

                {results.length > 0 && (
                    <div className="space-y-6">
                        {results.map((r, i) => (
                            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 ${frameworkColors[r.framework]} text-white rounded-lg text-sm font-bold`}>
                                            {r.framework}
                                        </span>
                                        <span className="text-slate-600 font-medium">文案 #{i + 1}</span>
                                    </div>
                                    <button onClick={() => handleCopy(i)} className="p-2 hover:bg-slate-100 rounded-lg">
                                        {copied === i ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-slate-400" />}
                                    </button>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-500 mb-2">结构描述</h4>
                                        <p className="text-slate-700">{r.structure}</p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-slate-500 mb-2">逐段拆解</h4>
                                        <div className="space-y-3">
                                            {r.breakdown.map((b, j) => (
                                                <div key={j} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{b.section}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-700 mb-1">{b.content}</p>
                                                    <p className="text-xs text-slate-500">{b.purpose}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-teal-50 p-3 rounded-lg border border-teal-100">
                                        <p className="text-sm text-teal-700"><span className="font-medium">总结：</span>{r.summary}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default StructureAnalyzer;
