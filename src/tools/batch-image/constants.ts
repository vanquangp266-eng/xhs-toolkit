import { STYLE_PRESETS, SIZE_OPTIONS } from '../image-studio/constants';
export { STYLE_PRESETS, SIZE_OPTIONS };

export const IMPORT_TEMPLATES = [
    { id: 'simple', name: '简单列表', desc: '每行一个 Prompt', example: '一杯精致的拿铁咖啡，自然光\n极简白底产品图，护肤品\n户外场景，运动鞋特写' },
    { id: 'csv', name: 'CSV 格式', desc: 'prompt,style 两列', example: 'prompt,style\n精致咖啡拍摄,小红书种草风\n白底产品图,极简白底' },
];

export const CONCURRENCY_OPTIONS = [
    { value: 1, label: '单线程 (稳定)' },
    { value: 2, label: '2 并发' },
    { value: 3, label: '3 并发 (快速)' },
];
