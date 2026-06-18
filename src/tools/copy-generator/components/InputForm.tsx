import React from 'react';
import { CopyRequest, ProductManual, NoteType } from '../types';
import { PRODUCTS } from '../constants';
import { Sparkles, Loader2, Search, TrendingUp, ShoppingBag, Database } from 'lucide-react';
import { useGlobalStore } from '../../../shared/store/globalStore';

interface InputFormProps {
  isLoading: boolean;
  onSubmit: (data: CopyRequest) => void;
}

export const InputForm: React.FC<InputFormProps> = ({ isLoading, onSubmit }) => {
  const [topic, setTopic] = React.useState('');
  const [targetAudience, setTargetAudience] = React.useState('');
  const [noteType, setNoteType] = React.useState<NoteType>('SEARCH');
  const { currentPainPoint, currentPersona, currentProductContext, currentTitle, currentPattern } = useGlobalStore();
  
  // Persist custom settings in localStorage
  const [customPrompt, setCustomPrompt] = React.useState(() => localStorage.getItem('copy_custom_prompt') || '');
  const [customProduct, setCustomProduct] = React.useState(() => localStorage.getItem('copy_custom_product') || '');

  React.useEffect(() => {
    localStorage.setItem('copy_custom_prompt', customPrompt);
  }, [customPrompt]);

  React.useEffect(() => {
    localStorage.setItem('copy_custom_product', customProduct);
  }, [customProduct]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For Sales type, topic is optional/ignored, but we pass a placeholder if empty to satisfy type
    const finalTopic = noteType === 'SALES' && !topic ? '产品强力推荐' : topic;
    
    if (!finalTopic || !targetAudience) return;
    onSubmit({ topic: finalTopic, targetAudience, noteType, customPrompt, customProduct });
  };

  const isSalesType = noteType === 'SALES';

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 border border-white/40">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl">
                <Sparkles className="w-5 h-5 text-indigo-500" />
            </div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">全局引擎配置</h2>
        </div>
        <button
            type="button"
            onClick={() => {
                if (currentPainPoint) setTopic(currentPainPoint);
                if (currentTitle) setTopic(prev => prev ? `${prev} - ${currentTitle}` : currentTitle);
                if (currentPersona) setCustomPrompt(currentPersona);
                if (currentProductContext) setCustomProduct(currentProductContext);
                
                // If there's a pattern, append it to custom prompt
                if (currentPattern && currentPersona) {
                    setCustomPrompt(`${currentPersona}\n\n【附加写作句式要求】\n${currentPattern}`);
                } else if (currentPattern && !currentPersona) {
                    setCustomPrompt(`【写作句式要求】\n${currentPattern}`);
                }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-[13px] font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
            <Database className="w-4 h-4" />
            一键填入全局流转数据
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Note Type Selector */}
        <div>
          <label className="block text-[13px] font-semibold text-slate-700 mb-3 uppercase tracking-wider">
            产出笔记类型
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setNoteType('SEARCH')}
              className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all duration-200 ${
                noteType === 'SEARCH'
                  ? 'bg-indigo-50/50 border-indigo-500 text-indigo-600 shadow-sm'
                  : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Search className="w-5 h-5 mb-1.5" />
              <span className="text-xs font-semibold">搜索/干货</span>
            </button>
            <button
              type="button"
              onClick={() => setNoteType('TRAFFIC')}
              className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all duration-200 ${
                noteType === 'TRAFFIC'
                  ? 'bg-purple-50/50 border-purple-500 text-purple-600 shadow-sm'
                  : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-5 h-5 mb-1.5" />
              <span className="text-xs font-semibold">流量/共鸣</span>
            </button>
            <button
              type="button"
              onClick={() => setNoteType('SALES')}
              className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all duration-200 ${
                noteType === 'SALES'
                  ? 'bg-rose-50/50 border-rose-500 text-rose-600 shadow-sm'
                  : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-5 h-5 mb-1.5" />
              <span className="text-xs font-semibold">商销/转化</span>
            </button>
          </div>
        </div>

        {/* Topic Input - Hidden for Sales Type if desired, but user said "don't need to input", 
            so we make it optional or visualy hidden/disabled. 
            Let's keep it visible but optional and change placeholder. */}
        {!isSalesType && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label htmlFor="topic" className="block text-[13px] font-semibold text-slate-700 mb-2">
              {noteType === 'TRAFFIC' ? '吐槽点 / 共鸣话题' : '选题 / 痛点 (Topic)'}
            </label>
            <textarea
              id="topic"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none text-slate-800 placeholder-slate-400 bg-white/50"
              placeholder={noteType === 'TRAFFIC' 
                ? "例如：当妈后没人理解的崩溃瞬间..." 
                : "例如：孩子做作业总是磨蹭，吼也没用..."}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required={!isSalesType}
            />
          </div>
        )}

        {isSalesType && (
           <div className="p-4 bg-gradient-to-r from-rose-50 to-orange-50 rounded-xl border border-rose-100/50 text-rose-800 text-sm animate-in fade-in">
              <p className="font-bold mb-1 flex items-center gap-1.5"><ShoppingBag className="w-4 h-4"/> 商销模式已开启</p>
              <p className="opacity-80">系统将忽略具体选题，直接生成针对【目标人群】强推【自定义产品】的转化文案。</p>
           </div>
        )}

        <div>
          <label htmlFor="audience" className="block text-[13px] font-semibold text-slate-700 mb-2">
            目标人群 (Target Audience)
          </label>
          <input
            type="text"
            id="audience"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder-slate-400 bg-white/50"
            placeholder="例如：3-8岁孩子的职场妈妈..."
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            required
          />
        </div>

        {/* Custom Persona Textarea */}
        <div>
          <label htmlFor="customPrompt" className="block text-[13px] font-semibold text-slate-700 mb-2 flex justify-between">
            <span>专属人设/系统提示词</span>
            <span className="text-[10px] text-slate-400 font-normal">留空则使用默认配置</span>
          </label>
          <textarea
            id="customPrompt"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition-all resize-none text-slate-800 placeholder-slate-400 bg-white/50 text-sm"
            placeholder="例如：你是一个幽默搞笑的数码评测博主，语气要夸张，喜欢用网络热词..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
          />
        </div>

        {/* Custom Product Textarea */}
        <div>
          <label htmlFor="customProduct" className="block text-[13px] font-semibold text-slate-700 mb-2">
            {noteType === 'TRAFFIC' ? '关联产品资料 (仅作后台参考)' : '重点推荐产品及卖点资料'}
          </label>
          <textarea
            id="customProduct"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition-all resize-none text-slate-800 placeholder-slate-400 bg-white/50 text-sm"
            placeholder="粘贴您的产品核心卖点、价格、优势特征..."
            value={customProduct}
            onChange={(e) => setCustomProduct(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || (!isSalesType && !topic) || !targetAudience}
          className={`w-full py-4 rounded-2xl font-bold text-white text-base shadow-[0_8px_20px_rgb(99,102,241,0.3)] transform transition-all duration-300 
            ${isLoading || (!isSalesType && !topic) || !targetAudience 
              ? 'bg-slate-300 cursor-not-allowed shadow-none' 
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:-translate-y-0.5 active:translate-y-0'
            }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>AI 引擎运转中...</span>
            </div>
          ) : (
            '立即生成爆款文案'
          )}
        </button>
      </form>
    </div>
  );
};