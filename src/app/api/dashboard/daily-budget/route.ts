// app/api/weekly-trend/route.ts
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
WITH daily_spending AS (
  SELECT 
    transaction_date,
    ROUND(SUM(amount)::numeric, 2) as daily_total,
    COUNT(*) as transaction_count
  FROM transactions
  WHERE type = 'expense'
    AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
  GROUP BY transaction_date
),
monthly_budget AS (
  SELECT 30000 as total_budget
),
daily_budget AS (
  SELECT ROUND((total_budget / EXTRACT(DAY FROM (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')))::numeric, 2) as daily_limit
  FROM monthly_budget
)
SELECT 
  ds.transaction_date,
  to_char(ds.daily_total, 'FM999,999,999,990.00') as daily_total,
  to_char(db.daily_limit, 'FM999,999,999,990.00') as daily_limit,
  to_char(ROUND(ds.daily_total - db.daily_limit, 2), 'FM999,999,999,990.00') as over_budget_amount,
  CASE 
    WHEN ds.daily_total > db.daily_limit * 1.2 THEN 'SIGNIFICANTLY_OVER'
    WHEN ds.daily_total > db.daily_limit THEN 'OVER_BUDGET'
    WHEN ds.daily_total < db.daily_limit * 0.8 THEN 'UNDER_BUDGET'
    ELSE 'WITHIN_BUDGET'
  END as budget_status,
  ds.transaction_count
FROM daily_spending ds
CROSS JOIN daily_budget db
ORDER BY ds.transaction_date DESC;
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
