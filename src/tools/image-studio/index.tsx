import React, { useState, useCallback, useEffect } from 'react';
import { Camera, Sparkles } from 'lucide-react';
import { ToolHeader } from '../../shared/components/ToolHeader';
import SourcePanel from './components/SourcePanel';
import ReferenceUpload from './components/ReferenceUpload';
import CreationParams from './components/CreationParams';
import ResultDisplay from './components/ResultDisplay';
import HistoryGrid from './components/HistoryGrid';
import { generateImage } from './services/imageService';
import { STYLE_PRESETS } from './constants';
import type { SourceMode, ImageSize, ImageQuality, ReferenceImage, GeneratedImage, GenerationStatus } from './types';
import { useGlobalStore } from '../../shared/store/globalStore';
import { buildLinkedImagePrompt, hasLinkedImageAssets } from '../../shared/utils/imagePromptLinker';
import { useImageJobStore } from '../../shared/store/imageJobStore';
import { imageHistoryDb } from '../../shared/utils/imageHistoryDb';

const ImageStudio: React.FC = () => {
    const globalAssets = useGlobalStore();
    const { currentCopy } = globalAssets;

    const [sourceMode, setSourceMode] = useState<SourceMode>(currentCopy ? 'text' : 'blank');
    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [textContent, setTextContent] = useState(currentCopy || '');
    const [refImages, setRefImages] = useState<ReferenceImage[]>([]);
    const [prompt, setPrompt] = useState('');
    const [styleId, setStyleId] = useState('xiaohongshu');
    const [size, setSize] = useState<ImageSize>('1024x1024');
    const [quality, setQuality] = useState<ImageQuality>('standard');
    const {
        studioStatus: status,
        studioResult: result,
        studioError: error,
        studioStartedAt,
        studioHistory: history,
        setStudioJob,
        setStudioHistory,
        addStudioHistory,
        clearStudioHistory,
    } = useImageJobStore();

    useEffect(() => {
        imageHistoryDb.listStudioImages()
            .then(items => {
                if (items.length > 0) setStudioHistory(items);
            })
            .catch(error => console.warn('Failed to load image history:', error));
    }, [setStudioHistory]);

    useEffect(() => {
        if (currentCopy) {
            setSourceMode('text');
            setTextContent(currentCopy);
        }
    }, [currentCopy]);

    const addRefImages = useCallback((imgs: ReferenceImage[]) => {
        setRefImages(prev => [...prev, ...imgs].slice(0, 6));
    }, []);

    const removeRefImage = useCallback((id: string) => {
        setRefImages(prev => {
            const removed = prev.find(i => i.id === id);
            if (removed) URL.revokeObjectURL(removed.preview);
            return prev.filter(i => i.id !== id);
        });
    }, []);

    const changeRefLabel = useCallback((id: string, label: ReferenceImage['label']) => {
        setRefImages(prev => prev.map(i => i.id === id ? { ...i, label } : i));
    }, []);

    const handleGenerate = useCallback(async () => {
        const canGenerate = prompt.trim() || textContent.trim() || hasLinkedImageAssets(globalAssets);
        if (!canGenerate && sourceMode !== 'image') return;

        setStudioJob({ studioStatus: 'loading', studioError: null, studioStartedAt: Date.now() });

        try {
            const stylePreset = STYLE_PRESETS.find(s => s.id === styleId);
            const effectivePrompt = buildLinkedImagePrompt({
                userPrompt: prompt,
                sourceText: sourceMode === 'text' ? textContent : '',
                stylePrompt: stylePreset?.prompt || '',
                assets: globalAssets,
            });

            const generated = await generateImage({
                mode: sourceMode,
                prompt: effectivePrompt,
                sourceImage: sourceMode === 'image' ? sourceImage || undefined : undefined,
                referenceImages: refImages,
                style: '',
                size,
                quality,
            });

            setStudioJob({ studioResult: generated, studioStatus: 'success', studioStartedAt: null });
            addStudioHistory(generated);
            imageHistoryDb.saveStudioImage(generated).catch(error => console.warn('Failed to save image history:', error));
        } catch (err: any) {
            setStudioJob({ studioError: err.message || '鐢熸垚澶辫触', studioStatus: 'error', studioStartedAt: null });
        }
    }, [prompt, sourceMode, textContent, sourceImage, refImages, styleId, size, quality, globalAssets, setStudioJob, addStudioHistory]);

    const handleSelectHistory = useCallback((item: GeneratedImage) => {
        setStudioJob({ studioResult: item, studioStatus: 'success', studioError: null });
    }, [setStudioJob]);

    const handleUseAsSource = useCallback((url: string) => {
        setSourceMode('image');
        setSourceImage(url);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleClearHistory = useCallback(() => {
        if (confirm('确定要清空所有生成历史吗？')) {
            clearStudioHistory();
            imageHistoryDb.clearStudioImages().catch(error => console.warn('Failed to clear image history:', error));
        }
    }, [clearStudioHistory]);

    const canGenerate = Boolean(prompt.trim() || textContent.trim() || hasLinkedImageAssets(globalAssets) || sourceImage);

    return (
        <div className="min-h-screen bg-transparent text-slate-900 pb-12">
            <ToolHeader
                icon={Camera}
                iconBgClass="bg-gradient-to-br from-rose-500 to-pink-600"
                title="笔记图片"
                titleHighlight="工作台"
                subtitle="Image Studio · 全局资产联动作图"
                rightContent={
                    <div className="text-[11px] font-medium tracking-wide text-rose-600 bg-rose-50/80 px-3 py-1.5 rounded-full border border-rose-100/50 hidden sm:flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        GPT Image + DeepSeek 提示词增强
                    </div>
                }
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                    <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                        <div className="space-y-2 mb-2 px-1">
                            <h1 className="text-3xl font-black text-slate-800 leading-tight tracking-tight">
                                笔记图片<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500">联动生成</span> 工作台
                            </h1>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                自动读取产品、痛点、人设、标题和正文资产，再用 DeepSeek 优化提示词后生成图片。
                            </p>
                        </div>

                        <SourcePanel
                            mode={sourceMode}
                            onModeChange={setSourceMode}
                            sourceImage={sourceImage}
                            onSourceImageChange={setSourceImage}
                            textContent={textContent}
                            onTextContentChange={setTextContent}
                        />

                        <ReferenceUpload
                            images={refImages}
                            onAdd={addRefImages}
                            onRemove={removeRefImage}
                            onLabelChange={changeRefLabel}
                        />

                        <CreationParams
                            prompt={prompt}
                            onPromptChange={setPrompt}
                            styleId={styleId}
                            onStyleChange={setStyleId}
                            size={size}
                            onSizeChange={setSize}
                            quality={quality}
                            onQualityChange={setQuality}
                            isLoading={status === 'loading'}
                            canGenerate={canGenerate}
                            onGenerate={handleGenerate}
                        />
                    </div>

                    <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                        <ResultDisplay
                            status={status}
                            result={result}
                            error={error}
                            startedAt={studioStartedAt}
                            onRetry={handleGenerate}
                            onUseAsSource={handleUseAsSource}
                        />
                        <HistoryGrid
                            history={history}
                            onSelect={handleSelectHistory}
                            onClear={handleClearHistory}
                            currentId={result?.id}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ImageStudio;

