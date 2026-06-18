import React, { useState, useRef, useCallback } from 'react';
import { Image, FileText, Sparkles, Upload, Link, X } from 'lucide-react';
import type { SourceMode } from '../types';

interface SourcePanelProps {
    mode: SourceMode;
    onModeChange: (mode: SourceMode) => void;
    sourceImage: string | null;
    onSourceImageChange: (img: string | null) => void;
    textContent: string;
    onTextContentChange: (text: string) => void;
}

const tabs: { mode: SourceMode; icon: React.ElementType; label: string; desc: string }[] = [
    { mode: 'image', icon: Image, label: '笔记原图', desc: '上传或粘贴原图进行二创' },
    { mode: 'text', icon: FileText, label: '文案作图', desc: '从文案内容生成图片' },
    { mode: 'blank', icon: Sparkles, label: '空白创作', desc: '纯 Prompt 驱动创作' },
];

const SourcePanel: React.FC<SourcePanelProps> = ({
    mode, onModeChange, sourceImage, onSourceImageChange, textContent, onTextContentChange
}) => {
    const [urlInput, setUrlInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => onSourceImageChange(reader.result as string);
        reader.readAsDataURL(file);
    }, [onSourceImageChange]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file?.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => onSourceImageChange(reader.result as string);
        reader.readAsDataURL(file);
    }, [onSourceImageChange]);

    const handlePaste = useCallback(() => {
        if (urlInput.trim()) {
            onSourceImageChange(urlInput.trim());
            setUrlInput('');
        }
    }, [urlInput, onSourceImageChange]);

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Mode Tabs */}
            <div className="flex border-b border-slate-100">
                {tabs.map(tab => (
                    <button key={tab.mode} onClick={() => onModeChange(tab.mode)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all border-b-2
                            ${mode === tab.mode ? 'text-red-600 border-red-500 bg-red-50/40' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50'}`}>
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="p-4">
                <p className="text-[11px] text-slate-400 font-medium mb-3">
                    {tabs.find(t => t.mode === mode)?.desc}
                </p>

                {mode === 'image' && (
                    <div className="space-y-3">
                        {sourceImage ? (
                            <div className="relative group">
                                <img src={sourceImage} alt="源图片" className="w-full rounded-xl border border-slate-200 object-cover max-h-52" />
                                <button onClick={() => onSourceImageChange(null)}
                                    className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <div onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-red-300 hover:bg-red-50/30 transition-all group">
                                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2 group-hover:text-red-400 transition-colors" />
                                <p className="text-sm font-medium text-slate-500">拖拽图片到这里或点击上传</p>
                                <p className="text-[10px] text-slate-400 mt-1">支持 JPG, PNG, WebP</p>
                            </div>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />

                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Link className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                                    placeholder="或粘贴图片 URL..."
                                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all" />
                            </div>
                            <button onClick={handlePaste} disabled={!urlInput.trim()}
                                className="px-3 py-2 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-40 transition-all">
                                导入
                            </button>
                        </div>
                    </div>
                )}

                {mode === 'text' && (
                    <textarea value={textContent} onChange={e => onTextContentChange(e.target.value)}
                        rows={6} placeholder="粘贴笔记文案内容...\n\nAI 将从文案中提炼核心卖点和视觉元素，自动生成图片描述 Prompt"
                        className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none transition-all leading-relaxed" />
                )}

                {mode === 'blank' && (
                    <div className="text-center py-6">
                        <Sparkles className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm text-slate-500 font-medium">纯 Prompt 创作模式</p>
                        <p className="text-[11px] text-slate-400 mt-1">在下方输入你的创作描述即可</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SourcePanel;
