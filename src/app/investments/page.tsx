// app/investments/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Transaction } from '@/types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function InvestmentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investmentData, setInvestmentData] = useState<{
    types: { name: string; value: number }[];
    timeline: { name: string; amount: number }[];
    total: number;
  }>({
    types: [],
    timeline: [],
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/transactions');
        const data = await response.json();
        setTransactions(data);
        
        // Filter and process investment transactions
        const investments = data.filter((t: Transaction) => t.IsInvestment);
        setInvestmentData(processInvestmentData(investments));
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const processInvestmentData = (investments: Transaction[]) => {
    const investmentTypes: { [key: string]: number } = {};
    const monthlyInvestments: { [key: string]: number } = {};
    
    investments.forEach(investment => {
      const amount = investment.Debit !== '-' ? parseFloat(investment.Debit) : parseFloat(investment.Credit);
      const category = investment.Category;
      
      // Group by investment type
      if (category) {
        if (investmentTypes[category]) {
          investmentTypes[category] += amount;
        } else {
          investmentTypes[category] = amount;
        }
      }
      
      // Group by month
      const date = new Date(investment.Date);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      if (monthlyInvestments[monthYear]) {
        monthlyInvestments[monthYear] += amount;
      } else {
        monthlyInvestments[monthYear] = amount;
      }
    });
    
    const typeData = Object.entries(investmentTypes)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));
    
    const timelineData = Object.entries(monthlyInvestments)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([name, value]) => ({ name, amount: value }));
    
    return {
      types: typeData,
      timeline: timelineData,
      total: investments.reduce((sum: number, inv: Transaction) => {
        const amount = inv.Debit !== '-' ? parseFloat(inv.Debit) : parseFloat(inv.Credit);
        return sum + amount;
      }, 0)
    };
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
        <h1 className="text-2xl font-bold text-gray-900">Investments</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
          Add Investment
        </button>
      </div>

      {/* Investment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Total Invested</h3>
          <p className="text-3xl font-bold text-indigo-600">
            ₹{investmentData.total?.toLocaleString('en-IN') || '0'}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Investment Types</h3>
          <p className="text-3xl font-bold text-green-600">
            {investmentData.types?.length || '0'}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Monthly Average</h3>
          <p className="text-3xl font-bold text-blue-600">
            ₹{(investmentData.total / (investmentData.timeline?.length || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Investment Timeline */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Investment Timeline</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={investmentData.timeline || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']} />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Investment by Type */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Investment by Type</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={investmentData.types || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => {
                    const total = investmentData.types.reduce((sum, entry) => sum + entry.value, 0);
                    const calculatedPercent = (((value as number) / total) * 100).toFixed(0);
                    return `${name} (${calculatedPercent}%)`;
                  }}
                  
                >
                  {(investmentData.types || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Investment List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Investments</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions
                .filter(t => t.IsInvestment)
                .slice(0, 10)
                .map((transaction) => (
                  <tr key={transaction.hash}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.Date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.Details.length > 60 
                        ? `${transaction.Details.substring(0, 60)}...` 
                        : transaction.Details
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {transaction.Category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -₹{(transaction.Debit !== '-' ? parseFloat(transaction.Debit) : parseFloat(transaction.Credit)).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}