import { ViralCase } from './types';

export const DEFAULT_CASES: ViralCase[] = [
    { id: '1', content: '听劝！这辈子千万不要做/去/买......' },
    { id: '2', content: '关于我......的那些事，说出来你可能不信' },
    { id: '3', content: '救命！谁懂啊，真的......' },
    { id: '4', content: '沉浸式体验......，这也太爽了吧' },
    { id: '5', content: '普通女生如何......？亲测有效！' },
    { id: '6', content: '2024年了，不会还有人不知道......吧？' },
    { id: '7', content: '后悔没有早点发现这个宝藏......' },
    { id: '8', content: '把......坚持做100天，结果惊呆了' },
    { id: '9', content: '咱就是说，......真的是yyds！' },
    { id: '10', content: '避雷！这些......真的不要踩坑' }
];

export const STORAGE_KEY_CASES = 'rednote_viral_cases_v1';
export const STORAGE_KEY_HISTORY = 'rednote_viral_history_v1';

export const STORAGE_KEYS = {
    CASES: STORAGE_KEY_CASES,
    HISTORY: STORAGE_KEY_HISTORY
};
