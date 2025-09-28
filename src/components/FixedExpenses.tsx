// components/FixedExpenses.tsx
'use client';
import { useEffect, useState } from 'react';

type Fixed = {
  merchant: string;
  category_name: string;
  expected_amount: number;
  paid_amount: number | null;
  paid_date: string | null;
  due_day: number;
  payment_status: string;
  reminder_message: string;
};

export default function FixedExpenses() {
  const [data, setData] = useState<Fixed[]>([]);

  useEffect(() => {
    fetch('/api/fixed-expenses')
      .then((res) => res.json())
      .then((rows) => setData(rows))
      .catch((err) => console.error('fetch fixed:', err));
  }, []);

  return (
    <div className="bg-white shadow rounded p-4 mt-4">
      <h2 className="text-lg font-semibold mb-2">Fixed / Recurring Expenses</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-auto border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1">Merchant</th>
              <th className="px-2 py-1">Category</th>
              <th className="px-2 py-1">Expected</th>
              <th className="px-2 py-1">Paid</th>
              <th className="px-2 py-1">Due Day</th>
              <th className="px-2 py-1">Status</th>
              <th className="px-2 py-1">Reminder</th>
            </tr>
          </thead>
          <tbody>
            {/* {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-2 py-1">{row.merchant}</td>
                <td className="px-2 py-1">{row.category_name}</td>
                <td className="px-2 py-1">₹{row.expected_amount}</td>
                <td className="px-2 py-1">{row.paid_amount != null ? `₹${row.paid_amount}` : '-'}</td>
                <td className="px-2 py-1">{row.due_day}</td>
                <td className="px-2 py-1">{row.payment_status}</td>
                <td className="px-2 py-1">{row.reminder_message}</td>
              </tr>
            ))} */}
          </tbody>
        </table>
      </div>
    </div>
  );
}
