import React, { useState } from 'react';
import { Plus, Sparkles, Loader2 } from 'lucide-react';

interface ExpansionPanelProps {
    onExpand: (direction?: string) => void;
    isExpanding: boolean;
}

const ExpansionPanel: React.FC<ExpansionPanelProps> = ({ onExpand, isExpanding }) => {
    const [direction, setDirection] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onExpand(direction);
        setDirection('');
    };

    return (
        <div className="mt-12 bg-gradient-to-br from-white to-red-50/50 rounded-2xl border border-red-100 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="bg-red-100 p-1.5 rounded-lg text-red-600">
                            <Sparkles size={18} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">继续扩展赛道</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                        觉得不够？点一下自动挖掘未被覆盖的蓝海领域，或者输入你想深挖的具体方向。
                    </p>
                </div>

                <div className="w-full md:w-auto flex-shrink-0">
                    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={direction}
                            onChange={(e) => setDirection(e.target.value)}
                            placeholder="输入特定扩展方向 (可选)..."
                            disabled={isExpanding}
                            className="flex-1 min-w-[240px] px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-50 transition-all disabled:bg-gray-50"
                        />
                        <button
                            type="submit"
                            disabled={isExpanding}
                            className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-all shadow-sm flex items-center justify-center min-w-[120px]"
                        >
                            {isExpanding ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    挖掘中
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    {direction ? '定向扩展' : '自动扩展'}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ExpansionPanel;
