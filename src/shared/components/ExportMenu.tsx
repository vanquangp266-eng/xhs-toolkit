import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, Check, Loader2, FileText, Table } from 'lucide-react';

export interface ExportOption {
    id: string;
    label: string;
    icon?: React.ReactNode;
    onExport: () => Promise<void> | void;
}

interface ExportMenuProps {
    options: ExportOption[];
    defaultLabel?: string;
    className?: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
    options,
    defaultLabel = '导出',
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOptionClick = async (option: ExportOption) => {
        setIsOpen(false);
        if (status === 'loading' || status === 'success') return;
        
        try {
            setStatus('loading');
            await Promise.resolve(option.onExport());
            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (error) {
            console.error('Export failed:', error);
            setStatus('idle');
        }
    };

    const isSuccess = status === 'success';
    const isLoading = status === 'loading';

    return (
        <div className="relative inline-block text-left" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoading}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm
                    ${isSuccess 
                        ? 'bg-green-500 text-white shadow-green-200 shadow-lg border-transparent' 
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}
                    ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}
                    ${className}
                `}
            >
                {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : isSuccess ? (
                    <Check size={16} />
                ) : (
                    <Download size={16} />
                )}
                
                <span className="hidden sm:inline">
                    {isLoading ? '导出中...' : isSuccess ? '已导出' : defaultLabel}
                </span>
                
                {!isLoading && !isSuccess && (
                    <ChevronDown size={14} className="ml-1 opacity-70" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        {options.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => handleOptionClick(option)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                role="menuitem"
                            >
                                {option.icon && (
                                    <span className="mr-3 text-gray-400">
                                        {option.icon}
                                    </span>
                                )}
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
