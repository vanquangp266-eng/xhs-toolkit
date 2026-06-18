import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './shared/components/Sidebar';

// Tool Components (lazy load for performance)
import KeywordMiner from './tools/keyword-miner';
import PatternExtractor from './tools/pattern-extractor';
import TitleGenerator from './tools/title-generator';
import MetaQuestion from './tools/meta-question';
import CopyAnalyzer from './tools/copy-analyzer';
import ProductInsight from './tools/product-insight';
import StructureAnalyzer from './tools/structure-analyzer';
import PromptArchitect from './tools/prompt-architect';
import CopyGenerator from './tools/copy-generator';
import Dashboard from './tools/dashboard';
import SeoMaster from './tools/seo-master';
import ImageStudio from './tools/image-studio';
import BatchImage from './tools/batch-image';
import AuthorScraper from './tools/author-scraper';
import { GlobalContextPanel } from './shared/components/GlobalContextPanel';

const App: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 flex overflow-hidden relative">
            {/* Global decorative background glows */}
            <div className="absolute top-0 left-1/4 w-[800px] h-[600px] bg-red-100/40 rounded-full blur-3xl pointer-events-none mix-blend-multiply opacity-60"></div>
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[500px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none mix-blend-multiply opacity-60"></div>

            {/* Sidebar Navigation */}
            <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

            {/* Main Content Area */}
            <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} h-screen overflow-y-auto relative z-10 custom-scrollbar`}>
                <div className="min-h-full">
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/author-scraper" element={<AuthorScraper />} />
                        <Route path="/keyword-miner" element={<KeywordMiner />} />
                        <Route path="/pattern-extractor" element={<PatternExtractor />} />
                        <Route path="/title-generator" element={<TitleGenerator />} />
                        <Route path="/meta-question" element={<MetaQuestion />} />
                        <Route path="/copy-analyzer" element={<CopyAnalyzer />} />
                        <Route path="/product-insight" element={<ProductInsight />} />
                        <Route path="/structure-analyzer" element={<StructureAnalyzer />} />
                        <Route path="/prompt-architect" element={<PromptArchitect />} />
                        <Route path="/copy-generator" element={<CopyGenerator />} />
                        <Route path="/seo-master" element={<SeoMaster />} />
                        <Route path="/image-studio" element={<ImageStudio />} />
                        <Route path="/batch-image" element={<BatchImage />} />
                    </Routes>
                </div>
            </main>

            {/* Global Context Flow Panel */}
            <GlobalContextPanel />
        </div>
    );
};

export default App;
