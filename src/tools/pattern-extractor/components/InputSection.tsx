import React from 'react';
import { DomainType } from '../types';
import { Upload, Trash2 } from 'lucide-react';

interface InputSectionProps {
    rawInput: string;
    setRawInput: (val: string) => void;
    domain: DomainType;
    setDomain: (val: DomainType) => void;
    isProcessing: boolean;
    onClear: () => void;
}

const InputSection: React.FC<InputSectionProps> = ({
    rawInput, setRawInput, domain, setDomain, isProcessing, onClear
}) => {

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setRawInput(text);
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const lineCount = rawInput.trim() ? rawInput.trim().split('\n').length : 0;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-800">1. 输入标题</h2>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${lineCount > 1000 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                    {lineCount} 行
                </span>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">选择领域</label>
                <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value as DomainType)}
                    disabled={isProcessing}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    {Object.values(DomainType).map((d) => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
            </div>

            <div className="flex-1 relative mb-4">
                <textarea
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    disabled={isProcessing}
                    className="w-full h-full min-h-[200px] p-4 bg-slate-50 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    placeholder={`粘贴你的标题列表，每行一个。\n\n示例：\n孩子拖延如何应对？\n35岁，我用一张纸拯救了我们的亲子时光`}
                />
                {rawInput && !isProcessing && (
                    <button
                        onClick={onClear}
                        className="absolute top-2 right-2 p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-500 rounded-md transition"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="relative">
                    <input
                        type="file"
                        accept=".txt,.csv"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isProcessing}
                    />
                    <button
                        type="button"
                        className={`flex items-center space-x-2 text-sm font-medium ${isProcessing ? 'text-slate-300' : 'text-indigo-600 hover:text-indigo-700'}`}
                    >
                        <Upload size={16} />
                        <span>导入文件</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InputSection;
