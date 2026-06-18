import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Plus, Trash2, GripVertical } from 'lucide-react';
import { IMPORT_TEMPLATES } from '../constants';
import type { BatchItem } from '../types';

interface ImportPanelProps {
    items: BatchItem[];
    onItemsChange: (items: BatchItem[]) => void;
    onImportLinkedAssets?: () => void;
    hasLinkedAssets?: boolean;
}

const ImportPanel: React.FC<ImportPanelProps> = ({ items, onItemsChange, onImportLinkedAssets, hasLinkedAssets = false }) => {
    const [textInput, setTextInput] = useState('');
    const [singlePrompt, setSinglePrompt] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseAndAdd = (text: string) => {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        // Skip CSV header if present
        const startIdx = lines[0]?.toLowerCase().startsWith('prompt') ? 1 : 0;
        const newItems: BatchItem[] = lines.slice(startIdx).map(line => ({
            id: crypto.randomUUID(),
            prompt: line.split(',')[0]?.trim() || line,
            status: 'pending' as const,
        }));
        if (newItems.length > 0) {
            onItemsChange([...items, ...newItems]);
            setTextInput('');
        }
    };

    const addSingle = () => {
        if (!singlePrompt.trim()) return;
        onItemsChange([...items, { id: crypto.randomUUID(), prompt: singlePrompt.trim(), status: 'pending' }]);
        setSinglePrompt('');
    };

    const removeItem = (id: string) => onItemsChange(items.filter(i => i.id !== id));
    const clearAll = () => onItemsChange([]);
    const updatePrompt = (id: string, prompt: string) =>
        onItemsChange(items.map(i => i.id === id ? { ...i, prompt } : i));

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => parseAndAdd(reader.result as string);
        reader.readAsText(file);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1 bg-orange-50 rounded-md">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-orange-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Prompt 列表</span>
                    <span className="text-[10px] font-bold text-white bg-slate-400 px-1.5 py-0.5 rounded-full">{items.length}</span>
                </div>
                {items.length > 0 && (
                    <button onClick={clearAll} className="text-[10px] font-medium text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                        <Trash2 className="w-3 h-3" /> 清空
                    </button>
                )}
            </div>

            <div className="p-4 space-y-3">
                {/* Quick add single */}
                <div className="flex gap-2">
                    <input value={singlePrompt} onChange={e => setSinglePrompt(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSingle()}
                        placeholder="输入单条 Prompt，回车添加"
                        className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all" />
                    <button onClick={addSingle} disabled={!singlePrompt.trim()}
                        className="px-3 py-2 text-xs font-semibold bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 disabled:opacity-40 transition-all">
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>

                {onImportLinkedAssets && (
                    <button
                        onClick={onImportLinkedAssets}
                        disabled={!hasLinkedAssets}
                        className="w-full py-2 text-xs font-semibold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                    >
                        <Plus className="w-3 h-3" /> 从全局资产生成 3 条作图 Prompt
                    </button>
                )}

                {/* Batch import */}
                <div className="space-y-2">
                    <textarea value={textInput} onChange={e => setTextInput(e.target.value)}
                        rows={4} placeholder={IMPORT_TEMPLATES[0].example}
                        className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none transition-all font-mono leading-relaxed" />
                    <div className="flex gap-2">
                        <button onClick={() => parseAndAdd(textInput)} disabled={!textInput.trim()}
                            className="flex-1 py-2 text-xs font-semibold bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5">
                            <Plus className="w-3 h-3" /> 批量导入
                        </button>
                        <button onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all flex items-center gap-1.5">
                            <Upload className="w-3 h-3" /> 导入文件
                        </button>
                    </div>
                </div>
                <input ref={fileInputRef} type="file" accept=".txt,.csv" onChange={handleFileUpload} className="hidden" />

                {/* Item list */}
                {items.length > 0 && (
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {items.map((item, idx) => (
                            <div key={item.id} className={`flex items-start gap-2 p-2.5 rounded-xl border transition-all text-xs
                                ${item.status === 'success' ? 'bg-emerald-50/50 border-emerald-200' :
                                  item.status === 'error' ? 'bg-red-50/50 border-red-200' :
                                  item.status === 'generating' ? 'bg-blue-50/50 border-blue-200' :
                                  'bg-slate-50/50 border-slate-200/80'}`}>
                                <span className="text-[10px] font-bold text-slate-400 mt-0.5 w-5 text-center flex-shrink-0">{idx + 1}</span>
                                <input value={item.prompt} onChange={e => updatePrompt(item.id, e.target.value)}
                                    disabled={item.status !== 'pending'}
                                    className="flex-1 bg-transparent outline-none text-slate-700 font-medium disabled:text-slate-500" />
                                {item.status === 'pending' && (
                                    <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                                {item.status === 'generating' && (
                                    <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
                                )}
                                {item.status === 'success' && <span className="text-emerald-500 flex-shrink-0">✓</span>}
                                {item.status === 'error' && <span className="text-red-400 flex-shrink-0" title={item.error}>✗</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImportPanel;
