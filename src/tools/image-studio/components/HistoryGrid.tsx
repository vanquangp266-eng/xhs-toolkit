import React from 'react';
import { Clock, Trash2, Download, ImageOff } from 'lucide-react';
import type { GeneratedImage } from '../types';

interface HistoryGridProps {
    history: GeneratedImage[];
    onSelect: (item: GeneratedImage) => void;
    onClear: () => void;
    currentId?: string;
}

const HistoryGrid: React.FC<HistoryGridProps> = ({ history, onSelect, onClear, currentId }) => {
    if (history.length === 0) return null;

    const handleDownload = (e: React.MouseEvent, item: GeneratedImage) => {
        e.stopPropagation();
        if (!item.url) return;
        const link = document.createElement('a');
        link.href = item.url;
        link.download = `xhs-studio-${item.id.slice(0, 8)}.png`;
        link.click();
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1 bg-slate-100 rounded-md">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">生成历史</span>
                    <span className="text-[10px] text-slate-400 font-medium">{history.length}</span>
                </div>
                <button onClick={onClear}
                    className="text-[10px] font-medium text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                    <Trash2 className="w-3 h-3" /> 清空
                </button>
            </div>
            <div className="p-3 grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {history.map(item => (
                    <div key={item.id} onClick={() => onSelect(item)}
                        className={`relative group rounded-xl overflow-hidden cursor-pointer border-2 transition-all
                            ${currentId === item.id ? 'border-red-400 ring-2 ring-red-100' : 'border-transparent hover:border-slate-200'}`}>
                        {item.url ? (
                            <img src={item.url} alt="" className="w-full aspect-square object-cover" />
                        ) : (
                            <div className="w-full aspect-square bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                                <ImageOff className="w-6 h-6 mb-1" />
                                <span className="text-[9px]">旧记录无图片</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button onClick={e => handleDownload(e, item)}
                                className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center">
                                <Download className="w-3.5 h-3.5 text-slate-700" />
                            </button>
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-1.5">
                            <span className="text-[8px] text-white/90 font-medium">
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HistoryGrid;
