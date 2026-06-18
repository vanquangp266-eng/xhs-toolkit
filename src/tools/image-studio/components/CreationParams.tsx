import React from 'react';
import { Palette, Settings, Key, ExternalLink, Server, Eye } from 'lucide-react';
import type { ImageSize, ImageQuality } from '../types';
import { STYLE_PRESETS, SIZE_OPTIONS } from '../constants';
import { getRawImageSettings, saveImageApiConfig, IMAGE_CONFIG_DEFAULTS } from '../../../shared/utils/imageApiConfig';

interface CreationParamsProps {
    prompt: string;
    onPromptChange: (p: string) => void;
    styleId: string;
    onStyleChange: (id: string) => void;
    size: ImageSize;
    onSizeChange: (s: ImageSize) => void;
    quality: ImageQuality;
    onQualityChange: (q: ImageQuality) => void;
    isLoading: boolean;
    canGenerate?: boolean;
    onGenerate: () => void;
}

const CreationParams: React.FC<CreationParamsProps> = ({
    prompt, onPromptChange, styleId, onStyleChange,
    size, onSizeChange, quality, onQualityChange,
    isLoading, canGenerate = Boolean(prompt.trim()), onGenerate,
}) => {
    const [showSettings, setShowSettings] = React.useState(false);

    // 从共享配置读取（与桌面工作台 localStorage key 一致）
    const [settings, setSettings] = React.useState(() => getRawImageSettings());

    const updateField = (field: string, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const saveSettings = () => {
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
        setShowSettings(false);
    };

    const hasKey = settings.imageKeys.trim().length > 0;

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1 bg-red-50 rounded-md">
                        <Palette className="w-3.5 h-3.5 text-red-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">二创参数</span>
                    {hasKey && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                            Key 已配置
                        </span>
                    )}
                </div>
                <button onClick={() => setShowSettings(!showSettings)}
                    className={`p-1.5 rounded-lg transition-all ${showSettings ? 'bg-red-50 text-red-500' : 'text-slate-400 hover:bg-slate-50'}`}>
                    <Settings className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Settings Panel — 复用桌面工作台的完整配置 */}
            {showSettings && (
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
                    {/* Image API 配置 */}
                    <div className="space-y-2">
                        <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                            <Palette className="w-3 h-3" /> GPT Image 2 做图引擎
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-1">
                                <Key className="w-3 h-3" /> API Key（支持多key逗号分隔轮换）
                            </label>
                            <input type="password" value={settings.imageKeys} onChange={e => updateField('imageKeys', e.target.value)}
                                placeholder="sk-xxx,sk-yyy（多个key逗号分隔）"
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-red-400" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-1">
                                <Server className="w-3 h-3" /> API 地址
                            </label>
                            <input value={settings.imageBase} onChange={e => updateField('imageBase', e.target.value)}
                                placeholder={IMAGE_CONFIG_DEFAULTS.IMAGE_API_BASE}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-red-400" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mb-1">
                                <ExternalLink className="w-3 h-3" /> 模型
                            </label>
                            <input value={settings.imageModel} onChange={e => updateField('imageModel', e.target.value)}
                                placeholder={IMAGE_CONFIG_DEFAULTS.IMAGE_MODEL}
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-red-400" />
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
                            <Eye className="w-3 h-3" /> Poe (识图专用副教练)
                        </div>
                        <input type="password" value={settings.poeKey} onChange={e => updateField('poeKey', e.target.value)}
                            placeholder="Poe API Key (sk-poe-...)"
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400" />
                        <input value={settings.poeBase} onChange={e => updateField('poeBase', e.target.value)}
                            placeholder={IMAGE_CONFIG_DEFAULTS.POE_API_BASE}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400" />
                        <input value={settings.poeModel} onChange={e => updateField('poeModel', e.target.value)}
                            placeholder={IMAGE_CONFIG_DEFAULTS.POE_VISION_MODEL}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-400" />
                    </div>

                    <button onClick={saveSettings}
                        className="w-full py-2 text-xs font-bold text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                        保存设置
                    </button>
                </div>
            )}

            <div className="p-4 space-y-4">
                {/* Prompt */}
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">创作描述 Prompt</label>
                    <textarea value={prompt} onChange={e => onPromptChange(e.target.value)}
                        rows={3} placeholder="描述你想要的图片效果...\n例如：一杯精致的拿铁咖啡，旁边摆放着产品，窗边自然光"
                        className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none transition-all leading-relaxed" />
                </div>

                {/* Style Presets */}
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">风格预设</label>
                    <div className="flex flex-wrap gap-1.5">
                        {STYLE_PRESETS.map(preset => (
                            <button key={preset.id} onClick={() => onStyleChange(preset.id)}
                                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border transition-all
                                    ${styleId === preset.id
                                        ? 'bg-red-50 border-red-300 text-red-700 ring-2 ring-red-100'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                                {preset.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Size & Quality */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">尺寸</label>
                        <select value={size} onChange={e => onSizeChange(e.target.value as ImageSize)}
                            className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-400 cursor-pointer">
                            {SIZE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label} ({opt.ratio})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">品质</label>
                        <select value={quality} onChange={e => onQualityChange(e.target.value as ImageQuality)}
                            className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-red-400 cursor-pointer">
                            <option value="standard">标准</option>
                            <option value="hd">高清 HD</option>
                        </select>
                    </div>
                </div>

                {/* Generate Button */}
                <button onClick={onGenerate} disabled={isLoading || !canGenerate}
                    className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg
                        ${isLoading
                            ? 'bg-slate-200 text-slate-500 cursor-wait shadow-none'
                            : 'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 shadow-red-500/20 hover:shadow-red-500/30'}`}>
                    {isLoading ? (
                        <><span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> AI 生成中...</>
                    ) : (
                        <><Palette className="w-4 h-4" /> 🎨 一键二创</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default CreationParams;
