// // components/dashboard/SummaryCards.tsx
// import { Transaction } from '@/types';

// interface SummaryCardsProps {
//   transactions: Transaction[];
// }

// export default function SummaryCards({ transactions }: SummaryCardsProps) {
//   const calculateSummary = () => {
//     let totalIncome = 0;
//     let totalExpenses = 0;
//     const categoryExpenses: { [key: string]: number } = {};
    
//     transactions.forEach(transaction => {
//       const debit = transaction.Debit === '-' ? 0 : parseFloat(transaction.Debit);
//       const credit = transaction.Credit === '-' ? 0 : parseFloat(transaction.Credit);
      
//       if (debit > 0) {
//         totalExpenses += debit;
        
//         if (transaction.Category && categoryExpenses[transaction.Category]) {
//             categoryExpenses[transaction.Category] += debit;
//           } else {
//             if (transaction.Category) {
//               categoryExpenses[transaction.Category] = debit;
//             }
//           }
//       }
      
//       if (credit > 0) {
//         totalIncome += credit;
//       }
//     });
    
//     let highestSpendingCategory = '';
//     let highestSpendingAmount = 0;
    
//     Object.entries(categoryExpenses).forEach(([category, amount]) => {
//       if (amount > highestSpendingAmount) {
//         highestSpendingCategory = category;
//         highestSpendingAmount = amount;
//       }
//     });
    
//     return {
//       totalIncome,
//       totalExpenses,
//       net: totalIncome - totalExpenses,
//       highestSpendingCategory,
//       highestSpendingAmount,
//       savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
//     };
//   };
  
//   const { totalIncome, totalExpenses, net, highestSpendingCategory, highestSpendingAmount, savingsRate } = calculateSummary();
  
//   return (
//     <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
//       <div className="bg-white overflow-hidden shadow rounded-lg">
//         <div className="px-4 py-5 sm:p-6">
//           <dt className="text-sm font-medium text-gray-500 truncate">Total Income</dt>
//           <dd className="mt-1 text-3xl font-semibold text-green-600">₹{totalIncome.toLocaleString('en-IN')}</dd>
//         </div>
//       </div>
      
//       <div className="bg-white overflow-hidden shadow rounded-lg">
//         <div className="px-4 py-5 sm:p-6">
//           <dt className="text-sm font-medium text-gray-500 truncate">Total Expenses</dt>
//           <dd className="mt-1 text-3xl font-semibold text-red-600">₹{totalExpenses.toLocaleString('en-IN')}</dd>
//         </div>
//       </div>
      
//       <div className="bg-white overflow-hidden shadow rounded-lg">
//         <div className="px-4 py-5 sm:p-6">
//           <dt className="text-sm font-medium text-gray-500 truncate">Net Balance</dt>
//           <dd className={`mt-1 text-3xl font-semibold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//             ₹{net.toLocaleString('en-IN')}
//           </dd>
//         </div>
//       </div>
      
//       <div className="bg-white overflow-hidden shadow rounded-lg">
//         <div className="px-4 py-5 sm:p-6">
//           <dt className="text-sm font-medium text-gray-500 truncate">Savings Rate</dt>
//           <dd className="mt-1 text-3xl font-semibold text-blue-600">{savingsRate}%</dd>
//         </div>
//       </div>
//     </div>
//   );
// }

// components/dashboard/SummaryCards.tsx
'use client';

import { Transaction } from "@/types";

// import { Transaction } from '@/types/ai';

interface SummaryCardsProps {
  transactions: Transaction[];
}

/**
 * SummaryCards - Displays high-level financial overview
 * Shows total income, expenses, net balance, and savings rate
 * Uses real-time data from transactions
 */
export default function SummaryCards({ transactions }: SummaryCardsProps) {
  // Calculate totals from transactions
  const totals = transactions.reduce(
    (acc, transaction) => {
      if (transaction.type === 'income') {
        acc.income += transaction.amount;
      } else {
        acc.expenses += transaction.amount;
      }
      return acc;
    },
    { income: 0, expenses: 0 }
  );

  const netBalance = totals.income - totals.expenses;
  const savingsRate = totals.income > 0 ? (netBalance / totals.income) * 100 : 0;

  // Card data configuration
  const cards = [
    {
      title: 'Total Income',
      amount: totals.income,
      trend: '+12%', // This would come from comparison with previous period
      icon: '💰',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Expenses',
      amount: totals.expenses,
      trend: '+5%',
      icon: '💸',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Net Balance',
      amount: netBalance,
      trend: savingsRate > 0 ? `+${savingsRate.toFixed(1)}%` : `${savingsRate.toFixed(1)}%`,
      icon: '⚖️',
      color: netBalance >= 0 ? 'text-blue-600' : 'text-orange-600',
      bgColor: netBalance >= 0 ? 'bg-blue-50' : 'bg-orange-50'
    },
    {
      title: 'Savings Rate',
      amount: savingsRate,
      trend: 'Goal: 20%',
      icon: '🎯',
      color: savingsRate >= 20 ? 'text-purple-600' : 'text-yellow-600',
      bgColor: savingsRate >= 20 ? 'bg-purple-50' : 'bg-yellow-50',
      isPercentage: true
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white overflow-hidden shadow rounded-lg border border-gray-200"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-md ${card.bgColor}`}>
                <span className="text-2xl">{card.icon}</span>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {card.title}
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {card.isPercentage 
                      ? `${card.amount.toFixed(1)}%`
                      : `₹${card.amount.toLocaleString('en-IN')}`
                    }
                  </dd>
                  <dd className={`text-xs font-medium ${card.color}`}>
                    {card.trend}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          {/* Progress bar for savings rate */}
          {card.title === 'Savings Rate' && (
            <div className="bg-gray-50 px-6 py-2">
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block text-gray-600">
                      Progress
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-gray-600">
                      20%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${Math.min(card.amount, 100)}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                      card.amount >= 20 ? 'bg-purple-500' : 'bg-yellow-500'
                    }`}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}