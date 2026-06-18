import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import ReportView from './components/ReportView';
import { generateReport } from './services/geminiService';
import { ReportData, Message, Session } from './types';
import { Loader2, Compass } from 'lucide-react';
import { ToolHeader } from '../../shared/components/ToolHeader';

const STORAGE_KEY = 'product_insight_sessions_v1';

const createNewSession = (): Session => ({
    id: Date.now().toString(),
    name: '新产品构想',
    lastModified: Date.now(),
    messages: [{
        id: 'welcome',
        role: 'model',
        content: '你好！我是你的产品洞察架构师。请告诉我关于你产品的构想、功能、目标受众，或者上传相关简介，我将为你生成一份全面的背景报告。',
        timestamp: Date.now()
    }],
    reportData: null
});

const ProductInsight: React.FC = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    // Initialize from LocalStorage or create default
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setSessions(parsed);
                    setCurrentSessionId(parsed[0].id);
                    return;
                }
            } catch (e) {
                console.error("Failed to load sessions", e);
            }
        }
        const newSession = createNewSession();
        setSessions([newSession]);
        setCurrentSessionId(newSession.id);
    }, []);

    // Save to LocalStorage whenever sessions change
    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        }
    }, [sessions]);

    const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];

    const handleCreateSession = () => {
        const newSession = createNewSession();
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
    };

    const handleSwitchSession = (id: string) => {
        setCurrentSessionId(id);
    };

    const handleDeleteSession = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const confirmDelete = window.confirm("确定要删除这个产品报告记录吗？此操作无法撤销。");
        if (!confirmDelete) return;

        setSessions(prev => {
            const filtered = prev.filter(s => s.id !== id);
            if (filtered.length === 0) {
                const newS = createNewSession();
                setCurrentSessionId(newS.id);
                return [newS];
            }
            if (id === currentSessionId) {
                setCurrentSessionId(filtered[0].id);
            }
            return filtered;
        });
    };

    const handleSendMessage = async (text: string, file?: File) => {
        if (!currentSession) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text + (file ? `\n[文件已上传: ${file.name}]` : ''),
            timestamp: Date.now()
        };

        // Optimistic update for UI
        setSessions(prev => prev.map(s =>
            s.id === currentSessionId
                ? { ...s, messages: [...s.messages, newMessage], lastModified: Date.now() }
                : s
        ));

        setIsLoading(true);

        try {
            let imagePart;
            let processedText = text;

            if (file) {
                if (file.type.startsWith('image/')) {
                    const base64 = await fileToBase64(file);
                    imagePart = {
                        inlineData: {
                            data: base64,
                            mimeType: file.type
                        }
                    };
                } else {
                    const textContent = await file.text();
                    processedText = `${text}\n\n文件内容 (${file.name}):\n${textContent}`;
                }
            }

            // Generate report using Gemini
            const newReportData = await generateReport(
                processedText,
                currentSession.reportData || undefined,
                imagePart
            );

            const botResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                content: currentSession.reportData
                    ? "我已经根据您的反馈更新了报告，请查看变更。"
                    : "报告已生成！您可以在右侧查看详情。如有需要，随时可以要求调整。",
                timestamp: Date.now()
            };

            // Update session with new report and bot message
            setSessions(prev => prev.map(s =>
                s.id === currentSessionId
                    ? {
                        ...s,
                        messages: [...s.messages, botResponse],
                        reportData: newReportData,
                        name: newReportData.productName !== "未指定产品" ? newReportData.productName : s.name,
                        lastModified: Date.now()
                    }
                    : s
            ));

        } catch (error) {
            console.error(error);
            setSessions(prev => prev.map(s =>
                s.id === currentSessionId
                    ? {
                        ...s,
                        messages: [...s.messages, {
                            id: Date.now().toString(),
                            role: 'model',
                            content: "生成报告时遇到错误，请重试或提供更详细的信息。",
                            timestamp: Date.now()
                        }],
                        lastModified: Date.now()
                    }
                    : s
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Safe render check
    if (!currentSession) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
            <ToolHeader
                icon={Compass}
                iconBgClass="bg-teal-600"
                title="产品全案"
                titleHighlight="洞察仪"
                subtitle="一键生成产品金字塔 · AI 交互推演"
            />
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar / Chat Area */}
                <div className="w-[400px] flex-shrink-0 h-full z-10 shadow-xl border-r border-slate-200">
                    <ChatInterface
                        messages={currentSession.messages}
                        onSendMessage={handleSendMessage}
                        isLoading={isLoading}
                        sessions={sessions}
                        currentSessionId={currentSessionId}
                        onNewSession={handleCreateSession}
                        onSwitchSession={handleSwitchSession}
                        onDeleteSession={handleDeleteSession}
                    />
                </div>

                {/* Main Content / Report Area */}
                <div className="flex-1 h-full relative bg-slate-100">
                    {isLoading && !currentSession.reportData && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50">
                            <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
                            <p className="text-slate-600 font-medium">正在构建您的产品洞察...</p>
                            <p className="text-slate-400 text-sm mt-2">这可能需要一点时间，请稍候。</p>
                        </div>
                    )}
                    <ReportView data={currentSession.reportData} />
                </div>
            </div>
        </div>
    );
};

export default ProductInsight;
