// // components/dashboard/RecentTransactions.tsx
// import { Transaction } from '@/types';

// interface RecentTransactionsProps {
//   transactions: Transaction[];
// }

// export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
//   const formatAmount = (debit: string, credit: string) => {
//     if (debit !== '-') {
//       return `-₹${parseFloat(debit).toLocaleString('en-IN')}`;
//     }
//     return `+₹${parseFloat(credit).toLocaleString('en-IN')}`;
//   };

//   const getTransactionIcon = (type: string) => {
//     switch (type) {
//       case 'UPI Transfer': return '💸';
//       case 'Shopping': return '🛒';
//       case 'Food': return '🍕';
//       case 'Utilities': return '💡';
//       case 'Investment': return '📈';
//       default: return '💰';
//     }
//   };

//   return (
//     <div className="flow-root">
//       <ul role="list" className="-mb-8">
//         {transactions.slice(0, 10).map((transaction, idx) => (
//           <li key={transaction.hash || idx}>
//             <div className="relative pb-8">
//               {idx !== transactions.length - 1 && (
//                 <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
//               )}
//               <div className="relative flex space-x-3">
//                 <div>
//                   <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
//                     {/* Todo */}
//                     {/* {getTransactionIcon(transaction.ExtractedInfo.type)} */}
//                   </span>
//                 </div>
//                 <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
//                   <div>
//                     <p className="text-sm text-gray-800 truncate">
//                       {/* Todo */}
//                       {/* {transaction.Details.length > 60 
//                         ? `${transaction.Details.substring(0, 60)}...` 
//                         : transaction.Details
//                       } */}
//                     </p>
//                     <p className="text-xs text-gray-500">{transaction.Date}</p>
//                     <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
//                       {transaction.Category}
//                     </span>
//                   </div>
//                   <div className="whitespace-nowrap text-right text-sm font-medium">
//                     <span className={transaction.Debit !== '-' ? 'text-red-600' : 'text-green-600'}>
//                       {formatAmount(transaction.Debit, transaction.Credit)}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// components/dashboard/RecentTransactions.tsx
'use client';

import { Transaction } from '@/types/ai';
import { useState } from 'react';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

/**
 * RecentTransactions - Shows latest transactions with filtering and search
 * Supports filtering by type (income/expense) and search by description/merchant
 * Provides quick actions for each transaction
 */
export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(transaction => {
      // Type filter
      if (filter !== 'all' && transaction.type !== filter) return false;
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          transaction.description?.toLowerCase().includes(searchLower) ||
          transaction.merchant?.toLowerCase().includes(searchLower) ||
          transaction.category_name?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
    .slice(0, 10); // Show only latest 10

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get transaction icon based on category
  const getTransactionIcon = (category: string, type: string) => {
    const icons: { [key: string]: string } = {
      'Rent': '🏠',
      'Groceries': '🛒',
      'Utilities': '💡',
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Healthcare': '🏥',
      'Insurance': '🛡️',
      'Loan Payment': '💰',
      'Dining Out': '🍽️',
      'default': type === 'income' ? '💵' : '💸'
    };

    return icons[category] || icons.default;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Transactions
          </h3>
          
          <div className="mt-3 sm:mt-0 flex space-x-2">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex bg-gray-100 rounded-md p-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'income', label: 'Income' },
                { key: 'expense', label: 'Expense' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    filter === key
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
      </div>

      {/* Transactions List */}
      <div className="overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || filter !== 'all' 
              ? 'No transactions match your filters'
              : 'No transactions found'
            }
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => (
              <li key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Transaction Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'income' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      <span className="text-lg">
                        {getTransactionIcon(transaction.category_name || '', transaction.type)}
                      </span>
                    </div>

                    {/* Transaction Details */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transaction.description || transaction.merchant || 'Unknown Transaction'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatDate(transaction.transaction_date)}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          {transaction.category_name}
                        </span>
                        {transaction.is_recurring && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                            Recurring
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount and Actions */}
                  <div className="flex items-center space-x-4">
                    <span className={`text-sm font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN')}
                    </span>
                    
                    {/* Quick Actions */}
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => console.log('Edit:', transaction.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit transaction"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => console.log('Delete:', transaction.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete transaction"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                {(transaction.merchant || transaction.notes) && (
                  <div className="mt-2 ml-13 text-xs text-gray-500">
                    {transaction.merchant && (
                      <span className="mr-3">Merchant: {transaction.merchant}</span>
                    )}
                    {transaction.notes && (
                      <span>Note: {transaction.notes}</span>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      {transactions.length > 10 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <button 
            onClick={() => console.log('View all transactions')}
            className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
          >
            View all transactions ({transactions.length})
          </button>
        </div>
      )}
    </div>
  );
}