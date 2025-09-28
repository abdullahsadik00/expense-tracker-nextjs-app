// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Expense Tracker Pro',
  description: 'Advanced expense tracking application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
              <h1 className="text-xl font-bold text-indigo-600">ExpenseTracker Pro</h1>
              <nav className="flex space-x-4">
  <a href="/dashboard" className="text-gray-700 hover:text-indigo-600">Dashboard</a>
  <a href="/transactions" className="text-gray-700 hover:text-indigo-600">Transactions</a>
  <a href="/analytics" className="text-gray-700 hover:text-indigo-600">Analytics</a>
  <a href="/investments" className="text-gray-700 hover:text-indigo-600">Investments</a>
  <a href="/budget" className="text-gray-700 hover:text-indigo-600">budget</a>
  <a href="/alerts" className="text-gray-700 hover:text-indigo-600">alerts</a>
</nav>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}