// app/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Transaction } from '@/types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [timeframe, setTimeframe] = useState('monthly');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/transactions');
        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const processSpendingData = () => {
    const monthlyData: { [key: string]: { income: number; expenses: number } } = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.Date);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { income: 0, expenses: 0 };
      }
      
      const debit = transaction.Debit === '-' ? 0 : parseFloat(transaction.Debit);
      const credit = transaction.Credit === '-' ? 0 : parseFloat(transaction.Credit);
      
      monthlyData[monthYear].income += credit;
      monthlyData[monthYear].expenses += debit;
    });
    
    return Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([name, data]) => ({
        name,
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses
      }));
  };

  const processCategoryData = () => {
    const categoryData: { [key: string]: number } = {};
    
    transactions.forEach(transaction => {
      const debit = transaction.Debit === '-' ? 0 : parseFloat(transaction.Debit);
      if (debit > 0) {
        if (categoryData[transaction.Category ?? 'Unknown']) {
          categoryData[transaction.Category ?? 'Unknown'] += debit;
        } else {
          categoryData[transaction.Category ?? 'Unknown'] = debit;
        }
      }
    });
    
    return Object.entries(categoryData)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));
  };

  const processAccountData = () => {
    const accountData: { [key: string]: { income: number; expenses: number } } = {};
    
    transactions.forEach(transaction => {
      const account = transaction.Account || 'unknown';
      
      if (!accountData[account]) {
        accountData[account] = { income: 0, expenses: 0 };
      }
      
      const debit = transaction.Debit === '-' ? 0 : parseFloat(transaction.Debit);
      const credit = transaction.Credit === '-' ? 0 : parseFloat(transaction.Credit);
      
      accountData[account].income += credit;
      accountData[account].expenses += debit;
    });
    
    return Object.entries(accountData).map(([name, data]) => ({
      name,
      income: data.income,
      expenses: data.expenses
    }));
  };

  const spendingData = processSpendingData();
  const categoryData = processCategoryData();
  const accountData = processAccountData();

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
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <select 
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Income vs Expenses Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Income vs Expenses</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spendingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#4cc9f0" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#f72585" strokeWidth={2} />
                <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending by Category */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Spending by Category</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={(props) => {
                    const { name, value, percent } = props;
                    const calculatedPercent = percent !== null && percent !== undefined 
                      ? (Number(percent) * 100) 
                      : (Number(value) / Number(props.total) * 100);
                    return `${name} (${calculatedPercent}%)`;
                  }}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Account-wise Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Account-wise Breakdown</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={accountData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']} />
              <Legend />
              <Bar dataKey="income" fill="#4cc9f0" name="Income" />
              <Bar dataKey="expenses" fill="#f72585" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Income</h3>
          <p className="text-3xl font-bold text-green-600">
            ₹{spendingData.reduce((sum, item) => sum + item.income, 0).toLocaleString('en-IN')}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Expenses</h3>
          <p className="text-3xl font-bold text-red-600">
            ₹{spendingData.reduce((sum, item) => sum + item.expenses, 0).toLocaleString('en-IN')}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Net Savings</h3>
          <p className="text-3xl font-bold text-blue-600">
            ₹{spendingData.reduce((sum, item) => sum + item.net, 0).toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
}