
import 'dotenv/config';
import { db } from '@/lib/database';
import { transactions, accounts, categories } from '@/db/schema';
import { readFileSync } from 'fs';
import path from 'path';
import { createSchema } from './create-schema';
import { InferInsertModel } from 'drizzle-orm';
import url from 'url';

// Infer type for transaction insert
type NewTransaction = InferInsertModel<typeof transactions>;

async function importData() {
  try {
    console.log('📦 Starting data import...');

    // Step 1: Create schema if needed
    await createSchema();

    // Step 2: Load JSON data
    const filePath = path.join(process.cwd(), 'src', 'data', 'transactions.json');
    console.log('📄 Reading file from:', filePath);

    const jsonData = JSON.parse(readFileSync(filePath, 'utf8'));
    console.log(`✅ Found ${jsonData.length} transactions in JSON`);

    // Step 3: Create default account
    console.log('🏦 Creating default account...');
    const [account] = await db
      .insert(accounts)
      .values({
        name: 'My Personal Account',
        type: 'personal',
        balance: '0.00', // Must be a string for `decimal` in Drizzle
      })
      .returning();

    // Step 4: Create default categories
    console.log('📚 Creating default categories...');
    const defaultCategories = [
      { name: 'Transfer', type: 'transfer' },
      { name: 'Food', type: 'expense' },
      { name: 'Utilities', type: 'expense' },
      { name: 'Rent', type: 'expense' },
      { name: 'Salary', type: 'income' },
      { name: 'Investment', type: 'income' },
    ];

    for (const category of defaultCategories) {
      await db.insert(categories).values(category).onConflictDoNothing();
    }

    // Step 5: Load all categories into a Map
    const categoryMap = new Map<string, number>();
    const allCategories = await db.select().from(categories);
    allCategories.forEach((cat) => categoryMap.set(cat.name, cat.id));

    // Step 6: Import transactions
    console.log('📥 Importing transactions...');
    let importedCount = 0;

    for (const item of jsonData) {
      const amount = item.Debit !== '-' ? parseFloat(item.Debit) : parseFloat(item.Credit);
      const type = item.Debit !== '-' ? 'expense' : 'income';

      // Determine category
      let categoryId = categoryMap.get('Transfer'); // default
      if (categoryMap.has(item.Category)) {
        categoryId = categoryMap.get(item.Category);
      }

      const tx: NewTransaction = {
        accountId: account.id,
        categoryId: categoryId!,
        date: item.Date, // Drizzle expects string for date, ISO format preferred
        amount: Math.abs(amount).toFixed(2), // string for decimal
        type: type,
        description: item.Details,
        merchant: item.ExtractedInfo?.name,
        referenceId: item.ExtractedInfo?.transactionId,
        bankCode: item.ExtractedInfo?.bankCode,
        isInvestment: item.Category.toLowerCase().includes('investment'),
        isRecurring: ['rent', 'electricity', 'wifi', 'telephone'].some((word) =>
          item.Details.toLowerCase().includes(word)
        ),
      };

      await db.insert(transactions).values(tx);

      importedCount++;
      if (importedCount % 100 === 0) {
        console.log(`🔄 Imported ${importedCount} transactions...`);
      }
    }

    console.log(`🎉 Successfully imported ${importedCount} transactions!`);
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

// Run script if executed directly
if (url.fileURLToPath(import.meta.url) === process.argv[1]) {
  importData().catch(console.error);
}
