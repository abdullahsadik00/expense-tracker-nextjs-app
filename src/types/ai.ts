// types/ai.ts
export interface Transaction {
    id: string;
    date: string;
    amount: number;
    category: string;
    description: string;
    type: 'income' | 'expense';
    merchant?: string;
    category_name?: string; // Added category_name property

  }
  
  export interface SpendingPattern {
    category: string;
    averageAmount: number;
    frequency: number; // transactions per month
    trend: 'increasing' | 'decreasing' | 'stable';
    confidence: number;
    category_name: string; // Added property
  }
  
  export interface AIRecommendation {
    type: 'SAVING_OPPORTUNITY' | 'SPENDING_ALERT' | 'BUDGET_ADJUSTMENT' | 'SUBSCRIPTION_FINDER';
    title: string;
    message: string;
    confidence: number;
    amountSaved?: number;
    actionItems: string[];
    category?: string;
  }
  
  export interface Forecast {
    month: string;
    predictedIncome: number;
    predictedExpenses: number;
    confidence: number;
  }