export interface Transaction {
    id?: string;
    Date: string;
    Details: string;
    Debit: string; // Use string to accommodate '-' for no debit  number | null;
    Credit: string; // Use string to accommodate '-' for no debit  number | null;
    Balance: number;
    Category?: string;
    ExtractedInfo: {
        type: string;
        name: string;
        service: string;
        upiId: string;
        bankCode: string;
        reference: string;
        transactionId: string;
      };
      hash: string;
      Account?:'personal' | 'mom' | 'dad';
      IsInvestment?: boolean;
      IsRecurring?: boolean;
      LoanDetails?: {
        borrower: string;
        dueDate: string;
        returned: boolean;
      };
      Notes?: string;
}

export interface AnalyticsData {
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    categoryWiseExpense: { [key: string]: number };
    monthlyTrends: { [month: string]: { income: number; expense: number } };
    recurringExpenses: Transaction[];
    investmentTransactions: Transaction[];
}

export interface User {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Budget {
    id: string;
    category: string;
    amount: number;
    startDate: string;
    endDate: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Account {
    id: string;
    accountType: 'sbi' | 'mom' | 'dad' |'baroda';
    balance: number;
}

export type OwnerType = 'me' | 'mom' | 'dad';
export type AccountOwnerType = 'shared' | OwnerType;
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface TransactionModel {
  id: number;
  date: string;
  amount: string;
  type: TransactionType;
  description: string;
  merchant: string;
  category: string;
  category_color: string;
  account: string;
  account_number: string;
  account_ownership_type: AccountOwnerType;
  closing_balance: string;
  notes: string;
  transaction_owner: OwnerType;
  transaction_purpose: string;
  is_recurring: boolean;
  is_investment: boolean;
}

export interface Category {
    id: number;
    name: string;
    type: TransactionType;
    color: string;
  }
  
  export interface BankAccount {
    id: number;
    bank_name: string;
    account_number: string;
    account_type: string;
    account_owner: AccountOwnerType;
    current_balance: number;
    purpose: string;
  }
  
  export interface AnalyticsData {
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    categoryWiseExpense: { [key: string]: number };
    monthlyTrends: { [month: string]: { income: number; expense: number } };
    recurringExpenses: Transaction[];
    investmentTransactions: Transaction[];
  }