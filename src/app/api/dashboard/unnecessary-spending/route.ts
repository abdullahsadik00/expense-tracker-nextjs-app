// app/api/unnecessary-spending/route.ts
import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  const client = await pool.connect();

  try {
    const sql = `
    SELECT 
      t.transaction_date,
      t.merchant,
      t.amount,
      c.name as category_name,
      t.description,
      CASE 
        WHEN c.name IN ('Entertainment', 'Dining Out', 'Shopping', 'Hobbies') AND t.amount > 2000 THEN 'HIGH_DISCRETIONARY'
        WHEN t.amount > 5000 AND c.name NOT IN ('Rent', 'Utilities', 'Groceries', 'Healthcare') THEN 'LARGE_NON_ESSENTIAL'
        WHEN EXISTS (
          SELECT 1 FROM transactions t2 
          WHERE t2.merchant = t.merchant 
            AND t2.amount > t.amount * 1.5 
            AND t2.transaction_date < t.transaction_date
        ) THEN 'INCREASED_MERCHANT_SPEND'
        ELSE 'NORMAL'
      END as spending_alert,
      t.notes
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.type = 'expense'
      AND t.transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
      AND (
        (c.name IN ('Entertainment', 'Dining Out', 'Shopping', 'Hobbies') AND t.amount > 2000)
        OR (t.amount > 5000 AND c.name NOT IN ('Rent', 'Utilities', 'Groceries', 'Healthcare'))
      )
    ORDER BY t.amount DESC;
    `;

    const result = await client.query(sql);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('weekly-trend error:', error);
    return NextResponse.json({ error: 'Failed to fetch weekly trends' }, { status: 500 });
  } finally {
    client.release();
  }
}