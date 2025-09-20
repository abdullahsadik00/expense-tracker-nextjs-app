// app/transactions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/types';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    account: 'all',
    type: 'all',
    search: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/transactions');
        const data = await response.json();
        console.log('Raw data:', data); // Check what's actually received

        setTransactions(data);
        setFilteredTransactions(data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  console.log('Transactions state:', transactions); // Check state

  useEffect(() => {
    let result = transactions;
    
    // Apply filters
    if (filters.category !== 'all') {
      result = result.filter(t => t.Category === filters.category);
    }
    
    if (filters.account !== 'all') {
      result = result.filter(t => t.Account === filters.account);
    }
    
    if (filters.type !== 'all') {
      if (filters.type === 'income') {
        result = result.filter(t => t.Credit !== '-');
      } else {
        result = result.filter(t => t.Debit !== '-');
      }
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(t => 
        t.Details.toLowerCase().includes(searchLower) ||
        (t.Category?.toLowerCase() ?? '').includes(searchLower) ||
        (t.ExtractedInfo.name && t.ExtractedInfo.name.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredTransactions(result);
  }, [transactions, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getUniqueCategories = () => {
    const categories = new Set(transactions.map(t => t.Category));
    return ['all', ...Array.from(categories)].filter(Boolean);
  };

  const formatAmount = (debit: string, credit: string) => {
    if (debit !== '-') {
      return `-₹${parseFloat(debit).toLocaleString('en-IN')}`;
    }
    return `+₹${parseFloat(credit).toLocaleString('en-IN')}`;
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
          Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search transactions..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {getUniqueCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
            <select
              value={filters.account}
              onChange={(e) => handleFilterChange('account', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Accounts</option>
              <option value="personal">My Account</option>
              <option value="dad">Dad's Account</option>
              <option value="mom">Mom's Account</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow overflow-hidden rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredTransactions.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No transactions found matching your filters.
            </li>
          ) : (
            filteredTransactions.map((transaction) => (
              <li key={transaction.hash} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transaction.Details}
                    </p>
                    <div className="flex items-center mt-1">
                      <p className="text-sm text-gray-500 mr-3">
                        {transaction.Date}
                      </p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {transaction.Category}
                      </span>
                      {transaction.Account && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 ml-2">
                          {transaction.Account}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className={`text-sm font-medium ${
                      transaction.Debit !== '-' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatAmount(transaction.Debit, transaction.Credit)}
                    </span>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}