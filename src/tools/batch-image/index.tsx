import React, { useCallback, useRef } from 'react';
import { Layers, Sparkles } from 'lucide-react';
import { ToolHeader } from '../../shared/components/ToolHeader';
import ImportPanel from './components/ImportPanel';
import BatchConfigPanel from './components/BatchConfigPanel';
import ResultsGrid from './components/ResultsGrid';
import { runBatchGeneration } from './services/batchService';
import type { BatchItem } from './types';
import { useGlobalStore } from '../../shared/store/globalStore';
import { buildBatchPromptsFromContext, hasLinkedImageAssets } from '../../shared/utils/imagePromptLinker';
import { useImageJobStore } from '../../shared/store/imageJobStore';
import { imageHistoryDb } from '../../shared/utils/imageHistoryDb';

const BatchImage: React.FC = () => {
    const globalAssets = useGlobalStore();
    const {
        batchItems: items,
        batchConfig: config,
        batchIsRunning: isRunning,
        batchStartedAt,
        batchHistory,
        setBatchItems: setItems,
        setBatchConfig: setConfig,
        updateBatchItem,
        setBatchRunning,
        addBatchHistory,
        clearBatchHistory,
    } = useImageJobStore();
    const abortRef = useRef({ aborted: false });

    const pendingCount = items.filter(i => i.status === 'pending').length;
    const doneCount = items.filter(i => i.status === 'success' || i.status === 'error').length;
    const errorCount = items.filter(i => i.status === 'error').length;

    const handleProgress = useCallback((id: string, update: Partial<BatchItem>) => {
        updateBatchItem(id, update);
    }, [updateBatchItem]);

    const handleImportLinkedAssets = useCallback(() => {
        const prompts = buildBatchPromptsFromContext(globalAssets);
        if (prompts.length === 0) return;

        const linkedItems = prompts.map(prompt => ({
            id: crypto.randomUUID(),
            prompt,
            status: 'pending' as const,
        }));
        setItems(prev => [...prev, ...linkedItems]);
    }, [globalAssets]);

    const handleStart = useCallback(async () => {
        if (pendingCount === 0) return;
        abortRef.current = { aborted: false };
        setBatchRunning(true, Date.now());

        await runBatchGeneration(
            items,
            config.style,
            config.size,
            config.quality,
            config.concurrency,
            handleProgress,
            abortRef.current
        );

        const finalItems = useImageJobStore.getState().batchItems;
        imageHistoryDb.saveBatchItems(finalItems).catch(error => console.warn('Failed to save batch image history:', error));
        addBatchHistory(finalItems, config);
        setBatchRunning(false);
    }, [items, config, pendingCount, handleProgress, setBatchRunning, addBatchHistory]);

    const handleStop = useCallback(() => {
        abortRef.current.aborted = true;
        setBatchRunning(false);
    }, [setBatchRunning]);

    return (
        <div className="min-h-screen bg-transparent text-slate-900 pb-12">
            <ToolHeader
                icon={Layers}
                iconBgClass="bg-gradient-to-br from-indigo-500 to-purple-600"
                title="批量图片"
                titleHighlight="生成器"
                subtitle="Batch Studio · 全局资产批量作图"
                rightContent={
                    <div className="text-[11px] font-medium tracking-wide text-indigo-600 bg-indigo-50/80 px-3 py-1.5 rounded-full border border-indigo-100/50 hidden sm:flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        联动提示词矩阵
                    </div>
                }
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                    <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                        <div className="space-y-2 mb-2 px-1">
                            <h1 className="text-3xl font-black text-slate-800 leading-tight tracking-tight">
                                批量图片<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">矩阵化</span> 生成引擎
                            </h1>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                从全局产品、痛点、人设、标题和正文自动生成封面/场景/转化三类图片 Prompt。
                            </p>
                        </div>

                        <ImportPanel
                            items={items}
                            onItemsChange={setItems}
                            onImportLinkedAssets={handleImportLinkedAssets}
                            hasLinkedAssets={hasLinkedImageAssets(globalAssets)}
                        />

                        <BatchConfigPanel
                            config={config}
                            onConfigChange={setConfig}
                            itemCount={pendingCount}
                            isRunning={isRunning}
                            startedAt={batchStartedAt}
                            onStart={handleStart}
                            onStop={handleStop}
                            progress={{ done: doneCount, total: items.length, errors: errorCount }}
                        />
                    </div>

                    <div className="lg:col-span-7 xl:col-span-8">
                        <ResultsGrid items={items} />
                        {batchHistory.length > 0 && (
                            <div className="mt-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700">批量作图历史 ({batchHistory.length})</span>
                                    <button
                                        onClick={() => {
                                            if (confirm('确定清空批量作图历史吗？')) clearBatchHistory();
                                        }}
                                        className="text-[10px] font-medium text-slate-400 hover:text-red-500"
                                    >
                                        清空
                                    </button>
                                </div>
                                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto custom-scrollbar">
                                    {batchHistory.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setItems(item.items);
                                                setConfig(item.config);
                                            }}
                                            className="text-left p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
                                        >
                                            <div className="text-xs text-slate-400 mb-1">{new Date(item.timestamp).toLocaleString()} · {item.items.filter(i => i.status === 'success').length} 张成功</div>
                                            <div className="text-sm font-semibold text-slate-700 line-clamp-2">{item.items[0]?.prompt || '批量作图记录'}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BatchImage;
