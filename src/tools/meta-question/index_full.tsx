import React, { useState, useMemo, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  Trash2, 
  FileText, 
  Copy, 
  Check, 
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Download,
  AlertTriangle,
  FileDown,
  History,
  Clock,
  X,
  RotateCcw
} from 'lucide-react';
import { analyzeTopics, generateMetaQuestionReport } from './services/geminiService';
import { DimensionCategory, AppStatus, HistoryItem } from './types';
import AnalysisChart from './components/AnalysisChart';
import { ExportButton } from '../../shared/components/ExportButton';
import { exportAsCSV, exportAsMarkdown } from '../../shared/utils/exportUtils';

const SAMPLE_TEXT = `孩子经常顶嘴怎么办
做作业拖拖拉拉
性格太内向，不敢和人打招呼
如何培养孩子的专注力
孩子沉迷手机游戏
不爱吃蔬菜
总是丢三落四
在学校被同学欺负
不愿意分享玩具
晚上不肯睡觉
孩子一说就哭玻璃心
怎么让孩子爱上阅读
青春期叛逆怎么管
孩子写作业老是走神
如何培养孩子的时间观念
二胎家庭两个孩子老打架
孩子胆小怕事怎么办
... (在此粘贴您的数千条选题)`;

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<DimensionCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // State for expanding/collapsing sections
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  // State for tracking which report is generating
  const [generatingReports, setGeneratingReports] = useState<Record<string, boolean>>({});

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('app_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveToHistory = (input: string, res: DimensionCategory[]) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      inputText: input,
      result: res
    };
    const updated = [newItem, ...history].slice(0, 50); // Keep last 50
    setHistory(updated);
    localStorage.setItem('app_history', JSON.stringify(updated));
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setInputText(item.inputText);
    setResult(item.result);
    setStatus(AppStatus.COMPLETED);
    setError(null);
    
    // Expand all categories
    const allExpanded: Record<number, boolean> = {};
    item.result.forEach((_, idx) => allExpanded[idx] = true);
    setExpandedCategories(allExpanded);
    setExpandedQuestions({});
    setShowHistory(false);
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('app_history', JSON.stringify(updated));
  };

  const toggleCategory = (index: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleQuestion = (catIdx: number, qIdx: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent category toggle when clicking question
    const key = `${catIdx}-${qIdx}`;
    setExpandedQuestions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;

    setStatus(AppStatus.ANALYZING);
    setError(null);
    setExpandedCategories({});
    setExpandedQuestions({});

    try {
      const data = await analyzeTopics(inputText);
      setResult(data);
      saveToHistory(inputText, data);
      
      // Auto expand all categories for better initial view
      const allExpanded: Record<number, boolean> = {};
      data.forEach((_, idx) => allExpanded[idx] = true);
      setExpandedCategories(allExpanded);
      setStatus(AppStatus.COMPLETED);
    } catch (err: any) {
      setError(err.message || "发生了意外错误。");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleGenerateReport = async (catIdx: number, qIdx: number, metaQuestion: string, originalTopics: string[], e: React.MouseEvent) => {
    e.stopPropagation();
    const key = `${catIdx}-${qIdx}`;
    
    setGeneratingReports(prev => ({ ...prev, [key]: true }));

    try {
      const report = await generateMetaQuestionReport(metaQuestion, originalTopics);
      
      // Construct Markdown
      const markdownContent = `
# 元问题深度分析报告

## 📌 核心定义
**元问题**：${metaQuestion}
**关联选题数**：${originalTopics.length} 条

---

## 🔍 深度拆解

### 1. 🎯 目标人群 (Target Audience)
${report.targetAudience}

### 2. 📍 发生场景 (Scenario)
${report.scenario}

### 3. 😫 痛点与阻碍 (Pain Points & Obstacles)
${report.painPoints}

### 4. 🌈 期待状态 (Desired Outcome)
${report.desiredOutcome}

---

## 💡 解决方案与干货方向 (Solutions)
${report.solutions}

---

## 📝 原始选题列表 (References)
${originalTopics.map(t => `- ${t}`).join('\n')}
      `.trim();

      // Sanitize filename
      const safeFilename = metaQuestion.replace(/[\\/:*?"<>|]/g, '_').substring(0, 50);
      exportAsMarkdown(markdownContent, `分析报告_${safeFilename}.md`);

    } catch (err) {
      alert("报告生成失败，请稍后重试");
      console.error(err);
    } finally {
      setGeneratingReports(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleCopyResults = () => {
    if (result.length === 0) return;
    
    let textToCopy = "";
    result.forEach(cat => {
      textToCopy += `### ${cat.dimensionName}\n`;
      cat.questions.forEach(q => {
        textToCopy += `- ${q.metaQuestion} (包含 ${q.originalTopics.length} 条选题)\n`;
      });
      textToCopy += `\n`;
    });

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = async () => {
    if (result.length === 0) return;
    await new Promise(resolve => setTimeout(resolve, 50));

    const headers = ['维度', '元问题', '原始选题'];
    const csvRows = [headers.join(',')];

    result.forEach(cat => {
      cat.questions.forEach(q => {
        // If there are original topics, create a row for each
        if (q.originalTopics && q.originalTopics.length > 0) {
           q.originalTopics.forEach(topic => {
             const row = [
               `"${cat.dimensionName.replace(/"/g, '""')}"`,
               `"${q.metaQuestion.replace(/"/g, '""')}"`,
               `"${topic.replace(/"/g, '""')}"`
             ];
             csvRows.push(row.join(','));
           });
        } else {
             // Fallback if empty
             const row = [
               `"${cat.dimensionName.replace(/"/g, '""')}"`,
               `"${q.metaQuestion.replace(/"/g, '""')}"`,
               `""`
             ];
             csvRows.push(row.join(','));
        }
      });
    });

    const csvString = csvRows.join('\n');
    exportAsCSV(csvString, '元问题拆解报告.csv');
  };

  const clearInput = () => {
    setInputText('');
    setStatus(AppStatus.IDLE);
    setResult([]);
    setExpandedCategories({});
    setExpandedQuestions({});
  };

  const fillSample = () => {
    setInputText(SAMPLE_TEXT);
  };

  // Metrics
  const inputLineCount = useMemo(() => {
    return inputText.split('\n').filter(line => line.trim() !== '').length;
  }, [inputText]);

  const totalMetaQuestions = result.reduce((acc, cat) => acc + cat.questions.length, 0);
  const totalOriginalTopics = result.reduce((acc, cat) => 
    acc + cat.questions.reduce((qAcc, q) => qAcc + q.originalTopics.length, 0), 0
  );
  
  const coveragePercentage = inputLineCount > 0 ? Math.round((totalOriginalTopics / inputLineCount) * 100) : 0;
  const isCoverageLow = inputLineCount > 0 && coveragePercentage < 95;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 relative">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">元问题拆解大师</h1>
              <p className="text-xs text-slate-500 font-medium">海量选题归纳与提炼</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <button 
               onClick={() => setShowHistory(true)}
               className="flex items-center space-x-1 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50"
             >
               <History className="h-4 w-4" />
               <span className="hidden sm:inline">历史记录</span>
             </button>
          </div>
        </div>
      </header>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
          <div className="absolute inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
             <div className="flex items-center justify-between p-4 border-b border-slate-100">
               <h2 className="text-lg font-bold text-slate-800 flex items-center">
                 <History className="h-5 w-5 mr-2 text-indigo-600" />
                 历史记录
               </h2>
               <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
                 <X className="h-5 w-5" />
               </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-3">
               {history.length === 0 ? (
                 <div className="text-center py-10 text-slate-400">
                   <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                   <p>暂无历史记录</p>
                 </div>
               ) : (
                 history.map((item) => (
                   <div key={item.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all group">
                     <div className="flex justify-between items-start mb-2">
                       <span className="text-xs font-medium text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">
                         {new Date(item.timestamp).toLocaleString()}
                       </span>
                       <button 
                         onClick={(e) => deleteHistoryItem(e, item.id)}
                         className="text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                         title="删除记录"
                       >
                         <Trash2 className="h-3.5 w-3.5" />
                       </button>
                     </div>
                     <p className="text-sm text-slate-700 line-clamp-2 mb-2 font-mono bg-white p-2 rounded border border-slate-100 text-xs">
                       {item.inputText.slice(0, 80)}...
                     </p>
                     <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-slate-500">
                           <span className="font-semibold text-indigo-600">{item.result.reduce((acc, c) => acc + c.questions.length, 0)}</span> 个元问题
                        </div>
                        <button 
                          onClick={() => loadHistoryItem(item)}
                          className="flex items-center space-x-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>恢复</span>
                        </button>
                     </div>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Intro Section */}
        <section className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-4">
            挖掘<span className="text-indigo-600">核心痛点</span>
          </h2>
          <p className="text-lg text-slate-600">
            粘贴数千条原始选题。我们将为您智能提炼出约50个结构化的“元问题”，并支持查看每个元问题涵盖的原始选题。
          </p>
        </section>

        {/* Input Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-1 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-4 py-2">
            <div className="flex items-center space-x-2 text-sm text-slate-600 font-medium">
              <FileText className="h-4 w-4" />
              <span>原始输入数据</span>
              {inputLineCount > 0 && (
                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs">
                  {inputLineCount} 条
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={fillSample}
                className="text-xs px-3 py-1.5 rounded-md text-indigo-600 hover:bg-indigo-50 font-medium transition-colors"
              >
                使用示例
              </button>
              <button 
                onClick={clearInput}
                className="text-xs px-3 py-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-red-500 transition-colors flex items-center space-x-1"
              >
                <Trash2 className="h-3 w-3" />
                <span>清空</span>
              </button>
            </div>
          </div>
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="在此粘贴您的 1000+ 条选题列表..."
              className="w-full h-64 p-4 text-sm font-mono text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y border-none"
              spellCheck={false}
            />
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={status === AppStatus.ANALYZING || !inputText.trim()}
              className={`
                flex items-center space-x-2 px-6 py-2.5 rounded-lg font-semibold text-white transition-all shadow-md
                ${status === AppStatus.ANALYZING || !inputText.trim() 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-95'}
              `}
            >
              {status === AppStatus.ANALYZING ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>深度思考中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>拆解与提炼 (全量覆盖)</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Error State */}
        {status === AppStatus.ERROR && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3 text-red-800">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold">分析失败</h4>
              <p className="text-sm mt-1 opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Results Section */}
        {status === AppStatus.COMPLETED && result.length > 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1 md:col-span-2">
                 <AnalysisChart data={result} />
              </div>
              <div className="col-span-1 space-y-4">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className="relative z-10 w-full px-4">
                      <div className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">提炼成果</div>
                      <div className="flex items-baseline justify-center space-x-2 mb-2">
                        <span className="text-6xl font-extrabold text-indigo-600">{totalMetaQuestions}</span>
                        <span className="text-lg font-medium text-slate-400">个元问题</span>
                      </div>
                      
                      {/* Coverage Stat */}
                      <div className={`text-xs mb-6 inline-flex items-center space-x-1 px-3 py-1 rounded-full border ${isCoverageLow ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                         <span>覆盖 {totalOriginalTopics} / {inputLineCount} ({coveragePercentage}%)</span>
                      </div>
                      
                      {isCoverageLow && (
                        <div className="mb-4 text-xs text-orange-600 flex items-start text-left bg-orange-50 p-2 rounded border border-orange-100">
                           <AlertTriangle className="h-4 w-4 mr-1.5 flex-shrink-0" />
                           <span>部分选题未被归类。这可能是因为单次输出长度限制。建议分批次处理大批量数据。</span>
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        <ExportButton
                          onExport={handleExportCSV}
                          label="导出 CSV 数据"
                          className="w-full justify-center !bg-indigo-600 hover:!bg-indigo-700 !text-white !border-transparent"
                        />
                        
                        <button 
                          onClick={handleCopyResults}
                          className="flex items-center justify-center w-full space-x-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-medium transition-colors"
                        >
                          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                          <span>{copied ? '已复制' : '复制简报'}</span>
                        </button>
                      </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Detailed Categories */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">拆解维度明细</h3>
                <span className="text-sm text-slate-500">点击问题可查看对应原始选题</span>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {result.map((category, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md"
                  >
                    <div 
                      className="px-6 py-4 flex items-center justify-between cursor-pointer bg-slate-50/50 hover:bg-slate-100 transition-colors border-b border-slate-100"
                      onClick={() => toggleCategory(idx)}
                    >
                      <div className="flex items-center space-x-3">
                         <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                           {category.questions.length}
                         </span>
                         <div>
                           <h4 className="text-lg font-semibold text-slate-900">{category.dimensionName}</h4>
                           <p className="text-sm text-slate-500">{category.description}</p>
                         </div>
                      </div>
                      <div className="text-slate-400">
                        {expandedCategories[idx] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </div>
                    </div>
                    
                    {expandedCategories[idx] && (
                      <div className="bg-white animate-in slide-in-from-top-2 duration-300">
                        <ul className="divide-y divide-slate-100">
                          {category.questions.map((q, qIdx) => {
                            const isExpanded = expandedQuestions[`${idx}-${qIdx}`];
                            const isGenerating = generatingReports[`${idx}-${qIdx}`];

                            return (
                              <li key={qIdx} className="group transition-colors">
                                {/* Meta Question Row */}
                                <div 
                                  className="px-6 py-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                                  onClick={(e) => toggleQuestion(idx, qIdx, e)}
                                >
                                  {/* Left side: Dot and Text */}
                                  <div className="flex items-start space-x-3 flex-grow pr-4">
                                    <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full transition-colors ${isExpanded ? 'bg-indigo-600' : 'bg-slate-300 group-hover:bg-indigo-400'}`} />
                                    <div className="flex-grow">
                                      <span className={`text-base leading-relaxed font-medium ${isExpanded ? 'text-indigo-900' : 'text-slate-700'}`}>
                                        {q.metaQuestion}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right side: Actions */}
                                  <div className="flex items-center space-x-3 flex-shrink-0">
                                     {/* Report Generator Button */}
                                     <button
                                       onClick={(e) => handleGenerateReport(idx, qIdx, q.metaQuestion, q.originalTopics, e)}
                                       disabled={isGenerating}
                                       title="生成并下载详细分析报告 (Markdown)"
                                       className={`
                                         p-1.5 rounded-md transition-colors flex items-center space-x-1
                                         ${isGenerating ? 'bg-indigo-50 text-indigo-400 cursor-wait' : 'bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50'}
                                       `}
                                     >
                                       {isGenerating ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                       ) : (
                                          <FileDown className="h-4 w-4" />
                                       )}
                                       <span className="text-xs font-medium hidden sm:inline">
                                         {isGenerating ? '生成中' : '报告'}
                                       </span>
                                     </button>

                                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                       {q.originalTopics.length} 选题
                                     </span>
                                     <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-indigo-500' : ''}`} />
                                  </div>
                                </div>

                                {/* Original Topics List (Expanded) */}
                                {isExpanded && (
                                  <div className="px-6 pb-4 pl-10 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-sm text-slate-600">
                                      <div className="flex items-center space-x-2 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                        <MessageCircle className="h-3 w-3" />
                                        <span>包含的原始选题</span>
                                      </div>
                                      <ul className="list-disc list-inside space-y-1 ml-1 max-h-60 overflow-y-auto custom-scrollbar">
                                        {q.originalTopics.map((topic, tIdx) => (
                                          <li key={tIdx} className="text-slate-500 leading-snug break-words pl-1 marker:text-slate-300">
                                            {topic}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;