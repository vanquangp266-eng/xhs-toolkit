import React from 'react';
import { UserInput } from '../types';
import { User, Briefcase, Heart, Users, Package, Target, AlertCircle, FileText } from 'lucide-react';

interface InputFormProps {
  input: UserInput;
  setInput: React.Dispatch<React.SetStateAction<UserInput>>;
  onGenerate: () => void;
  isGenerating: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ input, setInput, onGenerate, isGenerating }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInput(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Persona Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
            <User size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">角色设定 (Persona)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">IP 昵称 / 身份</label>
            <div className="relative">
              <input
                type="text"
                name="roleName"
                value={input.roleName}
                onChange={handleChange}
                placeholder="例如：北大硕士妈妈、资深护肤配方师"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all"
              />
              <Briefcase className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">背景 / 资历 (Authority)</label>
            <div className="relative">
              <input
                type="text"
                name="roleBackground"
                value={input.roleBackground}
                onChange={handleChange}
                placeholder="例如：10年大厂运营、三甲医院皮肤科医生"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all"
              />
              <FileText className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-slate-600">具体人设细节 / 家庭情况</label>
            <textarea
              name="familyDetails"
              value={input.familyDetails}
              onChange={handleChange}
              placeholder="例如：有两个女儿，大宝性格内向，二宝活泼。或者：自己是敏感肌，曾经烂脸..."
              className="w-full p-4 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all h-24 resize-none"
            />
          </div>

          <div className="col-span-1 md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-slate-600">核心价值观 (Values)</label>
            <div className="relative">
              <input
                type="text"
                name="roleValues"
                value={input.roleValues}
                onChange={handleChange}
                placeholder="例如：拒绝无效内卷，科学养肤，只买对的不买贵的"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition-all"
              />
              <Heart className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Product Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
            <Package size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">产品与受众 (Product)</h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">产品名称 & 核心卖点</label>
            <input
              type="text"
              name="productName"
              value={input.productName}
              onChange={handleChange}
              placeholder="例如：《0-6岁英语启蒙全攻略》、抗老紧致面霜"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">具体包含内容 / 体系 (Important)</label>
            <textarea
              name="productFeatures"
              value={input.productFeatures}
              onChange={handleChange}
              placeholder="这部分最重要。请列出产品包含的‘手册’、‘课程章节’或‘成分体系’。例如：1. 入门课 2. 进阶课..."
              className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all h-32 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">目标人群 (Target)</label>
              <div className="relative">
                <input
                  type="text"
                  name="targetAudience"
                  value={input.targetAudience}
                  onChange={handleChange}
                  placeholder="例如：25-35岁职场女性，焦虑的宝妈"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
                <Users className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">主要痛点 (Pain Points)</label>
              <div className="relative">
                <input
                  type="text"
                  name="painPoints"
                  value={input.painPoints}
                  onChange={handleChange}
                  placeholder="例如：孩子不听话、脸上细纹增多"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
                <AlertCircle className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={`
            group relative overflow-hidden rounded-xl px-8 py-4 bg-slate-900 text-white font-bold text-lg shadow-xl shadow-slate-200
            hover:shadow-2xl hover:translate-y-[-2px] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed
            flex items-center gap-3
          `}
        >
          {isGenerating ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>正在构建架构...</span>
            </>
          ) : (
            <>
              <Target size={20} className="group-hover:rotate-12 transition-transform duration-300"/>
              <span>生成提示词架构</span>
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        </button>
      </div>
    </div>
  );
};

export default InputForm;