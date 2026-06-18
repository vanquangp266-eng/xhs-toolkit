import React from 'react';
import { ParagraphAnalysis } from '../types';

interface AnalysisCardProps {
  item: ParagraphAnalysis;
  index: number;
}

const MetaTag: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className={`flex flex-col px-3 py-2 rounded-lg bg-${color}-50 border border-${color}-100 flex-1 min-w-[100px]`}>
    <span className={`text-[10px] uppercase tracking-wider font-bold text-${color}-600 mb-1`}>{label}</span>
    <span className="text-xs text-slate-800 font-medium leading-tight">{value}</span>
  </div>
);

export const AnalysisCard: React.FC<AnalysisCardProps> = ({ item, index }) => {
  return (
    <div className="group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all duration-300 flex flex-col h-full overflow-hidden">
      
      {/* Header: Macro Strategy */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-col gap-3">
        <div className="flex justify-between items-start">
           <div className="flex items-center space-x-2">
             <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded">#{index + 1}</span>
             <h4 className="text-sm font-bold text-slate-700">段落宏观策略</h4>
           </div>
           <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
             {item.purpose}
           </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
           <MetaTag label="结构逻辑" value={item.logic} color="emerald" />
           <MetaTag label="语调" value={item.tone} color="blue" />
           <MetaTag label="节奏" value={item.rhythm} color="amber" />
        </div>
      </div>

      {/* Body: Sentence-by-Sentence Micro Analysis */}
      <div className="p-6 space-y-6">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">
          逐句微观拆解 (Micro-Analysis)
        </h4>
        
        <div className="space-y-4">
          {item.sentences && item.sentences.map((sent, sIndex) => (
            <div key={sIndex} className="relative pl-4 border-l-2 border-slate-200 hover:border-indigo-400 transition-colors">
              {/* The Sentence Text */}
              <p className="text-slate-800 text-sm font-serif leading-relaxed mb-2">
                "{sent.text}"
              </p>
              
              {/* Technique & Effect */}
              <div className="flex items-start gap-3">
                 <div className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                   <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                   {sent.technique}
                 </div>
                 <div className="flex items-start text-xs text-slate-500 leading-tight mt-0.5">
                   <span className="mr-1 text-slate-400">→</span>
                   {sent.effect}
                 </div>
              </div>
            </div>
          ))}
          {(!item.sentences || item.sentences.length === 0) && (
             <p className="text-slate-400 italic text-sm">暂无逐句分析</p>
          )}
        </div>
      </div>

      {/* Footer: Transition */}
      <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 mt-auto">
        <div className="flex items-center space-x-2 text-xs">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="font-bold text-slate-500">承接:</span>
          <span className="text-slate-600">{item.transition}</span>
        </div>
      </div>
    </div>
  );
};