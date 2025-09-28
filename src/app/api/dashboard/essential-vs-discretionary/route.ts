// app/api/essential-vs-discretionary/route.ts
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
  CASE 
    WHEN c.name IN ('Rent', 'Utilities', 'Groceries', 'Healthcare', 'Insurance', 'Loan Payment') THEN 'Essential'
    ELSE 'Discretionary'
  END as spending_type,
  COUNT(*) as transaction_count,
  to_char(SUM(t.amount), 'FM999,999,999,990.00') as total_amount,
  to_char(
    SUM(t.amount) * 100.0 / (
      SELECT SUM(amount) FROM transactions 
      WHERE type = 'expense' 
        AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
    ), 'FM999,999,999,990.00'
  ) as percentage,
  to_char(AVG(t.amount), 'FM999,999,999,990.00') as average_transaction
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.type = 'expense'
  AND t.transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY spending_type
ORDER BY SUM(t.amount) DESC;

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
