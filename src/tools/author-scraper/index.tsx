import React from 'react';
import AuthorScraperPanel from './components/AuthorScraperPanel';

const AuthorScraper: React.FC = () => {
    return (
        <div className="h-full flex flex-col relative z-10 p-6">
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2v20M4.93 4.93l14.14 14.14" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">对标作者爬取</h1>
                        <p className="text-sm text-slate-500">输入作者主页，保守爬取其高赞笔记及其文案图片，建立私有灵感库。</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-hidden">
                <AuthorScraperPanel />
            </div>
        </div>
    );
};

export default AuthorScraper;
