// scripts/import-data-enhanced.ts
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function importDataEnhanced() {
  const client = await pool.connect();
  
  try {
    console.log('Starting enhanced data import...');

    // Read your JSON data
    const filePath = path.join(process.cwd(), 'src', 'data', 'transactions.json');
    const jsonData = JSON.parse(readFileSync(filePath, 'utf8'));
    console.log(`Found ${jsonData.length} transactions in JSON`);

    // Get bank accounts (assuming SBI is account 1)
    const accountsResult = await client.query('SELECT id, bank_name FROM bank_accounts');
    const accounts = accountsResult.rows;
    console.log('Available accounts:', accounts);

    // Default to SBI account for existing transactions
    const defaultAccountId = accounts.find(acc => acc.bank_name === 'SBI')?.id || 1;

    // Get categories
    const categoriesResult = await client.query('SELECT id, name FROM categories');
    const categoryMap = new Map();
    categoriesResult.rows.forEach(row => {
      categoryMap.set(row.name, row.id);
    });

    // Import transactions with closing balance calculation
    console.log('Importing transactions with closing balances...');
    
    // Sort transactions by date for proper balance calculation
    const sortedTransactions = jsonData.sort((a: any, b: any) => 
      new Date(a.Date).getTime() - new Date(b.Date).getTime()
    );

    let currentBalance = 84125.25; // Starting balance for SBI
    
    for (const item of sortedTransactions) {
      const amount = item.Debit !== '-' ? parseFloat(item.Debit) : parseFloat(item.Credit);
      const type = item.Debit !== '-' ? 'expense' : 'income';
      
      // Update balance
      if (type === 'income') {
        currentBalance += amount;
      } else {
        currentBalance -= amount;
      }

      // Determine category
      let categoryId = categoryMap.get('Transfer'); // default
      if (categoryMap.has(item.Category)) {
        categoryId = categoryMap.get(item.Category);
      }

      await client.query(
        `INSERT INTO transactions 
         (bank_account_id, category_id, transaction_date, amount, type, description, 
          merchant, reference_number, closing_balance, is_investment, is_recurring)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          defaultAccountId,
          categoryId,
          new Date(item.Date),
          Math.abs(amount),
          type,
          item.Details,
          item.ExtractedInfo?.name,
          item.ExtractedInfo?.transactionId,
          currentBalance,
          item.Category.toLowerCase().includes('investment'),
          ['rent', 'electricity', 'wifi', 'telephone', 'gas'].some(word => 
            item.Details.toLowerCase().includes(word)
          )
        ]
      );
    }

    // Update account balance
    await client.query(
      'UPDATE bank_accounts SET current_balance = $1 WHERE id = $2',
      [currentBalance, defaultAccountId]
    );

    console.log('Enhanced data import completed successfully!');
    console.log(`Final SBI account balance: ₹${currentBalance.toLocaleString('en-IN')}`);
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  importDataEnhanced()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}