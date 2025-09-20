// components/charts/SpendingChart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction } from '@/types';

interface SpendingChartProps {
  transactions: Transaction[];
}

export default function SpendingChart({ transactions }: SpendingChartProps) {
  const processChartData = () => {
    const dailyData: { [key: string]: { income: number; expenses: number; net: number } } = {};
    
    transactions.forEach(transaction => {
      const date = transaction.Date;
      const debit = transaction.Debit === '-' ? 0 : parseFloat(transaction.Debit);
      const credit = transaction.Credit === '-' ? 0 : parseFloat(transaction.Credit);
      
      if (!dailyData[date]) {
        dailyData[date] = { income: 0, expenses: 0, net: 0 };
      }
      
      dailyData[date].income += credit;
      dailyData[date].expenses += debit;
      dailyData[date].net = dailyData[date].income - dailyData[date].expenses;
    });
    
    return Object.entries(dailyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, data]) => ({
        date,
        ...data
      }));
  };

  const data = processChartData();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="income" stroke="#4cc9f0" strokeWidth={2} />
        <Line type="monotone" dataKey="expenses" stroke="#f72585" strokeWidth={2} />
        <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}