import React, { useState } from 'react';
import { Copy, Check, ArrowLeft, RefreshCw, Sparkles, Send } from 'lucide-react';
import { useGlobalStore } from '../../../shared/store/globalStore';
import { ExportButton } from '../../../shared/components/ExportButton';
import { exportAsMarkdown } from '../../../shared/utils/exportUtils';

interface PromptResultProps {
  prompt: string;
  onReset: () => void;
}

const PromptResult: React.FC<PromptResultProps> = ({ prompt, onReset }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
    exportAsMarkdown(prompt, `xhs-prompt-${new Date().toISOString().slice(0, 10)}.md`);
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onReset}
          className="flex items-center text-slate-500 hover:text-slate-800 transition-colors font-medium text-sm gap-1"
        >
          <ArrowLeft size={16} />
          返回编辑
        </button>
        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <Sparkles size={12} />
          Prompt Generated
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col flex-grow">
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-400"></div>
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="ml-3 text-xs font-mono text-slate-400">system_prompt.md</span>
          </div>
          
          <div className="flex items-center gap-2">
            <ExportButton
              onExport={handleDownload}
              label="导出 MD"
            />
            
            <button
              onClick={handleCopy}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                ${copied 
                  ? 'bg-green-500 text-white shadow-green-200 shadow-lg' 
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm'}
              `}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? '已复制' : '复制提示词'}
            </button>
            <button
              onClick={() => useGlobalStore.getState().setPersona(prompt)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all ml-2"
              title="发送至全局中枢 (作为专属人设)"
            >
              <Send size={16} />
              <span className="hidden sm:inline">设为全局人设</span>
            </button>
          </div>
        </div>
        
        <div className="flex-grow overflow-auto p-0 bg-[#0d1117]">
          <pre className="p-6 font-mono text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
            {prompt}
          </pre>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-slate-700 flex gap-3 items-start">
        <div className="mt-0.5 text-blue-500">
           <RefreshCw size={18} />
        </div>
        <div>
          <p className="font-bold text-slate-900 mb-1">使用说明</p>
          <p className="leading-relaxed opacity-80">
            复制上方生成的 Prompt，发送给 ChatGPT / Claude / DeepSeek。然后，在新的对话中输入你的选题（例如：{'"'}如何培养孩子专注力{'"'}），AI 将会自动按照小红书爆款逻辑生成文案。
          </p>
        </div>
      </div>
    </div>
  );
};

export default PromptResult;