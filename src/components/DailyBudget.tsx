// // components/DailyBudget.tsx
// 'use client';
// import { useEffect, useState } from 'react';

// type Daily = {
//   transaction_date: string;
//   daily_total: number;
//   daily_limit: number;
//   over_budget_amount: number;
//   budget_status: string;
//   transaction_count: number;
// };

// export default function DailyBudget() {
//   const [data, setData] = useState<Daily[]>([]);

//   useEffect(() => {
//     fetch('/api/dashboard/daily-budget')
//       .then((res) => res.json())
//       .then((rows) => setData(rows))
//       .catch((err) => console.error('fetch daily budget:', err));
//   }, []);

//   return (
//     <div className="bg-white shadow rounded p-4 mt-4">
//       <h2 className="text-lg font-semibold mb-2">Daily Spending vs Budget</h2>
//       <div className="overflow-x-auto">
//         <table className="w-full text-sm table-auto border">
//           <thead>
//             <tr className="bg-gray-100">
//               <th className="px-2 py-1">Date</th>
//               <th className="px-2 py-1">Spent</th>
//               <th className="px-2 py-1">Limit</th>
//               <th className="px-2 py-1">Over / Under</th>
//               <th className="px-2 py-1">Status</th>
//               <th className="px-2 py-1">Count</th>
//             </tr>
//           </thead>
//           <tbody>
//             {data.map((row, i) => (
//               <tr key={i} className="hover:bg-gray-50">
//                 <td className="px-2 py-1">{new Date(row.transaction_date).toLocaleDateString()}</td>
//                 <td className="px-2 py-1">₹{row.daily_total}</td>
//                 <td className="px-2 py-1">₹{row.daily_limit}</td>
//                 <td className="px-2 py-1">{row.over_budget_amount}</td>
//                 <td className="px-2 py-1">{row.budget_status}</td>
//                 <td className="px-2 py-1">{row.transaction_count}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// components/budget/DailyBudget.tsx
'use client';

import { useState, useEffect } from 'react';

interface DailyBudgetData {
  transaction_date: string;
  daily_total: string;
  daily_limit: string;
  over_budget_amount: string;
  budget_status: string;
  transaction_count: number;
}

/**
 * DailyBudget - Shows daily budget adherence with visual indicators
 * Tracks daily spending against calculated budget limits
 * Provides immediate feedback on budget performance
 */
export default function DailyBudget() {
  const [data, setData] = useState<DailyBudgetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  useEffect(() => {
    const fetchDailyBudget = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/dashboard/daily-budget');
        
        if (!response.ok) {
          throw new Error('Failed to fetch daily budget data');
        }
        
        const budgetData = await response.json();
        setData(budgetData);
      } catch (err) {
        console.error('Error fetching daily budget:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDailyBudget();
  }, []);

  // Filter data based on time range
  const filteredData = timeRange === 'week' 
    ? data.slice(0, 7) // Last 7 days
    : data.slice(0, 30); // Last 30 days

  // Get status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'SIGNIFICANTLY_OVER':
        return { 
          color: 'text-red-600', 
          bgColor: 'bg-red-50', 
          borderColor: 'border-red-200',
          icon: '🚨',
          label: 'Significantly Over',
          progressColor: 'bg-red-500'
        };
      case 'OVER_BUDGET':
        return { 
          color: 'text-orange-600', 
          bgColor: 'bg-orange-50', 
          borderColor: 'border-orange-200',
          icon: '⚠️',
          label: 'Over Budget',
          progressColor: 'bg-orange-500'
        };
      case 'WITHIN_BUDGET':
        return { 
          color: 'text-green-600', 
          bgColor: 'bg-green-50', 
          borderColor: 'border-green-200',
          icon: '✅',
          label: 'Within Budget',
          progressColor: 'bg-green-500'
        };
      case 'UNDER_BUDGET':
        return { 
          color: 'text-blue-600', 
          bgColor: 'bg-blue-50', 
          borderColor: 'border-blue-200',
          icon: '👍',
          label: 'Under Budget',
          progressColor: 'bg-blue-500'
        };
      default:
        return { 
          color: 'text-gray-600', 
          bgColor: 'bg-gray-50', 
          borderColor: 'border-gray-200',
          icon: '📊',
          label: 'Unknown',
          progressColor: 'bg-gray-500'
        };
    }
  };

  // Calculate overall performance
  const performance = {
    withinBudget: filteredData.filter(d => 
      d.budget_status === 'WITHIN_BUDGET' || d.budget_status === 'UNDER_BUDGET'
    ).length,
    overBudget: filteredData.filter(d => 
      d.budget_status === 'OVER_BUDGET' || d.budget_status === 'SIGNIFICANTLY_OVER'
    ).length,
    totalDays: filteredData.length
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Daily Budget Tracking</h3>
        
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { key: 'week', label: 'Last 7 Days' },
            { key: 'month', label: 'Last 30 Days' }
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
      </div>

      {/* Performance Summary */}
      {performance.totalDays > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{performance.withinBudget}</p>
              <p className="text-xs text-gray-600">On Budget Days</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{performance.overBudget}</p>
              <p className="text-xs text-gray-600">Over Budget Days</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {Math.round((performance.withinBudget / performance.totalDays) * 100)}%
              </p>
              <p className="text-xs text-gray-600">Success Rate</p>
            </div>
          </div>
        </div>
      )}

      {/* Daily Budget List */}
      <div className="space-y-4">
        {filteredData.map((day, index) => {
          const dailyTotal = parseFloat(day.daily_total);
          const dailyLimit = parseFloat(day.daily_limit);
          const usagePercentage = Math.min((dailyTotal / dailyLimit) * 100, 150); // Cap at 150% for display
          const statusConfig = getStatusConfig(day.budget_status);
          
          return (
            <div 
              key={index} 
              className={`border rounded-lg p-4 ${statusConfig.borderColor} ${statusConfig.bgColor} hover:shadow-md transition-shadow`}
            >
              {/* Date and Status */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{statusConfig.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {new Date(day.transaction_date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {day.transaction_count} transactions
                    </p>
                  </div>
                </div>
                
                <span className={`text-sm font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>

              {/* Budget Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Spent: ₹{dailyTotal.toLocaleString('en-IN')}</span>
                  <span className="text-gray-600">Limit: ₹{dailyLimit.toLocaleString('en-IN')}</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${statusConfig.progressColor}`}
                    style={{ width: `${usagePercentage}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>100%</span>
                  <span>150%</span>
                </div>
              </div>

              {/* Over Budget Warning */}
              {day.over_budget_amount && parseFloat(day.over_budget_amount) > 0 && (
                <div className="mt-2 text-sm text-red-600 font-medium">
                  Over budget by ₹{parseFloat(day.over_budget_amount).toLocaleString('en-IN')}
                </div>
              )}

              {/* Under Budget Celebration */}
              {dailyTotal < dailyLimit * 0.8 && (
                <div className="mt-2 text-sm text-blue-600">
                  Great job! You saved ₹{(dailyLimit - dailyTotal).toLocaleString('en-IN')} today
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">💰</div>
          <p>No daily budget data available</p>
          <p className="text-sm">Add transactions to start tracking your daily budget</p>
        </div>
      )}

      {/* Budget Tips */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">💡 Budget Tips</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Aim to stay within 80-100% of your daily budget</li>
          <li>• Review over-budget days to identify spending patterns</li>
          <li>• Adjust your monthly budget if you consistently exceed limits</li>
        </ul>
      </div>
    </div>
  );
}