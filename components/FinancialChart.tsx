import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Transaction } from '../types';

interface Props {
  transactions: Transaction[];
}

const COLORS = ['#3b82f6', '#a855f7', '#10b981', '#f43f5e'];

export const FinancialChart: React.FC<Props> = ({ transactions }) => {
  // Aggregate data
  const dataMap = {
    'routine-expense': { name: '日常支出', value: 0 },
    'extra-expense': { name: '额外支出', value: 0 },
    'routine-income': { name: '日常收入', value: 0 },
    'extra-income': { name: '额外收入', value: 0 },
  };

  transactions.forEach(t => {
    const key = `${t.category}-${t.type}` as keyof typeof dataMap;
    if (dataMap[key]) {
      dataMap[key].value += t.amount;
    }
  });

  // Filter out zero values for better visual
  const data = Object.values(dataMap).filter(item => item.value > 0);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 bg-white rounded-2xl border border-gray-100">
        暂无数据
      </div>
    );
  }

  return (
    <div className="h-64 w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-500 mb-2 text-center">收支构成</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => `¥${value.toFixed(2)}`}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};