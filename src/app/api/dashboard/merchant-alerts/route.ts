// app/api/merchant-alerts/route.ts
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
WITH merchant_stats AS (
  SELECT 
    merchant,
    category_id,
    COUNT(*) as transaction_count,
    SUM(amount) as total_spent,
    AVG(amount) as avg_transaction,
    MAX(amount) as max_transaction
  FROM transactions
  WHERE type = 'expense'
    AND transaction_date >= DATE_TRUNC('year', CURRENT_DATE)
  GROUP BY merchant, category_id
)
SELECT 
  ms.merchant,
  c.name as category_name,
  ms.transaction_count,
  to_char(ms.total_spent, 'FM999,999,999,990.00') as total_spent,
  to_char(ms.avg_transaction, 'FM999,999,999,990.00') as avg_transaction,
  to_char(ms.max_transaction, 'FM999,999,999,990.00') as max_transaction,
  CASE 
    WHEN ms.transaction_count = 1 AND ms.total_spent > 3000 THEN 'SINGLE_LARGE_PURCHASE'
    WHEN ms.transaction_count > 5 AND ms.total_spent > 10000 THEN 'FREQUENT_HIGH_SPEND'
    WHEN ms.avg_transaction > 2000 AND c.name IN ('Shopping', 'Entertainment') THEN 'HIGH_AVG_DISCRETIONARY'
    WHEN ms.max_transaction > 5000 THEN 'VERY_LARGE_PURCHASE'
    ELSE 'NORMAL'
  END as spending_alert,
  DENSE_RANK() OVER (ORDER BY ms.total_spent DESC) as spend_rank
FROM merchant_stats ms
JOIN categories c ON ms.category_id = c.id
WHERE ms.total_spent > 1000
ORDER BY ms.total_spent DESC
LIMIT 15;
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
