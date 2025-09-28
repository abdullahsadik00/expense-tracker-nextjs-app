// // components/WeeklyTrends.tsx
// 'use client';
// import { useEffect, useState } from 'react';

// type Week = {
//   week_number: number;
//   week_start: string;
//   week_end: string;
//   weekly_total: number;
//   transaction_count: number;
//   previous_week_total: number | null;
//   week_over_week_change: number | null;
//   week_alert: string;
// };

// export default function WeeklyTrends() {
//   const [data, setData] = useState<Week[]>([]);

//   useEffect(() => {
//     fetch('/api/dashboard/weekly-trend')
//       .then((res) => res.json())
//       .then((rows) => {
//       console.log('weekly trend data:', rows);
//         setData(rows)
//       })
//       .catch((err) => console.error('fetch weekly trend:', err));
//   }, []);

//   return (
//     <div className="bg-white shadow rounded p-4 mt-4">
//       <h2 className="text-lg font-semibold mb-2">Weekly Spending Trend</h2>
//       <div className="overflow-x-auto">
//         <table className="w-full text-sm table-auto border">
//           <thead>
//             <tr className="bg-gray-100">
//               <th className="px-2 py-1">Week#</th>
//               <th className="px-2 py-1">Start</th>
//               <th className="px-2 py-1">End</th>
//               <th className="px-2 py-1">Total</th>
//               <th className="px-2 py-1">WoW %</th>
//               <th className="px-2 py-1">Alert</th>
//             </tr>
//           </thead>
//           <tbody>
//             {data.map((row, i) => (
//               <tr key={i} className="hover:bg-gray-50">
//                 <td className="px-2 py-1">{row.week_number}</td>
//                 <td className="px-2 py-1">{new Date(row.week_start).toLocaleDateString()}</td>
//                 <td className="px-2 py-1">{new Date(row.week_end).toLocaleDateString()}</td>
//                 <td className="px-2 py-1">₹{row.weekly_total}</td>
//                 <td className="px-2 py-1">
//                   {row.week_over_week_change != null ? `${row.week_over_week_change}%` : '-'}
//                 </td>
//                 <td className="px-2 py-1">{row.week_alert}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// components/analytics/WeeklyTrends.tsx
'use client';

import { useState, useEffect } from 'react';

interface WeeklyTrendData {
  year: number;
  week_number: number;
  week_start: string;
  week_end: string;
  weekly_total: string;
  transaction_count: number;
  previous_week_total: number | null;
  week_over_week_change: number | null;
  week_alert: string;
}

/**
 * WeeklyTrends - Shows weekly spending trends with week-over-week changes
 * Helps identify spending patterns and unusual weeks
 * Uses your weekly-trend API route data
 */
export default function WeeklyTrends() {
  const [data, setData] = useState<WeeklyTrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeeklyTrends = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/dashboard/weekly-trend');
        
        if (!response.ok) {
          throw new Error('Failed to fetch weekly trends');
        }
        
        const trendData = await response.json();
        setData(trendData);
      } catch (err) {
        console.error('Error fetching weekly trends:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeeklyTrends();
  }, []);

  // Format currency display
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Get alert color and icon
  const getAlertConfig = (alert: string) => {
    switch (alert) {
      case 'HIGH_SPENDING_WEEK':
        return { color: 'text-red-600', bgColor: 'bg-red-50', icon: '🚨', text: 'High Spending' };
      case 'HIGH_FREQUENCY_WEEK':
        return { color: 'text-orange-600', bgColor: 'bg-orange-50', icon: '⚡', text: 'High Frequency' };
      default:
        return { color: 'text-green-600', bgColor: 'bg-green-50', icon: '✅', text: 'Normal' };
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Weekly Spending Trends</h3>
          <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Spending Trends</h3>
        <div className="text-center py-8 text-red-600">
          <div className="text-2xl mb-2">⚠️</div>
          <p>Failed to load weekly trends</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Weekly Spending Trends</h3>
        <div className="text-sm text-gray-500">
          Last {data.length} weeks
        </div>
      </div>

      {/* Weekly Trends List */}
      <div className="space-y-4">
        {data.map((week, index) => {
          const alertConfig = getAlertConfig(week.week_alert);
          const change = week.week_over_week_change;
          
          return (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              {/* Week Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Week {week.week_number} • {new Date(week.week_start).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short' 
                    })} - {new Date(week.week_end).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {week.transaction_count} transactions
                  </p>
                </div>
                
                {/* Alert Badge */}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${alertConfig.bgColor} ${alertConfig.color}`}>
                  <span className="mr-1">{alertConfig.icon}</span>
                  {alertConfig.text}
                </span>
              </div>

              {/* Spending Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Spending</p>
                  <p className="font-semibold text-lg text-gray-900">
                    {formatCurrency(week.weekly_total)}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-600">Week-over-Week</p>
                  <p className={`font-semibold text-lg ${
                    change && change > 0 ? 'text-red-600' : 
                    change && change < 0 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {change ? `${change > 0 ? '+' : ''}${change}%` : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Progress Bar for High Spending Alert */}
              {week.week_alert === 'HIGH_SPENDING_WEEK' && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Spending Level</span>
                    <span>High</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
              )}

              {/* Additional Context */}
              {week.previous_week_total && (
                <div className="mt-2 text-xs text-gray-500">
                  Previous week: {formatCurrency(week.previous_week_total)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      {data.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Avg. Weekly</p>
              <p className="font-semibold text-gray-900">
                {formatCurrency(
                  data.reduce((sum, week) => sum + parseFloat(week.weekly_total), 0) / data.length
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Highest Week</p>
              <p className="font-semibold text-red-600">
                {formatCurrency(Math.max(...data.map(w => parseFloat(w.weekly_total))))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Alerts</p>
              <p className="font-semibold text-orange-600">
                {data.filter(w => w.week_alert !== 'NORMAL').length}
              </p>
            </div>
          </div>
        </div>
      )}

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">📊</div>
          <p>No weekly trend data available</p>
          <p className="text-sm">Add more transactions to see weekly patterns</p>
        </div>
      )}
    </div>
  );
}