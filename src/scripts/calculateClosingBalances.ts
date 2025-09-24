import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
const { parse } = require('json2csv');
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function calculateAndExportBalances() {
  const client = await pool.connect();

  try {
    console.log('Fetching transactions...');
    const { rows: transactions } = await client.query(`
      SELECT id, transaction_date, amount, type, closing_balance
      FROM transactions
      ORDER BY transaction_date, id
    `);

    if (transactions.length === 0) {
      console.log('No transactions found.');
      return;
    }

    const results: any[] = [];
    let currentBalance = parseFloat(transactions[0].closing_balance);

    results.push({
      id: transactions[0].id,
      transaction_date: transactions[0].transaction_date,
      amount: parseFloat(transactions[0].amount),
      type: transactions[0].type,
      original_closing_balance: parseFloat(transactions[0].closing_balance),
      calculated_closing_balance: currentBalance,
      difference: 0,
    });

    for (let i = 1; i < transactions.length; i++) {
      const tx = transactions[i];
      const amount = parseFloat(tx.amount);

      const calculatedBalance =
        tx.type === 'income' ? currentBalance + amount : currentBalance - amount;

      const originalBalance = parseFloat(tx.closing_balance);
      const difference = parseFloat((originalBalance - calculatedBalance).toFixed(2));

      results.push({
        id: tx.id,
        transaction_date: tx.transaction_date,
        amount: amount,
        type: tx.type,
        original_closing_balance: originalBalance,
        calculated_closing_balance: parseFloat(calculatedBalance.toFixed(2)),
        difference,
      });

      currentBalance = calculatedBalance;
    }

    // Convert to CSV
    const csv = parse(results, {
      fields: [
        'id',
        'transaction_date',
        'amount',
        'type',
        'original_closing_balance',
        'calculated_closing_balance',
        'difference',
      ],
    });

    const outputPath = path.join(__dirname, 'calculated_closing_balances.csv');
    fs.writeFileSync(outputPath, csv);

    console.log(`✅ CSV exported to: ${outputPath}`);
  } catch (error) {
    console.error('Error calculating balances:', error);
  } finally {
    client.release();
  }
}

calculateAndExportBalances();