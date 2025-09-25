// scripts/fix-transaction-balances.ts
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixTransactionBalances() {
  const client = await pool.connect();
  
  try {
    console.log('Starting transaction balance verification and fix...');
    
    await client.query('BEGIN');

    // Get all transactions in chronological order with account information
    const result = await client.query(`
      SELECT 
        t.id,
        t.bank_account_id,
        t.transaction_date,
        t.amount,
        t.type,
        t.closing_balance,
        b.current_balance as account_current_balance
      FROM transactions t
      LEFT JOIN bank_accounts b ON t.bank_account_id = b.id
      ORDER BY t.bank_account_id, t.transaction_date ASC, t.id ASC
    `);

    if (result.rows.length === 0) {
      console.log('No transactions found.');
      await client.query('COMMIT');
      return;
    }

    console.log(`Found ${result.rows.length} transactions to verify.`);

    // Group transactions by account
    const transactionsByAccount: { [accountId: string]: any[] } = {};
    result.rows.forEach(transaction => {
      const accountId = transaction.bank_account_id;
      if (!transactionsByAccount[accountId]) {
        transactionsByAccount[accountId] = [];
      }
      transactionsByAccount[accountId].push(transaction);
    });

    let totalFixed = 0;
    let totalChecked = 0;
    const accountUpdates: { [accountId: string]: number } = {};

    // Process each account separately
    for (const [accountId, transactions] of Object.entries(transactionsByAccount)) {
      console.log(`\nProcessing account ${accountId} with ${transactions.length} transactions...`);

      // Get the current account balance for verification
      const accountResult = await client.query(
        'SELECT current_balance, account_number FROM bank_accounts WHERE id = $1',
        [accountId]
      );

      if (accountResult.rows.length === 0) {
        console.log(`Account ${accountId} not found, skipping...`);
        continue;
      }

      const accountCurrentBalance = parseFloat(accountResult.rows[0].current_balance);
      const accountNumber = accountResult.rows[0].account_number;
      
      console.log(`Account ${accountNumber} current balance: ${accountCurrentBalance}`);

      let runningBalance: number | null = null;

      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        totalChecked++;

        // For the first transaction of the account, we need to determine the starting balance
        if (runningBalance === null) {
          // Use the current account balance and work backwards through all transactions
          runningBalance = accountCurrentBalance;
          for (let j = transactions.length - 1; j >= 0; j--) {
            const tempTrans = transactions[j];
            const amount = parseFloat(tempTrans.amount);
            
            if (tempTrans.type === 'income') {
              runningBalance -= amount;
            } else {
              runningBalance += amount;
            }
          }
          console.log(`Estimated starting balance for account ${accountNumber}: ${runningBalance}`);
        }

        // Calculate what the closing balance should be for this transaction
        const amount = parseFloat(transaction.amount);
        let calculatedClosingBalance: number;

        if (transaction.type === 'income') {
          calculatedClosingBalance = runningBalance + amount;
        } else {
          calculatedClosingBalance = runningBalance - amount;
        }

        // Update running balance for next transaction
        runningBalance = calculatedClosingBalance;

        // Check if the stored closing balance matches the calculated one
        const storedClosingBalance = transaction.closing_balance ? 
          parseFloat(transaction.closing_balance) : null;

        if (storedClosingBalance === null || Math.abs(storedClosingBalance - calculatedClosingBalance) > 0.01) {
          console.log(`Fixing transaction ${transaction.id}:`);
          console.log(`  Date: ${transaction.transaction_date}`);
          console.log(`  Type: ${transaction.type}`);
          console.log(`  Amount: ${amount}`);
          console.log(`  Stored balance: ${storedClosingBalance}`);
          console.log(`  Calculated balance: ${calculatedClosingBalance}`);

          // Update the transaction with the correct closing balance
          await client.query(
            'UPDATE transactions SET closing_balance = $1 WHERE id = $2',
            [calculatedClosingBalance, transaction.id]
          );

          totalFixed++;
        }
      }

      // Store the final calculated balance for updating the bank account
      accountUpdates[accountId] = runningBalance!;

      // Verify the final calculated balance matches the account's current balance
      if (Math.abs(runningBalance! - accountCurrentBalance) > 0.01) {
        console.warn(`⚠️  Balance discrepancy for account ${accountNumber}:`);
        console.warn(`   Calculated final balance: ${runningBalance}`);
        console.warn(`   Account current balance: ${accountCurrentBalance}`);
        console.warn(`   Difference: ${Math.abs(runningBalance! - accountCurrentBalance)}`);
      } else {
        console.log(`✅ Account ${accountNumber} balances match correctly.`);
      }
    }

    // Update bank accounts with the latest balances
    console.log('\n--- Updating Bank Account Balances ---');
    for (const [accountId, newBalance] of Object.entries(accountUpdates)) {
      const accountResult = await client.query(
        'SELECT account_number FROM bank_accounts WHERE id = $1',
        [accountId]
      );
      
      if (accountResult.rows.length > 0) {
        const accountNumber = accountResult.rows[0].account_number;
        console.log(`Updating account ${accountNumber} to balance: ${newBalance}`);
        
        await client.query(
          'UPDATE bank_accounts SET current_balance = $1 WHERE id = $2',
          [newBalance, accountId]
        );
      }
    }

    await client.query('COMMIT');

    console.log('\n=== Fix completed ===');
    console.log(`Transactions checked: ${totalChecked}`);
    console.log(`Transactions fixed: ${totalFixed}`);
    console.log(`Bank accounts updated: ${Object.keys(accountUpdates).length}`);
    console.log('Database changes committed.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during balance fix:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  fixTransactionBalances()
    .then(() => {
      console.log('Script completed successfully.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

if (import.meta.url === `file://${process.argv[1]}`) {
    fixTransactionBalances()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { fixTransactionBalances };