import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SubField, CATEGORY_LABELS, CategoryKey } from '../types';

interface AnalyticsProps {
    subField: SubField;
}

const Analytics: React.FC<AnalyticsProps> = ({ subField }) => {
    const data = useMemo(() => {
        return (Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((key) => {
            const categoryData = subField.keywords[key];
            const count = categoryData?.groups?.reduce((acc, group) => acc + group.items.length, 0) || 0;
            return {
                name: CATEGORY_LABELS[key].label,
                count: count,
                key: key
            };
        });
    }, [subField]);

    const totalKeywords = data.reduce((acc, curr) => acc + curr.count, 0);

    const getColor = (key: CategoryKey) => {
        switch (key) {
            case 'scene': return '#ef4444';
            case 'problem': return '#f97316';
            case 'identity': return '#3b82f6';
            case 'task': return '#a855f7';
            case 'knowledge': return '#14b8a6';
            case 'purchase': return '#10b981';
            default: return '#9ca3af';
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">关键词分布分析</h3>
                    <p className="text-sm text-gray-500">当前领域：{subField.name} | 关键词总数：<span className="font-bold text-red-500">{totalKeywords}</span></p>
                </div>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12, fill: '#6b7280' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis hide />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getColor(entry.key as CategoryKey)} fillOpacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Analytics;
