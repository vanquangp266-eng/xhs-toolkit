import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface ToolHeaderProps {
    icon: LucideIcon;
    iconColorClass?: string;
    iconBgClass?: string;
    title: string;
    titleHighlight?: string;
    subtitle?: string;
    rightContent?: React.ReactNode;
    badgeText?: string;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({
    icon: Icon,
    iconColorClass = 'text-white',
    iconBgClass = 'bg-slate-800',
    title,
    titleHighlight,
    subtitle = 'Xiaohongshu Industrial Engine',
    rightContent,
    badgeText
}) => {
    // If iconColorClass doesn't have a specific text color but has white, 
    // we try to extract a complementary color for the highlight, otherwise fallback to indigo
    const highlightColorClass = iconBgClass.includes('bg-') 
        ? iconBgClass.replace('bg-', 'text-').split(' ')[0] 
        : 'text-slate-800';

    return (
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className={`${iconBgClass} p-1.5 rounded-lg shadow-sm flex items-center justify-center`}>
                        <Icon className={`${iconColorClass} w-5 h-5`} strokeWidth={2.5} />
                    </div>
                    <div className="flex items-center">
                        <h1 className="text-[17px] font-bold text-slate-900 tracking-tight flex items-center">
                            {title}
                            {titleHighlight && (
                                <span className={`ml-1 ${highlightColorClass}`}>
                                    {titleHighlight}
                                </span>
                            )}
                            {badgeText && (
                                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wider ml-2">
                                    {badgeText}
                                </span>
                            )}
                        </h1>
                    </div>
                    
                    <div className="hidden sm:flex items-center gap-3 ml-4 pl-4 border-l border-slate-200/60">
                         <span className="text-[11px] font-medium text-slate-400 tracking-wide">{subtitle}</span>
                    </div>
                </div>
                
                <div className="flex items-center space-x-3">
                    {rightContent}
                </div>
            </div>
        </header>
    );
};
