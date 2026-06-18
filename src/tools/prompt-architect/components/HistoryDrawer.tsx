import React from 'react';
import { X, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ isOpen, onClose, history, onSelect, onClear }) => {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-800">
              <Clock size={20} className="text-rose-500" />
              <h2 className="text-lg font-bold">生成历史</h2>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{history.length}</span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* List */}
          <div className="flex-grow overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <Clock size={48} className="opacity-20" />
                <p>暂无历史记录</p>
              </div>
            ) : (
              history.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="group bg-slate-50 hover:bg-white border border-slate-100 hover:border-rose-200 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md relative"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{item.input.productName || '未命名产品'}</h3>
                    <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span className="bg-slate-200/50 px-1.5 py-0.5 rounded text-slate-600">{item.input.roleName}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.input.productFeatures.substring(0, 60)}...
                  </p>
                  
                  <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity text-rose-400">
                    <ChevronRight size={16} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {history.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button 
                onClick={onClear}
                className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-red-500 text-sm py-2 transition-colors"
              >
                <Trash2 size={16} />
                <span>清空历史记录</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HistoryDrawer;