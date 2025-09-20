// components/dashboard/RecentTransactions.tsx
import { Transaction } from '@/types';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const formatAmount = (debit: string, credit: string) => {
    if (debit !== '-') {
      return `-₹${parseFloat(debit).toLocaleString('en-IN')}`;
    }
    return `+₹${parseFloat(credit).toLocaleString('en-IN')}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'UPI Transfer': return '💸';
      case 'Shopping': return '🛒';
      case 'Food': return '🍕';
      case 'Utilities': return '💡';
      case 'Investment': return '📈';
      default: return '💰';
    }
  };

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {transactions.slice(0, 10).map((transaction, idx) => (
          <li key={transaction.hash || idx}>
            <div className="relative pb-8">
              {idx !== transactions.length - 1 && (
                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                    {getTransactionIcon(transaction.ExtractedInfo.type)}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-800 truncate">
                      {transaction.Details.length > 60 
                        ? `${transaction.Details.substring(0, 60)}...` 
                        : transaction.Details
                      }
                    </p>
                    <p className="text-xs text-gray-500">{transaction.Date}</p>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                      {transaction.Category}
                    </span>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm font-medium">
                    <span className={transaction.Debit !== '-' ? 'text-red-600' : 'text-green-600'}>
                      {formatAmount(transaction.Debit, transaction.Credit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}