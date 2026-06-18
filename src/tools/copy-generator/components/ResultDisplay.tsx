import React, { useState } from 'react';
import { GeneratedCopy, GenerationStatus } from '../types';
import { Copy, Check, BookOpen, Quote, Send, Sparkles, Loader2 } from 'lucide-react';
import { ExportButton } from '../../../shared/components/ExportButton';
import { exportAsMarkdown } from '../../../shared/utils/exportUtils';
import { useGlobalStore } from '../../../shared/store/globalStore';
import { useNavigate } from 'react-router-dom';

interface ResultDisplayProps {
  status: GenerationStatus;
  result: GeneratedCopy | null;
  onModify: (instruction: string) => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ status, result, onModify }) => {
  const [copied, setCopied] = useState(false);
  const [instruction, setInstruction] = useState('');
  const setCopy = useGlobalStore(state => state.setCopy);
  const navigate = useNavigate();

  const handleCopy = () => {
    if (!result) return;
    const fullText = `${result.title}\n\n${result.content}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!result) return;
    await new Promise(resolve => setTimeout(resolve, 50));
    const fullText = `${result.title}\n\n${result.content}`;
    exportAsMarkdown(fullText, `文案生成_${new Date().toISOString().slice(0, 10)}.md`);
  };

  const handleModifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || status === GenerationStatus.MODIFYING) return;
    onModify(instruction);
    setInstruction('');
  };

  // 1. IDLE STATE
  if (status === GenerationStatus.IDLE) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 min-h-[400px] border-2 border-dashed border-slate-200/50 rounded-3xl bg-white/40 backdrop-blur-sm">
        <div className="p-4 bg-slate-100/50 rounded-2xl mb-4">
            <BookOpen className="w-10 h-10 text-slate-300" />
        </div>
        <p className="text-base font-medium">配置左侧引擎参数，一键生成专属文案</p>
      </div>
    );
  }

  // 2. INITIAL LOADING STATE
  if (status === GenerationStatus.LOADING) {
    return (
      <div className="h-full flex flex-col items-center justify-center min-h-[400px] rounded-3xl bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 p-8 animate-pulse">
        <div className="w-2/3 h-8 bg-slate-200/50 rounded-lg mb-8"></div>
        <div className="w-full h-4 bg-slate-100 rounded-md mb-4"></div>
        <div className="w-full h-4 bg-slate-100 rounded-md mb-4"></div>
        <div className="w-3/4 h-4 bg-slate-100 rounded-md mb-4"></div>
        <div className="w-full h-4 bg-slate-100 rounded-md mb-4"></div>
        <div className="w-5/6 h-4 bg-slate-100 rounded-md mb-10"></div>
        <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            <p className="text-indigo-600 font-bold tracking-wide">AI 引擎全速运转中...</p>
        </div>
      </div>
    );
  }

  // 3. ERROR OR EMPTY STATE
  if (status === GenerationStatus.ERROR || !result) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-rose-500 min-h-[400px] border border-rose-200/50 rounded-3xl bg-rose-50/50 backdrop-blur-sm">
        <p className="font-semibold">生成出错，请重试。</p>
      </div>
    );
  }

  // 4. RESULT + MODIFY STATE
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 flex flex-col h-full max-h-[850px] overflow-hidden">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-8 relative overflow-hidden shrink-0">
        <Quote className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-5 rotate-12" />
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10 pr-8">
            <h3 className="text-xs uppercase tracking-widest opacity-80 mb-3 font-bold">
              {status === GenerationStatus.MODIFYING ? '正在微调中...' : '文案结果预览'}
            </h3>
            <h2 className="text-2xl font-black leading-tight tracking-tight">{result.title}</h2>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative">
        {status === GenerationStatus.MODIFYING && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-md">
             <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-xl border border-slate-100">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span className="text-slate-800 font-bold">引擎正在重写...</span>
             </div>
          </div>
        )}
        <div className="prose prose-slate max-w-none">
          {/* Displaying plain text but respecting newlines */}
          <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-[15px] font-normal">
            {result.content}
          </div>
        </div>
      </div>

      {/* Modification & Actions Bar */}
      <div className="p-5 bg-slate-50/50 border-t border-slate-100 shrink-0">
        
        {/* Modify Input */}
        <form onSubmit={handleModifySubmit} className="mb-5 relative">
          <input 
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            disabled={status === GenerationStatus.MODIFYING}
            placeholder="不满意？输入修改指令（例如：更长一点、语气幽默些...）"
            className="w-full pl-4 pr-12 py-3.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm shadow-sm bg-white"
          />
          <button 
            type="submit"
            disabled={!instruction.trim() || status === GenerationStatus.MODIFYING}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
          >
            {status === GenerationStatus.MODIFYING ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
             <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
             <span>通用引擎生成，请按需调整</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (result) {
                  setCopy(`${result.title}\n\n${result.content}`);
                  navigate('/image-studio');
                }
              }}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 transition-all duration-300"
            >
              一键生图
            </button>
            <ExportButton
              onExport={handleDownload}
              label="导出本地"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                copied
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-indigo-600 text-white border border-indigo-700 hover:bg-indigo-700 shadow-sm'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? '已复制成功' : '一键复制全文'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};