// app/api/monthly-summary/route.ts
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
        DATE_TRUNC('month', transaction_date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_balance
      FROM transactions
      WHERE transaction_date >= DATE_TRUNC('year', CURRENT_DATE)
      GROUP BY DATE_TRUNC('month', transaction_date)
      ORDER BY month DESC;
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
