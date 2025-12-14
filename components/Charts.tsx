import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Transaction } from '../types';

interface ChartsProps {
  transactions: Transaction[];
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];

const Charts: React.FC<ChartsProps> = ({ transactions }) => {
  const expenses = transactions.filter(t => t.type === 'expense');

  if (expenses.length === 0) return null;

  // Group by category
  const dataMap = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(dataMap).map(([name, value]) => ({ name, value: Number(value) }));
  
  // Sort by value desc
  data.sort((a, b) => b.value - a.value);

  return (
    <div className="bg-white dark:bg-white/5 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-white/10 h-full transition-all duration-200 backdrop-blur-md">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Despesas por Categoria</h3>
      <div className="h-64 w-full">
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
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
               formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
               contentStyle={{ 
                 borderRadius: '0.75rem', 
                 border: 'none', 
                 backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                 color: '#fff',
                 boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' 
               }}
               itemStyle={{ color: '#fff' }}
            />
            <Legend 
              layout="vertical" 
              verticalAlign="middle" 
              align="right" 
              wrapperStyle={{ fontSize: '12px', opacity: 0.8 }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;