export type CategoryKey = 'scene' | 'problem' | 'identity' | 'task' | 'knowledge' | 'purchase';

export interface KeywordGroup {
    groupName: string;
    items: string[];
}

export interface CategoryData {
    logic: string;
    groups: KeywordGroup[];
}

export interface SubField {
    name: string;
    description: string;
    keywords: Record<CategoryKey, CategoryData>;
}

export interface AnalysisResult {
    niche: string;
    subFields: SubField[];
}

export interface HistoryItem {
    id: string;
    timestamp: number;
    data: AnalysisResult;
}

export const CATEGORY_LABELS: Record<CategoryKey, { label: string; color: string; desc: string }> = {
    scene: {
        label: '场景词',
        color: 'bg-red-50 text-red-700 border-red-200',
        desc: '用户所在的具体环境或使用场景 (where/when)'
    },
    problem: {
        label: '问题词',
        color: 'bg-orange-50 text-orange-700 border-orange-200',
        desc: '用户遇到的痛点、困惑或故障 (pain points)'
    },
    identity: {
        label: '人群身份词',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        desc: '目标用户的身份标签 (who)'
    },
    task: {
        label: '任务词',
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        desc: '用户想要完成的具体目标或动作 (to do)'
    },
    knowledge: {
        label: '知识资讯词',
        color: 'bg-teal-50 text-teal-700 border-teal-200',
        desc: '行业干货、科普、原理 (info/how)'
    },
    purchase: {
        label: '购买决策词',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        desc: '对比、评测、避雷、推荐 (buy/review)'
    }
};
