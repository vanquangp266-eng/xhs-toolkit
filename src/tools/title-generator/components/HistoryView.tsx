import React from 'react';
import { HistoryItem } from '../types';
import { Clock, Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react';

interface HistoryViewProps {
    history: HistoryItem[];
    setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, setHistory }) => {
    const [expandedId, setExpandedId] = React.useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const clearHistory = () => {
        if (confirm('确定要清空所有历史记录吗？')) {
            setHistory([]);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'S': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'A': return 'bg-red-50 text-red-600 border-red-200';
            case 'B': return 'bg-blue-50 text-blue-600 border-blue-200';
            default: return 'bg-gray-100 text-gray-500 border-gray-200';
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-red-500" />
                    历史生成记录
                </h2>
                {history.length > 0 && (
                    <button
                        onClick={clearHistory}
                        className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" /> 清空记录
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {history.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>暂无历史记录，快去生成第一个爆款选题吧！</p>
                    </div>
                ) : (
                    history.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all"
                        >
                            <div
                                onClick={() => toggleExpand(item.id)}
                                className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="font-bold text-lg text-gray-800">{item.metaTopic}</span>
                                        <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded-full">
                                            {formatDate(item.timestamp)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center gap-2">
                                        共生成 {item.results.length} 个标题
                                    </div>
                                </div>
                                <div className="text-gray-400">
                                    {expandedId === item.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </div>
                            </div>

                            {expandedId === item.id && (
                                <div className="border-t border-gray-100 bg-gray-50/50 p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {item.results.map((result, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 hover:border-red-200 transition-colors group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="text-gray-800 font-medium leading-relaxed group-hover:text-red-600">
                                                    {result.title}
                                                </div>
                                                <div className={`flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded ml-2 whitespace-nowrap border ${getGradeColor(result.grade)}`}>
                                                    {result.grade} / {result.score}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-end mt-2">
                                                <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded truncate max-w-[80%]">
                                                    {result.reason}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        copyToClipboard(result.title);
                                                    }}
                                                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                    title="复制"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
