// // components/DiscretionaryVsEssential.tsx
// 'use client';
// import { useEffect, useState } from 'react';

// type Segment = {
//   spending_type: string;
//   transaction_count: number;
//   total_amount: number;
//   percentage: number;
//   average_transaction: number;
// };

// export default function DiscretionaryVsEssential() {
//   const [data, setData] = useState<Segment[]>([]);

//   useEffect(() => {
//     fetch('/api/dashboard/essential-vs-discretionary')
//       .then((res) => res.json())
//       .then((rows) => setData(rows))
//       .catch((err) => console.error('fetch essential vs discretionary:', err));
//   }, []);

//   return (
//     <div className="bg-white shadow rounded p-4">
//       <h2 className="text-lg font-semibold mb-2">Essential vs Discretionary Spend</h2>
//       <div className="flex space-x-4">
//         {data.map((row, i) => (
//           <div key={i} className="p-2 flex-1 bg-gray-50 rounded">
//             <h3 className="font-medium">{row.spending_type}</h3>
//             <p>Total: ₹{row.total_amount}</p>
//             <p>{row.percentage}%</p>
//             <p>Avg transaction: ₹{row.average_transaction}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// components/analytics/DiscretionaryVsEssential.tsx
'use client';

import { useState, useEffect } from 'react';

interface SpendingBreakdown {
  spending_type: string;
  transaction_count: number;
  total_amount: string;
  percentage: string;
  average_transaction: string;
}

/**
 * DiscretionaryVsEssential - Analyzes spending by essential vs discretionary categories
 * Essential: Rent, Utilities, Groceries, Healthcare, Insurance, Loan Payment
 * Discretionary: Everything else (Entertainment, Dining, Shopping, etc.)
 * Helps users understand their necessary vs optional spending
 */
export default function DiscretionaryVsEssential() {
  const [data, setData] = useState<SpendingBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'current' | 'last3' | 'last6'>('current');

  useEffect(() => {
    const fetchSpendingBreakdown = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/dashboard/essential-vs-discretionary');
        
        if (!response.ok) {
          throw new Error('Failed to fetch spending breakdown');
        }
        
        const breakdownData = await response.json();
        setData(breakdownData);
      } catch (err) {
        console.error('Error fetching spending breakdown:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpendingBreakdown();
  }, []);

  // Calculate totals
  const totals = {
    essential: data.find(item => item.spending_type === 'Essential'),
    discretionary: data.find(item => item.spending_type === 'Discretionary'),
    totalSpending: data.reduce((sum, item) => sum + parseFloat(item.total_amount), 0),
    totalTransactions: data.reduce((sum, item) => sum + item.transaction_count, 0)
  };

  // Get ideal ratio (50-30-20 rule: 50% essential, 30% discretionary, 20% savings)
  const idealRatio = {
    essential: 50,
    discretionary: 30,
    savings: 20
  };

  // Calculate actual ratios
  const actualRatios = {
    essential: totals.essential ? parseFloat(totals.essential.percentage) : 0,
    discretionary: totals.discretionary ? parseFloat(totals.discretionary.percentage) : 0,
    savings: 100 - (totals.essential ? parseFloat(totals.essential.percentage) : 0) - (totals.discretionary ? parseFloat(totals.discretionary.percentage) : 0)
  };

  // Get health status
  const getHealthStatus = () => {
    const discretionaryRatio = actualRatios.discretionary;
    
    if (discretionaryRatio > 40) return { status: 'Poor', color: 'text-red-600', bgColor: 'bg-red-50' };
    if (discretionaryRatio > 30) return { status: 'Fair', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    if (discretionaryRatio > 20) return { status: 'Good', color: 'text-green-600', bgColor: 'bg-green-50' };
    return { status: 'Excellent', color: 'text-blue-600', bgColor: 'bg-blue-50' };
  };

  const healthStatus = getHealthStatus();

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Essential vs Discretionary</h3>
          <p className="text-sm text-gray-600">Spending breakdown by necessity</p>
        </div>
        
        {/* Health Status */}
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${healthStatus.bgColor} ${healthStatus.color}`}>
          {healthStatus.status} Health
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">📊</div>
          <p>No spending data available</p>
          <p className="text-sm">Add transactions to see spending breakdown</p>
        </div>
      ) : (
        <>
          {/* Progress Bars */}
          <div className="space-y-6">
            {/* Essential Spending */}
            {totals.essential && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-500 text-lg">🏠</span>
                    <span className="font-medium text-gray-900">Essential Spending</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      ₹{parseFloat(totals.essential.total_amount).toLocaleString('en-IN')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {totals.essential.percentage}% of total • {totals.essential.transaction_count} transactions
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="h-4 rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${actualRatios.essential}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Actual: {actualRatios.essential.toFixed(1)}%</span>
                    <span>Ideal: {idealRatio.essential}%</span>
                    <span className={actualRatios.essential > idealRatio.essential ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                      {actualRatios.essential > idealRatio.essential ? 'Over' : 'Under'} {(Math.abs(actualRatios.essential - idealRatio.essential)).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Average Transaction:</span> ₹{parseFloat(totals.essential.average_transaction).toLocaleString('en-IN')}
                </div>
              </div>
            )}

            {/* Discretionary Spending */}
            {totals.discretionary && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-500 text-lg">🎮</span>
                    <span className="font-medium text-gray-900">Discretionary Spending</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      ₹{parseFloat(totals.discretionary.total_amount).toLocaleString('en-IN')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {totals.discretionary.percentage}% of total • {totals.discretionary.transaction_count} transactions
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="h-4 rounded-full bg-purple-500 transition-all duration-500"
                      style={{ width: `${actualRatios.discretionary}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Actual: {actualRatios.discretionary.toFixed(1)}%</span>
                    <span>Ideal: {idealRatio.discretionary}%</span>
                    <span className={actualRatios.discretionary > idealRatio.discretionary ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                      {actualRatios.discretionary > idealRatio.discretionary ? 'Over' : 'Under'} {(Math.abs(actualRatios.discretionary - idealRatio.discretionary)).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Average Transaction:</span> ₹{parseFloat(totals.discretionary.average_transaction).toLocaleString('en-IN')}
                </div>
              </div>
            )}
          </div>

          {/* Summary Card */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">📈 Spending Health Analysis</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="text-gray-600">Total Spending:</span>
                <div className="font-semibold text-gray-900">
                  ₹{totals.totalSpending.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Total Transactions:</span>
                <div className="font-semibold text-gray-900">
                  {totals.totalTransactions}
                </div>
              </div>
            </div>

            {/* Health Insights */}
            <div className="text-sm text-gray-600 space-y-2">
              {actualRatios.discretionary > 40 && (
                <p className="text-red-600 font-medium">
                  ⚠️ Your discretionary spending is high. Consider reducing non-essential expenses to improve savings.
                </p>
              )}
              {actualRatios.discretionary <= 40 && actualRatios.discretionary > 30 && (
                <p className="text-orange-600">
                  ℹ️ Your discretionary spending is moderate. Look for opportunities to optimize and increase savings.
                </p>
              )}
              {actualRatios.discretionary <= 30 && (
                <p className="text-green-600">
                  ✅ Your discretionary spending is well controlled. Great financial discipline!
                </p>
              )}
              
              {actualRatios.essential > 60 && (
                <p className="text-yellow-600">
                  💡 Your essential spending is high. Review fixed costs and look for ways to reduce necessary expenses.
                </p>
              )}
            </div>

            {/* Ideal vs Actual Comparison */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <h5 className="text-xs font-medium text-gray-500 mb-2">50-30-20 Rule Comparison</h5>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-semibold text-blue-600">Essential</div>
                  <div>Ideal: 50%</div>
                  <div>Actual: {actualRatios.essential.toFixed(1)}%</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-purple-600">Discretionary</div>
                  <div>Ideal: 30%</div>
                  <div>Actual: {actualRatios.discretionary.toFixed(1)}%</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-green-600">Savings</div>
                  <div>Ideal: 20%</div>
                  <div>Actual: {actualRatios.savings.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}