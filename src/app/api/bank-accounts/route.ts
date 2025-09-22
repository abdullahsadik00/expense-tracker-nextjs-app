// app/api/bank-accounts/route.ts
import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
console.log('Database URL:', process.env.DATABASE_URL);
export async function GET() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT id, bank_name, account_number, current_balance, account_type 
      FROM bank_accounts 
      WHERE is_active = true 
      ORDER BY bank_name
    `);
    
    const dbNameResult = await client.query('SELECT current_database()');
    console.log('Connected to DB:', dbNameResult.rows[0].current_database);

    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bank accounts' }, { status: 500 });
  } finally {
    client.release();
  }
}