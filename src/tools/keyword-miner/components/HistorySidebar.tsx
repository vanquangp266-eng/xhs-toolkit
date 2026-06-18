import React from 'react';
import { X, Clock, Trash2, ChevronRight, RotateCcw } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    history: HistoryItem[];
    onSelect: (item: HistoryItem) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onClear: () => void;
    currentResultId?: string;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
    isOpen, onClose, history, onSelect, onDelete, onClear, currentResultId
}) => {
    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2 text-gray-800">
                        <Clock className="w-5 h-5 text-red-500" />
                        <h2 className="font-bold text-lg">历史记录</h2>
                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full min-w-[24px] text-center">
                            {history.length}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-sm">
                            <RotateCcw className="w-12 h-12 mb-3 opacity-20" />
                            <p>暂无历史记录</p>
                            <p className="text-xs opacity-60 mt-1">挖掘过的赛道会显示在这里</p>
                        </div>
                    ) : (
                        history.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => onSelect(item)}
                                className={`
                  group relative border rounded-xl p-4 shadow-sm transition-all cursor-pointer flex flex-col gap-2
                  ${currentResultId === item.id
                                        ? 'bg-red-50 border-red-200 ring-1 ring-red-200'
                                        : 'bg-white border-gray-100 hover:border-red-200 hover:shadow-md'
                                    }
                `}
                            >
                                <div className="flex justify-between items-start">
                                    <h3 className={`font-bold text-lg transition-colors ${currentResultId === item.id ? 'text-red-700' : 'text-gray-800 group-hover:text-red-600'}`}>
                                        {item.data.niche}
                                    </h3>
                                    <button
                                        onClick={(e) => onDelete(item.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded-lg transition-all"
                                        title="删除"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span className="font-mono">
                                        {new Date(item.timestamp).toLocaleString('zh-CN', {
                                            month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 font-medium">
                                        查看 <ChevronRight className="w-3 h-3" />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-1 mt-1">
                                    {item.data.subFields.slice(0, 2).map((sf, i) => (
                                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                                            {sf.name}
                                        </span>
                                    ))}
                                    {item.data.subFields.length > 2 && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">+{item.data.subFields.length - 2}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {history.length > 0 && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                        <button
                            onClick={onClear}
                            className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-red-600 hover:bg-red-50 py-3 rounded-xl transition-all text-sm font-medium border border-transparent hover:border-red-100"
                        >
                            <Trash2 className="w-4 h-4" />
                            清空所有记录
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default HistorySidebar;
