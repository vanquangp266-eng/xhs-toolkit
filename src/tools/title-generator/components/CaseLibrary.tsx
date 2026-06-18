import React, { useState } from 'react';
import { ViralCase } from '../types';
import { Plus, Trash2, Save, RotateCcw, CheckCircle2 } from 'lucide-react';
import { DEFAULT_CASES } from '../constants';

interface CaseLibraryProps {
    cases: ViralCase[];
    setCases: React.Dispatch<React.SetStateAction<ViralCase[]>>;
}

export const CaseLibrary: React.FC<CaseLibraryProps> = ({ cases, setCases }) => {
    const [newCaseInput, setNewCaseInput] = useState('');
    const [showSavedToast, setShowSavedToast] = useState(false);

    const getCleanCasesFromInput = (input: string) => {
        return input.trim().split(/\s+/).filter(t => t.trim().length > 0);
    };

    const pendingCount = getCleanCasesFromInput(newCaseInput).length;

    const triggerSaveFeedback = () => {
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 2000);
    };

    const handleAdd = () => {
        const rawCases = getCleanCasesFromInput(newCaseInput);

        if (rawCases.length === 0) return;

        const newCasesToAdd: ViralCase[] = rawCases.map(content => ({
            id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
            content: content
        }));

        setCases(prev => [...newCasesToAdd, ...prev]);
        setNewCaseInput('');
        triggerSaveFeedback();
    };

    const handleDelete = (id: string) => {
        setCases(prev => prev.filter(c => c.id !== id));
        triggerSaveFeedback();
    };

    const handleReset = () => {
        if (confirm('确认重置为默认案例库吗？这将清除你自定义的案例。')) {
            setCases(DEFAULT_CASES);
            triggerSaveFeedback();
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* Save Feedback Toast */}
            {showSavedToast && (
                <div className="fixed bottom-10 right-10 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium">已自动保存记忆</span>
                </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Save className="w-5 h-5 text-red-500" />
                    爆款案例库录入
                </h2>
                <p className="text-gray-500 text-sm mb-4">
                    支持批量添加：直接粘贴一段话，系统会自动根据<b>空格</b>或<b>换行</b>将其拆分为多个案例。
                </p>

                <div className="flex flex-col gap-3">
                    <textarea
                        value={newCaseInput}
                        onChange={(e) => setNewCaseInput(e.target.value)}
                        placeholder={`在此处粘贴案例库...
例如：
听劝！别买   谁懂啊家人们
沉浸式护肤   关于我XX的那些事`}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all min-h-[120px] resize-y placeholder:text-gray-400"
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={handleAdd}
                            disabled={pendingCount === 0}
                            className={`
                px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2
                ${pendingCount > 0
                                    ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
                        >
                            <Plus className="w-4 h-4" />
                            批量添加 {pendingCount > 0 && `(${pendingCount})`}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800">
                        现有案例 ({cases.length})
                    </h3>
                    <button
                        onClick={handleReset}
                        className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" /> 重置默认
                    </button>
                </div>

                <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                    {cases.map((item) => (
                        <div
                            key={item.id}
                            className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                        >
                            <span className="text-gray-700 font-medium break-all">{item.content}</span>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
                                title="删除"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {cases.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                            暂无案例，请在上方添加
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
