import React, { useState } from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';

interface SearchInputProps {
    onSearch: (term: string) => void;
    isLoading: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({ onSearch, isLoading }) => {
    const [term, setTerm] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (term.trim()) {
            onSearch(term);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto my-8">
            <form onSubmit={handleSubmit} className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {isLoading ? (
                        <Loader2 className="h-6 w-6 text-red-500 animate-spin" />
                    ) : (
                        <Search className="h-6 w-6 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                    )}
                </div>
                <input
                    type="text"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    disabled={isLoading}
                    className="block w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl text-lg placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all shadow-sm hover:shadow-md disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="输入赛道，如：抗老、露营、程序员桌搭..."
                />
                <button
                    type="submit"
                    disabled={isLoading || !term.trim()}
                    className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium px-6 rounded-xl transition-all disabled:opacity-50 flex items-center shadow-md"
                >
                    {isLoading ? (
                        <span className="flex items-center">
                            <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                            深度挖掘中...
                        </span>
                    ) : '开始挖掘'}
                </button>
            </form>
            <div className="mt-3 flex items-center justify-center space-x-2">
                <span className="flex items-center text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                    <Sparkles className="w-3 h-3 mr-1" />
                    DeepSeek 驱动
                </span>
                <p className="text-center text-sm text-gray-500">
                    MECE 拆解 · 1000+ 词汇 · 痛点优先
                </p>
            </div>
        </div>
    );
};

export default SearchInput;
