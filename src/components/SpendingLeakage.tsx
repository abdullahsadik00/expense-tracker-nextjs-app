// // components/SpendingLeakage.tsx
// 'use client';
// import { useEffect, useState } from 'react';

// type Leak = {
//   category_name: string;
//   current_month_avg: number;
//   previous_months_avg: number;
//   increase_percentage: number;
// };

// export default function SpendingLeakage() {
//   const [data, setData] = useState<Leak[]>([]);

//   useEffect(() => {
//     fetch('/api/dashboard/spending-leakage')
//       .then((res) => res.json())
//       .then((rows) => setData(rows))
//       .catch((err) => console.error('fetch leakage:', err));
//   }, []);

//   return (
//     <div className="bg-white shadow rounded p-4">
//       <h2 className="text-lg font-semibold mb-2">Spending Leakage (vs previous)</h2>
//       <div className="overflow-x-auto">
//         <table className="w-full text-sm table-auto border">
//           <thead>
//             <tr className="bg-gray-100">
//               <th className="px-2 py-1">Category</th>
//               <th className="px-2 py-1">Current Avg</th>
//               <th className="px-2 py-1">Prev Avg</th>
//               <th className="px-2 py-1">Increase %</th>
//             </tr>
//           </thead>
//           <tbody>
//             {data.map((row, i) => (
//               <tr key={i} className="hover:bg-gray-50">
//                 <td className="px-2 py-1">{row.category_name}</td>
//                 <td className="px-2 py-1">₹{row.current_month_avg}</td>
//                 <td className="px-2 py-1">₹{row.previous_months_avg}</td>
//                 <td className="px-2 py-1 text-red-600">
//                   +{row.increase_percentage}%
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// components/analytics/SpendingLeakage.tsx
'use client';

import { useState, useEffect } from 'react';

interface SpendingLeakage {
  category_name: string;
  current_month_avg: number;
  previous_months_avg: number;
  increase_amount: number;
  increase_percentage: number;
  transaction_count: number;
}

/**
 * SpendingLeakage - Identifies categories with significant spending increases
 * Detects budget creep and unusual spending patterns
 * Helps users spot areas where spending is growing unexpectedly
 */
export default function SpendingLeakage() {
  const [leakages, setLeakages] = useState<SpendingLeakage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'percentage' | 'amount' | 'category'>('percentage');

  useEffect(() => {
    const fetchSpendingLeakage = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/dashboard/spending-leakage');
        
        if (!response.ok) {
          throw new Error('Failed to fetch spending leakage data');
        }
        
        const data = await response.json();
        setLeakages(data);
      } catch (err) {
        console.error('Error fetching spending leakage:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpendingLeakage();
  }, []);

  // Sort leakages
  const sortedLeakages = [...leakages].sort((a, b) => {
    switch (sortBy) {
      case 'percentage':
        return b.increase_percentage - a.increase_percentage;
      case 'amount':
        return b.increase_amount - a.increase_amount;
      case 'category':
        return a.category_name.localeCompare(b.category_name);
      default:
        return 0;
    }
  });

  // Get severity level
  const getSeverity = (percentage: number) => {
    if (percentage > 100) return { level: 'Critical', color: 'text-red-600', bgColor: 'bg-red-50', icon: '🚨' };
    if (percentage > 50) return { level: 'High', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: '⚠️' };
    if (percentage > 25) return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: '📈' };
    return { level: 'Low', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: 'ℹ️' };
  };

  // Calculate summary
  const summary = {
    totalLeakages: leakages.length,
    totalIncrease: leakages.reduce((sum, leak) => sum + leak.increase_amount, 0),
    averageIncrease: leakages.length > 0 ? leakages.reduce((sum, leak) => sum + leak.increase_percentage, 0) / leakages.length : 0,
    criticalLeakages: leakages.filter(leak => leak.increase_percentage > 100).length
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with Summary */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Spending Leakage Alerts</h3>
            <p className="text-sm text-gray-600">
              Categories with significant spending increases
            </p>
          </div>
          
          {/* Summary Stats */}
          <div className="mt-3 sm:mt-0 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-red-600">{summary.criticalLeakages}</div>
              <div className="text-xs text-gray-500">Critical</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">{summary.totalLeakages}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                ₹{summary.totalIncrease.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-gray-500">Total Increase</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="px-6 py-4 bg-gray-50 border-b">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Sort by:</span>
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'percentage', label: 'Increase %' },
              { key: 'amount', label: 'Increase Amount' },
              { key: 'category', label: 'Category' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key as any)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  sortBy === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leakages List */}
      <div className="p-6">
        {sortedLeakages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">🎉</div>
            <p>No spending leakage detected</p>
            <p className="text-sm">Your spending patterns are consistent across categories</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedLeakages.map((leakage, index) => {
              const severity = getSeverity(leakage.increase_percentage);
              
              return (
                <div 
                  key={index}
                  className={`border rounded-lg p-4 ${severity.bgColor} hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className={`text-2xl ${severity.color}`}>
                        {severity.icon}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            {leakage.category_name}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${severity.bgColor} ${severity.color}`}>
                            {severity.level} Risk
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600">
                          Significant spending increase detected
                        </p>
                        
                        {/* Spending Comparison */}
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Current Avg:</span>
                            <div className="font-semibold text-red-600">
                              ₹{leakage.current_month_avg.toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Previous Avg:</span>
                            <div className="font-semibold text-gray-900">
                              ₹{leakage.previous_months_avg.toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Increase:</span>
                            <div className="font-semibold text-red-600">
                              +₹{leakage.increase_amount.toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Transactions:</span>
                            <div className="font-semibold text-gray-900">
                              {leakage.transaction_count}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Percentage Increase */}
                    <div className="text-right">
                      <div className={`text-lg font-bold ${severity.color}`}>
                        +{leakage.increase_percentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        Increase
                      </div>
                    </div>
                  </div>

                  {/* Increase Visualization */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Previous: ₹{leakage.previous_months_avg.toLocaleString('en-IN')}</span>
                      <span>Current: ₹{leakage.current_month_avg.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-red-500 transition-all duration-500"
                        style={{ 
                          width: `${Math.min((leakage.current_month_avg / (leakage.previous_months_avg + leakage.current_month_avg)) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex space-x-2">
                    <button className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors">
                      View Transactions
                    </button>
                    <button className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-md hover:bg-red-200 transition-colors">
                      Set Budget Limit
                    </button>
                    <button className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-200 transition-colors">
                      Analyze Trend
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Monthly Impact Summary */}
      {leakages.length > 0 && (
        <div className="px-6 py-4 bg-red-50 border-t rounded-b-lg">
          <div className="text-center">
            <h4 className="font-semibold text-gray-900 mb-2">
              💸 Monthly Budget Impact
            </h4>
            <p className="text-sm text-gray-700">
              These increases are costing you an additional{' '}
              <span className="font-bold text-red-600">
                ₹{summary.totalIncrease.toLocaleString('en-IN')}
              </span>{' '}
              per month
            </p>
            <div className="mt-1 text-xs text-gray-600">
              Annual impact: ₹{(summary.totalIncrease * 12).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}