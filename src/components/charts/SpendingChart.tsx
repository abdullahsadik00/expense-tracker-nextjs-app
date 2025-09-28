// // components/charts/SpendingChart.tsx
// 'use client';

// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import { Transaction } from '@/types';

// interface SpendingChartProps {
//   transactions: Transaction[];
// }

// export default function SpendingChart({ transactions }: SpendingChartProps) {
//   const processChartData = () => {
//     const dailyData: { [key: string]: { income: number; expenses: number; net: number } } = {};
    
//     transactions.forEach(transaction => {
//       const date = transaction.Date;
//       const debit = transaction.Debit === '-' ? 0 : parseFloat(transaction.Debit);
//       const credit = transaction.Credit === '-' ? 0 : parseFloat(transaction.Credit);
      
//       if (!dailyData[date]) {
//         dailyData[date] = { income: 0, expenses: 0, net: 0 };
//       }
      
//       dailyData[date].income += credit;
//       dailyData[date].expenses += debit;
//       dailyData[date].net = dailyData[date].income - dailyData[date].expenses;
//     });
    
//     return Object.entries(dailyData)
//       .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
//       .map(([date, data]) => ({
//         date,
//         ...data
//       }));
//   };

//   const data = processChartData();

//   return (
//     <ResponsiveContainer width="100%" height={300}>
//       <LineChart data={data}>
//         <CartesianGrid strokeDasharray="3 3" />
//         <XAxis dataKey="date" />
//         <YAxis />
//         <Tooltip />
//         <Legend />
//         <Line type="monotone" dataKey="income" stroke="#4cc9f0" strokeWidth={2} />
//         <Line type="monotone" dataKey="expenses" stroke="#f72585" strokeWidth={2} />
//         <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} />
//       </LineChart>
//     </ResponsiveContainer>
//   );
// }

// components/charts/SpendingChart.tsx
'use client';

import { Transaction } from '@/types/ai';
// import { Transaction } from '@/types/ai';
import { useEffect, useRef } from 'react';

interface SpendingChartProps {
  transactions: Transaction[];
}

/**
 * SpendingChart - Visualizes spending by category using Canvas API
 * No external chart library dependency - fully controlled and fast
 * Shows category-wise spending distribution
 */
export default function SpendingChart({ transactions }: SpendingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Process transactions for chart data
  const processChartData = () => {
    // Group transactions by category and sum amounts
    const categorySpending: { [key: string]: number } = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const category = transaction.category_name || 'Uncategorized';
        categorySpending[category] = (categorySpending[category] || 0) + transaction.amount;
      });

    // Convert to array and sort by amount
    return Object.entries(categorySpending)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories
  };

  const chartData = processChartData();
  const totalSpending = chartData.reduce((sum, item) => sum + item.value, 0);

  // Colors for chart segments
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  useEffect(() => {
    if (!canvasRef.current || chartData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Donut chart configuration
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const innerRadius = radius * 0.6; // For donut hole

    let startAngle = 0;

    // Draw each segment
    chartData.forEach((item, index) => {
      const percentage = item.value / totalSpending;
      const endAngle = startAngle + (percentage * 2 * Math.PI);

      // Draw outer arc
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();

      // Add subtle shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      startAngle = endAngle;
    });

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw center text
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Spending', centerX, centerY - 10);
    
    ctx.fillStyle = '#6B7280';
    ctx.font = '12px system-ui';
    ctx.fillText(`₹${totalSpending.toLocaleString('en-IN')}`, centerX, centerY + 10);

  }, [transactions, chartData, totalSpending]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        No spending data available for the selected period
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Spending by Category
      </h3>
      
      <div className="flex flex-col lg:flex-row items-center">
        {/* Chart Canvas */}
        <div className="flex-1">
          <canvas
            ref={canvasRef}
            className="w-full h-64 lg:h-80"
            style={{ maxWidth: '400px', margin: '0 auto' }}
          />
        </div>

        {/* Legend */}
        <div className="flex-1 mt-4 lg:mt-0 lg:ml-6">
          <div className="space-y-3">
            {chartData.map((item, index) => {
              const percentage = ((item.value / totalSpending) * 100).toFixed(1);
              return (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      ₹{item.value.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {percentage}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Total Spending:</span>
                <span className="font-semibold">
                  ₹{totalSpending.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Categories:</span>
                <span className="font-semibold">{chartData.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}