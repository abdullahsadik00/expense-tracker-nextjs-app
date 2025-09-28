// components/budget/FixedExpenses.tsx
'use client';

import { useState, useEffect } from 'react';

interface FixedExpense {
  merchant: string;
  category_name: string;
  expected_amount: number;
  paid_amount: number | null;
  paid_date: string | null;
  due_day: number;
  payment_status: string;
  reminder_message: string;
}

/**
 * FixedExpenses - Tracks recurring bills and subscription payments
 * Shows payment status: Paid, Overdue, Due Soon, Upcoming
 * Helps manage cash flow and avoid missed payments
 */
export default function FixedExpenses() {
  const [expenses, setExpenses] = useState<FixedExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'all' | 'pending' | 'paid'>('all');

  useEffect(() => {
    const fetchFixedExpenses = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/budget/fixed-expenses');
        
        if (!response.ok) {
          throw new Error('Failed to fetch fixed expenses');
        }
        
        const data = await response.json();
        setExpenses(data);
      } catch (err) {
        console.error('Error fetching fixed expenses:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFixedExpenses();
  }, []);

  // Filter expenses based on view
  const filteredExpenses = view === 'all' 
    ? expenses 
    : view === 'paid' 
    ? expenses.filter(exp => exp.payment_status === 'PAID')
    : expenses.filter(exp => exp.payment_status !== 'PAID');

  // Get status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'PAID':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: '✅',
          badge: 'Paid'
        };
      case 'OVERDUE':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: '⚠️',
          badge: 'Overdue'
        };
      case 'DUE_SOON':
        return {
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          icon: '🔔',
          badge: 'Due Soon'
        };
      case 'UPCOMING':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: '📅',
          badge: 'Upcoming'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: '❓',
          badge: 'Unknown'
        };
    }
  };

  // Calculate summary
  const summary = {
    total: expenses.length,
    paid: expenses.filter(exp => exp.payment_status === 'PAID').length,
    overdue: expenses.filter(exp => exp.payment_status === 'OVERDUE').length,
    dueSoon: expenses.filter(exp => exp.payment_status === 'DUE_SOON').length,
    totalMonthly: expenses.reduce((sum, exp) => sum + exp.expected_amount, 0),
    paidAmount: expenses
      .filter(exp => exp.payment_status === 'PAID')
      .reduce((sum, exp) => sum + (exp.paid_amount || 0), 0)
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
            <h3 className="text-lg font-medium text-gray-900">Fixed Expenses</h3>
            <p className="text-sm text-gray-600">
              Track your recurring bills and subscriptions
            </p>
          </div>
          
          {/* Summary Stats */}
          <div className="mt-3 sm:mt-0 grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">{summary.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{summary.paid}</div>
              <div className="text-xs text-gray-500">Paid</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">{summary.overdue}</div>
              <div className="text-xs text-gray-500">Overdue</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">{summary.dueSoon}</div>
              <div className="text-xs text-gray-500">Due Soon</div>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="px-6 py-4 bg-gray-50 border-b">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
          {[
            { key: 'all', label: 'All Expenses' },
            { key: 'pending', label: 'Pending' },
            { key: 'paid', label: 'Paid' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key as any)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                view === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses List */}
      <div className="p-6">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">🏠</div>
            <p>No fixed expenses found</p>
            <p className="text-sm">Add recurring transactions to track fixed expenses</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map((expense, index) => {
              const statusConfig = getStatusConfig(expense.payment_status);
              const isPaid = expense.payment_status === 'PAID';
              
              return (
                <div 
                  key={index}
                  className={`border rounded-lg p-4 ${statusConfig.borderColor} ${statusConfig.bgColor} hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{statusConfig.icon}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900">
                            {expense.merchant}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
                            {statusConfig.badge}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600">
                          {expense.category_name} • Due on {expense.due_day}th of month
                        </p>
                        
                        {/* Amount and Dates */}
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Expected:</span>
                            <div className="font-semibold text-gray-900">
                              ₹{expense.expected_amount.toLocaleString('en-IN')}
                            </div>
                          </div>
                          
                          {isPaid ? (
                            <>
                              <div>
                                <span className="text-gray-500">Paid:</span>
                                <div className="font-semibold text-green-600">
                                  ₹{expense.paid_amount?.toLocaleString('en-IN')}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Paid Date:</span>
                                <div className="font-semibold text-gray-900">
                                  {expense.paid_date ? new Date(expense.paid_date).toLocaleDateString('en-IN') : 'N/A'}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="md:col-span-2">
                              <span className="text-gray-500">Reminder:</span>
                              <div className={`font-medium ${statusConfig.color}`}>
                                {expense.reminder_message}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    {!isPaid && (
                      <div className="flex space-x-2">
                        <button className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-md hover:bg-green-200 transition-colors">
                          Mark Paid
                        </button>
                        <button className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200 transition-colors">
                          Skip
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Payment Status Bar */}
                  {!isPaid && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Payment Status</span>
                        <span>{statusConfig.badge}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            expense.payment_status === 'OVERDUE' ? 'bg-red-500' :
                            expense.payment_status === 'DUE_SOON' ? 'bg-orange-500' :
                            'bg-blue-500'
                          }`}
                          style={{ 
                            width: expense.payment_status === 'OVERDUE' ? '100%' :
                                   expense.payment_status === 'DUE_SOON' ? '70%' : '30%'
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Monthly Summary */}
      {expenses.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Monthly Fixed Expenses:</span>
              <div className="font-semibold text-gray-900">
                ₹{summary.totalMonthly.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Paid This Month:</span>
              <div className="font-semibold text-green-600">
                ₹{summary.paidAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Monthly Payment Progress</span>
              <span>{Math.round((summary.paidAmount / summary.totalMonthly) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${Math.min((summary.paidAmount / summary.totalMonthly) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}