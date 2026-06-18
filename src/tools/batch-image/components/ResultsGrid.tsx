import React, { useState } from 'react';
import { Download, Eye, X, Image as ImageIcon, Package } from 'lucide-react';
import type { BatchItem } from '../types';

interface ResultsGridProps {
    items: BatchItem[];
}

const ResultsGrid: React.FC<ResultsGridProps> = ({ items }) => {
    const [preview, setPreview] = useState<BatchItem | null>(null);
    const completed = items.filter(i => i.status === 'success');

    const downloadSingle = (item: BatchItem) => {
        if (!item.resultUrl) return;
        const a = document.createElement('a');
        a.href = item.resultUrl;
        a.download = `batch-${item.id.slice(0, 8)}.png`;
        a.click();
    };

    const downloadAll = async () => {
        for (const item of completed) {
            downloadSingle(item);
            await new Promise(r => setTimeout(r, 300)); // stagger downloads
        }
    };

    if (items.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm h-full min-h-[500px] flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                    <Package className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-lg font-bold text-slate-300 mb-2">批量结果区</h3>
                <p className="text-sm text-slate-400 text-center max-w-xs">导入 Prompt 列表 → 配置参数 → 开始批量生成</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700">生成结果</span>
                    <div className="flex gap-1.5 text-[10px] font-semibold">
                        <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{completed.length} 成功</span>
                        <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded">{items.filter(i => i.status === 'error').length} 失败</span>
                        <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">{items.filter(i => i.status === 'generating').length} 生成中</span>
                    </div>
                </div>
                {completed.length > 1 && (
                    <button onClick={downloadAll}
                        className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1">
                        <Download className="w-3 h-3" /> 全部下载
                    </button>
                )}
            </div>

            {/* Grid */}
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                {items.map((item, idx) => (
                    <div key={item.id} className={`relative rounded-xl overflow-hidden border-2 transition-all group
                        ${item.status === 'success' ? 'border-slate-200 hover:border-indigo-300 hover:shadow-md' :
                          item.status === 'generating' ? 'border-blue-200' :
                          item.status === 'error' ? 'border-red-200' : 'border-slate-200'}`}>
                        
                        {item.status === 'success' && item.resultUrl ? (
                            <>
                                <img src={item.resultUrl} alt="" className="w-full aspect-square object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                                    <button onClick={() => setPreview(item)}
                                        className="w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center">
                                        <Eye className="w-3.5 h-3.5 text-slate-700" />
                                    </button>
                                    <button onClick={() => downloadSingle(item)}
                                        className="w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center">
                                        <Download className="w-3.5 h-3.5 text-slate-700" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="aspect-square flex flex-col items-center justify-center bg-slate-50 p-3">
                                {item.status === 'generating' && (
                                    <span className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2" />
                                )}
                                {item.status === 'error' && <span className="text-red-400 text-lg mb-1">✗</span>}
                                {item.status === 'pending' && <ImageIcon className="w-6 h-6 text-slate-200 mb-1" />}
                                <span className="text-[9px] text-slate-400 text-center line-clamp-2">{item.prompt.slice(0, 40)}</span>
                            </div>
                        )}
                        <div className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            #{idx + 1}
                        </div>
                    </div>
                ))}
            </div>

            {/* Preview modal */}
            {preview && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-8" onClick={() => setPreview(null)}>
                    <div className="relative max-w-3xl max-h-full" onClick={e => e.stopPropagation()}>
                        <img src={preview.resultUrl} alt="" className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl" />
                        <button onClick={() => setPreview(null)}
                            className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                            <X className="w-4 h-4 text-slate-600" />
                        </button>
                        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl p-3">
                            <p className="text-xs text-slate-600 font-mono line-clamp-2">{preview.prompt}</p>
                            <button onClick={() => downloadSingle(preview)}
                                className="mt-2 px-3 py-1.5 text-[10px] font-bold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 flex items-center gap-1 w-fit">
                                <Download className="w-3 h-3" /> 下载
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultsGrid;
