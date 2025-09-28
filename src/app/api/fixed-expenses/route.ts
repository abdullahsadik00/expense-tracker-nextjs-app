// app/api/fixed-expenses/route.ts
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
    WITH fixed_expenses AS (
      SELECT 
        merchant,
        category_id,
        AVG(amount) as typical_amount,
        COUNT(*) as occurrence_count,
        MIN(transaction_date) as first_occurrence,
        MAX(transaction_date) as last_occurrence,
        EXTRACT(DAY FROM AVG(transaction_date::timestamp)) as typical_due_day
      FROM transactions 
      WHERE type = 'expense'
        AND transaction_date >= CURRENT_DATE - INTERVAL '6 months'
        AND is_recurring = true
      GROUP BY merchant, category_id
      HAVING COUNT(*) >= 2
    ),
    current_month_payments AS (
      SELECT 
        merchant,
        category_id,
        amount as paid_amount,
        transaction_date as paid_date
      FROM transactions 
      WHERE type = 'expense'
        AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
    ),
    calendar_days AS (
      SELECT generate_series(
        DATE_TRUNC('month', CURRENT_DATE),
        DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day',
        INTERVAL '1 day'
      )::date as calendar_date
    )
    SELECT 
      f.merchant,
      c.name as category_name,
      f.typical_amount as expected_amount,
      cmp.paid_amount,
      cmp.paid_date,
      f.typical_due_day as due_day,
      CASE 
        WHEN cmp.paid_amount IS NOT NULL THEN 'PAID'
        WHEN cd.calendar_date > (DATE_TRUNC('month', CURRENT_DATE) + (f.typical_due_day - 1) * INTERVAL '1 day')::date THEN 'OVERDUE'
        WHEN cd.calendar_date >= (DATE_TRUNC('month', CURRENT_DATE) + (f.typical_due_day - 5) * INTERVAL '1 day')::date THEN 'DUE_SOON'
        ELSE 'UPCOMING'
      END as payment_status,
      CASE 
        WHEN cmp.paid_amount IS NOT NULL THEN '✅ Paid on ' || cmp.paid_date::text
        WHEN cd.calendar_date > (DATE_TRUNC('month', CURRENT_DATE) + (f.typical_due_day - 1) * INTERVAL '1 day')::date THEN '⚠️ OVERDUE - Pay immediately!'
        WHEN cd.calendar_date >= (DATE_TRUNC('month', CURRENT_DATE) + (f.typical_due_day - 5) * INTERVAL '1 day')::date THEN '🔔 Due in ' || (f.typical_due_day - EXTRACT(DAY FROM cd.calendar_date)) || ' days'
        ELSE '📅 Due on ' || EXTRACT(DAY FROM CURRENT_DATE) || 'th'
      END as reminder_message
    FROM fixed_expenses f
    JOIN categories c ON f.category_id = c.id
    CROSS JOIN (SELECT MAX(calendar_date) as calendar_date FROM calendar_days) cd
    LEFT JOIN current_month_payments cmp ON f.merchant = cmp.merchant AND f.category_id = cmp.category_id
    ORDER BY 
      CASE 
        WHEN cmp.paid_amount IS NOT NULL THEN 3
        WHEN cd.calendar_date > (DATE_TRUNC('month', CURRENT_DATE) + (f.typical_due_day - 1) * INTERVAL '1 day')::date THEN 1
        WHEN cd.calendar_date >= (DATE_TRUNC('month', CURRENT_DATE) + (f.typical_due_day - 5) * INTERVAL '1 day')::date THEN 2
        ELSE 4
      END,
      f.typical_due_day;
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
