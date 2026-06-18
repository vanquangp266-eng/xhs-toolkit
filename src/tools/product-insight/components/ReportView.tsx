import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ReportData, FabeItem, Persona, QaItem } from '../types';
import { Layers, Target, Heart, Sparkles, ShieldAlert, Users, MessageSquare, Briefcase, Lightbulb, User, ArrowRight, Zap, Scale, Send } from './icons';
import { useGlobalStore } from '../../../shared/store/globalStore';
import { ExportButton } from '../../../shared/components/ExportButton';
import { exportAsMarkdown } from '../../../shared/utils/exportUtils';

interface ReportViewProps {
  data: ReportData | null;
}

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; color?: string }> = ({ icon, title, color = "text-slate-800" }) => (
  <h3 className={`text-xl font-bold flex items-center gap-2 mb-4 border-b border-slate-100 pb-2 ${color}`}>
    {icon}
    {title}
  </h3>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl border border-slate-200 p-6 shadow-sm ${className}`}>
    {children}
  </div>
);

const MarkdownBlock: React.FC<{ content: string }> = ({ content }) => (
  <div className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed">
    <ReactMarkdown>{content}</ReactMarkdown>
  </div>
);

const FabeCard: React.FC<{ item: FabeItem; index: number }> = ({ item, index }) => (
  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-3 last:mb-0 hover:border-indigo-200 transition-colors">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">特性 (Feature/Fact)</span>
        <p className="font-medium text-slate-800 mt-1">{item.fact}</p>
      </div>
      <div>
        <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">优势 (Advantage)</span>
        <p className="text-sm text-slate-600 mt-1">{item.advantage}</p>
      </div>
      <div>
        <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">利益 (Benefit)</span>
        <p className="text-sm text-slate-600 mt-1">{item.benefit}</p>
      </div>
      <div>
        <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">证据 (Evidence)</span>
        <p className="text-sm text-slate-500 italic mt-1">{item.evidence}</p>
      </div>
    </div>
  </div>
);

const PersonaCard: React.FC<{ persona: Persona }> = ({ persona }) => (
  <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
        {persona.name.charAt(0)}
      </div>
      <div>
        <h4 className="font-bold text-slate-800">{persona.name}</h4>
        <p className="text-xs text-slate-500 font-medium">{persona.role}</p>
      </div>
    </div>
    <div className="mb-4">
      <p className="text-sm text-slate-600 italic">"{persona.quote}"</p>
    </div>
    <p className="text-sm text-slate-700 mb-4 leading-relaxed">{persona.story}</p>
    <div className="flex flex-wrap gap-2">
      {persona.tags.map((tag, i) => (
        <span key={i} className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded-md font-medium">
          {tag}
        </span>
      ))}
    </div>
  </div>
);

const QaItemView: React.FC<{ item: QaItem }> = ({ item }) => (
  <div className="border-b border-slate-100 last:border-0 py-4 first:pt-0">
    <h5 className="font-semibold text-slate-800 mb-2 flex items-start gap-2">
      <span className="text-indigo-500">问:</span> {item.question}
    </h5>
    <div className="pl-6 text-sm text-slate-600">
      <ReactMarkdown>{item.answer}</ReactMarkdown>
    </div>
  </div>
);

const ReportView: React.FC<ReportViewProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50/50">
        <Layers size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">暂无报告</p>
        <p className="text-sm">请先在左侧聊天框中描述您的产品。</p>
      </div>
    );
  }

  const handleDownload = async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
    // Determine if we have the new structure, fallback if not
    const strategy = data.strategicAnalysis || {
        user: { identity: '-', attributes: '-' },
        scenario: { timeSpace: '-', event: '-', emotion: '-' },
        problem: { dissatisfaction: '-', blockingPoints: '-', gap: '-' },
        property: { product: '-', service: '-', deliverables: '-' },
        advantage: { differentiation: '-', marketPosition: '-' },
        value: { functional: '-', emotional: '-' },
        dynamics: { motivation: { internal: '-', external: '-' }, resistance: { lowYield: '-', highInput: '-', timeWindow: '-', opportunityCost: '-' } }
    };

    const markdown = `
# ${data.productName} - 产品战略深度报告

> ${data.summary}

## 1. 深度战略分析 (Strategic Analysis)

### 1.1 用户 (User)
*   **身份 (Identity):** ${strategy.user.identity}
*   **属性 (Attributes):** ${strategy.user.attributes}

### 1.2 场景 (Scenario)
*   **时空 (Space-Time):** ${strategy.scenario.timeSpace}
*   **事件 (Event):** ${strategy.scenario.event}
*   **情绪 (Emotion):** ${strategy.scenario.emotion}

### 1.3 问题 (Problem)
*   **不满 (Dissatisfaction - Past):** ${strategy.problem.dissatisfaction}
*   **卡点 (Blocking Points - Change):** ${strategy.problem.blockingPoints}
*   **差距 (Gap - Future):** ${strategy.problem.gap}

### 1.4 属性 (Property)
*   **产品 (Product):** ${strategy.property.product}
*   **服务 (Service):** ${strategy.property.service}
*   **交付成果 (Deliverables):** ${strategy.property.deliverables}

### 1.5 优点 (Advantage)
*   **差异化 (Differentiation):** ${strategy.advantage.differentiation}
*   **市场地位 (Market Position):** ${strategy.advantage.marketPosition}

### 1.6 价值 (Value)
*   **功能价值 (Functional):** ${strategy.value.functional}
*   **情绪价值 (Emotional):** ${strategy.value.emotional}

### 1.7 动力与阻力 (Dynamics)
#### 动力 (Motivation)
*   **内部驱动 (Internal):** ${strategy.dynamics.motivation.internal}
*   **外部影响 (External):** ${strategy.dynamics.motivation.external}

#### 阻力 (Resistance)
*   **收益感知低 (Low Yield):** ${strategy.dynamics.resistance.lowYield}
*   **投入高 (High Input):** ${strategy.dynamics.resistance.highInput}
*   **时间窗口 (Time Window):** ${strategy.dynamics.resistance.timeWindow}
*   **机会成本 (Opportunity Cost):** ${strategy.dynamics.resistance.opportunityCost}

---

## 2. 产品详细拆解

### 核心需求
${data.decomposition.requirements}

### 目标人群
${data.decomposition.targetAudience}

### 背景信息
${data.decomposition.background}

### 痛点、痒点与爽点
- **痛点 (Pain):** ${data.decomposition.points.pain}
- **痒点 (Itch):** ${data.decomposition.points.itch}
- **爽点 (Wow):** ${data.decomposition.points.wow}

### 用户状态
- **现状:** ${data.decomposition.userState.current}
- **期待:** ${data.decomposition.userState.expectations}
- **已知事实:** ${data.decomposition.userState.knownFacts}

### 生活建议
${data.decomposition.lifeSuggestions}

---

## 3. 产品内核与演示

### 核心本质 (Product Core)
${data.core.productCore}

### 购买体验演示 (Buying Demo)
${data.core.buyingDemo}

---

## 4. 典型用户画像

${data.personas.map(p => `
### ${p.name} (${p.role})
> "${p.quote}"

${p.story}
*标签: ${p.tags.join(', ')}*
`).join('\n')}

---

## 5. FABE 分析

${data.fabe.map(f => `
- **特性 (Fact):** ${f.fact}
- **优势 (Advantage):** ${f.advantage}
- **利益 (Benefit):** ${f.benefit}
- **证据 (Evidence):** ${f.evidence}
`).join('\n')}

---

## 6. 全方位营销话术

### 直击痛点
${data.marketingCopy.painCopy}

### 挠痒点
${data.marketingCopy.itchCopy}

### 制造爽点
${data.marketingCopy.wowCopy}

### 增强动力 (为何现在买)
${data.marketingCopy.motivationCopy}

### 消除阻力 (建立信任)
${data.marketingCopy.resistanceCopy}

---

## 7. 常见问答 (Q&A)

${data.qa.map(q => `
**Q: ${q.question}**
A: ${q.answer}
`).join('\n')}

---
*生成时间: ${new Date().toLocaleString()} 由产品洞察架构师生成*
    `;

    exportAsMarkdown(markdown, `${data.productName}-深度战略报告.md`);
  };

  // Helper to ensure we don't crash on old reports without strategicAnalysis
  const strategy = data.strategicAnalysis || {
      user: { identity: '需重新生成', attributes: '需重新生成' },
      scenario: { timeSpace: '需重新生成', event: '需重新生成', emotion: '需重新生成' },
      problem: { dissatisfaction: '需重新生成', blockingPoints: '需重新生成', gap: '需重新生成' },
      property: { product: '需重新生成', service: '需重新生成', deliverables: '需重新生成' },
      advantage: { differentiation: '需重新生成', marketPosition: '需重新生成' },
      value: { functional: '需重新生成', emotional: '需重新生成' },
      dynamics: { motivation: { internal: '需重新生成', external: '需重新生成' }, resistance: { lowYield: '需重新生成', highInput: '需重新生成', timeWindow: '需重新生成', opportunityCost: '需重新生成' } }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50/30 p-8 relative">
       {/* Export Button */}
       <div className="absolute top-8 right-8 z-10 flex flex-col gap-2">
          <button 
            onClick={() => {
              const summary = `【产品名称】${data.productName}\n【核心卖点】${data.summary}\n【核心需求】${data.decomposition.requirements}\n【目标人群】${data.decomposition.targetAudience}`;
              useGlobalStore.getState().setProductContext(summary);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 border border-indigo-500 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors text-sm font-bold"
          >
            <Send size={16} />
            设为全局产品背景
          </button>
          <ExportButton
            onExport={handleDownload}
            label="导出 Markdown"
            className="w-full justify-center"
          />
       </div>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">{data.productName}</h1>
          <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
            深度商业洞察报告
          </div>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">{data.summary}</p>
        </div>

        {/* --- NEW STRATEGIC ANALYSIS SECTION --- */}
        <Card className="border-t-4 border-t-indigo-600 shadow-md">
            <div className="flex items-center justify-between mb-6">
                <SectionTitle icon={<Briefcase className="w-6 h-6 text-indigo-700" />} title="深度战略框架分析" color="text-indigo-900" />
                <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded uppercase">Core Strategy</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. User & Scenario */}
                <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-sm uppercase"><User size={16} className="text-blue-500"/> 用户 (User)</h4>
                        <div className="space-y-3">
                            <div><span className="text-xs font-semibold text-slate-400">身份 (Identity)</span><MarkdownBlock content={strategy.user.identity} /></div>
                            <div><span className="text-xs font-semibold text-slate-400">属性 (Attributes)</span><MarkdownBlock content={strategy.user.attributes} /></div>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-sm uppercase"><Target size={16} className="text-red-500"/> 场景 (Scenario)</h4>
                        <div className="space-y-3">
                            <div><span className="text-xs font-semibold text-slate-400">时空 (Space-Time)</span><MarkdownBlock content={strategy.scenario.timeSpace} /></div>
                            <div><span className="text-xs font-semibold text-slate-400">事件 (Event)</span><MarkdownBlock content={strategy.scenario.event} /></div>
                            <div><span className="text-xs font-semibold text-slate-400">情绪 (Emotion)</span><MarkdownBlock content={strategy.scenario.emotion} /></div>
                        </div>
                    </div>
                </div>

                {/* 2. Problem & Property */}
                <div className="space-y-6">
                     <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-sm uppercase"><ShieldAlert size={16} className="text-orange-500"/> 问题 (Problem)</h4>
                        <div className="space-y-3">
                            <div><span className="text-xs font-semibold text-slate-400">不满 (Dissatisfaction)</span><MarkdownBlock content={strategy.problem.dissatisfaction} /></div>
                            <div><span className="text-xs font-semibold text-slate-400">卡点 (Blocking)</span><MarkdownBlock content={strategy.problem.blockingPoints} /></div>
                            <div><span className="text-xs font-semibold text-slate-400">差距 (Gap)</span><MarkdownBlock content={strategy.problem.gap} /></div>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-sm uppercase"><Layers size={16} className="text-purple-500"/> 属性 (Property)</h4>
                        <div className="space-y-3">
                            <div><span className="text-xs font-semibold text-slate-400">产品 (Product)</span><MarkdownBlock content={strategy.property.product} /></div>
                            <div><span className="text-xs font-semibold text-slate-400">服务 (Service)</span><MarkdownBlock content={strategy.property.service} /></div>
                            <div><span className="text-xs font-semibold text-slate-400">交付 (Deliverable)</span><MarkdownBlock content={strategy.property.deliverables} /></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 pt-6 border-t border-slate-100">
                {/* 3. Advantage & Value */}
                <div className="space-y-6">
                    <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                        <h4 className="flex items-center gap-2 font-bold text-indigo-900 mb-3 text-sm uppercase"><Sparkles size={16}/> 优点 (Advantage)</h4>
                        <div className="space-y-3">
                            <div><span className="text-xs font-semibold text-indigo-400">差异化</span><MarkdownBlock content={strategy.advantage.differentiation} /></div>
                            <div><span className="text-xs font-semibold text-indigo-400">市场地位</span><MarkdownBlock content={strategy.advantage.marketPosition} /></div>
                        </div>
                    </div>
                    <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
                        <h4 className="flex items-center gap-2 font-bold text-emerald-900 mb-3 text-sm uppercase"><Heart size={16}/> 价值 (Value)</h4>
                        <div className="space-y-3">
                            <div><span className="text-xs font-semibold text-emerald-400">功能价值</span><MarkdownBlock content={strategy.value.functional} /></div>
                            <div><span className="text-xs font-semibold text-emerald-400">情绪价值</span><MarkdownBlock content={strategy.value.emotional} /></div>
                        </div>
                    </div>
                </div>

                {/* 4. Dynamics (Motivation & Resistance) */}
                <div className="bg-gradient-to-br from-orange-50 to-white p-5 rounded-lg border border-orange-100">
                    <h4 className="flex items-center gap-2 font-bold text-orange-900 mb-4 text-sm uppercase"><Scale size={16}/> 动力与阻力 (Dynamics)</h4>
                    
                    <div className="mb-4">
                        <h5 className="text-xs font-bold text-orange-600 uppercase mb-2 flex items-center gap-1"><Zap size={12}/> 动力 (Motivation)</h5>
                        <div className="pl-2 border-l-2 border-orange-200 space-y-2">
                             <div><span className="text-xs text-slate-400 block">内部驱动</span><MarkdownBlock content={strategy.dynamics.motivation.internal} /></div>
                             <div><span className="text-xs text-slate-400 block">外部影响</span><MarkdownBlock content={strategy.dynamics.motivation.external} /></div>
                        </div>
                    </div>

                    <div>
                        <h5 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><ShieldAlert size={12}/> 阻力 (Resistance)</h5>
                        <div className="pl-2 border-l-2 border-slate-200 space-y-2">
                             <div><span className="text-xs text-slate-400 block">收益小</span><MarkdownBlock content={strategy.dynamics.resistance.lowYield} /></div>
                             <div><span className="text-xs text-slate-400 block">投入高</span><MarkdownBlock content={strategy.dynamics.resistance.highInput} /></div>
                             <div><span className="text-xs text-slate-400 block">时间窗口</span><MarkdownBlock content={strategy.dynamics.resistance.timeWindow} /></div>
                             <div><span className="text-xs text-slate-400 block">机会成本</span><MarkdownBlock content={strategy.dynamics.resistance.opportunityCost} /></div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>

        {/* 1. Decomposition (Classic) */}
        <Card>
          <SectionTitle icon={<Layers className="w-5 h-5 text-indigo-600" />} title="产品基础拆解" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-slate-700 mb-2">核心需求</h4>
                <MarkdownBlock content={data.decomposition.requirements} />
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-2">目标人群概览</h4>
                <MarkdownBlock content={data.decomposition.targetAudience} />
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-2">背景信息</h4>
                <MarkdownBlock content={data.decomposition.background} />
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-5 space-y-6">
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-600 font-semibold text-sm uppercase"><ShieldAlert size={14}/> 痛点 (Pain)</div>
                  <MarkdownBlock content={data.decomposition.points.pain} />
               </div>
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm uppercase"><Lightbulb size={14}/> 痒点 (Itch)</div>
                  <MarkdownBlock content={data.decomposition.points.itch} />
               </div>
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm uppercase"><Sparkles size={14}/> 爽点 (Wow)</div>
                  <MarkdownBlock content={data.decomposition.points.wow} />
               </div>
            </div>
          </div>
        </Card>

        {/* 3. Core & Buying */}
        <Card className="bg-slate-900 text-white border-slate-800">
          <SectionTitle icon={<Sparkles className="w-5 h-5 text-yellow-400" />} title="产品内核与购买演示" color="text-white" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div>
                <h4 className="text-indigo-300 font-semibold mb-3 uppercase tracking-wider text-xs">核心本质</h4>
                <div className="prose prose-invert prose-sm"><ReactMarkdown>{data.core.productCore}</ReactMarkdown></div>
             </div>
             <div>
                <h4 className="text-emerald-300 font-semibold mb-3 uppercase tracking-wider text-xs">购买体验演示</h4>
                <div className="prose prose-invert prose-sm"><ReactMarkdown>{data.core.buyingDemo}</ReactMarkdown></div>
             </div>
          </div>
        </Card>

        {/* 4. Personas */}
        <div>
          <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
             <Users className="w-6 h-6 text-indigo-600"/>
             典型用户画像
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.personas.map((persona, idx) => (
              <PersonaCard key={idx} persona={persona} />
            ))}
          </div>
        </div>

        {/* 5. FABE */}
        <Card>
          <SectionTitle icon={<Target className="w-5 h-5 text-slate-700" />} title="FABE 分析" />
          <div className="space-y-4">
            {data.fabe.map((item, idx) => (
              <FabeCard key={idx} item={item} index={idx} />
            ))}
          </div>
        </Card>

        {/* 6. Marketing Copy */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
          <SectionTitle icon={<MessageSquare className="w-5 h-5 text-purple-600" />} title="全方位营销话术" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white/80 p-4 rounded-lg shadow-sm backdrop-blur-sm">
               <h5 className="font-bold text-red-500 mb-3 text-sm uppercase">直击痛点</h5>
               <MarkdownBlock content={data.marketingCopy.painCopy} />
            </div>
            <div className="bg-white/80 p-4 rounded-lg shadow-sm backdrop-blur-sm">
               <h5 className="font-bold text-amber-500 mb-3 text-sm uppercase">挠痒点</h5>
               <MarkdownBlock content={data.marketingCopy.itchCopy} />
            </div>
            <div className="bg-white/80 p-4 rounded-lg shadow-sm backdrop-blur-sm">
               <h5 className="font-bold text-emerald-500 mb-3 text-sm uppercase">制造爽点</h5>
               <MarkdownBlock content={data.marketingCopy.wowCopy} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-indigo-100/50">
             <div className="bg-white/90 p-5 rounded-lg shadow-sm border-l-4 border-l-orange-500">
                <h5 className="font-bold text-orange-600 mb-3 text-sm uppercase flex items-center gap-2">
                   <Briefcase size={16}/> 增强动力 (驱动力)
                </h5>
                <MarkdownBlock content={data.marketingCopy.motivationCopy} />
             </div>
             <div className="bg-white/90 p-5 rounded-lg shadow-sm border-l-4 border-l-blue-500">
                <h5 className="font-bold text-blue-600 mb-3 text-sm uppercase flex items-center gap-2">
                   <ShieldAlert size={16}/> 消除阻力 (障碍)
                </h5>
                <MarkdownBlock content={data.marketingCopy.resistanceCopy} />
             </div>
          </div>
        </Card>

        {/* 7. Q&A */}
        <Card>
          <SectionTitle icon={<MessageSquare className="w-5 h-5 text-slate-700" />} title="常见用户问答" />
          <div className="space-y-2">
            {data.qa.map((item, idx) => (
              <QaItemView key={idx} item={item} />
            ))}
          </div>
        </Card>
        
        <div className="text-center text-slate-400 text-sm py-8">
           由产品洞察架构师生成 • AI 内容仅供参考
        </div>
      </div>
    </div>
  );
};

export default ReportView;