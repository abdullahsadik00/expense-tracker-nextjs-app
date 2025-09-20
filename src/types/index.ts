export interface Transaction {
    id?: string;
    Date: string;
    Details: string;
    Debit: number | null;
    Credit: number | null;
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