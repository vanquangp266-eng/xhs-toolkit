import React, { useState, useEffect } from 'react';
import { PatternAnalysisResult, LoadingState, VideoStoryboard } from '../types';
import { generateDeepCopy, planVideo, generateSceneImage, generateSceneAudio } from '../services/geminiService';
import { VideoPlayer } from './VideoPlayer';

interface PatternResultProps {
  data: PatternAnalysisResult;
  inputTexts: string[];
}

interface GeneratedItem {
  id: string;
  topic: string;
  content: string;
  status: 'pending' | 'generating' | 'success' | 'error';
  videoStatus: 'idle' | 'analyzing' | 'generating' | 'complete' | 'error';
  videoProgress?: string;
  storyboard?: VideoStoryboard | null;
}

export const PatternResult: React.FC<PatternResultProps> = ({ data, inputTexts }) => {
  const [generateTopic, setGenerateTopic] = useState(''); // Now serves as multiline input
  const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([]);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  
  // Master prompt state
  const [masterPrompt, setMasterPrompt] = useState('');

  // Global Player State
  const [showPlayer, setShowPlayer] = useState(false);
  const [activeStoryboard, setActiveStoryboard] = useState<VideoStoryboard | null>(null);

  useEffect(() => {
    if (data.suggestedPrompt) {
      setMasterPrompt(data.suggestedPrompt);
    }
  }, [data]);

  const handleBatchGenerate = async () => {
    if (!generateTopic.trim() || !masterPrompt.trim()) return;
    
    const topics = generateTopic.split('\n').filter(t => t.trim());
    if (topics.length === 0) return;

    setIsBatchGenerating(true);
    
    // Initialize items
    const initialItems: GeneratedItem[] = topics.map(t => ({
        id: crypto.randomUUID(),
        topic: t,
        content: '',
        status: 'pending',
        videoStatus: 'idle'
    }));
    setGeneratedItems(initialItems);

    // Process Sequentially
    for (let i = 0; i < initialItems.length; i++) {
        const currentId = initialItems[i].id;
        
        // Update status to generating
        setGeneratedItems(prev => prev.map(item => 
            item.id === currentId ? { ...item, status: 'generating' } : item
        ));

        try {
            const result = await generateDeepCopy(masterPrompt, initialItems[i].topic);
            
            setGeneratedItems(prev => prev.map(item => 
                item.id === currentId ? { ...item, status: 'success', content: result } : item
            ));
        } catch (e) {
            setGeneratedItems(prev => prev.map(item => 
                item.id === currentId ? { ...item, status: 'error' } : item
            ));
        }
        
        // Small delay
        await new Promise(r => setTimeout(r, 500));
    }

    setIsBatchGenerating(false);
  };

  const handleCreateVideoForItem = async (itemId: string) => {
    const itemIndex = generatedItems.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;
    const item = generatedItems[itemIndex];
    if (!item.content) return;

    // Helper to update specific item state
    const updateItem = (updates: Partial<GeneratedItem>) => {
        setGeneratedItems(prev => prev.map(it => it.id === itemId ? { ...it, ...updates } : it));
    };

    updateItem({ videoStatus: 'analyzing', videoProgress: '正在构思分镜脚本...' });
    
    try {
      // 1. Plan
      const sb = await planVideo(item.content, data.styleDNA.tone);
      // Initialize scenes status
      sb.scenes = sb.scenes.map(s => ({...s, status: 'pending'}));
      
      updateItem({ 
          videoStatus: 'generating', 
          storyboard: sb,
          videoProgress: `正在生成素材 (0/${sb.scenes.length})...`
      });
      
      // 2. Generate Assets - Sequential
      const updatedScenes = [...sb.scenes];
      let completedCount = 0;

      for (let i = 0; i < updatedScenes.length; i++) {
          const scene = updatedScenes[i];
          try {
              // Update local scene status
              updatedScenes[i].status = 'generating';
              const currentSb = { ...sb, scenes: [...updatedScenes] };
              updateItem({ storyboard: currentSb });

              const imgUrl = await generateSceneImage(scene.imagePrompt);
              updatedScenes[i].imageUrl = imgUrl;

              const audioData = await generateSceneAudio(scene.textSegment, sb.voiceName);
              updatedScenes[i].audioUrl = audioData.url;
              updatedScenes[i].duration = audioData.duration;

              updatedScenes[i].status = 'done';
              
              await new Promise(r => setTimeout(r, 500));
          } catch (e) {
              console.error(`Error generating scene ${i + 1}`, e);
              updatedScenes[i].status = 'error';
          } finally {
              completedCount++;
              updateItem({ 
                  videoProgress: `正在生成素材 (${completedCount}/${updatedScenes.length})...`,
                  storyboard: { ...sb, scenes: [...updatedScenes] }
              });
          }
      }

      updateItem({ videoStatus: 'complete' });
      // Optionally auto-play? Let's just let user click play.

    } catch (e) {
      console.error(e);
      updateItem({ videoStatus: 'error', videoProgress: '生成失败' });
    }
  };

  const playVideo = (storyboard: VideoStoryboard) => {
      setActiveStoryboard(storyboard);
      setShowPlayer(true);
  };

  return (
    <div className="space-y-12 animate-fade-in-up pb-20">
      
      {/* 1. Header Section */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-600 rounded-full opacity-20 blur-3xl"></div>
        <div className="relative z-10">
            <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-2">核心框架 (Master Framework)</h2>
            <h1 className="text-3xl font-bold mb-4">{data.frameworkName}</h1>
            <p className="text-slate-300 text-lg leading-relaxed max-w-3xl">{data.coreLogic}</p>
        </div>
      </div>

      {/* 2. Style DNA Section */}
      <section>
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-8 w-1 bg-pink-500 rounded-full"></div>
          <h2 className="text-2xl font-bold text-slate-800">文风基因 (Style DNA)</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-pink-500 uppercase tracking-wider mb-2">语气 Tone</div>
              <div className="text-sm text-slate-700 font-medium">{data.styleDNA.tone}</div>
           </div>
           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">节奏 Rhythm</div>
              <div className="text-sm text-slate-700 font-medium">{data.styleDNA.rhythm}</div>
           </div>
           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">用词 Vocab</div>
              <div className="text-sm text-slate-700 font-medium">{data.styleDNA.vocabulary}</div>
           </div>
           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-2">句式 Structure</div>
              <div className="text-sm text-slate-700 font-medium">{data.styleDNA.sentenceStructure}</div>
           </div>
        </div>

        <div className="bg-gradient-to-r from-slate-50 to-white p-6 rounded-xl border border-slate-200">
          <h4 className="text-sm font-bold text-slate-700 mb-4">关键特征 (Key Features)</h4>
          <div className="flex flex-wrap gap-3">
             {data.styleDNA.keyFeatures.map((feat, idx) => (
                <div key={idx} className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex flex-col max-w-xs">
                   <span className="text-sm font-bold text-slate-800 mb-1">{feat.featureName}</span>
                   <span className="text-xs text-slate-500 leading-snug">{feat.description}</span>
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* 3. Steps Visualization */}
      <section>
        <div className="flex items-center space-x-3 mb-6">
            <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-800">结构步骤拆解</h2>
        </div>
        <div className="space-y-6">
          {data.steps.map((step, index) => (
            <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className="md:w-1/3 bg-slate-50 p-6 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-center relative">
                <div className="absolute top-4 left-4 bg-slate-200 text-slate-600 font-bold text-xs px-2 py-1 rounded">
                  STEP {index + 1}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mt-6 mb-3">{step.stepName}</h3>
                <p className="text-slate-600 font-medium leading-relaxed italic border-l-4 border-indigo-400 pl-4 py-1">
                  "{step.abstractLogic}"
                </p>
              </div>
              <div className="md:w-2/3 p-6 space-y-4">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">案例映射 (Case Mapping)</h4>
                 <div className="grid grid-cols-1 gap-4">
                   {step.examples.map((ex, exIndex) => (
                     <div key={exIndex} className="relative pl-8 group">
                       <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200 group-last:bottom-auto group-last:h-6"></div>
                       <div className="absolute left-[9px] top-2 w-1.5 h-1.5 rounded-full bg-indigo-400 ring-4 ring-white"></div>
                       <div className="bg-white hover:bg-slate-50 border border-slate-100 rounded-lg p-3 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-white bg-slate-400 px-1.5 py-0.5 rounded">
                                  文案 {ex.textIndex + 1}
                              </span>
                          </div>
                          <p className="text-sm text-slate-800 font-serif mb-2 bg-indigo-50/50 p-2 rounded border border-indigo-100/50">
                              "{ex.excerpt}"
                          </p>
                          <p className="text-xs text-slate-500 leading-tight">
                              <span className="font-bold text-indigo-600">分析: </span>
                              {ex.explanation}
                          </p>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Generation Tool */}
      <section className="mt-12 pt-12 border-t-2 border-slate-200 border-dashed">
         <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-2xl space-y-8">
            
            <div className="flex items-center space-x-2">
               <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/30">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                  <span>AI 深度仿写生成器 (批量版)</span>
               </div>
               <h2 className="text-xl font-bold">由 "案例宝典" 驱动的批量复刻</h2>
            </div>

            <div className="space-y-3">
               <div className="flex justify-between items-baseline">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                   Step 1: 确认/编辑 核心提示词 (Master Prompt)
                 </label>
                 <span className="text-[10px] text-slate-500">此提示词包含了上述所有分析 + 原始文案案例</span>
               </div>
               <textarea 
                 value={masterPrompt}
                 onChange={(e) => setMasterPrompt(e.target.value)}
                 className="w-full h-40 bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-xs font-mono text-slate-300 placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-y leading-relaxed scrollbar-thin scrollbar-thumb-slate-600"
               />
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
               <div className="md:w-1/3 space-y-4">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                       Step 2: 批量输入 选题/内容 (Input Topics)
                     </label>
                     <p className="text-slate-400 text-xs">
                       请每行输入一个主题。AI将依次为您生成对应的仿写文案。
                     </p>
                     <div className="flex flex-col gap-3">
                        <textarea 
                           value={generateTopic}
                           onChange={(e) => setGenerateTopic(e.target.value)}
                           placeholder="例如：\n推荐一本关于心理学的书\n介绍一款适合夏天的香水\n写一段关于坚持的励志文案..." 
                           className="w-full h-64 bg-slate-100 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all resize-none leading-relaxed"
                        />
                        <button 
                           onClick={handleBatchGenerate}
                           disabled={isBatchGenerating || !generateTopic.trim() || !masterPrompt.trim()}
                           className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                              ${isBatchGenerating || !generateTopic.trim() || !masterPrompt.trim()
                                 ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                 : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-500/25 transform active:scale-[0.98]'
                              }
                           `}
                        >
                           {isBatchGenerating ? (
                             <>
                               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                               <span>正在批量生产中...</span>
                             </>
                           ) : (
                             <>
                               <span>开始批量生成</span>
                               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                             </>
                           )}
                        </button>
                     </div>
                  </div>
               </div>

               {/* Output Area - Batch Results List */}
               <div className="md:w-2/3 bg-slate-800/50 rounded-xl border border-slate-700 h-[600px] flex flex-col relative overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center bg-slate-800/80 rounded-t-xl">
                     <span className="text-xs font-bold text-slate-400 uppercase">
                         生成结果队列 ({generatedItems.filter(i => i.status === 'success').length}/{generatedItems.length})
                     </span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-600">
                     {generatedItems.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-600 text-sm italic flex-col gap-2">
                           <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                           <span>请在左侧输入选题并点击生成</span>
                        </div>
                     ) : (
                        generatedItems.map((item, index) => (
                           <div key={item.id} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg transition-all hover:border-slate-600">
                              {/* Item Header */}
                              <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                     <span className="bg-slate-700 text-slate-300 text-[10px] px-1.5 rounded font-mono">{index + 1}</span>
                                     <h3 className="text-sm font-bold text-slate-200 truncate max-w-[200px]" title={item.topic}>{item.topic}</h3>
                                  </div>
                                  <div className="flex items-center gap-2">
                                     {item.status === 'pending' && <span className="text-[10px] text-slate-500">等待中...</span>}
                                     {item.status === 'generating' && <span className="text-[10px] text-indigo-400 animate-pulse">正在生成文案...</span>}
                                     {item.status === 'error' && <span className="text-[10px] text-red-400">生成失败</span>}
                                     {item.status === 'success' && (
                                         <div className="flex gap-2">
                                             <button 
                                                onClick={() => navigator.clipboard.writeText(item.content)}
                                                className="text-[10px] bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded transition-colors"
                                             >
                                                复制文案
                                             </button>
                                         </div>
                                     )}
                                  </div>
                              </div>
                              
                              {/* Item Content */}
                              <div className="p-4 bg-slate-900/50 min-h-[100px] max-h-[300px] overflow-y-auto relative">
                                  {item.status === 'success' ? (
                                      <p className="whitespace-pre-wrap font-serif text-sm text-slate-300 leading-relaxed">{item.content}</p>
                                  ) : item.status === 'generating' ? (
                                      <div className="flex justify-center py-8">
                                          <div className="w-6 h-6 border-2 border-indigo-500 rounded-full animate-spin border-t-transparent"></div>
                                      </div>
                                  ) : item.status === 'error' ? (
                                      <div className="text-center py-4 text-red-400 text-xs">AI 请求失败，请检查网络或重试</div>
                                  ) : (
                                      <div className="text-center py-4 text-slate-600 text-xs">等待处理...</div>
                                  )}

                                  {/* Video Overlay Status */}
                                  {(item.videoStatus !== 'idle') && (
                                     <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4 text-center">
                                         {item.videoStatus === 'complete' ? (
                                             <div className="space-y-3 animate-fade-in-up">
                                                 <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/30">
                                                     <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                 </div>
                                                 <h4 className="text-white font-bold text-sm">视频生成完毕</h4>
                                                 <button 
                                                    onClick={() => item.storyboard && playVideo(item.storyboard)}
                                                    className="px-4 py-2 bg-white text-green-600 rounded-lg font-bold text-xs hover:bg-green-50 transition-colors shadow-lg"
                                                 >
                                                    立即播放
                                                 </button>
                                             </div>
                                         ) : item.videoStatus === 'error' ? (
                                             <div className="text-red-400 text-xs font-bold">视频生成失败</div>
                                         ) : (
                                             <>
                                                <div className="w-8 h-8 border-2 border-pink-500 rounded-full animate-spin border-t-transparent mb-2"></div>
                                                <div className="text-pink-400 text-xs font-bold animate-pulse">{item.videoProgress || '正在处理...'}</div>
                                             </>
                                         )}
                                     </div>
                                  )}
                              </div>

                              {/* Item Actions Footer */}
                              {item.status === 'success' && item.videoStatus === 'idle' && (
                                  <div className="bg-slate-800/30 px-4 py-2 border-t border-slate-800 flex justify-end">
                                      <button 
                                          onClick={() => handleCreateVideoForItem(item.id)}
                                          className="text-xs flex items-center gap-1 text-pink-400 hover:text-pink-300 transition-colors font-bold"
                                      >
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                          生成短视频
                                      </button>
                                  </div>
                              )}
                              {item.status === 'success' && item.videoStatus === 'complete' && (
                                  <div className="bg-green-900/20 px-4 py-2 border-t border-green-900/30 flex justify-end">
                                      <button 
                                          onClick={() => item.storyboard && playVideo(item.storyboard)}
                                          className="text-xs flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors font-bold"
                                      >
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                          回放视频
                                      </button>
                                  </div>
                              )}
                           </div>
                        ))
                     )}
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Video Player Modal */}
      {showPlayer && activeStoryboard && (
         <VideoPlayer 
            storyboard={activeStoryboard} 
            onClose={() => setShowPlayer(false)} 
         />
      )}

    </div>
  );
};