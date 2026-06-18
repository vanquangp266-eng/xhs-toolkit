import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalStore } from '../../shared/store/globalStore';
import { 
    LayoutDashboard, 
    Search, 
    Lightbulb, 
    BrainCircuit, 
    PenTool, 
    Wand2, 
    BarChart2, 
    FileText, 
    Database, 
    Sparkles, 
    Zap,
    CheckCircle2,
    ArrowRight,
    Compass,
    Hammer,
    Rocket,
    AlertCircle
} from 'lucide-react';
import { ToolHeader } from '../../shared/components/ToolHeader';

interface StageCardProps {
    title: string;
    icon: React.ElementType;
    path: string;
    description: string;
    status: 'ready' | 'pending' | 'none';
    statusText?: string;
}

const StageCard: React.FC<StageCardProps> = ({ title, icon: Icon, path, description, status, statusText }) => {
    const navigate = useNavigate();
    
    return (
        <div 
            onClick={() => navigate(path)}
            className={`
                relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 group
                ${status === 'ready' 
                    ? 'bg-white border-green-500 shadow-[0_8px_30px_rgba(34,197,94,0.12)] hover:shadow-[0_8px_30px_rgba(34,197,94,0.2)]' 
                    : status === 'pending'
                        ? 'bg-white border-amber-400 shadow-md hover:shadow-lg'
                        : 'bg-white/60 border-slate-200 hover:border-indigo-300 hover:bg-white shadow-sm'
                }
            `}
        >
            <div className="flex items-start justify-between mb-3">
                <div className={`
                    p-3 rounded-xl transition-colors
                    ${status === 'ready' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'}
                `}>
                    <Icon className="w-6 h-6" />
                </div>
                {status === 'ready' && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        已就绪
                    </div>
                )}
            </div>
            
            <h3 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-indigo-600 transition-colors">{title}</h3>
            <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 min-h-[36px]">{description}</p>

            {statusText && status === 'ready' && (
                <div className="mt-4 pt-3 border-t border-slate-100/80">
                    <p className="text-[11px] font-medium text-slate-600 truncate bg-slate-50 px-2 py-1.5 rounded-md border border-slate-100">
                        <span className="text-green-600 font-bold mr-1">内容:</span>
                        {statusText}
                    </p>
                </div>
            )}
        </div>
    );
};

const Dashboard = () => {
    const { currentPainPoint, currentPersona, currentProductContext, currentPattern, currentTitle } = useGlobalStore();

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans relative">
            {/* Background elements */}
            <div className="fixed top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none z-0"></div>
            
            <div className="relative z-10">
                <ToolHeader
                    icon={LayoutDashboard}
                    iconBgClass="bg-slate-800"
                    title="全局生产"
                    titleHighlight="中控台"
                    subtitle="Industrial Production Control Center · 全局资产流转监控"
                />

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
                    {/* Overall Status Banner */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-xl font-extrabold text-slate-800 mb-2 flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-indigo-500" />
                                工业化流水线监控
                            </h2>
                            <p className="text-sm text-slate-500 font-medium">当前应用状态：监控各车间生产要素是否就绪，就绪后可一键进入终端总装。</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="text-center px-6 py-2 border-r border-slate-100">
                                <div className="text-3xl font-black text-slate-800 mb-1">
                                    {[currentPainPoint, currentPersona, currentProductContext, currentPattern, currentTitle].filter(Boolean).length}
                                    <span className="text-sm text-slate-400 font-medium ml-1">/ 5</span>
                                </div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">已备资产</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-12 relative">


                        {/* STAGE 1 */}
                        <section className="relative">
                            <div className="flex items-center gap-3 mb-6 bg-slate-50 inline-flex px-4 py-2 rounded-xl border border-slate-200">
                                <Compass className="w-5 h-5 text-red-500" />
                                <h2 className="text-lg font-bold text-slate-800">一车间：市场与受众洞察</h2>
                                <span className="text-xs font-semibold bg-white text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">调研挖掘</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <StageCard 
                                    title="关键词挖掘机" 
                                    icon={Search} 
                                    path="/keyword-miner" 
                                    description="挖掘细分赛道长尾词、痛点与痒点。可输出全局痛点。"
                                    status={currentPainPoint ? 'ready' : 'none'}
                                    statusText={currentPainPoint || undefined}
                                />
                                <StageCard 
                                    title="元问题挖掘" 
                                    icon={BrainCircuit} 
                                    path="/meta-question" 
                                    description="基于大流量词，挖掘用户底层的终极诉求（元问题）。"
                                    status="none"
                                />
                            </div>
                        </section>


                        {/* STAGE 2 */}
                        <section className="relative">
                            <div className="flex items-center gap-3 mb-6 bg-yellow-50 inline-flex px-4 py-2 rounded-xl border border-yellow-200">
                                <Lightbulb className="w-5 h-5 text-yellow-500" />
                                <h2 className="text-lg font-bold text-slate-800">二车间：产品与人设中台</h2>
                                <span className="text-xs font-semibold bg-white text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">品牌资产构建</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <StageCard 
                                    title="产品全案洞察仪" 
                                    icon={Lightbulb} 
                                    path="/product-insight" 
                                    description="输入产品基本信息，AI深度洞察产品战略与卖点。可输出全局产品背景。"
                                    status={currentProductContext ? 'ready' : 'none'}
                                    statusText={currentProductContext || undefined}
                                />
                                <StageCard 
                                    title="提示词大师" 
                                    icon={PenTool} 
                                    path="/prompt-architect" 
                                    description="针对红书生态定制的高级写作提示词。可输出全局人设。"
                                    status={currentPersona ? 'ready' : 'none'}
                                    statusText={currentPersona ? '已缓存人设模型' : undefined}
                                />
                            </div>
                        </section>


                        {/* STAGE 3 */}
                        <section className="relative">
                            <div className="flex items-center gap-3 mb-6 bg-slate-50 inline-flex px-4 py-2 rounded-xl border border-slate-200">
                                <Hammer className="w-5 h-5 text-indigo-500" />
                                <h2 className="text-lg font-bold text-slate-800">三车间：爆款基因逆向</h2>
                                <span className="text-xs font-semibold bg-white text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">内核与组件解析</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StageCard 
                                    title="链路提取器" 
                                    icon={Wand2} 
                                    path="/pattern-extractor" 
                                    description="批量提炼爆款笔记的行文结构与标题句式。可输出全局句式。"
                                    status={currentPattern ? 'ready' : 'none'}
                                    statusText={currentPattern || undefined}
                                />
                                <StageCard 
                                    title="结构分析" 
                                    icon={BarChart2} 
                                    path="/structure-analyzer" 
                                    description="拆解对标账号的矩阵结构与选题比例。"
                                    status="none"
                                />
                                <StageCard 
                                    title="文案拆解" 
                                    icon={FileText} 
                                    path="/copy-analyzer" 
                                    description="深度逐句分析爆款文案的情绪调动与诱导点。"
                                    status="none"
                                />
                            </div>
                        </section>


                        {/* STAGE 4 */}
                        <section className="relative">
                            <div className="flex items-center gap-3 mb-6 bg-blue-50 inline-flex px-4 py-2 rounded-xl border border-blue-200 shadow-sm">
                                <Rocket className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-extrabold text-blue-900">四车间：智能终端总装</h2>
                                <span className="text-xs font-semibold bg-white text-blue-600 px-2 py-0.5 rounded-md border border-blue-100 shadow-sm">生成引擎</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StageCard 
                                    title="标题生成器" 
                                    icon={Zap} 
                                    path="/title-generator" 
                                    description="基于元话题批量生成S级爆款标题。可输出全局标题。"
                                    status={currentTitle ? 'ready' : 'none'}
                                    statusText={currentTitle || undefined}
                                />
                                <StageCard 
                                    title="SEO 赛道大师 (NEW)" 
                                    icon={Database} 
                                    path="/seo-master" 
                                    description="读取全局资产，批量裂变生成【流量/搜准/转化】三型笔记矩阵大库。"
                                    status="pending"
                                    statusText="强大的矩阵生成终端"
                                />
                                <StageCard 
                                    title="万能文案引擎" 
                                    icon={Sparkles} 
                                    path="/copy-generator" 
                                    description="一键聚合所有全局资产，结合AI大模型输出可直接发布的完美爆款笔记。"
                                    status="pending"
                                    statusText="单篇精修终端"
                                />
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
