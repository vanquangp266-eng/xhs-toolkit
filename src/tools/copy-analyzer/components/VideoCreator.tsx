import React, { useState, useEffect } from 'react';
import { LoadingState, VideoStoryboard } from '../types';
import { planVideo, generateSceneImage, generateSceneAudio } from '../services/geminiService';
import { VideoPlayer } from './VideoPlayer';

interface VideoCreatorProps {
  onSave?: (inputText: string, tone: string, storyboard: VideoStoryboard) => void;
  initialData?: {
    inputText: string;
    tone: string;
    storyboard: VideoStoryboard;
  } | null;
}

export const VideoCreator: React.FC<VideoCreatorProps> = ({ onSave, initialData }) => {
  const [inputText, setInputText] = useState('');
  const [tone, setTone] = useState('Passionate and Energetic');
  const [loading, setLoading] = useState<LoadingState>({ status: 'idle' });
  const [storyboard, setStoryboard] = useState<VideoStoryboard | null>(null);
  const [progressText, setProgressText] = useState('');
  const [showPlayer, setShowPlayer] = useState(false);

  // Restore state if initialData is provided
  useEffect(() => {
    if (initialData) {
      setInputText(initialData.inputText);
      setTone(initialData.tone || 'Passionate and Energetic');
      setStoryboard(initialData.storyboard);
      setLoading({ status: 'complete' }); // Assume completed if loaded from history
    }
  }, [initialData]);

  const handleCreate = async () => {
    if (!inputText.trim()) return;
    
    setLoading({ status: 'analyzing' });
    setProgressText('正在策划分镜脚本 (Aiming for 20+ scenes)...');
    setStoryboard(null);

    try {
      // 1. Plan Video
      const sb = await planVideo(inputText, tone);
      setStoryboard(sb);
      setLoading({ status: 'generating' });

      // 2. Generate Assets - Sequential to respect Rate Limits
      const updatedScenes = [...sb.scenes];
      let completedCount = 0;

      for (let i = 0; i < updatedScenes.length; i++) {
         const scene = updatedScenes[i];
         try {
             updatedScenes[i].status = 'generating';
             setStoryboard({ ...sb, scenes: [...updatedScenes] });

             // Generate Image
             const imgUrl = await generateSceneImage(scene.imagePrompt);
             updatedScenes[i].imageUrl = imgUrl;

             // Generate Audio
             const audioData = await generateSceneAudio(scene.textSegment, sb.voiceName);
             updatedScenes[i].audioUrl = audioData.url;
             updatedScenes[i].duration = audioData.duration;

             updatedScenes[i].status = 'done';
             
             // Small delay to be polite to the API
             await new Promise(r => setTimeout(r, 500));
         } catch (e) {
             console.error(`Error generating scene ${i + 1}:`, e);
             updatedScenes[i].status = 'error';
         } finally {
             completedCount++;
             setProgressText(`正在生成素材: ${completedCount}/${updatedScenes.length}`);
             const currentSb = { ...sb, scenes: [...updatedScenes] };
             setStoryboard(currentSb);
             
             // Save progress incrementally if desired, or at the end
             // For now, we save only when complete to avoid partial history spam
         }
      }
      
      const finalSb = { ...sb, scenes: updatedScenes };
      setStoryboard(finalSb);
      setLoading({ status: 'complete' });
      setShowPlayer(true);

      // Save to history upon completion
      if (onSave) {
        onSave(inputText, tone, finalSb);
      }

    } catch (e) {
      console.error(e);
      setLoading({ status: 'error', message: '生成失败，请重试' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
        {/* Input Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </div>
                <div>
                   <h2 className="text-2xl font-bold text-slate-800">智能视频创作 (Smart Video Creator)</h2>
                   <p className="text-slate-500 text-sm">输入文案，AI自动切分20+分镜，生成画面、配音与背景音乐</p>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">文案内容 (Script)</label>
                    <textarea 
                        className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-4 focus:ring-pink-100 focus:border-pink-400 outline-none transition-all resize-none text-slate-700"
                        placeholder="在此输入您的文案，AI将自动为您切分分镜..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">情感基调 (Video Tone)</label>
                   <div className="flex flex-wrap gap-3">
                       {['High Energy & Fast', 'Emotional & Touching', 'Professional & Clean', 'Suspenseful & Dark', 'Relaxed & Calm'].map(t => (
                           <button 
                              key={t}
                              onClick={() => setTone(t)}
                              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${tone === t ? 'bg-pink-50 border-pink-400 text-pink-600' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                           >
                               {t}
                           </button>
                       ))}
                   </div>
                </div>

                <button
                    onClick={handleCreate}
                    disabled={loading.status === 'analyzing' || loading.status === 'generating' || !inputText.trim()}
                    className={`
                        w-full py-4 rounded-xl font-bold text-lg text-white shadow-xl transition-all flex items-center justify-center gap-3
                        ${loading.status === 'analyzing' || loading.status === 'generating' || !inputText.trim()
                            ? 'bg-slate-300 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 transform active:scale-[0.99]'
                        }
                    `}
                >
                    {loading.status === 'analyzing' || loading.status === 'generating' ? (
                        <>
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                           <span>{progressText}</span>
                        </>
                    ) : (
                        <>
                           <span>开始生成短视频</span>
                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </>
                    )}
                </button>
            </div>
        </section>

        {/* Results / Storyboard Preview */}
        {storyboard && (
            <section className="bg-slate-50 rounded-2xl border border-slate-200 p-8">
               <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-bold text-slate-800">分镜脚本概览 ({storyboard.scenes.length} Scenes)</h3>
                   <button 
                      onClick={() => setShowPlayer(true)}
                      className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2"
                   >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      播放完整视频
                   </button>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {storyboard.scenes.map((scene) => (
                      <div key={scene.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                          <div className="aspect-square bg-slate-100 relative">
                             {scene.imageUrl ? (
                                 <img src={scene.imageUrl} className="w-full h-full object-cover" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center text-slate-300">
                                     {scene.status === 'generating' ? <div className="w-5 h-5 border-2 border-pink-500 rounded-full animate-spin border-t-transparent"></div> : 
                                      scene.status === 'error' ? <span className="text-red-400 text-xs font-bold">Error</span> : '...'}
                                 </div>
                             )}
                             <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-1.5 rounded font-mono">
                                 {scene.id + 1}
                             </div>
                          </div>
                          <div className="p-3">
                              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{scene.textSegment}</p>
                          </div>
                      </div>
                  ))}
               </div>
            </section>
        )}

        {showPlayer && storyboard && (
            <VideoPlayer storyboard={storyboard} onClose={() => setShowPlayer(false)} />
        )}
    </div>
  );
};
