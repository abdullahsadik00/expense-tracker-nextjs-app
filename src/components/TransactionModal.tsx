// components/TransactionModal.tsx
'use client';

import { useState, useEffect } from 'react';

interface TransactionModel {
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
  account_ownership_type: 'shared' | 'me' | 'mom' | 'dad';
  closing_balance: string;
  notes: string;
  transaction_owner: 'me' | 'mom' | 'dad';
  transaction_purpose: string;
  is_recurring: boolean;
  is_investment: boolean;

  
}

interface Category {
  id: number;
  name: string;
  type: string;
  color: string;
}

interface BankAccount {
  id: number;
  bank_name: string;
  account_number: string;
  account_type: string;
  account_owner: 'shared' | 'me' | 'mom' | 'dad';
  current_balance: number;
  purpose: string;
}

interface TransactionModalProps {
  transaction: TransactionModel | null;
  categories: Category[];
//   bankAccounts: BankAccount[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTransaction: TransactionModel) => void;
  onDelete: (transactionId: number) => void;
}

export default function TransactionModal({
  transaction,
  categories,
//   bankAccounts,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}: TransactionModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    merchant: '',
    category_id: '',
    transaction_owner: 'me' as 'me' | 'mom' | 'dad',
    transaction_purpose: '',
    notes: '',
    is_recurring: false,
    is_investment: false
  });

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction) {
      setFormData({
        description: transaction.description,
        merchant: transaction.merchant || '',
        category_id: '', // We'll map this from category name to ID
        transaction_owner: transaction.transaction_owner,
        transaction_purpose: transaction.transaction_purpose || '',
        notes: transaction.notes || '',
        is_recurring: transaction.is_recurring,
        is_investment: transaction.is_investment
      });
    }
    setIsEditing(false);
    setIsDeleting(false);
  }, [transaction]);

  if (!isOpen || !transaction) return null;

  // Find category ID by name
  const currentCategory = categories.find(cat => cat.name === transaction.category);
  const categoryId = currentCategory?.id || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          category_id: formData.category_id || categoryId
        }),
      });

      if (response.ok) {
        const updatedTransaction = await response.json();
        onUpdate(updatedTransaction);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete(transaction.id);
        onClose();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const formatCurrency = (amount: string) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Edit Transaction' : 'Transaction Details'}
          </h2>
          <div className="flex space-x-2">
            {!isEditing && !isDeleting && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => setIsDeleting(true)}
                  className="bg-red-600 text-white px-3 py-1 rounded-md text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {isDeleting && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <h3 className="text-red-800 font-semibold">Confirm Delete</h3>
            <p className="text-red-600 mt-2">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setIsDeleting(false)}
                className="px-3 py-1 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700"
              >
                Delete Transaction
              </button>
            </div>
          </div>
        )}

        {/* Transaction Details */}
        {!isEditing && !isDeleting && (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Amount</label>
                <p className={`text-lg font-semibold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Date</label>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(transaction.date).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Description & Merchant */}
            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-lg font-semibold text-gray-900">{transaction.description}</p>
            </div>

            {transaction.merchant && (
              <div>
                <label className="text-sm font-medium text-gray-500">Merchant/Person</label>
                <p className="text-lg text-gray-900">{transaction.merchant}</p>
              </div>
            )}

            {/* Category & Owner */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                <span 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: transaction.category_color + '20', color: transaction.category_color }}
                >
                  {transaction.category}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Transaction By</label>
                <p className="text-lg font-semibold text-gray-900 capitalize">{transaction.transaction_owner}</p>
              </div>
            </div>

            {/* Account Info */}
            <div>
              <label className="text-sm font-medium text-gray-500">Account</label>
              <p className="text-lg text-gray-900">
                {transaction.account} ({transaction.account_number})
              </p>
              <p className="text-sm text-gray-500 capitalize">{transaction.account_ownership_type} account</p>
            </div>

            {/* Purpose & Notes */}
            {transaction.transaction_purpose && (
              <div>
                <label className="text-sm font-medium text-gray-500">Purpose</label>
                <p className="text-lg text-gray-900">{transaction.transaction_purpose}</p>
              </div>
            )}

            {transaction.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Notes</label>
                <p className="text-lg text-gray-900">{transaction.notes}</p>
              </div>
            )}

            {/* Flags */}
            <div className="flex space-x-3">
              {transaction.is_recurring && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  Recurring
                </span>
              )}
              {transaction.is_investment && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Investment
                </span>
              )}
            </div>

            {/* Closing Balance */}
            <div className="border-t pt-4 mt-4">
              <label className="text-sm font-medium text-gray-500">Closing Balance</label>
              <p className="text-2xl font-bold text-indigo-600">
                {formatCurrency(transaction.closing_balance)}
              </p>
              <p className="text-sm text-gray-500">Balance after this transaction</p>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {isEditing && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Transaction By *</label>
                <select
                  required
                  value={formData.transaction_owner}
                  onChange={(e) => setFormData({...formData, transaction_owner: e.target.value as any})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="me">Me</option>
                  <option value="mom">Mom</option>
                  <option value="dad">Dad</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category *</label>
                <select
                  required
                  value={formData.category_id || categoryId}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="">Select Category</option>
                  {categories
                    .filter(cat => cat.type === transaction.type)
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Merchant/Person</label>
              <input
                type="text"
                value={formData.merchant}
                onChange={(e) => setFormData({...formData, merchant: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Purpose/Context</label>
              <input
                type="text"
                value={formData.transaction_purpose}
                onChange={(e) => setFormData({...formData, transaction_purpose: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({...formData, is_recurring: e.target.checked})}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label className="ml-2 text-sm text-gray-700">Recurring transaction</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_investment}
                  onChange={(e) => setFormData({...formData, is_investment: e.target.checked})}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label className="ml-2 text-sm text-gray-700">Investment transaction</label>
              </div>
            </div>

            {/* Read-only fields */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Read-only Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-gray-500">Amount</label>
                  <p className={`font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500">Date</label>
                  <p className="font-semibold">
                    {new Date(transaction.date).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div>
                  <label className="text-gray-500">Type</label>
                  <p className="font-semibold capitalize">{transaction.type}</p>
                </div>
                <div>
                  <label className="text-gray-500">Closing Balance</label>
                  <p className="font-semibold text-indigo-600">
                    {formatCurrency(transaction.closing_balance)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}