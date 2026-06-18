import React from 'react';
import { Copy, Check, GitFork, Send } from 'lucide-react';
import { CategoryKey, CATEGORY_LABELS, CategoryData } from '../types';
import { useGlobalStore } from '../../../shared/store/globalStore';

interface KeywordGroupProps {
    categoryKey: CategoryKey;
    data: CategoryData;
}

const KeywordGroup: React.FC<KeywordGroupProps> = ({ categoryKey, data }) => {
    const [copied, setCopied] = React.useState(false);
    const info = CATEGORY_LABELS[categoryKey];

    const allKeywords = data?.groups?.flatMap(g => g.items) || [];

    const handleCopy = () => {
        const textToCopy = data.groups.map(g => `【${g.groupName}】\n${g.items.join('\n')}`).join('\n\n');
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!data || !data.groups || data.groups.length === 0) return null;

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md flex-shrink-0">
            <div className={`px-4 py-3 border-b flex items-center justify-between ${info.color.split(' ')[0]}`}>
                <div className="flex-1">
                    <h3 className={`font-bold text-base ${info.color.split(' ')[1]}`}>{info.label}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 opacity-80 line-clamp-1">{info.desc}</p>
                </div>
                <div className="flex items-center space-x-2 ml-2">
                    <span className="text-xs font-semibold bg-white/50 px-2 py-1 rounded-full text-gray-600">
                        {allKeywords.length}
                    </span>
                    <button
                        onClick={handleCopy}
                        className="p-1.5 hover:bg-white/50 rounded-lg transition-colors text-gray-600"
                        title="复制所有关键词 (带分组)"
                    >
                        {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    </button>
                </div>
            </div>

            <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100 text-xs text-gray-500 flex items-start gap-1.5">
                <GitFork size={12} className="mt-0.5 flex-shrink-0 text-gray-400" />
                <span><span className="font-medium text-gray-600">拆解逻辑：</span>{data.logic}</span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto max-h-[450px] bg-white space-y-5">
                {data.groups.map((group, groupIdx) => (
                    <div key={groupIdx}>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2"></span>
                            {group.groupName}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {group.items.map((kw, idx) => (
                                <div key={idx} className="group relative flex items-center">
                                    <span
                                        className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-gray-50 text-gray-700 border border-gray-100 transition-colors cursor-default select-all pr-8"
                                    >
                                        {kw}
                                    </span>
                                    <button 
                                        onClick={() => useGlobalStore.getState().setPainPoint(kw)}
                                        className="absolute right-1 opacity-0 group-hover:opacity-100 p-1 bg-white hover:bg-indigo-50 hover:text-indigo-600 text-gray-400 rounded transition-all shadow-sm border border-gray-200 z-10"
                                        title="发送至全局中枢 (作为痛点)"
                                    >
                                        <Send size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KeywordGroup;
