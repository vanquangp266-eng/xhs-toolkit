import React, { useState, useRef, useEffect } from 'react';
import { VideoStoryboard } from '../types';
import { downloadFile } from '../../../shared/utils/exportUtils';

interface VideoPlayerProps {
  storyboard: VideoStoryboard;
  onClose: () => void;
}

// Public domain / Royalty free placeholder music
const BGM_URL = "https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3"; 

// Helper to load image for canvas
const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
};

// Helper to decode audio for Web Audio API
const loadAudioBuffer = async (ctx: AudioContext, src: string): Promise<AudioBuffer> => {
    const response = await fetch(src);
    const arrayBuffer = await response.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer);
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ storyboard, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0 to 100 for current scene
  
  // Settings
  const [playbackSpeed, setPlaybackSpeed] = useState(1.25);
  const [bgmVolume, setBgmVolume] = useState(0.2);
  const [showSettings, setShowSettings] = useState(false);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<number>(0);

  const currentScene = storyboard.scenes[currentSceneIndex];

  // Initialize playback rate and volume
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.playbackRate = playbackSpeed;
    }
    if (bgmRef.current) {
        bgmRef.current.volume = isPlaying ? bgmVolume : 0;
    }
  }, [playbackSpeed, bgmVolume, isPlaying]);

  // Handle Scene Switching
  useEffect(() => {
    if (audioRef.current && currentScene?.audioUrl) {
      audioRef.current.src = currentScene.audioUrl;
      // Ensure speed is maintained after src change
      audioRef.current.playbackRate = playbackSpeed;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Play error:", e));
      }
    }
  }, [currentSceneIndex, storyboard]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!audioRef.current || !bgmRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      bgmRef.current.pause();
      setIsPlaying(false);
      cancelAnimationFrame(requestRef.current!);
    } else {
      audioRef.current.play();
      bgmRef.current.play();
      setIsPlaying(true);
    }
  };

  // Track Audio Progress & Auto-Advance
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    
    const duration = audioRef.current.duration || 1;
    const current = audioRef.current.currentTime;
    const pct = (current / duration) * 100;
    setProgress(pct);

    if (current >= duration && !audioRef.current.paused) {
      // Audio ended, go to next scene
      if (currentSceneIndex < storyboard.scenes.length - 1) {
        setCurrentSceneIndex(prev => prev + 1);
        setProgress(0);
      } else {
        setIsPlaying(false);
        setProgress(100);
        bgmRef.current?.pause(); // Stop music at end
      }
    }
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(0);

    // Pause current playback if running
    if (isPlaying) togglePlay();

    try {
        const canvas = document.createElement('canvas');
        canvas.width = 1080; 
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("No canvas context");

        // Audio Context for mixing
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const dest = audioCtx.createMediaStreamDestination();
        
        // Prepare assets first to avoid stutter
        console.log("Loading assets for export...");
        const assets = await Promise.all(storyboard.scenes.map(async (scene) => {
             const [img, buffer] = await Promise.all([
                 scene.imageUrl ? loadImage(scene.imageUrl) : null,
                 scene.audioUrl ? loadAudioBuffer(audioCtx, scene.audioUrl) : null
             ]);
             return { img, buffer, text: scene.textSegment };
        }));

        // Combine streams
        const canvasStream = canvas.captureStream(30); // 30 FPS
        const combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...dest.stream.getAudioTracks()
        ]);

        const mimeType = MediaRecorder.isTypeSupported('video/mp4') 
             ? 'video/mp4' 
             : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
                 ? 'video/webm;codecs=vp9'
                 : 'video/webm';

        const recorder = new MediaRecorder(combinedStream, { mimeType });
        const chunks: Blob[] = [];
        
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };
        
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            const filename = `CopyCraft_Video_${Date.now()}.${mimeType === 'video/mp4' ? 'mp4' : 'webm'}`;
            downloadFile(blob, filename, mimeType);
            
            setIsExporting(false);
            setExportProgress(0);
            audioCtx.close();
        };

        recorder.start();

        // Background Music Setup
        let bgmSource: AudioBufferSourceNode | null = null;
        try {
            const bgmResp = await fetch(BGM_URL);
            const bgmArr = await bgmResp.arrayBuffer();
            const bgmBuffer = await audioCtx.decodeAudioData(bgmArr);
            
            bgmSource = audioCtx.createBufferSource();
            bgmSource.buffer = bgmBuffer;
            bgmSource.loop = true;
            
            const bgmGain = audioCtx.createGain();
            bgmGain.gain.value = bgmVolume; // Use user selected volume
            
            bgmSource.connect(bgmGain);
            bgmGain.connect(dest);
            bgmSource.start(0);
        } catch (e) {
            console.warn("Failed to mix BGM", e);
        }

        // Render Loop
        for (let i = 0; i < assets.length; i++) {
            const scene = assets[i];
            
            // Audio Playback
            const duration = scene.buffer ? scene.buffer.duration : 2.5; // Default 2.5s if no audio
            if (scene.buffer) {
                const source = audioCtx.createBufferSource();
                source.buffer = scene.buffer;
                source.connect(dest);
                source.start(audioCtx.currentTime);
            }

            // Visual Rendering Loop (Ken Burns Effect + Subtitles)
            const startTime = Date.now();
            const endTime = startTime + (duration * 1000);
            
            while (Date.now() < endTime) {
                // Calculate progress 0 to 1
                const p = (Date.now() - startTime) / (duration * 1000);
                
                // Clear
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                if (scene.img) {
                    // Ken Burns Effect: Slow Zoom (1.0 -> 1.1)
                    const scale = 1.0 + (p * 0.1);
                    const w = canvas.width * scale;
                    const h = canvas.height * scale;
                    // Center the zoom
                    const x = (canvas.width - w) / 2;
                    const y = (canvas.height - h) / 2;
                    
                    ctx.drawImage(scene.img, x, y, w, h);
                    
                    // Subtitle Overlay
                    const fontSize = 36;
                    ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
                    
                    // Word wrapping for canvas
                    const words = scene.text.split(''); // Char split for Chinese or word split for Eng
                    // Actually simple split doesn't work well for mixed. Let's just break coarsely for now or just one line if short.
                    // Simple wrapping logic
                    const maxLineWidth = canvas.width - 100;
                    let line = '';
                    let lines = [];
                    
                    for (let n = 0; n < scene.text.length; n++) {
                         const testLine = line + scene.text[n];
                         const metrics = ctx.measureText(testLine);
                         if (metrics.width > maxLineWidth && n > 0) {
                             lines.push(line);
                             line = scene.text[n];
                         } else {
                             line = testLine;
                         }
                    }
                    lines.push(line);

                    // Draw Subtitle Background & Text
                    const lineHeight = fontSize * 1.4;
                    const totalHeight = lines.length * lineHeight;
                    const startY = canvas.height - 80 - totalHeight;

                    lines.forEach((l, idx) => {
                        const textWidth = ctx.measureText(l).width;
                        const textX = (canvas.width - textWidth) / 2;
                        const textY = startY + (idx * lineHeight);
                        
                        // Shadow/Outline for better readability
                        ctx.fillStyle = 'rgba(0,0,0,0.6)';
                        ctx.fillRect(textX - 10, textY - fontSize + 5, textWidth + 20, fontSize + 10);
                        
                        ctx.fillStyle = '#ffffff';
                        ctx.fillText(l, textX, textY);
                    });
                }
                
                await new Promise(r => setTimeout(r, 16)); // ~60fps wait
            }
            
            setExportProgress(((i + 1) / assets.length) * 100);
        }

        if (bgmSource) bgmSource.stop();
        // Give a tiny buffer at the end
        await new Promise(r => setTimeout(r, 500));
        recorder.stop();

    } catch (e) {
        console.error("Export failed", e);
        alert("Export failed. Please check console.");
        setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-6xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col md:flex-row h-[90vh]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-black/50 text-white p-2 rounded-full hover:bg-white/20 transition-all"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Visual Area (Main Stage) */}
        <div className="md:w-3/4 relative bg-slate-900 flex items-center justify-center overflow-hidden group">
          {currentScene?.imageUrl ? (
            <img 
              src={currentScene.imageUrl} 
              alt="Scene" 
              className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-linear ${isPlaying ? 'scale-110' : 'scale-100'}`}
            />
          ) : (
            <div className="flex flex-col items-center text-slate-500">
              <svg className="w-12 h-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-xs">Generating Visual...</span>
            </div>
          )}

          {/* Subtitles Overlay */}
          <div className="absolute bottom-12 left-0 right-0 text-center px-8 pointer-events-none">
            <p className="inline-block bg-black/60 text-white text-xl font-bold px-6 py-3 rounded-xl backdrop-blur-md shadow-lg leading-relaxed max-w-3xl">
              {currentScene?.textSegment}
            </p>
          </div>

          {/* Controls Overlay (Play/Pause) */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
             {!isExporting && (
                <button 
                onClick={togglePlay}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-6 rounded-full text-white transform hover:scale-110 transition-all"
                >
                {isPlaying ? (
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                ) : (
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                )}
                </button>
             )}
          </div>
          
          {/* Export Overlay */}
          {isExporting && (
             <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
                 <div className="w-24 h-24 rounded-full border-4 border-slate-700 border-t-pink-500 animate-spin mb-6"></div>
                 <h2 className="text-2xl font-bold text-white mb-2">正在合成视频</h2>
                 <p className="text-slate-400 mb-6">Rendering Video... {Math.round(exportProgress)}%</p>
                 <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-pink-500 transition-all duration-300" style={{ width: `${exportProgress}%` }}></div>
                 </div>
                 <p className="text-xs text-slate-500 mt-4 max-w-sm text-center">AI is stitching scenes, mixing audio, and rendering visual effects. Please wait.</p>
             </div>
          )}
          
          {/* Settings Overlay Button */}
          <div className="absolute top-4 left-4 z-40 flex gap-2">
             <button onClick={() => setShowSettings(!showSettings)} className="bg-black/50 text-white p-2 rounded-lg hover:bg-black/70 flex items-center gap-2 text-xs backdrop-blur-sm">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 Settings
             </button>
             <button 
                onClick={handleExport}
                disabled={isExporting}
                className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 text-xs font-bold shadow-pink-500/20 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
             >
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 Export Video
             </button>
             
             {showSettings && (
                 <div className="absolute top-12 left-0 mt-2 bg-black/80 backdrop-blur text-white p-4 rounded-xl w-64 space-y-4 shadow-xl border border-slate-700">
                     <div>
                         <label className="block text-xs font-bold text-slate-400 mb-1">语速 (Speed): {playbackSpeed}x</label>
                         <input 
                            type="range" min="0.8" max="2.0" step="0.1" 
                            value={playbackSpeed}
                            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                            className="w-full accent-indigo-500 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-400 mb-1">背景音乐音量 (BGM): {Math.round(bgmVolume * 100)}%</label>
                         <input 
                            type="range" min="0" max="1.0" step="0.1" 
                            value={bgmVolume}
                            onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                            className="w-full accent-pink-500 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer"
                         />
                     </div>
                 </div>
             )}
          </div>

          {/* Progress Bar (Bottom) */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
             <div 
               className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-200"
               style={{ width: `${progress}%` }}
             ></div>
          </div>
        </div>

        {/* Sidebar: Scenes List (1/4) */}
        <div className="md:w-1/4 border-l border-slate-800 bg-slate-900 flex flex-col h-full overflow-hidden">
           <div className="p-4 border-b border-slate-800 bg-slate-900 z-10">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">分镜列表 ({storyboard.scenes.length})</h3>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">Auto-Scroll</span>
             </div>
             <p className="text-xs text-slate-500 truncate">Voice: <span className="text-indigo-400">{storyboard.voiceName}</span></p>
           </div>
           
           <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
             {storyboard.scenes.map((scene, idx) => (
               <div 
                 key={scene.id}
                 onClick={() => {
                   if (!isExporting) {
                       setCurrentSceneIndex(idx);
                       setIsPlaying(false);
                       setProgress(0);
                   }
                 }}
                 className={`
                    cursor-pointer rounded-lg p-2 border transition-all flex gap-3 items-center group
                    ${currentSceneIndex === idx 
                      ? 'bg-slate-800 border-indigo-500 shadow-md' 
                      : 'bg-slate-800/30 border-transparent hover:bg-slate-800/80'
                    }
                 `}
               >
                 <div className="text-[10px] font-mono text-slate-600 w-4 text-center">{idx + 1}</div>
                 
                 {/* Thumbnail */}
                 <div className="w-12 h-12 rounded bg-black flex-shrink-0 overflow-hidden relative border border-slate-700">
                   {scene.imageUrl ? (
                     <img src={scene.imageUrl} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center">
                         <div className="w-3 h-3 border border-indigo-500 rounded-full animate-spin border-t-transparent"></div>
                     </div>
                   )}
                   {currentSceneIndex === idx && isPlaying && (
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-0.5 h-2 bg-white mx-0.5 animate-pulse"></div>
                        <div className="w-0.5 h-3 bg-white mx-0.5 animate-pulse delay-75"></div>
                     </div>
                   )}
                 </div>

                 {/* Text */}
                 <div className="flex-1 min-w-0">
                   <p className={`text-[11px] line-clamp-2 leading-tight ${currentSceneIndex === idx ? 'text-white font-medium' : 'text-slate-400'}`}>
                     {scene.textSegment}
                   </p>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-slate-600 bg-black/30 px-1 rounded">
                        {scene.status === 'done' ? `${(scene.duration || 0).toFixed(1)}s` : scene.status}
                      </span>
                   </div>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Hidden Audio Elements */}
        <audio 
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {
             // Redundant check, mostly handled in timeUpdate
             if (currentSceneIndex === storyboard.scenes.length - 1) {
                setIsPlaying(false);
             }
          }}
        />
        <audio 
            ref={bgmRef}
            src={BGM_URL}
            loop
        />
      </div>
    </div>
  );
};