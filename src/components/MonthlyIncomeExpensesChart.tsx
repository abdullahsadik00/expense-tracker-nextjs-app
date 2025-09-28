// // components/MonthlyIncomeExpensesChart.tsx
// 'use client';

// import { useEffect, useState } from 'react';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   BarElement,
//   Tooltip,
//   Legend,
//   ChartOptions,
// } from 'chart.js';
// import { Bar } from 'react-chartjs-2';

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   BarElement,
//   Tooltip,
//   Legend
// );

// interface SummaryRow {
//   month: string;
//   total_income: string;
//   total_expenses: string;
//   net_balance: string;
// }

// export default function MonthlyIncomeExpensesChart() {
//   const [data, setData] = useState<SummaryRow[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     fetch('/api/dashboard/monthly-summary')
//       .then((res) => {
//         if (!res.ok) throw new Error('Network response was not ok');
//         return res.json();
//       })
//       .then((rows: SummaryRow[]) => {
//         setData(rows);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error('fetch monthly summary error:', err);
//         setError('Failed to load data');
//         setLoading(false);
//       });
//   }, []);

//   if (loading) {
//     return <div className="p-4">Loading...</div>;
//   }
//   if (error) {
//     return <div className="p-4 text-red-500">Error: {error}</div>;
//   }
//   if (data.length === 0) {
//     return <div className="p-4">No data to display</div>;
//   }

//   // Prepare chart data
//   const labels = data.map((row) => {
//     const dt = new Date(row.month);
//     return dt.toLocaleString('default', { month: 'short', year: 'numeric' });
//   }).reverse();  // reverse if you want oldest first

//   const incomeValues = data.map((row) => parseFloat(row.total_income)).reverse();
//   const expenseValues = data.map((row) => parseFloat(row.total_expenses)).reverse();

//   const chartData = {
//     labels,
//     datasets: [
//       {
//         label: 'Income',
//         data: incomeValues,
//         backgroundColor: 'rgba(34, 197, 94, 0.7)', // greenish
//       },
//       {
//         label: 'Expenses',
//         data: expenseValues,
//         backgroundColor: 'rgba(239, 68, 68, 0.7)', // redish
//       },
//     ],
//   };

//   const options: ChartOptions<'bar'> = {
//     responsive: true,
//     plugins: {
//       legend: {
//         position: 'top',
//       },
//       tooltip: {
//         enabled: true,
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//       },
//     },
//   };

//   return (
//     <div className="bg-white shadow rounded p-4">
//       <h2 className="text-lg font-semibold mb-4">Monthly Income vs Expenses</h2>
//       <Bar options={options} data={chartData} />
//       {/* Optionally, also show a table below */}
//       <div className="mt-6 overflow-x-auto">
//         <table className="w-full text-sm table-auto border">
//           <thead>
//             <tr className="bg-gray-100">
//               <th className="px-2 py-1">Month</th>
//               <th className="px-2 py-1">Income</th>
//               <th className="px-2 py-1">Expenses</th>
//               <th className="px-2 py-1">Net</th>
//             </tr>
//           </thead>
//           <tbody>
//             {data.map((row, idx) => {
//               const dt = new Date(row.month);
//               const label = dt.toLocaleString('default', {
//                 month: 'short',
//                 year: 'numeric',
//               });
//               const inc = parseFloat(row.total_income);
//               const exp = parseFloat(row.total_expenses);
//               const net = parseFloat(row.net_balance);
//               return (
//                 <tr key={idx} className="hover:bg-gray-50">
//                   <td className="px-2 py-1">{label}</td>
//                   <td className="px-2 py-1">₹{inc}</td>
//                   <td className="px-2 py-1">₹{exp}</td>
//                   <td className={`px-2 py-1 ${net < 0 ? 'text-red-600' : 'text-green-600'}`}>
//                     ₹{net}
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }


// components/analytics/MonthlyIncomeExpensesChart.tsx
'use client';

import { useState, useEffect } from 'react';

interface MonthlySummary {
  month: string;
  total_income: number;
  total_expenses: number;
  net_balance: number;
}

/**
 * MonthlyIncomeExpensesChart - Visualizes monthly income, expenses, and net balance trends
 * Helps users understand their financial trajectory and seasonal patterns
 * Provides insights into savings rate and financial health over time
 */
export default function MonthlyIncomeExpensesChart() {
  const [data, setData] = useState<MonthlySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'6m' | '1y' | 'all'>('1y');
  const [view, setView] = useState<'bars' | 'lines' | 'stacked'>('bars');

  useEffect(() => {
    const fetchMonthlySummary = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/dashboard/monthly-summary');
        
        if (!response.ok) {
          throw new Error('Failed to fetch monthly summary');
        }
        
        const summaryData = await response.json();
        setData(summaryData);
      } catch (err) {
        console.error('Error fetching monthly summary:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonthlySummary();
  }, []);

  // Filter data based on time range
  const filteredData = (() => {
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (timeRange) {
      case '6m':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
      default:
        return data;
    }
    
    return data.filter(item => new Date(item.month) >= cutoffDate);
  })();

  // Calculate chart metrics
  const chartMetrics = {
    maxAmount: Math.max(...filteredData.map(item => Math.max(item.total_income, item.total_expenses))),
    totalIncome: filteredData.reduce((sum, item) => sum + item.total_income, 0),
    totalExpenses: filteredData.reduce((sum, item) => sum + item.total_expenses, 0),
    totalNet: filteredData.reduce((sum, item) => sum + item.net_balance, 0),
    averageSavingsRate: filteredData.length > 0 
      ? (filteredData.reduce((sum, item) => sum + (item.net_balance / item.total_income), 0) / filteredData.length) * 100 
      : 0
  };

  // Format month for display
  const formatMonth = (monthString: string) => {
    const date = new Date(monthString);
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      year: timeRange === '6m' ? undefined : '2-digit'
    });
  };

  // Get net balance status
  const getNetStatus = (netBalance: number) => {
    if (netBalance > 0) return { color: 'text-green-600', bgColor: 'bg-green-50', icon: '📈' };
    if (netBalance < 0) return { color: 'text-red-600', bgColor: 'bg-red-50', icon: '📉' };
    return { color: 'text-gray-600', bgColor: 'bg-gray-50', icon: '➡️' };
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Monthly Income vs Expenses</h3>
          <p className="text-sm text-gray-600">Track your financial progress over time</p>
        </div>
        
        <div className="mt-3 lg:mt-0 flex space-x-2">
          {/* Time Range Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { key: '6m', label: '6M' },
              { key: '1y', label: '1Y' },
              { key: 'all', label: 'All' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTimeRange(key as any)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  timeRange === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* View Type Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { key: 'bars', label: 'Bars', icon: '📊' },
              { key: 'lines', label: 'Lines', icon: '📈' },
              { key: 'stacked', label: 'Stacked', icon: '🔄' }
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setView(key as any)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  view === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={label}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">📊</div>
          <p>No monthly summary data available</p>
          <p className="text-sm">Add transactions to see income vs expenses trends</p>
        </div>
      ) : (
        <>
          {/* Bar Chart */}
          <div className="h-64 flex items-end space-x-1 mb-6 bg-gray-50 rounded-lg p-4">
            {filteredData.map((month, index) => {
              const incomeHeight = (month.total_income / chartMetrics.maxAmount) * 100;
              const expensesHeight = (month.total_expenses / chartMetrics.maxAmount) * 100;
              const netStatus = getNetStatus(month.net_balance);
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center justify-end space-y-1 group">
                  {/* Bars Container */}
                  <div className="flex items-end space-x-1 w-full" style={{ height: '180px' }}>
                    {/* Income Bar */}
                    <div 
                      className="flex-1 bg-green-500 rounded-t transition-all duration-500 hover:bg-green-600 relative group"
                      style={{ height: `${incomeHeight}%` }}
                      title={`Income: ₹${month.total_income.toLocaleString('en-IN')}`}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ₹{month.total_income.toLocaleString('en-IN')}
                      </div>
                    </div>
                    
                    {/* Expenses Bar */}
                    <div 
                      className="flex-1 bg-red-500 rounded-t transition-all duration-500 hover:bg-red-600 relative group"
                      style={{ height: `${expensesHeight}%` }}
                      title={`Expenses: ₹${month.total_expenses.toLocaleString('en-IN')}`}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ₹{month.total_expenses.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Month Label */}
                  <div className="text-xs text-gray-500 text-center h-6 flex items-center">
                    {formatMonth(month.month)}
                  </div>
                  
                  {/* Net Balance Indicator */}
                  <div 
                    className={`text-xs font-medium px-2 py-1 rounded-full ${netStatus.bgColor} ${netStatus.color}`}
                    title={`Net: ₹${month.net_balance.toLocaleString('en-IN')}`}
                  >
                    {netStatus.icon} ₹{Math.abs(month.net_balance).toLocaleString('en-IN')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex justify-center space-x-6 text-sm mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600">Income</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-600">Expenses</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-600">Net Balance</span>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ₹{chartMetrics.totalIncome.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-gray-600">Total Income</div>
              <div className="text-xs text-green-500 mt-1">
                ₹{(chartMetrics.totalIncome / filteredData.length).toLocaleString('en-IN')}/month
              </div>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                ₹{chartMetrics.totalExpenses.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-gray-600">Total Expenses</div>
              <div className="text-xs text-red-500 mt-1">
                ₹{(chartMetrics.totalExpenses / filteredData.length).toLocaleString('en-IN')}/month
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className={`text-2xl font-bold ${
                chartMetrics.totalNet >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                ₹{chartMetrics.totalNet.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-gray-600">Net Balance</div>
              <div className="text-xs text-blue-500 mt-1">
                {chartMetrics.totalNet >= 0 ? 'Surplus' : 'Deficit'}
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className={`text-2xl font-bold ${
                chartMetrics.averageSavingsRate >= 20 ? 'text-purple-600' : 
                chartMetrics.averageSavingsRate >= 10 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {chartMetrics.averageSavingsRate.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">Avg Savings Rate</div>
              <div className="text-xs text-purple-500 mt-1">
                {chartMetrics.averageSavingsRate >= 20 ? 'Excellent' : 
                 chartMetrics.averageSavingsRate >= 10 ? 'Good' : 'Needs Improvement'}
              </div>
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">📈 Trend Analysis</h4>
            <div className="text-sm text-gray-600 space-y-1">
              {chartMetrics.totalNet > 0 ? (
                <p className="text-green-600">
                  ✅ You're maintaining a positive cash flow with an average savings rate of {chartMetrics.averageSavingsRate.toFixed(1)}%
                </p>
              ) : (
                <p className="text-red-600">
                  ⚠️ You're spending more than you earn. Consider reducing expenses or increasing income.
                </p>
              )}
              
              {filteredData.length >= 3 && (
                <p>
                  Over {filteredData.length} months, your average monthly net is{' '}
                  <span className={`font-medium ${
                    (chartMetrics.totalNet / filteredData.length) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ₹{(chartMetrics.totalNet / filteredData.length).toLocaleString('en-IN')}
                  </span>
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}