// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
// import SummaryCards from '@/components/dashboard/SummaryCards';
// import RecentTransactions from '@/components/dashboard/RecentTransactions';
import { Transaction } from '@/types';
import SpendingChart from '@/components/charts/SpendingChart';
import SummaryCards from './SummaryCards';
import RecentTransactions from './RecentTransactions';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = selectedAccount === 'all' 
          ? '/api/transactions' 
          : `/api/transactions?account=${selectedAccount}`;
        
        const response = await fetch(url);
        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedAccount]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <select 
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Accounts</option>
          <option value="personal">My Account</option>
          <option value="dad">Dad's Account</option>
          <option value="mom">Mom's Account</option>
        </select>
      </div>
      
      <SummaryCards transactions={transactions} />
      
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Spending Analysis</h2>
          <SpendingChart transactions={transactions} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h2>
          <RecentTransactions transactions={transactions} />
        </div>
      </div>
    </div>
  );
}