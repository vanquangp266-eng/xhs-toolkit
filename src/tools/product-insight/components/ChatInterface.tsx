import React, { useState, useRef, useEffect } from 'react';
import { Message, Session } from '../types';
import { Send, Bot, User, Loader2, Paperclip, History, Plus, ChevronLeft, Trash2, MessageSquareDashed } from './icons';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string, file?: File) => void;
  isLoading: boolean;
  sessions: Session[];
  currentSessionId: string;
  onNewSession: () => void;
  onSwitchSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading,
  sessions,
  currentSessionId,
  onNewSession,
  onSwitchSession,
  onDeleteSession
}) => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading) return;
    
    onSendMessage(input, selectedFile || undefined);
    setInput('');
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shadow-sm z-10">
        {showHistory ? (
           <div className="flex items-center gap-2">
             <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
               <ChevronLeft size={20} className="text-slate-600" />
             </button>
             <h2 className="text-lg font-semibold text-slate-800">历史记录</h2>
           </div>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowHistory(true)} 
              className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600"
              title="查看历史记录"
            >
              <History size={20} />
            </button>
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-600" />
              产品洞察助手
            </h2>
          </div>
        )}
        
        <button 
          onClick={() => {
            onNewSession();
            setShowHistory(false);
          }}
          className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
          title="新会话"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* History List View */}
        {showHistory ? (
          <div className="h-full overflow-y-auto p-2 space-y-2 bg-slate-50/50">
            {sessions.length === 0 ? (
               <div className="text-center text-slate-400 mt-10">
                 <MessageSquareDashed size={48} className="mx-auto mb-2 opacity-20"/>
                 <p>暂无历史记录</p>
               </div>
            ) : (
              sessions.sort((a,b) => b.lastModified - a.lastModified).map(session => (
                <div 
                  key={session.id}
                  onClick={() => {
                    onSwitchSession(session.id);
                    setShowHistory(false);
                  }}
                  className={`group p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                    session.id === currentSessionId 
                      ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-100' 
                      : 'bg-white border-slate-100 hover:border-indigo-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-medium truncate pr-2 ${session.id === currentSessionId ? 'text-indigo-700' : 'text-slate-700'}`}>
                      {session.name || "未命名会话"}
                    </h3>
                    <button 
                      onClick={(e) => onDeleteSession(session.id, e)}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    {formatTime(session.lastModified)}
                  </p>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Chat View */
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                 <div className="text-center text-slate-400 mt-10 text-sm">
                   开始一个新的对话...
                 </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${
                      msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div
                      className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-100 text-slate-800 rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-sm p-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正在分析产品数据...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
              {selectedFile && (
                <div className="mb-2 flex items-center gap-2 text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full w-fit">
                    <Paperclip size={12} />
                    <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                    <button onClick={() => setSelectedFile(null)} className="ml-1 hover:text-indigo-900">×</button>
                </div>
              )}
              <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-100"
                  title="上传图片或文本文件"
                >
                  <Paperclip size={20} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*, .txt, .md, .csv" 
                  onChange={handleFileChange}
                />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="输入消息..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-full py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && !selectedFile)}
                  className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;