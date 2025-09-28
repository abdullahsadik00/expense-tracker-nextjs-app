// components/MerchantAlerts.tsx
'use client';
import { useEffect, useState } from 'react';

type Merchant = {
  merchant: string;
  category_name: string;
  transaction_count: number;
  total_spent: number;
  avg_transaction: number;
  max_transaction: number;
  spending_alert: string;
  spend_rank: number;
};

export default function MerchantAlerts() {
  const [data, setData] = useState<Merchant[]>([]);

  useEffect(() => {
    fetch('/api/dashboard/merchant-alerts')
      .then((res) => res.json())
      .then((rows) => setData(rows))
      .catch((err) => console.error('fetch merchant alerts:', err));
  }, []);

  return (
    <div className="bg-white shadow rounded p-4 mt-4">
      <h2 className="text-lg font-semibold mb-2">Merchant-wise Spending Alerts</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-auto border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1">Merchant</th>
              <th className="px-2 py-1">Category</th>
              <th className="px-2 py-1">Total Spent</th>
              <th className="px-2 py-1">Avg</th>
              <th className="px-2 py-1">Max</th>
              <th className="px-2 py-1">Alert</th>
              <th className="px-2 py-1">Rank</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-2 py-1">{row.merchant}</td>
                <td className="px-2 py-1">{row.category_name}</td>
                <td className="px-2 py-1">₹{row.total_spent}</td>
                <td className="px-2 py-1">₹{row.avg_transaction}</td>
                <td className="px-2 py-1">₹{row.max_transaction}</td>
                <td className="px-2 py-1">{row.spending_alert}</td>
                <td className="px-2 py-1">{row.spend_rank}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
