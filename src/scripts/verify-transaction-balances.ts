import { Pool } from 'pg';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { parse } from 'json2csv';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifyTransactionBalances() {
  const client = await pool.connect();

  try {
    console.log('📦 Starting transaction balance verification...');

    const result = await client.query(`
      SELECT 
        t.id,
        t.bank_account_id,
        t.transaction_date,
        t.amount,
        t.type,
        t.closing_balance,
        b.current_balance as account_current_balance,
        b.account_number
      FROM transactions t
      LEFT JOIN bank_accounts b ON t.bank_account_id = b.id
      ORDER BY t.bank_account_id, t.transaction_date ASC, t.id ASC
    `);

    if (result.rows.length === 0) {
      console.log('⚠️ No transactions found.');
      return;
    }

    const discrepancies: any[] = [];
    let totalChecked = 0;

    const transactionsByAccount: { [accountId: string]: any[] } = {};
    result.rows.forEach((tx) => {
      if (!transactionsByAccount[tx.bank_account_id]) {
        transactionsByAccount[tx.bank_account_id] = [];
      }
      transactionsByAccount[tx.bank_account_id].push(tx);
    });

    for (const [accountId, transactions] of Object.entries(transactionsByAccount)) {
      const accountCurrentBalance = parseFloat(transactions[0].account_current_balance);
      const accountNumber = transactions[0].account_number;
      let runningBalance: number | null = null;

      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        const amount = parseFloat(tx.amount);
        const type = tx.type;

        totalChecked++;

        if (runningBalance === null) {
          runningBalance = parseFloat(tx.closing_balance);
          if (type === 'income') {
            runningBalance -= amount;
          } else {
            runningBalance += amount;
          }
        }

        const calculatedClosingBalance: number = type === 'income'
          ? runningBalance + amount
          : runningBalance - amount;

        const storedClosingBalance = parseFloat(tx.closing_balance);
        const diff = Math.abs(calculatedClosingBalance - storedClosingBalance);

        if (diff > 0.01) {
          discrepancies.push({
            transaction_id: tx.id,
            account_id: tx.bank_account_id,
            account_number: accountNumber,
            transaction_date: tx.transaction_date,
            type: tx.type,
            amount,
            stored_closing_balance: storedClosingBalance,
            calculated_closing_balance: calculatedClosingBalance,
            balance_difference: parseFloat(diff.toFixed(2)),
          });
        }

        runningBalance = calculatedClosingBalance;
      }

      // Final account balance check
      if (runningBalance !== null && Math.abs(runningBalance - accountCurrentBalance) > 0.01) {
        discrepancies.push({
          transaction_id: null,
          account_id: accountId,
          account_number: accountNumber,
          transaction_date: null,
          type: 'account-final-check',
          amount: null,
          stored_closing_balance: accountCurrentBalance,
          calculated_closing_balance: runningBalance,
          balance_difference: parseFloat(Math.abs(runningBalance - accountCurrentBalance).toFixed(2)),
        });
      }
    }

    console.log('\n=== VERIFICATION COMPLETED ===');
    console.log(`🔢 Transactions checked: ${totalChecked}`);
    console.log(`❗ Discrepancies found: ${discrepancies.length}`);

    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvPath = path.join(outputDir, `discrepancies-${timestamp}.csv`);
    const jsonPath = path.join(outputDir, `discrepancies-${timestamp}.json`);

    // Save as CSV
    const csv = parse(discrepancies, {
      fields: [
        'transaction_id',
        'account_id',
        'account_number',
        'transaction_date',
        'type',
        'amount',
        'stored_closing_balance',
        'calculated_closing_balance',
        'balance_difference',
      ],
    });

    fs.writeFileSync(csvPath, csv);
    console.log(`📄 Discrepancy CSV saved: ${csvPath}`);

    // Save as JSON
    fs.writeFileSync(jsonPath, JSON.stringify(discrepancies, null, 2));
    console.log(`📄 Discrepancy JSON saved: ${jsonPath}`);

    if (discrepancies.length === 0) {
      console.log('🎉 All transaction balances are correct!');
    } else {
      console.log('⚠️ Review the CSV/JSON files for discrepancy details.');
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// ESM-compatible main check
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyTransactionBalances()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { verifyTransactionBalances };
