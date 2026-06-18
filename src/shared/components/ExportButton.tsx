import React, { useState } from 'react';
import { Download, Check, Loader2, LucideIcon } from 'lucide-react';

interface ExportButtonProps {
    onExport: () => Promise<void> | void;
    label?: string;
    icon?: LucideIcon;
    className?: string;
    loadingLabel?: string;
    successLabel?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
    onExport,
    label = '导出',
    icon: Icon = Download,
    className = '',
    loadingLabel = '导出中...',
    successLabel = '已导出'
}) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const handleClick = async () => {
        if (status === 'loading' || status === 'success') return;
        
        try {
            setStatus('loading');
            await Promise.resolve(onExport());
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
        <button
            onClick={handleClick}
            disabled={isLoading}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm
                ${isSuccess 
                    ? 'bg-green-500 text-white shadow-green-200 shadow-lg border-transparent' 
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-red-600'}
                ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}
                ${className}
            `}
            title={label}
        >
            {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
            ) : isSuccess ? (
                <Check size={16} />
            ) : (
                <Icon size={16} />
            )}
            
            <span className="hidden sm:inline">
                {isLoading ? loadingLabel : isSuccess ? successLabel : label}
            </span>
        </button>
    );
};
