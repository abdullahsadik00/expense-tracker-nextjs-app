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
  SELECT
        EXTRACT(YEAR FROM transaction_date) AS year,
        EXTRACT(WEEK FROM transaction_date) AS week_number,
        MIN(transaction_date) AS week_start,
        MAX(transaction_date) AS week_end,
        SUM(amount) AS weekly_total,
        COUNT(*) AS transaction_count,
        LAG(SUM(amount)) OVER (ORDER BY EXTRACT(YEAR FROM transaction_date), EXTRACT(WEEK FROM transaction_date)) AS previous_week_total,
        CASE 
          WHEN LAG(SUM(amount)) OVER (ORDER BY EXTRACT(YEAR FROM transaction_date), EXTRACT(WEEK FROM transaction_date)) IS NOT NULL THEN
            (SUM(amount) - LAG(SUM(amount)) OVER (ORDER BY EXTRACT(YEAR FROM transaction_date), EXTRACT(WEEK FROM transaction_date))) * 100.0 /
            LAG(SUM(amount)) OVER (ORDER BY EXTRACT(YEAR FROM transaction_date), EXTRACT(WEEK FROM transaction_date))
          ELSE NULL
        END AS week_over_week_change,
        CASE
          WHEN SUM(amount) > 15000 THEN 'HIGH_SPENDING_WEEK'
          WHEN COUNT(*) > 20 THEN 'HIGH_FREQUENCY_WEEK'
          ELSE 'NORMAL'
        END AS week_alert
      FROM transactions
      WHERE type = 'expense'
        AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY EXTRACT(YEAR FROM transaction_date), EXTRACT(WEEK FROM transaction_date)
      ORDER BY year DESC, week_number DESC;
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

