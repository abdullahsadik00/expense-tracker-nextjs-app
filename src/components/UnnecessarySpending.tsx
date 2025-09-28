// // components/UnnecessarySpending.tsx
// 'use client';
// import { useEffect, useState } from 'react';

// type Unnecessary = {
//   transaction_date: string;
//   merchant: string;
//   amount: number;
//   category_name: string;
//   spending_alert: string;
//   description: string | null;
// };

// export default function UnnecessarySpending() {
//   const [data, setData] = useState<Unnecessary[]>([]);

//   useEffect(() => {
//     fetch('/api/dashboard/unnecessary-spending')
//       .then((res) => res.json())
//       .then((rows) => {
//       console.log('unnecessary spending data:', rows);
//         setData(rows)
//       })
//       .catch((err) => console.error('fetch unnecessary:', err));
//   }, []);

//   return (
//     <div className="bg-white shadow rounded p-4 mt-4">
//       <h2 className="text-lg font-semibold mb-2">Unnecessary / Discretionary Spending Alerts</h2>
//       <div className="overflow-x-auto">
//         <table className="w-full text-sm table-auto border">
//           <thead>
//             <tr className="bg-gray-100">
//               <th className="px-2 py-1">Date</th>
//               <th className="px-2 py-1">Merchant</th>
//               <th className="px-2 py-1">Amount</th>
//               <th className="px-2 py-1">Category</th>
//               <th className="px-2 py-1">Alert</th>
//               <th className="px-2 py-1">Desc</th>
//             </tr>
//           </thead>
//           <tbody>
//             {data.map((row, i) => (
//               <tr key={i} className="hover:bg-gray-50">
//                 <td className="px-2 py-1">{new Date(row.transaction_date).toLocaleDateString()}</td>
//                 <td className="px-2 py-1">{row.merchant}</td>
//                 <td className="px-2 py-1">₹{row.amount}</td>
//                 <td className="px-2 py-1">{row.category_name}</td>
//                 <td className="px-2 py-1">
//                   <span className="px-1 py-0.5 bg-red-200 text-red-800 rounded">
//                     {row.spending_alert}
//                   </span>
//                 </td>
//                 <td className="px-2 py-1">{row.description || '-'}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// components/alerts/UnnecessarySpending.tsx
'use client';

import { useState, useEffect } from 'react';

interface UnnecessarySpending {
  transaction_date: string;
  merchant: string;
  amount: number;
  category_name: string;
  description: string;
  spending_alert: string;
  notes: string | null;
}

/**
 * UnnecessarySpending - Flags potentially wasteful or discretionary spending
 * Identifies: High discretionary purchases, large non-essential items, increased merchant spending
 * Helps users identify areas to cut back and save money
 */
export default function UnnecessarySpending() {
  const [transactions, setTransactions] = useState<UnnecessarySpending[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'amount' | 'date' | 'category'>('amount');

  useEffect(() => {
    const fetchUnnecessarySpending = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/dashboard/unnecessary-spending');
        
        if (!response.ok) {
          throw new Error('Failed to fetch unnecessary spending data');
        }
        
        const data = await response.json();
        setTransactions(data);
      } catch (err) {
        console.error('Error fetching unnecessary spending:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnnecessarySpending();
  }, []);

  // Sort transactions
  const sortedTransactions = [...transactions].sort((a, b) => {
    switch (sortBy) {
      case 'amount':
        return b.amount - a.amount;
      case 'date':
        return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
      case 'category':
        return a.category_name.localeCompare(b.category_name);
      default:
        return 0;
    }
  });

  // Get alert configuration
  const getAlertConfig = (alertType: string) => {
    switch (alertType) {
      case 'HIGH_DISCRETIONARY':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          icon: '🛍️',
          title: 'High Discretionary',
          description: 'Large purchase in discretionary category (Entertainment, Dining, Shopping, Hobbies)'
        };
      case 'LARGE_NON_ESSENTIAL':
        return {
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          icon: '💸',
          title: 'Large Non-Essential',
          description: 'Large purchase in non-essential category (excluding Rent, Utilities, Groceries, Healthcare)'
        };
      case 'INCREASED_MERCHANT_SPEND':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          icon: '📈',
          title: 'Increased Merchant Spend',
          description: 'Significant increase in spending compared to previous transactions'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          icon: '📊',
          title: 'Other',
          description: 'Potential unnecessary spending'
        };
    }
  };

  // Calculate summary
  const summary = {
    totalTransactions: transactions.length,
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    averageAmount: transactions.length > 0 ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length : 0,
    highDiscretionary: transactions.filter(t => t.spending_alert === 'HIGH_DISCRETIONARY').length
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
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
            <h3 className="text-lg font-medium text-gray-900">Unnecessary Spending Alerts</h3>
            <p className="text-sm text-gray-600">
              Potential areas to reduce spending and save money
            </p>
          </div>
          
          {/* Summary Stats */}
          <div className="mt-3 sm:mt-0 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-red-600">{summary.totalTransactions}</div>
              <div className="text-xs text-gray-500">Transactions</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                ₹{summary.totalAmount.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-gray-500">Total Amount</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">
                ₹{summary.averageAmount.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-gray-500">Average</div>
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
              { key: 'amount', label: 'Amount' },
              { key: 'date', label: 'Date' },
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

      {/* Transactions List */}
      <div className="p-6">
        {sortedTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">🎉</div>
            <p>No unnecessary spending detected</p>
            <p className="text-sm">Your spending looks essential and reasonable</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedTransactions.map((transaction, index) => {
              const alertConfig = getAlertConfig(transaction.spending_alert);
              
              return (
                <div 
                  key={index}
                  className={`border rounded-lg p-4 ${alertConfig.bgColor} hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className={`text-2xl ${alertConfig.color}`}>
                        {alertConfig.icon}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            {transaction.merchant}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${alertConfig.bgColor} ${alertConfig.color}`}>
                            {alertConfig.title}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600">
                          {transaction.category_name} • {new Date(transaction.transaction_date).toLocaleDateString('en-IN')}
                        </p>
                        
                        {transaction.description && (
                          <p className="text-sm text-gray-700 mt-1">
                            {transaction.description}
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-2">
                          {alertConfig.description}
                        </p>
                        
                        {/* Notes */}
                        {transaction.notes && (
                          <div className="mt-2 p-2 bg-white rounded border text-xs text-gray-600">
                            <strong>Note:</strong> {transaction.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Amount */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        -₹{transaction.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {transaction.spending_alert.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex space-x-2">
                    <button className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors">
                      View Similar
                    </button>
                    <button className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-md hover:bg-red-200 transition-colors">
                      Set Category Limit
                    </button>
                    <button className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-200 transition-colors">
                      Analyze Pattern
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Savings Opportunity */}
      {transactions.length > 0 && (
        <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50 border-t">
          <div className="text-center">
            <h4 className="font-semibold text-gray-900 mb-2">
              💰 Potential Savings Opportunity
            </h4>
            <p className="text-sm text-gray-700">
              By reducing these expenses by 50%, you could save{' '}
              <span className="font-bold text-green-600">
                ₹{(summary.totalAmount * 0.5).toLocaleString('en-IN')}
              </span>{' '}
              per month
            </p>
            <div className="mt-2 text-xs text-gray-600">
              That's ₹{(summary.totalAmount * 0.5 * 12).toLocaleString('en-IN')} annually!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}