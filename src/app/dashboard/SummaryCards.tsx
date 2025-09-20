// components/dashboard/SummaryCards.tsx
import { Transaction } from '@/types';

interface SummaryCardsProps {
  transactions: Transaction[];
}

export default function SummaryCards({ transactions }: SummaryCardsProps) {
  const calculateSummary = () => {
    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryExpenses: { [key: string]: number } = {};
    
    transactions.forEach(transaction => {
      const debit = transaction.Debit === '-' ? 0 : parseFloat(transaction.Debit);
      const credit = transaction.Credit === '-' ? 0 : parseFloat(transaction.Credit);
      
      if (debit > 0) {
        totalExpenses += debit;
        
        if (transaction.Category && categoryExpenses[transaction.Category]) {
            categoryExpenses[transaction.Category] += debit;
          } else {
            if (transaction.Category) {
              categoryExpenses[transaction.Category] = debit;
            }
          }
      }
      
      if (credit > 0) {
        totalIncome += credit;
      }
    });
    
    let highestSpendingCategory = '';
    let highestSpendingAmount = 0;
    
    Object.entries(categoryExpenses).forEach(([category, amount]) => {
      if (amount > highestSpendingAmount) {
        highestSpendingCategory = category;
        highestSpendingAmount = amount;
      }
    });
    
    return {
      totalIncome,
      totalExpenses,
      net: totalIncome - totalExpenses,
      highestSpendingCategory,
      highestSpendingAmount,
      savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
    };
  };
  
  const { totalIncome, totalExpenses, net, highestSpendingCategory, highestSpendingAmount, savingsRate } = calculateSummary();
  
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Income</dt>
          <dd className="mt-1 text-3xl font-semibold text-green-600">₹{totalIncome.toLocaleString('en-IN')}</dd>
        </div>
      </div>
      
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Expenses</dt>
          <dd className="mt-1 text-3xl font-semibold text-red-600">₹{totalExpenses.toLocaleString('en-IN')}</dd>
        </div>
      </div>
      
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">Net Balance</dt>
          <dd className={`mt-1 text-3xl font-semibold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{net.toLocaleString('en-IN')}
          </dd>
        </div>
      </div>
      
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">Savings Rate</dt>
          <dd className="mt-1 text-3xl font-semibold text-blue-600">{savingsRate.toFixed(1)}%</dd>
        </div>
      </div>
    </div>
  );
}