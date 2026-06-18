import React, { useState } from 'react';
import { useGlobalStore } from '../store/globalStore';
import { Database, Target, User, Package, Trash2, ChevronDown, ChevronUp, Type, Wand2, FileText, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const GlobalContextPanel: React.FC = () => {
    const { currentPainPoint, currentPersona, currentProductContext, currentTitle, currentPattern, currentCopy, clearAll, setPainPoint, setPersona, setProductContext, setTitle, setPattern, setCopy } = useGlobalStore();
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();

    const hasData = currentPainPoint || currentPersona || currentProductContext || currentTitle || currentPattern || currentCopy;

    if (!hasData && !isExpanded) return null;

    const dataPoints = [
        { key: 'currentProductContext', label: '全局产品', icon: <Package className="w-4 h-4 text-emerald-500" />, value: currentProductContext, clear: () => setProductContext('') },
        { key: 'currentPainPoint', label: '核心痛点', icon: <Target className="w-4 h-4 text-rose-500" />, value: currentPainPoint, clear: () => setPainPoint('') },
        { key: 'currentPersona', label: '专属人设', icon: <User className="w-4 h-4 text-indigo-500" />, value: currentPersona, clear: () => setPersona('') },
        { key: 'currentPattern', label: '全局句式', icon: <Wand2 className="w-4 h-4 text-amber-500" />, value: currentPattern, clear: () => setPattern('') },
        { key: 'currentTitle', label: '目标标题', icon: <Type className="w-4 h-4 text-blue-500" />, value: currentTitle, clear: () => setTitle('') },
        { key: 'currentCopy', label: '最终文案', icon: <FileText className="w-4 h-4 text-purple-500" />, value: currentCopy, clear: () => setCopy('') },
    ].filter(item => item.value);

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            {/* Panel Body */}
            {isExpanded && (
                <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-2xl mb-4 w-80 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-slate-700" />
                            <h3 className="text-sm font-bold text-slate-800 tracking-tight">全局生产总线</h3>
                        </div>
                        <button
                            onClick={clearAll}
                            className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                        >
                            <Trash2 className="w-3 h-3" />
                            清空
                        </button>
                    </div>

                    <div className="p-3 max-h-96 overflow-y-auto space-y-3">
                        {dataPoints.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs">
                                暂无流转数据，请在各个工具中点击「发送」
                            </div>
                        ) : (
                            dataPoints.map((item, idx) => (
                                <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-100 relative group">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        {item.icon}
                                        <span className="text-[11px] font-bold text-slate-500 tracking-wider">{item.label}</span>
                                    </div>
                                    <p className="text-xs text-slate-700 font-medium leading-relaxed line-clamp-3">
                                        {item.value}
                                    </p>
                                    <button 
                                        onClick={item.clear}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all bg-white rounded p-0.5 shadow-sm"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {dataPoints.length > 0 && (
                        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
                            <button
                                onClick={() => {
                                    setIsExpanded(false);
                                    navigate('/copy-generator');
                                }}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                            >
                                前往总装车间一键装配文案
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </button>
                            <button
                                onClick={() => {
                                    setIsExpanded(false);
                                    navigate('/image-studio');
                                }}
                                className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Camera className="w-3.5 h-3.5" />
                                前往笔记图片一键生图
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Floating Action Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
                    flex items-center gap-2 px-4 py-3 rounded-full shadow-lg border backdrop-blur-md transition-all duration-300
                    ${isExpanded || !hasData
                        ? 'bg-white/90 border-slate-200 text-slate-600 hover:bg-white'
                        : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700 hover:shadow-indigo-500/20'
                    }
                `}
            >
                <Database className="w-5 h-5" />
                {hasData && !isExpanded && (
                    <span className="font-bold text-sm tracking-wide">
                        总线已就绪 ({dataPoints.length})
                    </span>
                )}
                {isExpanded ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronUp className="w-4 h-4 ml-1" />}
            </button>
        </div>
    );
};
