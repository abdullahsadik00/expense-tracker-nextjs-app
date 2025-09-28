// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
// import SummaryCards from '@/components/dashboard/SummaryCards';
// import RecentTransactions from '@/components/dashboard/RecentTransactions';
import { Transaction } from '@/types/ai';
import SpendingChart from '@/components/charts/SpendingChart';
import SummaryCards from './SummaryCards';
import RecentTransactions from './RecentTransactions';
import WeeklyTrends from '@/components/WeeklyTrends';
import DailyBudget from '@/components/DailyBudget';
import MerchantAlerts from '@/components/MerchantAlerts';
import FixedExpenses from '@/components/FixedExpenses';
import UnnecessarySpending from '@/components/UnnecessarySpending';
import DiscretionaryVsEssential from '@/components/DiscretionaryVsEssential';
import SpendingLeakage from '@/components/SpendingLeakage';
import MonthlyIncomeExpensesChart from '@/components/MonthlyIncomeExpensesChart';
import { AIRecommendations } from '@/components/ai/AIRecommendations';

// Define types for our API data
interface MonthlySummaryData {
  month: string;
  total_income: number;
  total_expenses: number;
  net_balance: number;
}

interface DailyBudgetData {
  transaction_date: string;
  daily_total: string;
  daily_limit: string;
  over_budget_amount: string;
  budget_status: string;
  transaction_count: number;
}

interface EssentialVsDiscretionaryData {
  spending_type: string;
  transaction_count: number;
  total_amount: string;
  percentage: string;
  average_transaction: string;
}

interface MerchantAlertData {
  merchant: string;
  category_name: string;
  transaction_count: number;
  total_spent: string;
  avg_transaction: string;
  max_transaction: string;
  spending_alert: string;
  spend_rank: number;
}

interface UnnecessarySpendingData {
  transaction_date: string;
  merchant: string;
  amount: number;
  category_name: string;
  description: string;
  spending_alert: string;
  notes: string | null;
}


export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // State for API data
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryData[]>([]);
  const [dailyBudgetTrend, setDailyBudgetTrend] = useState<DailyBudgetData[]>([]);
  const [essentialVsDiscretionary, setEssentialVsDiscretionary] = useState<EssentialVsDiscretionaryData[]>([]);
  const [merchantAlerts, setMerchantAlerts] = useState<MerchantAlertData[]>([]);
  const [unnecessarySpending, setUnnecessarySpending] = useState<UnnecessarySpendingData[]>([]);

  // Fetch all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all data in parallel
        const [
          transactionsRes,
          monthlySummaryRes,
          dailyBudgetRes,
          essentialRes,
          merchantAlertsRes,
          unnecessarySpendingRes
        ] = await Promise.all([
          fetch(selectedAccount === 'all' ? '/api/transactions' : `/api/transactions?account=${selectedAccount}`),
          fetch('/api/dashboard/monthly-summary'),
          fetch('/api/dashboard/daily-budget'),
          fetch('/api/dashboard/essential-vs-discretionary'),
          fetch('/api/dashboard/merchant-alerts'),
          fetch('/api/dashboard/unnecessary-spending')
        ]);

        // Check if all responses are OK
        if (!transactionsRes.ok) throw new Error('Failed to fetch transactions');
        if (!monthlySummaryRes.ok) throw new Error('Failed to fetch monthly summary');
        if (!dailyBudgetRes.ok) throw new Error('Failed to fetch daily budget');
        if (!essentialRes.ok) throw new Error('Failed to fetch essential vs discretionary');
        if (!merchantAlertsRes.ok) throw new Error('Failed to fetch merchant alerts');
        if (!unnecessarySpendingRes.ok) throw new Error('Failed to fetch unnecessary spending');

        // Parse all responses
        const [
          transactionsData,
          monthlySummaryData,
          dailyBudgetData,
          essentialData,
          merchantAlertsData,
          unnecessarySpendingData
        ] = await Promise.all([
          transactionsRes.json(),
          monthlySummaryRes.json(),
          dailyBudgetRes.json(),
          essentialRes.json(),
          merchantAlertsRes.json(),
          unnecessarySpendingRes.json()
        ]);

        // Set all state
        setTransactions(transactionsData);
        setMonthlySummary(monthlySummaryData);
        setDailyBudgetTrend(dailyBudgetData);
        setEssentialVsDiscretionary(essentialData);
        setMerchantAlerts(merchantAlertsData);
        setUnnecessarySpending(unnecessarySpendingData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [selectedAccount]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  return (
  //   <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  //     {/* <div className="flex justify-between items-center mb-6">
  //       <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
  //       <select
  //         value={selectedAccount}
  //         onChange={(e) => setSelectedAccount(e.target.value)}
  //         className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
  //       >
  //         <option value="all">All Accounts</option>
  //         <option value="personal">My Account</option>
  //         <option value="dad">Dad's Account</option>
  //         <option value="mom">Mom's Account</option>
  //       </select>
  //     </div>

  //     <SummaryCards transactions={transactions} />

  //     <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
  //       <div className="bg-white p-6 rounded-lg shadow">
  //         <h2 className="text-lg font-medium text-gray-900 mb-4">Spending Analysis</h2>
  //         <SpendingChart transactions={transactions} />
  //       </div>

  //       <div className="bg-white p-6 rounded-lg shadow">
  //         <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h2>
  //         <RecentTransactions transactions={transactions} />
  //       </div>
  //     </div> */}
  //     {/* Testing */}
  //     {/* <div>
  //       <div className="grid md:grid-cols-2 gap-6">
  //         <SpendingLeakage />
  //         <DiscretionaryVsEssential />
  //       </div>
  //       <UnnecessarySpending />
  //       <FixedExpenses />
  //       <MerchantAlerts />
  //       <div className="grid md:grid-cols-2 gap-6">
  //         <DailyBudget />
  //         <WeeklyTrends />
  //       </div>
  //       <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
  //         <MonthlyIncomeExpensesChart />
  //         Later you can add other components side by side
  //       </div>
  //     </div> */}
  //   {/* <div className="grid gap-6 md:grid-cols-2">
  //     <WeeklyTrends />
  //     <SpendingLeakage />
  //     <MerchantAlerts />
  //   </div> */}
  //    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  //     {/* Header and Account Selector */}
  //     <div className="flex justify-between items-center mb-6">
  //       <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
  //       <select 
  //         value={selectedAccount}
  //         onChange={(e) => setSelectedAccount(e.target.value)}
  //         className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
  //       >
  //         <option value="all">All Accounts</option>
  //         <option value="personal">My Account</option>
  //         <option value="dad">Dad's Account</option>
  //         <option value="mom">Mom's Account</option>
  //       </select>
  //     </div>
      
  //     {/* 1. Summary Cards */}
  //     <SummaryCards transactions={transactions} />
      
  //     {/* 2. AI Recommendations */}
  //     <div className="mt-8">
  //       {/* <AIRecommendations transactions={transactions} /> */}
  //     </div>

  //     {/* 3. Main Charts and Recent Transactions */}
  //     <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
  //       <SpendingChart transactions={transactions} />
  //       <RecentTransactions transactions={transactions} />
  //     </div>

  //     {/* 4. Weekly Trends and Daily Budget */}
  //     <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
  //       <WeeklyTrends />
  //       <DailyBudget />
  //     </div>

  //     {/* 5. Spending Analysis */}
  //     <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
  //       <DiscretionaryVsEssential />
  //       <SpendingLeakage />
  //     </div>

  //     {/* 6. Monthly Overview */}
  //     <div className="mt-8">
  //       <MonthlyIncomeExpensesChart />
  //     </div>

  //     {/* 7. Alerts Section */}
  //     <div className="mt-8 space-y-6">
  //       <MerchantAlerts />
  //       <UnnecessarySpending />
  //       <FixedExpenses />
  //     </div>
  //   </div>
  //  </div>

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {/* Header with Account Selector */}
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
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

  {/* 1. Summary Cards */}
  {/* <SummaryCards transactions={transactions} /> */}

  {/* 2. AI Recommendations */}
  <div className="mt-8">
    <AIRecommendations transactions={transactions} /> AI Recommendations Placeholder
  </div>

  {/* 3. Main Charts and Recent Transactions */}
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

  {/* 4. Monthly Overview */}
  <div className="mt-8">
    <MonthlyIncomeExpensesChart />
  </div>

  {/* 5. Weekly Trends and Daily Budget */}
  <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
    <WeeklyTrends />
    <DailyBudget />
  </div>

  {/* 6. Spending Analysis */}
  <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
    <DiscretionaryVsEssential />
    <SpendingLeakage />
  </div>

  {/* 7. Alerts Section */}
  <div className="mt-8 space-y-6">
    <MerchantAlerts />
    <UnnecessarySpending />
    <FixedExpenses />
  </div>
</div>

  );
}