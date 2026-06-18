import React from 'react';
import { StructureData, MindMapPhase, MindMapElement } from '../types';

interface TreeVisualizerProps {
  data: StructureData;
}

const ElementNode: React.FC<{ element: MindMapElement }> = ({ element }) => (
  <div className="relative group bg-white border border-slate-200 rounded-xl p-0 w-64 shadow-sm hover:shadow-lg transition-all overflow-hidden z-10">
    <div className="bg-indigo-50 px-3 py-2 border-b border-indigo-100 flex items-center justify-between">
      <span className="font-bold text-xs text-indigo-700 uppercase tracking-wide truncate pr-2" title={element.name}>
        {element.name}
      </span>
      <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 flex-shrink-0"></div>
    </div>
    <div className="p-3 space-y-2 bg-slate-50 group-hover:bg-white transition-colors">
      {element.details.map((detail, idx) => (
        <div key={idx} className="flex items-start text-xs text-slate-600 leading-relaxed">
           <span className="text-slate-400 mr-1.5 mt-0.5">•</span>
           <span>{detail}</span>
        </div>
      ))}
    </div>
  </div>
);

const PhaseNode: React.FC<{ phase: MindMapPhase; isFirst: boolean; isLast: boolean; isOnly: boolean }> = ({ phase, isFirst, isLast, isOnly }) => {
  return (
    <div className="flex flex-col items-center relative px-2">
      {/* Connectors to Parent (Root) */}
      {!isOnly && (
        <>
          {/* Horizontal Line at the top used to connect siblings */}
          <div 
            className={`absolute top-0 h-0.5 bg-slate-300 ${
              isFirst ? 'left-1/2 w-1/2' : isLast ? 'left-0 w-1/2' : 'w-full left-0'
            }`} 
          />
        </>
      )}
      {/* Vertical Line from top horizontal line to Phase Card */}
      <div className="h-8 w-0.5 bg-slate-300 mb-0 flex-shrink-0"></div>

      {/* Phase Card */}
      <div className="relative z-10 bg-white border-2 border-slate-200 rounded-lg shadow-sm px-4 py-2 font-bold text-slate-700 text-center mb-0 min-w-[140px] hover:border-indigo-500 hover:text-indigo-600 transition-all text-sm">
        {phase.phaseName}
      </div>

      {/* Connector to Children (Elements) */}
      {phase.elements.length > 0 && (
         <div className="w-0.5 h-6 bg-slate-300"></div>
      )}

      {/* Elements Stack */}
      <div className="flex flex-col gap-3 w-full items-center">
        {phase.elements.map((el, idx) => (
           <React.Fragment key={idx}>
             {idx > 0 && <div className="w-0.5 h-2 bg-slate-300"></div>}
             <ElementNode element={el} />
           </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export const TreeVisualizer: React.FC<TreeVisualizerProps> = ({ data }) => {
  return (
    <div className="w-full overflow-x-auto bg-slate-50 rounded-2xl border border-slate-200 p-8 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
      <div className="min-w-max flex flex-col items-center pb-8">
        
        {/* Level 0: Root */}
        <div className="z-20 px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-xl text-lg border-2 border-slate-700 text-center tracking-tight max-w-lg">
           {data.rootTheme}
        </div>

        {/* Connector from Root to Phases */}
        {data.phases.length > 0 && (
          <div className="h-8 w-0.5 bg-slate-300"></div>
        )}

        {/* Level 1: Phases Container */}
        <div className="flex items-start justify-center gap-6">
          {data.phases.map((phase, index) => (
            <PhaseNode 
              key={index} 
              phase={phase} 
              isFirst={index === 0} 
              isLast={index === data.phases.length - 1}
              isOnly={data.phases.length === 1}
            />
          ))}
        </div>

      </div>
    </div>
  );
};