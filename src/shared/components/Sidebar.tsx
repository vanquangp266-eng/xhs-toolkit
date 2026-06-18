import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
    ChevronLeft,
    ChevronRight,
    Compass,
    Hammer,
    Rocket,
    Camera,
    Layers,
    Bot
} from 'lucide-react';

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

const toolGroups = [
    {
        title: '市场与受众洞察',
        icon: Compass,
        color: 'text-red-500',
        bg: 'bg-red-50',
        borderColor: 'border-red-500',
        subtitle: 'Insights',
        tools: [
            { path: '/author-scraper', name: '对标作者爬取', icon: Bot, color: 'text-orange-500' },
            { path: '/keyword-miner', name: '关键词挖掘', icon: Search, color: 'text-red-500' },
            { path: '/meta-question', name: '元问题挖掘', icon: BrainCircuit, color: 'text-purple-500' },
        ]
    },
    {
        title: '产品与人设中台',
        icon: Lightbulb,
        color: 'text-yellow-500',
        bg: 'bg-yellow-50',
        borderColor: 'border-yellow-500',
        subtitle: 'Product & Persona',
        tools: [
            { path: '/product-insight', name: '产品洞察', icon: Lightbulb, color: 'text-yellow-500' },
            { path: '/prompt-architect', name: '提示词大师', icon: PenTool, color: 'text-rose-500' },
        ]
    },
    {
        title: '爆款基因逆向',
        icon: Hammer,
        color: 'text-indigo-500',
        bg: 'bg-indigo-50',
        borderColor: 'border-indigo-500',
        subtitle: 'Pattern Reverse',
        tools: [
            { path: '/pattern-extractor', name: '链路提取器', icon: Wand2, color: 'text-indigo-500' },
            { path: '/structure-analyzer', name: '结构分析', icon: BarChart2, color: 'text-teal-500' },
            { path: '/copy-analyzer', name: '文案拆解', icon: FileText, color: 'text-blue-500' },
        ]
    },
    {
        title: '智能终端总装',
        icon: Rocket,
        color: 'text-blue-500',
        bg: 'bg-blue-50',
        borderColor: 'border-blue-500',
        subtitle: 'Assembly',
        tools: [
            { path: '/seo-master', name: 'SEO 大师', icon: Database, color: 'text-blue-500' },
            { path: '/copy-generator', name: '万能文案引擎', icon: Sparkles, color: 'text-pink-500' },
            { path: '/title-generator', name: '标题生成器', icon: Zap, color: 'text-orange-500' },
        ]
    },
    {
        title: '图片车间',
        icon: Camera,
        color: 'text-rose-500',
        bg: 'bg-rose-50',
        borderColor: 'border-rose-500',
        subtitle: 'Image Factory',
        tools: [
            { path: '/image-studio', name: '单图二创', icon: Camera, color: 'text-rose-500' },
            { path: '/batch-image', name: '批量作图', icon: Layers, color: 'text-indigo-500' },
        ]
    }
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
    const location = useLocation();
    
    // Initialize model from localStorage, default to flash
    const [model, setModel] = useState(() => {
        const saved = localStorage.getItem('deepseek_model_preference');
        const normalized = saved === 'deepseek-reasoner' ? 'deepseek-v4-pro' : (saved || 'deepseek-v4-flash');
        localStorage.setItem('deepseek_model_preference', normalized);
        return normalized;
    });

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newModel = e.target.value;
        setModel(newModel);
        localStorage.setItem('deepseek_model_preference', newModel);
    };

    return (
        <aside
            className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-100 shadow-[2px_0_20px_rgba(0,0,0,0.02)] flex flex-col transition-all duration-300 z-50 ${collapsed ? 'w-[72px]' : 'w-64'
                }`}
        >
            {/* Header */}
            <div className="h-[72px] border-b border-slate-100 flex items-center justify-between px-5">
                {!collapsed && (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center shadow-md shadow-red-500/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-800 text-[15px] tracking-tight">小红书工作台</h1>
                            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Industrial Pro</p>
                        </div>
                    </div>
                )}
                {collapsed && (
                    <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center mx-auto shadow-md shadow-red-500/20">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar">
                <div className="px-3 mb-6">
                    <NavLink
                        to="/dashboard"
                        className={`
                            flex items-center gap-3 px-3 py-3 rounded-xl transition-all group
                            ${location.pathname === '/dashboard' || location.pathname === '/'
                                ? 'bg-slate-100 text-slate-900 font-bold'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                            }
                        `}
                        title={collapsed ? '总览看板' : undefined}
                    >
                        <LayoutDashboard className={`w-5 h-5 flex-shrink-0 ${location.pathname === '/dashboard' || location.pathname === '/' ? 'text-slate-800' : 'text-slate-400'}`} />
                        {!collapsed && <span className="text-[15px]">总览看板</span>}
                    </NavLink>
                </div>

                {toolGroups.map((group, groupIdx) => {
                    // Check if any child is active to highlight the group
                    const isGroupActive = group.tools.some(t => location.pathname === t.path);

                    return (
                        <div key={groupIdx} className="mb-6 relative">
                            {/* Group Header */}
                            {!collapsed ? (
                                <div className={`mx-3 mb-2 px-3 py-2 rounded-xl flex items-center justify-between ${isGroupActive ? group.bg : 'bg-transparent'}`}>
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-1.5 rounded-md ${isGroupActive ? 'bg-white shadow-sm' : ''} ${group.color}`}>
                                            <group.icon className="w-4 h-4" />
                                        </div>
                                        <span className={`text-[13px] font-bold tracking-wide ${isGroupActive ? group.color : 'text-slate-400'}`}>{group.title}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{group.subtitle}</span>
                                </div>
                            ) : (
                                <div className="flex justify-center mb-2" title={group.title}>
                                     <div className={`p-2 rounded-xl ${isGroupActive ? group.bg + ' ' + group.color : 'bg-slate-50 text-slate-400'}`}>
                                        <group.icon className="w-5 h-5" />
                                     </div>
                                </div>
                            )}

                            {/* Group Items */}
                            <ul className="space-y-1 relative">
                                {group.tools.map((tool) => {
                                    const Icon = tool.icon;
                                    const isActive = location.pathname === tool.path;

                                    return (
                                        <li key={tool.path} className="relative">
                                            {/* Active indicator line like the screenshot */}
                                            {isActive && !collapsed && (
                                                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-current ${group.color}`}></div>
                                            )}
                                            
                                            <NavLink
                                                to={tool.path}
                                                className={`
                                                    flex items-center gap-3 py-2.5 transition-all group relative
                                                    ${collapsed ? 'justify-center mx-3 rounded-xl px-0' : 'pl-11 pr-4 mx-3 rounded-lg'}
                                                    ${isActive
                                                        ? (collapsed ? group.bg + ' ' + group.color : 'bg-slate-50/80 text-slate-900 font-semibold')
                                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'
                                                    }
                                                `}
                                                title={collapsed ? tool.name : undefined}
                                            >
                                                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? tool.color : 'text-slate-400 group-hover:' + tool.color}`} />
                                                {!collapsed && (
                                                    <span className="text-[14px] truncate">{tool.name}</span>
                                                )}
                                            </NavLink>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    );
                })}
            </nav>

            {/* Model Selector */}
            {!collapsed && (
                <div className="px-5 py-5 border-t border-slate-100 bg-white">
                    <label className="block text-[11px] font-bold tracking-wider text-slate-400 mb-2 uppercase">AI 引擎核心</label>
                    <select
                        value={model}
                        onChange={handleModelChange}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-red-500 focus:border-red-500 block p-2.5 outline-none shadow-sm cursor-pointer transition-all hover:bg-white font-medium"
                    >
                        <option value="deepseek-v4-flash">⚡ 极速出文 (Flash)</option>
                        <option value="deepseek-v4-pro">🧠 深度思考 (Pro)</option>
                    </select>
                </div>
            )}
            {collapsed && (
                <div className="border-t border-slate-100 py-4 flex justify-center items-center">
                    <div title={model === 'deepseek-v4-flash' ? '极速出文 (Flash)' : '深度思考 (Pro)'} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 cursor-help border border-slate-200 shadow-sm">
                        {model === 'deepseek-v4-flash' ? '⚡' : '🧠'}
                    </div>
                </div>
            )}

            {/* Collapse Toggle */}
            <button
                onClick={onToggle}
                className="h-12 border-t border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >
                {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
        </aside>
    );
};

export default Sidebar;
