import { readFileSync,writeFileSync,promises as fs } from "fs";
import path from "path";
import { Transaction } from "@/types";

// lib/database.ts
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

console.log('Database URL:', process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

// Initialize database
export async function initializeDatabase() {
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Database migrated successfully');
  } catch (error) {
    console.error('Database migration failed:', error);
  }
}

const DATA_PATH = path.join(process.cwd(), 'data', 'transactions.json');

export class Database {
    private static async ensureDataFile():Promise<void> {
        try {
            await fs.access(DATA_PATH);
        } catch (error) {
            await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
            await fs.writeFile(DATA_PATH, JSON.stringify([],null,2));
        }
    }

    static async getTransactions(): Promise<Transaction[]> {
        await this.ensureDataFile();
        const data = readFileSync(DATA_PATH, 'utf-8');
        return JSON.parse(data) as Transaction[];
    }

    static async addTransaction(transaction: Transaction): Promise<void> {
        const transactions = await this.getTransactions();
        transactions.push(transaction);
        writeFileSync(DATA_PATH, JSON.stringify(transactions, null, 2));
    }

    static async updateTransaction(id: string, updatedTransaction: Partial<Transaction>): Promise<void> {
        const transactions = await this.getTransactions();
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updatedTransaction };
            writeFileSync(DATA_PATH, JSON.stringify(transactions, null, 2));
        } else {
            throw new Error('Transaction not found');
        }
    }

    static async deleteTransaction(id: string): Promise<void> {
        const transactions = await this.getTransactions();
        const filteredTransactions = transactions.filter(t => t.id !== id);
        writeFileSync(DATA_PATH, JSON.stringify(filteredTransactions, null, 2));
    }

    static async getTransactionByAccount(account:string): Promise<Transaction[]> {
        const transactions = await this.getTransactions();
        return transactions.filter(t => t.Account === account);
    }

    static async getRecurringTransactions(): Promise<Transaction[]> {
        const transactions = await this.getTransactions();
        return transactions.filter(t => t.IsRecurring);
    }

    static async getLoans(): Promise<Transaction[]> {
        const transactions = await this.getTransactions();
        return transactions.filter(t => t.LoanDetails);
    }
}