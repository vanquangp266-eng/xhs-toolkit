import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Paperclip, X, FileText, CheckCircle2, ArrowRight, Loader2, Image as ImageIcon } from 'lucide-react';
import { UserInput, ChatMessage } from '../types';
import { extractInfoFromContext } from '../services/geminiService';

interface SmartAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: Partial<UserInput>) => void;
}

const SmartAssistant: React.FC<SmartAssistantProps> = ({ isOpen, onClose, onApply }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '你好！我是你的 AI 助手。你可以直接告诉我你想写什么，或者上传产品资料（PDF、图片、文档），我会帮你自动提取信息填表。',
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAnalyzing]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // remove data:.*;base64,
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedFile) || isAnalyzing) return;

    const userMsgId = Date.now().toString();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: inputText,
      file: selectedFile ? { name: selectedFile.name, type: selectedFile.type } : undefined
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setIsAnalyzing(true);
    
    // Process file if exists
    let fileBase64 = undefined;
    let mimeType = undefined;

    if (selectedFile) {
        try {
            fileBase64 = await fileToBase64(selectedFile);
            mimeType = selectedFile.type;
        } catch (e) {
            console.error("File read error", e);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: "文件读取失败，请重试。"
            }]);
            setIsAnalyzing(false);
            setSelectedFile(null);
            return;
        }
    }
    
    const currentFile = selectedFile; // Capture for closure
    setSelectedFile(null); // Clear input immediately

    try {
      const result = await extractInfoFromContext(newUserMsg.text, fileBase64, mimeType);
      
      const botMsgId = (Date.now() + 1).toString();
      
      // Check if any data was actually extracted (non-empty strings)
      const hasData = Object.values(result.extractedData).some(val => val && val.trim().length > 0);

      const newBotMsg: ChatMessage = {
        id: botMsgId,
        role: 'model',
        text: result.conversationalResponse,
        extractedData: hasData ? result.extractedData : undefined
      };

      setMessages(prev => [...prev, newBotMsg]);

    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "抱歉，分析过程中出现了错误，请稍后重试。"
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyData = (data: Partial<UserInput>) => {
    onApply(data);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[80] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Modal/Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-[90] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">AI 智能助手</h2>
              <p className="text-xs text-slate-500">上传资料，自动提取填表</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] space-y-2`}>
                
                {/* Message Bubble */}
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                }`}>
                   {/* File attachment indicator in message */}
                   {msg.file && (
                     <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20">
                       <FileText size={16} />
                       <span className="font-medium truncate max-w-[200px]">{msg.file.name}</span>
                     </div>
                   )}
                   <div className="whitespace-pre-wrap">{msg.text || (msg.file ? "上传了文件" : "")}</div>
                </div>

                {/* Extracted Data Card */}
                {msg.extractedData && (
                  <div className="bg-white border border-indigo-100 rounded-xl p-4 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-2 mb-3 text-indigo-600 font-medium text-sm">
                      <CheckCircle2 size={16} />
                      <span>识别到以下信息：</span>
                    </div>
                    <div className="space-y-2 mb-4">
                      {msg.extractedData.productName && (
                        <div className="text-xs flex gap-2">
                          <span className="text-slate-400 min-w-[60px]">产品名称:</span>
                          <span className="text-slate-700 font-medium truncate">{msg.extractedData.productName}</span>
                        </div>
                      )}
                      {msg.extractedData.roleName && (
                        <div className="text-xs flex gap-2">
                          <span className="text-slate-400 min-w-[60px]">角色身份:</span>
                          <span className="text-slate-700 font-medium truncate">{msg.extractedData.roleName}</span>
                        </div>
                      )}
                       {msg.extractedData.productFeatures && (
                        <div className="text-xs flex gap-2">
                          <span className="text-slate-400 min-w-[60px]">产品详情:</span>
                          <span className="text-slate-700 truncate line-clamp-1">{msg.extractedData.productFeatures.substring(0, 30)}...</span>
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleApplyData(msg.extractedData!)}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 rounded-lg text-xs font-bold transition-colors"
                    >
                      <span>填入表单</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isAnalyzing && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 size={16} className="animate-spin text-indigo-500" />
                <span>正在分析内容...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          
          {selectedFile && (
            <div className="flex items-center justify-between bg-slate-100 px-3 py-2 rounded-lg mb-3 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                {selectedFile.type.startsWith('image') ? <ImageIcon size={16} /> : <FileText size={16} />}
                <span className="truncate max-w-[200px]">{selectedFile.name}</span>
              </div>
              <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors mb-[2px]"
              title="上传文件 (支持图片、PDF、文档)"
            >
              <Paperclip size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".txt,.md,.json,.pdf,image/png,image/jpeg,image/webp"
            />
            
            <div className="flex-grow relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入描述，或上传资料..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 resize-none max-h-32"
                rows={1}
                style={{ minHeight: '46px' }}
              />
            </div>
            
            <button 
              onClick={handleSend}
              disabled={(!inputText.trim() && !selectedFile) || isAnalyzing}
              className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-200 mb-[2px]"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SmartAssistant;