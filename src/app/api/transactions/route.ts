// app/api/transactions/route.ts
import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        t.id,
        t.transaction_date as date,
        t.amount,
        t.type,
        t.description,
        t.merchant,
        t.closing_balance,
        t.notes,
        c.name as category,
        c.color as category_color,
        b.bank_name as account,
        b.account_number
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN bank_accounts b ON t.bank_account_id = b.id
      ORDER BY t.transaction_date DESC, t.id DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(request: Request) {
  const client = await pool.connect();
  
  try {
    const transactionData = await request.json();
    
    await client.query('BEGIN');

    // Get current account balance
    const accountResult = await client.query(
      'SELECT current_balance FROM bank_accounts WHERE id = $1',
      [transactionData.bank_account_id]
    );

    if (accountResult.rows.length === 0) {
      throw new Error('Account not found');
    }

    const currentBalance = parseFloat(accountResult.rows[0].current_balance);
    const amount = parseFloat(transactionData.amount);
    
    // Calculate new balance
    let newBalance;
    if (transactionData.type === 'income') {
      newBalance = currentBalance + amount;
    } else {
      newBalance = currentBalance - amount;
    }

    // Insert transaction
    const transactionResult = await client.query(
      `INSERT INTO transactions 
       (bank_account_id, category_id, transaction_date, amount, type, description, merchant, notes, closing_balance)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        transactionData.bank_account_id,
        transactionData.category_id,
        transactionData.transaction_date,
        amount,
        transactionData.type,
        transactionData.description,
        transactionData.merchant,
        transactionData.notes,
        newBalance
      ]
    );

    // Update account balance
    await client.query(
      'UPDATE bank_accounts SET current_balance = $1 WHERE id = $2',
      [newBalance, transactionData.bank_account_id]
    );

    // Update savings goal if it's a house savings transaction
    if (transactionData.notes && transactionData.notes.toLowerCase().includes('house')) {
      await client.query(
        'UPDATE savings_goals SET current_amount = current_amount + $1 WHERE name = $2',
        [amount, 'House Down Payment']
      );
    }

    await client.query('COMMIT');

    return NextResponse.json(transactionResult.rows[0], { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  } finally {
    client.release();
  }
}