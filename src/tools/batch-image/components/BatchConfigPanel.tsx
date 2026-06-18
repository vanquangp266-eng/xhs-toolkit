import React from 'react';
import { Settings, Palette, Key, Server, ExternalLink, Eye } from 'lucide-react';
import type { BatchConfig } from '../types';
import { STYLE_PRESETS, SIZE_OPTIONS, CONCURRENCY_OPTIONS } from '../constants';
import { getRawImageSettings, saveImageApiConfig, IMAGE_CONFIG_DEFAULTS } from '../../../shared/utils/imageApiConfig';

interface BatchConfigPanelProps {
    config: BatchConfig;
    onConfigChange: (c: BatchConfig) => void;
    itemCount: number;
    isRunning: boolean;
    startedAt?: number | null;
    onStart: () => void;
    onStop: () => void;
    progress: { done: number; total: number; errors: number };
}

const BatchConfigPanel: React.FC<BatchConfigPanelProps> = ({
    config, onConfigChange, itemCount, isRunning, startedAt, onStart, onStop, progress
}) => {
    const [, forceTick] = React.useState(0);
    const [showApi, setShowApi] = React.useState(false);
    const [settings, setSettings] = React.useState(() => getRawImageSettings());

    const updateField = (field: string, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const saveKey = () => {
        saveImageApiConfig({
            imageBase: settings.imageBase,
            imageKeys: settings.imageKeys,
            imageModel: settings.imageModel,
            dsBase: settings.dsBase,
            dsKey: settings.dsKey,
            poeBase: settings.poeBase,
            poeKey: settings.poeKey,
            poeModel: settings.poeModel,
        });
        setShowApi(false);
    };

    const hasKey = settings.imageKeys.trim().length > 0;
    const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
    React.useEffect(() => {
        if (!isRunning) return;
        const timer = window.setInterval(() => forceTick(v => v + 1), 1000);
        return () => window.clearInterval(timer);
    }, [isRunning]);

    const elapsed = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
    const timePct = isRunning ? Math.min(98, Math.round((elapsed / 120) * 100)) : pct;

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1 bg-indigo-50 rounded-md"><Settings className="w-3.5 h-3.5 text-indigo-500" /></div>
                    <span className="text-xs font-bold text-slate-700">批量配置</span>
                    {hasKey && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                            Key 已配置
                        </span>
                    )}
                </div>
                <button onClick={() => setShowApi(!showApi)}
                    className={`p-1.5 rounded-lg transition-all ${showApi ? 'bg-indigo-50 text-indigo-500' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <Key className="w-3.5 h-3.5" />
                </button>
            </div>

            {showApi && (
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
                    {/* Image API 配置 */}
                    <div className="space-y-2">
                        <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1">
                            <Palette className="w-3 h-3" /> GPT Image 2 做图引擎
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-1">
                                <Key className="w-3 h-3" /> API Key（多key逗号分隔轮换）
                            </label>
                            <input type="password" value={settings.imageKeys} onChange={e => updateField('imageKeys', e.target.value)}
                                placeholder="sk-xxx,sk-yyy"
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-1">
                                <Server className="w-3 h-3" /> API 地址
                            </label>
                            <input value={settings.imageBase} onChange={e => updateField('imageBase', e.target.value)}
                                placeholder={IMAGE_CONFIG_DEFAULTS.IMAGE_API_BASE}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-1">
                                <ExternalLink className="w-3 h-3" /> 模型
                            </label>
                            <input value={settings.imageModel} onChange={e => updateField('imageModel', e.target.value)}
                                placeholder={IMAGE_CONFIG_DEFAULTS.IMAGE_MODEL}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400" />
                        </div>
                    </div>

                    {/* DeepSeek 配置 */}
                    <div className="space-y-2 pt-2 border-t border-slate-200/60">
                        <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> DeepSeek (AI教练)
                        </div>
                        <input type="password" value={settings.dsKey} onChange={e => updateField('dsKey', e.target.value)}
                            placeholder="DeepSeek API Key"
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400" />
                        <input value={settings.dsBase} onChange={e => updateField('dsBase', e.target.value)}
                            placeholder={IMAGE_CONFIG_DEFAULTS.DEEPSEEK_API_BASE}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-400" />
                    </div>

                    {/* Poe 配置 */}
                    <div className="space-y-2 pt-2 border-t border-slate-200/60">
                        <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                            <Eye className="w-3 h-3" /> Poe (识图专用)
                        </div>
                        <input type="password" value={settings.poeKey} onChange={e => updateField('poeKey', e.target.value)}
                            placeholder="sk-poe-..."
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400" />
                        <input value={settings.poeBase} onChange={e => updateField('poeBase', e.target.value)}
                            placeholder={IMAGE_CONFIG_DEFAULTS.POE_API_BASE}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400" />
                        <input value={settings.poeModel} onChange={e => updateField('poeModel', e.target.value)}
                            placeholder={IMAGE_CONFIG_DEFAULTS.POE_VISION_MODEL}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400" />
                    </div>

                    <button onClick={saveKey} className="w-full py-2 text-xs font-bold text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                        保存设置
                    </button>
                </div>
            )}

            <div className="p-4 space-y-4">
                {/* Style */}
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">统一风格</label>
                    <div className="flex flex-wrap gap-1.5">
                        {STYLE_PRESETS.map(p => (
                            <button key={p.id} onClick={() => onConfigChange({ ...config, style: p.prompt })}
                                className={`px-2 py-1 text-[10px] font-semibold rounded-lg border transition-all
                                    ${config.style === p.prompt ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-1 ring-indigo-100' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                {p.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Size + Quality + Concurrency */}
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">尺寸</label>
                        <select value={config.size} onChange={e => onConfigChange({ ...config, size: e.target.value as any })}
                            className="w-full px-2 py-1.5 text-[10px] font-medium bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer">
                            {SIZE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">品质</label>
                        <select value={config.quality} onChange={e => onConfigChange({ ...config, quality: e.target.value as any })}
                            className="w-full px-2 py-1.5 text-[10px] font-medium bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer">
                            <option value="standard">标准</option>
                            <option value="hd">HD</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">并发</label>
                        <select value={config.concurrency} onChange={e => onConfigChange({ ...config, concurrency: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 text-[10px] font-medium bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer">
                            {CONCURRENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* Progress */}
                {isRunning && (
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-medium">
                            <span className="text-slate-500">进度 {progress.done}/{progress.total}</span>
                            <span className="text-indigo-600">{timePct}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${timePct}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">作图计时 {elapsed}s / 120s，切换工具页不会打断后台任务</p>
                        {progress.errors > 0 && (
                            <p className="text-[10px] text-red-500 font-medium">{progress.errors} 个失败</p>
                        )}
                    </div>
                )}

                {/* Action Button */}
                {isRunning ? (
                    <button onClick={onStop}
                        className="w-full py-3 rounded-xl text-sm font-bold bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all flex items-center justify-center gap-2">
                        ⏹ 停止生成
                    </button>
                ) : (
                    <button onClick={onStart} disabled={itemCount === 0}
                        className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:shadow-none transition-all flex items-center justify-center gap-2">
                        <Palette className="w-4 h-4" /> 🚀 开始批量生成 ({itemCount} 张)
                    </button>
                )}
            </div>
        </div>
    );
};

export default BatchConfigPanel;
