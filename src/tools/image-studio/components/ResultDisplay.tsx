import React from 'react';
import { Download, RefreshCw, Copy, ImagePlus, AlertCircle, Image as ImageIcon } from 'lucide-react';
import type { GeneratedImage, GenerationStatus } from '../types';

interface ResultDisplayProps {
    status: GenerationStatus;
    result: GeneratedImage | null;
    error: string | null;
    startedAt?: number | null;
    onRetry: () => void;
    onUseAsSource: (url: string) => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ status, result, error, startedAt, onRetry, onUseAsSource }) => {
    const [, forceTick] = React.useState(0);

    React.useEffect(() => {
        if (status !== 'loading') return;
        const timer = window.setInterval(() => forceTick(v => v + 1), 1000);
        return () => window.clearInterval(timer);
    }, [status]);

    const handleDownload = () => {
        if (!result) return;
        const link = document.createElement('a');
        link.href = result.url;
        link.download = `xhs-studio-${Date.now()}.png`;
        link.click();
    };

    const handleCopyPrompt = () => {
        if (result?.prompt) navigator.clipboard.writeText(result.prompt);
    };

    if (status === 'idle' && !result) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm h-full min-h-[500px] flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                    <ImageIcon className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-lg font-bold text-slate-300 mb-2">等待生成</h3>
                <p className="text-sm text-slate-400 text-center max-w-xs">
                    选择素材来源、参考图和参数后开始作图。
                </p>
            </div>
        );
    }

    if (status === 'loading') {
        const elapsed = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
        const progress = Math.min(98, Math.round((elapsed / 120) * 100));
        const remaining = Math.max(0, 120 - elapsed);

        return (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm h-full min-h-[500px] flex flex-col items-center justify-center">
                <div className="relative mb-6">
                    <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-red-300" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">AI 正在创作中</h3>
                <p className="text-sm text-slate-400">按 120 秒作图节奏计时，切到其他工具页也会继续。</p>
                <div className="mt-6 w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-400 to-rose-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-2 text-[11px] text-slate-400 font-mono">
                    {elapsed}s / 120s{remaining > 0 ? ` · 预计剩余 ${remaining}s` : ' · 即将完成'}
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="bg-white rounded-2xl border border-red-200 shadow-sm h-full min-h-[500px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-red-600 mb-2">生成失败</h3>
                <p className="text-sm text-slate-500 max-w-xs text-center mb-4">{error || '未知错误，请检查 API Key 配置'}</p>
                <button onClick={onRetry}
                    className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5" /> 重试
                </button>
            </div>
        );
    }

    if (!result) return null;

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="relative bg-slate-50 flex items-center justify-center min-h-[400px]">
                <img src={result.url} alt="生成结果" className="max-w-full max-h-[600px] object-contain" />
                <div className="absolute bottom-4 right-4 flex gap-2">
                    <button onClick={handleDownload}
                        className="w-10 h-10 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-md transition-all"
                        title="下载图片">
                        <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => onUseAsSource(result.url)}
                        className="w-10 h-10 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-md transition-all"
                        title="作为原图继续迭代">
                        <ImagePlus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="p-4 border-t border-slate-100">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 font-mono leading-relaxed line-clamp-2">{result.prompt}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-medium">
                            <span>{result.size}</span>
                            <span>·</span>
                            <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
                            <span>·</span>
                            <span>{result.mode === 'image' ? '原图二创' : result.mode === 'text' ? '文案作图' : '空白创作'}</span>
                        </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={handleCopyPrompt}
                            className="px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1">
                            <Copy className="w-3 h-3" /> 复制 Prompt
                        </button>
                        <button onClick={onRetry}
                            className="px-2.5 py-1.5 text-[10px] font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> 重新生成
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultDisplay;
