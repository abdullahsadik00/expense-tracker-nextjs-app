// app/transactions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import AddTransactionForm from '@/components/AddTransactionForm';

interface Transaction {
  id: number;
  date: string;
  amount: string;
  type: 'income' | 'expense' | 'transfer';
  description: string;
  merchant: string;
  category: string;
  category_color: string;
  account: string;
  account_number: string;
  closing_balance: string;
  notes: string;
}

interface BankAccount {
  id: number;
  bank_name: string;
  account_number: string;
  current_balance: number;
}

interface Category {
  id: number;
  name: string;
  type: string;
  color: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    bank_account_id: '',
    category_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    amount: '',
    type: 'expense',
    description: '',
    merchant: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transactionsRes, accountsRes, categoriesRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/bank-accounts'),
        fetch('/api/categories')
      ]);

      if (transactionsRes.ok) setTransactions(await transactionsRes.json());
      if (accountsRes.ok) setBankAccounts(await accountsRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({
          bank_account_id: bankAccounts[0]?.id.toString() || '',
          category_id: '',
          transaction_date: new Date().toISOString().split('T')[0],
          amount: '',
          type: 'expense',
          description: '',
          merchant: '',
          notes: ''
        });
        setShowForm(false);
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const filteredTransactions = selectedAccount === 'all' 
    ? transactions 
    : transactions.filter(t => t.account === selectedAccount);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Manage your personal and family transactions</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          + Add Transaction
        </button>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {bankAccounts.map(account => (
          <div key={account.id} className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900">{account.bank_name}</h3>
            <p className="text-2xl font-bold text-indigo-600">
              ₹{account.current_balance.toLocaleString('en-IN')}
            </p>
            <p className="text-sm text-gray-500">{account.account_number}</p>
          </div>
        ))}
      </div>

      {/* Add Transaction Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Transaction</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Form fields from previous example */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account</label>
                  <select
                    required
                    value={formData.bank_account_id}
                    onChange={(e) => setFormData({...formData, bank_account_id: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="">Select Account</option>
                    {bankAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.bank_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="">Select Category</option>
                  {categories
                    .filter(cat => cat.type === formData.type)
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => {
                    const input = e.target.value;
                    const formatted =
                      input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
                    setFormData({ ...formData, description: formatted });
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="What was this transaction for?"
                />

              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Merchant/Person</label>
                <input
                  type="text"
                  value={formData.merchant}
                  onChange={(e) => {
                    const input = e.target.value;
                    const formatted =
                      input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
                    setFormData({...formData, merchant: formatted})}}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="Store, person, or company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  required
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="Additional notes (e.g., 'House savings')"
                  rows={2}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Filter */}
      <div className="mb-4">
        <select 
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">All Accounts</option>
          {bankAccounts.map(account => (
            <option key={account.id} value={account.bank_name}>
              {account.bank_name}
            </option>
          ))}
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow overflow-hidden rounded-md">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No transactions yet</p>
            <p className="text-gray-400 mt-2">Start by adding your first transaction!</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.date).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                    <div className="text-sm text-gray-500">
                      <span 
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2"
                        style={{ backgroundColor: transaction.category_color + '20', color: transaction.category_color }}
                      >
                        {transaction.category}
                      </span>
                      {transaction.merchant}
                    </div>
                    {transaction.notes && (
                      <div className="text-xs text-gray-400 mt-1">{transaction.notes}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.account}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}₹
                    {parseFloat(transaction.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{parseFloat(transaction.closing_balance).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}