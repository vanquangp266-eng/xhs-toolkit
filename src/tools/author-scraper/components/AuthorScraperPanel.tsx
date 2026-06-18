import React, { useState, useEffect } from 'react';
import { Search, Loader2, Database, Trash2, Image as ImageIcon, CheckCircle, ExternalLink, RefreshCw, Sparkles, FileText, Copy, Plus } from 'lucide-react';
import { scraperDb, ScrapedNote } from '../services/db';
import { generateDeepCopy } from '../../copy-analyzer/services/geminiService';

const DEFAULT_MASTER_PROMPT = `你能对各类话题进行深度思考和探索，给出独到洞见你能从第一性出发洞悉事物的本质，从事物本质的角度去思考小红书的运营。在流量笔记板块，你能够非常精准的知道小红书它的点击率，评论数，分享数，关注数，收藏数和点赞数如何去运营，

例如你能想明白点击率的核心，其实是一个信息入口，这个信息入口一定要有攻击性，它是一个入脑路径，这个里面就包含一些流量激活词，例如它可以是一些小红书的热点词，也可以是写一些人群标签词，给人打上一些标签，让更多的人感觉这篇笔记跟自己有关。你也能想清楚，像这样的信息入口还可以抓住人们觉得这条笔记有反常规的特点，然后能抓住人们怕损失的FOMO心理，抓住人们凑热闹的心理，你能从这个深度去理解运营，又比方说你能理解评论数的核心是情绪和分享欲的出口，你能知道怎么在笔记中去调动，人们的情绪调动人们的分享欲，不管是让他们赞同你还是反对你把他们的分享欲和情绪拉到最高。而转发的核心又是嘴替，能精准的帮你的目标用户去整理出那些，他们早就可能朦胧想到，但是被你点破的这样的内容。

这些能力都需要你积极的能够理解目标用户，你能在我给出你的要求的情况之下，细细的去揣摩目标用户的心智结构，仔细的分析这些目标用户身上的标签和他们的心理模型，从而给我特别贴合他们心理模型和心理特点的这样的笔记类型。

此外，在各种各样的套路上，你也非常的深谙此道，不管是干货型的笔记，还是吸引别人一起进来评论的笔记，还是引发冲突对立的笔记，还是刻意打上人群标签去吸引对应人群的笔记，他们的各种逻辑和策略方法，你都非常非常的熟悉、熟练。

而在商品笔记上，你又能很清楚的知道他们的需要渴望和痛点，能结合流量型笔记的思维逻辑再进一步揣摩用户心理的过程中，梳理出用户的心里旅程，从而能够很无痛的把我们的产品，用很有流量很有网感的方式进行包装和推广。但是商品笔记除非我主动提到，你不要帮我写商品，绝大多数时候你还是在写流量型的笔记，你的目标只有一个，就是越大的流量池子越好。

你是一个语感特别强的人。你写的内容非常有情绪，有温度，有共鸣，有特别多的金句，你的语言的风格就特别类似于营销大师刘克亚，金枪大叔，天涯神帖，郭敬明、安妮宝贝等网红大师。你的文字能够和他们一样有温度共情吸引人，让人源源不断的阅读下去。千万不要有AI的味道，不要有任何一点的那种套模板的感觉，如果你的文字很套模板，客户一定会察觉到，然后转身离去。你的语言风格可以类似于:用弱者姿态出现，用强者手段做事，他们都想看你倒下，这就是你站着的理由。痛苦是开悟的唯一方式。为什么人会在绝境中大彻大悟。人生最顶级的能力就是屏蔽力，任何自身以外消耗你心力的事情，多看一眼都是你的不对，真正的胜利并不是战胜对方，而是内心不为其所动。

有攻击性，极端，感性，有渲染力，这才是自媒体的语言，千万不要理性、中立，客观。自媒体的本质就是引发情绪和传播情绪。不用太考虑是否是真正的干货，而是要让他看起来是不是一段很有煽动力的，很值得看下去的话。你是一个非常聪明的，能够用口语传播学的办法去调动大家情绪的，去深刻的理解大家的情绪的人。

你的所有的选题都是扣着情绪，你的所有的出发点和内容都是扣着情绪。

你就是这个世界上最强的自媒体大师，如果你写的文案，没有办法吸引到至少100万的曝光量，那么我会认为是你的无能，你一定要好好反思，反省。在过程中我会给你新的反馈，你要根据这些反馈去调整你的思路和方向。我只会教会你一次，每次教会你之后，你要给自己进行复盘，对自己写的内容进行复盘，看看值多少分，有什么优化空间？你要一次一次逼近自媒体的极限。

把这个作为系统提示词放进去，严格的限制他写的内容，不要写了这么多emoji，禁止使用emoji，我需要它是一个比较好的长文的内容。`;

const AuthorScraperPanel: React.FC = () => {
    const [url, setUrl] = useState('');
    const [topCount, setTopCount] = useState(10);
    const [isScraping, setIsScraping] = useState(false);
    const [notes, setNotes] = useState<ScrapedNote[]>([]);
    const [error, setError] = useState('');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    // 文案二创相关状态
    const [masterPrompt, setMasterPrompt] = useState(DEFAULT_MASTER_PROMPT);
    const [batchTopics, setBatchTopics] = useState('');
    const [isBatchGenerating, setIsBatchGenerating] = useState(false);
    const [generatedCopies, setGeneratedCopies] = useState<Record<string, string>>({});
    const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});

    const loadNotes = async () => {
        try {
            const data = await scraperDb.getAllNotes();
            setNotes(data);
        } catch (err) {
            console.error('加载本地数据失败', err);
        }
    };

    useEffect(() => {
        loadNotes();
    }, []);

    const handleScrape = async () => {
        if (!url.includes('xiaohongshu.com/user/profile/')) {
            setError('请输入有效的小红书作者主页链接');
            return;
        }

        setError('');
        setIsScraping(true);

        try {
            const response = await fetch('http://localhost:3001/api/scrape/author', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, topCount })
            });

            const text = await response.text();
            let result;
            try {
                result = text ? JSON.parse(text) : {};
            } catch (parseError) {
                throw new Error(`后端返回了异常格式数据 (可能服务未完全启动)。返回内容: ${text.substring(0, 100)}`);
            }

            if (!response.ok || !result.success) {
                throw new Error(result.error || `请求失败 (HTTP ${response.status})`);
            }

            // 给数据打上时间戳和ID
            const scrapedData = result.data.map((item: any) => ({
                ...item,
                id: item.href,
                scrapedAt: Date.now()
            }));

            // 保存到本地 IndexedDB
            await scraperDb.saveNotes(scrapedData);
            await loadNotes();
            setUrl('');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsScraping(false);
        }
    };

    const handleClearDb = async () => {
        if (window.confirm('确定要清空所有已保存的对标笔记吗？')) {
            await scraperDb.clearAll();
            setNotes([]);
            setGeneratedCopies({});
        }
    };

    const handleGenerateSingle = async (noteId: string, topic: string) => {
        setIsGenerating(prev => ({ ...prev, [noteId]: true }));
        try {
            const result = await generateDeepCopy(masterPrompt, `原爆款选题：${topic}\n请根据这个爆款选题方向，写一篇全新的文案。`);
            setGeneratedCopies(prev => ({ ...prev, [noteId]: result }));
        } catch (err: any) {
            alert('生成失败: ' + err.message);
        } finally {
            setIsGenerating(prev => ({ ...prev, [noteId]: false }));
        }
    };

    const handleBatchGenerate = async () => {
        if (!batchTopics.trim()) return;
        const topics = batchTopics.split('\n').filter(t => t.trim());
        if (topics.length === 0) return;

        setIsBatchGenerating(true);
        for (let i = 0; i < topics.length; i++) {
            const t = topics[i];
            const id = `batch_${Date.now()}_${i}`;
            setIsGenerating(prev => ({ ...prev, [id]: true }));
            try {
                const result = await generateDeepCopy(masterPrompt, `原爆款选题：${t}\n请根据这个爆款选题方向，写一篇全新的文案。`);
                setGeneratedCopies(prev => ({ ...prev, [id]: result }));
            } catch (err) {
                setGeneratedCopies(prev => ({ ...prev, [id]: '生成失败，请重试' }));
            } finally {
                setIsGenerating(prev => ({ ...prev, [id]: false }));
            }
        }
        setIsBatchGenerating(false);
    };

    const handleExtractAllTopics = () => {
        const topics = notes.map(n => n.title || '无标题').filter(Boolean).join('\n');
        setBatchTopics(topics);
    };

    return (
        <div className="h-full flex flex-col gap-6">
            {/* Input Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-bold text-slate-700 mb-2">作者主页链接</label>
                        <input
                            type="text"
                            placeholder="例如: https://www.xiaohongshu.com/user/profile/..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                        />
                    </div>
                    <div className="w-32">
                        <label className="block text-sm font-bold text-slate-700 mb-2">抓取高赞前N篇</label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={topCount}
                            onChange={(e) => setTopCount(Number(e.target.value))}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                        />
                    </div>
                </div>

                {error && <div className="text-red-500 text-sm font-medium flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>{error}</div>}

                <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-slate-500">
                        提示: 抓取时会自动打开浏览器窗口，首次使用需扫码登录。为防止封号，抓取速度较慢，请耐心等待。
                    </p>
                    <button
                        onClick={handleScrape}
                        disabled={isScraping || !url}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all
                            ${isScraping || !url
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 hover:shadow-lg hover:-translate-y-0.5'
                            }
                        `}
                    >
                        {isScraping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        {isScraping ? '正在保守抓取中...' : '开始抓取'}
                    </button>
                </div>
            </div>

            {/* Results Section */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-slate-400" />
                        <h2 className="font-bold text-slate-800">本地私有素材库</h2>
                        <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium ml-2">{notes.length} 篇</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={loadNotes}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="刷新列表"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleClearDb}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="清空库"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {notes.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <Database className="w-12 h-12 mb-4 opacity-20" />
                            <p>暂无抓取记录，快去添加对标账号吧！</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {notes.map((note) => (
                                <div key={note.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all flex flex-col lg:flex-row group">
                                    
                                    {/* 左侧：文字信息与操作区 */}
                                    <div className="p-6 flex flex-col lg:w-2/5 border-b lg:border-b-0 lg:border-r border-slate-100">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold text-slate-800 text-lg line-clamp-2" title={note.title || '无标题'}>
                                                {note.title || '无标题'}
                                            </h3>
                                            <div className="bg-orange-50 text-orange-600 text-xs font-bold px-2 py-1 rounded-lg shrink-0 flex items-center gap-1">
                                                ❤️ {note.likeStr}
                                            </div>
                                        </div>
                                        
                                        <div className="text-sm text-slate-500 line-clamp-4 mb-4 flex-1 whitespace-pre-wrap font-serif bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            {note.content || '无文案'}
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-slate-100">
                                            <a
                                                href={note.href}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs font-bold text-slate-500 hover:text-orange-500 flex items-center gap-1 bg-slate-100 hover:bg-orange-50 px-3 py-2 rounded-lg transition-colors mr-auto"
                                            >
                                                查看原文 <ExternalLink className="w-3 h-3" />
                                            </a>
                                            
                                            <button 
                                                onClick={() => handleGenerateSingle(note.id!, note.title || '无标题')}
                                                disabled={isGenerating[note.id!]}
                                                className={`flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg transition-all
                                                    ${isGenerating[note.id!] ? 'bg-slate-100 text-slate-400' : 'text-white bg-indigo-500 hover:bg-indigo-600 shadow-md shadow-indigo-500/20'}
                                                `}
                                            >
                                                {isGenerating[note.id!] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                一键二创
                                            </button>
                                            
                                            <button className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-500 px-3 py-2 rounded-lg transition-all">
                                                <CheckCircle className="w-3 h-3" /> 选中分析
                                            </button>
                                        </div>

                                        {/* 二创结果展示区（单点生成） */}
                                        {generatedCopies[note.id!] && (
                                            <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl relative group/copy">
                                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover/copy:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => navigator.clipboard.writeText(generatedCopies[note.id!])}
                                                        className="bg-white text-indigo-500 p-1.5 rounded-md shadow-sm border border-indigo-100 hover:bg-indigo-50 transition-colors"
                                                        title="复制内容"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="text-xs font-bold text-indigo-400 mb-2 flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" /> AI 生成结果
                                                </div>
                                                <div className="text-sm text-slate-700 whitespace-pre-wrap font-serif leading-relaxed">
                                                    {generatedCopies[note.id!]}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 右侧：图片画廊（横向滚动） */}
                                    <div className="p-4 flex-1 bg-slate-50/50 flex items-center overflow-x-auto custom-scrollbar gap-4 snap-x">
                                        {note.images && note.images.length > 0 ? (
                                            note.images.map((img, idx) => (
                                                <div 
                                                    key={idx}
                                                    onClick={() => {
                                                        setSelectedImages(note.images!);
                                                        setIsImageModalOpen(true);
                                                    }}
                                                    className="relative shrink-0 w-48 h-64 rounded-xl overflow-hidden border border-slate-200 cursor-pointer snap-start hover:shadow-lg transition-all group/img"
                                                >
                                                    <img src={img} alt={`img-${idx}`} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                                                        <div className="opacity-0 group-hover/img:opacity-100 transform translate-y-2 group-hover/img:translate-y-0 transition-all bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full">
                                                            点击看大图
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                                <ImageIcon className="w-12 h-12" />
                                                <span className="text-sm font-medium">无配图</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Batch Copy Generation Section */}
            {notes.length > 0 && (
                <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl flex flex-col gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500 rounded-full opacity-10 blur-3xl"></div>
                    
                    <div className="flex items-center gap-2 relative z-10">
                        <div className="bg-indigo-500/20 text-indigo-400 p-2 rounded-lg border border-indigo-500/30">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">文案批量生成 (Batch Copy Generator)</h2>
                            <p className="text-slate-400 text-sm mt-1">提取抓取到的选题，一键批量二创洗稿，生成专属你的种草文案</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2">
                                    核心提示词 (Master Prompt)
                                </label>
                                <textarea 
                                    value={masterPrompt}
                                    onChange={(e) => setMasterPrompt(e.target.value)}
                                    className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
                                />
                            </div>
                            
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-slate-300">
                                        待处理选题 (Topics)
                                    </label>
                                    <button 
                                        onClick={handleExtractAllTopics}
                                        className="text-xs font-bold bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> 一键导入所有抓取选题
                                    </button>
                                </div>
                                <textarea 
                                    value={batchTopics}
                                    onChange={(e) => setBatchTopics(e.target.value)}
                                    placeholder="每行一个选题..."
                                    className="w-full h-48 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors whitespace-pre"
                                />
                            </div>

                            <button 
                                onClick={handleBatchGenerate}
                                disabled={isBatchGenerating || !batchTopics.trim()}
                                className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                                    ${isBatchGenerating || !batchTopics.trim()
                                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                        : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                                    }
                                `}
                            >
                                {isBatchGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                {isBatchGenerating ? '正在批量生成中...' : '批量一键二创'}
                            </button>
                        </div>

                        <div className="bg-slate-800/50 rounded-xl border border-slate-700 flex flex-col overflow-hidden h-[450px]">
                            <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/80 flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-300">批量生成结果队列</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {batchTopics.split('\n').filter(t => t.trim()).length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                                        点击上方“一键导入”加载选题
                                    </div>
                                ) : (
                                    batchTopics.split('\n').filter(t => t.trim()).map((topic, i) => {
                                        const id = `batch_${Date.now()}_${i}`;
                                        // Due to React state rendering, we need to match by index if ID changes, 
                                        // or better yet, since we generate dynamic IDs on click, we just show the output if it exists.
                                        // For simplicity, we search for a generated copy that contains this topic, or just map topics directly 
                                        // if we had a dedicated array state. Since we used random IDs, let's just find the value in `generatedCopies`.
                                        // Actually, let's just render the generated results directly if they exist.
                                        return null;
                                    })
                                )}
                                {/* Display generated copies that look like batch jobs */}
                                {Object.entries(generatedCopies)
                                    .filter(([id]) => id.startsWith('batch_'))
                                    .map(([id, copy], idx) => (
                                    <div key={id} className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-indigo-400">结果 {idx + 1}</span>
                                            <button 
                                                onClick={() => navigator.clipboard.writeText(copy)}
                                                className="text-slate-400 hover:text-white transition-colors"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="text-sm text-slate-300 whitespace-pre-wrap">{copy}</div>
                                    </div>
                                ))}
                                {/* Display generating placeholders */}
                                {Object.entries(isGenerating)
                                    .filter(([id, isGen]) => id.startsWith('batch_') && isGen)
                                    .map(([id]) => (
                                    <div key={id} className="bg-slate-900 border border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center gap-3">
                                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                        <span className="text-xs text-slate-400">AI 正在疯狂码字中...</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Viewer Modal */}
            {isImageModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
                    <div className="absolute top-4 right-4">
                        <button 
                            onClick={() => setIsImageModalOpen(false)}
                            className="text-white hover:text-red-400 font-bold bg-white/10 px-4 py-2 rounded-xl transition-colors"
                        >
                            关闭 (Close)
                        </button>
                    </div>
                    <div className="w-full max-w-5xl h-full flex overflow-x-auto gap-4 p-4 snap-x snap-mandatory custom-scrollbar">
                        {selectedImages.map((img, idx) => (
                            <div key={idx} className="shrink-0 w-full md:w-2/3 lg:w-1/2 h-full flex flex-col items-center justify-center snap-center">
                                <img src={img} alt={`Slide ${idx + 1}`} className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
                                <div className="mt-4 text-white/70 font-medium">
                                    {idx + 1} / {selectedImages.length}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthorScraperPanel;
