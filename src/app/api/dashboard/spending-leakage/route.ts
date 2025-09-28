// app/api/spending-leakage/route.ts
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
WITH monthly_avg AS (
  SELECT 
    c.name as category_name,
    AVG(CASE 
      WHEN EXTRACT(MONTH FROM t.transaction_date) = EXTRACT(MONTH FROM CURRENT_DATE) 
        THEN t.amount ELSE 0 
    END) as current_month_avg,
    AVG(CASE 
      WHEN EXTRACT(MONTH FROM t.transaction_date) != EXTRACT(MONTH FROM CURRENT_DATE) 
        THEN t.amount ELSE 0 
    END) as previous_months_avg,
    COUNT(*) as transaction_count
  FROM transactions t
  JOIN categories c ON t.category_id = c.id
  WHERE t.type = 'expense'
    AND t.transaction_date >= DATE_TRUNC('year', CURRENT_DATE)
  GROUP BY c.name
)
SELECT 
  category_name,
  current_month_avg,
  previous_months_avg,
  (current_month_avg - previous_months_avg) as increase_amount,
  CASE 
    WHEN previous_months_avg > 0 THEN 
      ((current_month_avg - previous_months_avg) / previous_months_avg) * 100 
    ELSE 100 
  END as increase_percentage,
  transaction_count
FROM monthly_avg
WHERE current_month_avg > previous_months_avg * 1.2  
  AND current_month_avg > 1000  
ORDER BY increase_percentage DESC;

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