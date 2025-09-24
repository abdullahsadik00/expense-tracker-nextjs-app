// app/api/transactions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();
  
  try {
    const transactionId = params.id;
    const updateData = await request.json();

    // Build dynamic update query based on provided fields
    const allowedFields = [
      'description', 'merchant', 'category_id', 'transaction_owner',
      'transaction_purpose', 'notes', 'is_recurring', 'is_investment'
    ];
    
    const updates: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    allowedFields.forEach(field => {
      if (field in updateData) {
        updates.push(`${field} = $${valueIndex}`);
        values.push(updateData[field]);
        valueIndex++;
      }
    });

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Add updated_at timestamp
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(transactionId);

    const query = `
      UPDATE transactions 
      SET ${updates.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *,
        (SELECT name FROM categories WHERE id = category_id) as category,
        (SELECT color FROM categories WHERE id = category_id) as category_color,
        (SELECT bank_name FROM bank_accounts WHERE id = bank_account_id) as account,
        (SELECT account_number FROM bank_accounts WHERE id = bank_account_id) as account_number,
        (SELECT account_owner FROM bank_accounts WHERE id = bank_account_id) as account_ownership_type
    `;

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();
  
  try {
    const transactionId = params.id;

    // First get the transaction details to update the account balance
    const transactionResult = await client.query(
      'SELECT * FROM transactions WHERE id = $1',
      [transactionId]
    );

    if (transactionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const transaction = transactionResult.rows[0];

    await client.query('BEGIN');

    // Delete the transaction
    const deleteResult = await client.query(
      'DELETE FROM transactions WHERE id = $1 RETURNING *',
      [transactionId]
    );

    if (deleteResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
    }

    // Update account balance (reverse the transaction effect)
    if (transaction.type === 'income') {
      await client.query(
        'UPDATE bank_accounts SET current_balance = current_balance - $1 WHERE id = $2',
        [transaction.amount, transaction.bank_account_id]
      );
    } else {
      await client.query(
        'UPDATE bank_accounts SET current_balance = current_balance + $1 WHERE id = $2',
        [transaction.amount, transaction.bank_account_id]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  } finally {
    client.release();
  }
}