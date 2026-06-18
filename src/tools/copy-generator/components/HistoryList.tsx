import React from 'react';
import { GeneratedCopy } from '../types';
import { Clock, ChevronRight, Trash2 } from 'lucide-react';

interface HistoryListProps {
  history: GeneratedCopy[];
  onSelect: (item: GeneratedCopy) => void;
  onClear: () => void;
  currentId?: string;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onClear, currentId }) => {
  if (history.length === 0) return null;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 rounded-lg">
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          生成历史
        </h3>
        <button 
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          清空
        </button>
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className={`group cursor-pointer p-4 rounded-2xl border transition-all duration-300 hover:shadow-[0_4px_12px_rgb(0,0,0,0.03)]
              ${currentId === item.id 
                ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' 
                : 'border-slate-100 bg-white hover:border-slate-300'
              }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold text-[13px] truncate mb-1.5 ${currentId === item.id ? 'text-indigo-700' : 'text-slate-700 group-hover:text-slate-900'}`}>
                  {item.title || '未命名笔记'}
                </h4>
                <p className="text-[11px] text-slate-400 truncate">
                  {new Date(item.timestamp).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <ChevronRight className={`w-4 h-4 mt-0.5 transition-transform group-hover:translate-x-1 ${currentId === item.id ? 'text-indigo-400' : 'text-slate-300'}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};