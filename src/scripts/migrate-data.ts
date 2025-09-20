// scripts/migrate-data.ts
import { db } from '@/lib/database';
import { transactions, accounts, categories, loans, investments } from '@/db/schema';
import { readFileSync } from 'fs';
import path from 'path';

async function migrateData() {
  try {
    // Read your JSON data
    const filePath = path.join(process.cwd(), 'data', 'transactions.json');
    const jsonData = JSON.parse(readFileSync(filePath, 'utf8'));

    // Create default categories
    const defaultCategories = [
      { name: 'Transfer', type: 'transfer' },
      { name: 'Food', type: 'expense' },
      { name: 'Utilities', type: 'expense' },
      { name: 'Rent', type: 'expense' },
      { name: 'Salary', type: 'income' },
      { name: 'Investment', type: 'investment' },
      // Add more categories as needed
    ];

    for (const category of defaultCategories) {
      await db.insert(categories).values(category).onConflictDoNothing();
    }

    // Create default account
    const [account] = await db.insert(accounts).values({
      name: 'My Personal Account',
      type: 'personal',
      balance: 0,
      currency: 'INR'
    }).returning();

    // Migrate transactions
    for (const item of jsonData) {
      const amount = item.Debit !== '-' ? parseFloat(item.Debit) : parseFloat(item.Credit);
      const type = item.Debit !== '-' ? 'expense' : 'income';

      await db.insert(transactions).values({
        accountId: account.id,
        categoryId: 1, // Default to Transfer
        date: new Date(item.Date),
        amount: Math.abs(amount),
        type: type,
        description: item.Details,
        merchant: item.ExtractedInfo?.name,
        referenceId: item.ExtractedInfo?.transactionId,
        bankCode: item.ExtractedInfo?.bankCode,
        isInvestment: item.Category.toLowerCase().includes('investment'),
        isRecurring: ['rent', 'electricity', 'wifi', 'telephone'].some(word => 
          item.Details.toLowerCase().includes(word)
        ),
      });
    }

    console.log('Data migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateData();