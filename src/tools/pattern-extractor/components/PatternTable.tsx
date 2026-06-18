import React from 'react';
import { TitlePair } from '../types';
import { Copy, Check, Send } from 'lucide-react';
import { useGlobalStore } from '../../../shared/store/globalStore';

interface PatternTableProps {
    data: TitlePair[];
}

const PatternTable: React.FC<PatternTableProps> = ({ data }) => {
    const [copiedId, setCopiedId] = React.useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    if (data.length === 0) return null;

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">提取结果 ({data.length})</h3>
            </div>

            <div className="overflow-auto flex-1">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-3 font-medium text-slate-500 w-1/12">#</th>
                            <th className="px-6 py-3 font-medium text-slate-500 w-5/12">原标题</th>
                            <th className="px-6 py-3 font-medium text-indigo-600 w-5/12">结构句式</th>
                            <th className="px-6 py-3 font-medium text-slate-500 w-1/12 text-center">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((item, index) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-3 text-slate-400 font-mono text-xs">{index + 1}</td>
                                <td className="px-6 py-3 text-slate-800 select-text">{item.original}</td>
                                <td className="px-6 py-3 text-indigo-700 font-medium bg-indigo-50/30 select-text">
                                    {item.pattern}
                                </td>
                                <td className="px-6 py-3 text-center space-x-1">
                                    <button
                                        onClick={() => handleCopy(item.pattern, item.id)}
                                        className="p-1.5 hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 rounded-md transition-colors"
                                        title="复制句式"
                                    >
                                        {copiedId === item.id ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                    <button
                                        onClick={() => useGlobalStore.getState().setPattern(item.pattern)}
                                        className="p-1.5 hover:bg-amber-100 text-slate-400 hover:text-amber-600 rounded-md transition-colors"
                                        title="发送至全局中枢 (作为写作句式)"
                                    >
                                        <Send size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PatternTable;
