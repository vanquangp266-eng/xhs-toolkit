import { StylePreset, ImageSize } from './types';

export const STYLE_PRESETS: StylePreset[] = [
    { id: 'xiaohongshu', name: '小红书种草风', prompt: '小红书风格，明亮温暖的色调，精致的产品摆拍，带有生活感的场景，柔和自然光，高质量摄影', color: 'text-red-500' },
    { id: 'minimal', name: '极简白底', prompt: '极简主义白色背景，干净利落的产品展示，专业商业摄影，高对比度，无杂物', color: 'text-slate-500' },
    { id: 'scene', name: '场景化', prompt: '精心布置的生活场景，温馨自然的氛围，故事感构图，暖色调，有层次的背景', color: 'text-amber-500' },
    { id: 'premium', name: '高级质感', prompt: '高端奢华风格，深色背景，戏剧化打光，精致材质细节，杂志级摄影品质', color: 'text-purple-500' },
    { id: 'flat', name: '扁平插画', prompt: '现代扁平插画风格，鲜艳配色，简洁图形元素，适合信息图和教程类笔记', color: 'text-blue-500' },
    { id: 'retro', name: '复古胶片', prompt: '胶片摄影风格，略带颗粒感，偏暖色调，怀旧氛围，自然随性的构图', color: 'text-orange-500' },
    { id: 'custom', name: '自定义', prompt: '', color: 'text-emerald-500' },
];

export const SIZE_OPTIONS: { value: ImageSize; label: string; ratio: string }[] = [
    { value: '1024x1024', label: '正方形', ratio: '1:1' },
    { value: '1024x1365', label: '小红书竖图', ratio: '3:4' },
    { value: '1024x1536', label: '长竖版', ratio: '2:3' },
    { value: '1536x1024', label: '横版', ratio: '3:2' },
];

export const LABEL_MAP = {
    product: { text: '产品图', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    style: { text: '风格参考', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    material: { text: '素材', color: 'bg-amber-100 text-amber-700 border-amber-200' },
} as const;
