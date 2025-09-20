import { db } from '@/lib/database';
import { sql } from 'drizzle-orm';
import url from 'url';

export async function createSchema() {
  try {
    console.log('Creating database schema...');
    
    // Create tables
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        type VARCHAR(10) CHECK (type IN ('income', 'expense', 'transfer'))
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(20) CHECK (type IN ('personal', 'family')),
        balance DECIMAL(15, 2) DEFAULT 0.00,
        currency VARCHAR(3) DEFAULT 'INR',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES accounts(id),
        category_id INTEGER REFERENCES categories(id),
        date DATE NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        type VARCHAR(10) CHECK (type IN ('income', 'expense', 'transfer')),
        description TEXT,
        merchant VARCHAR(255),
        reference_id VARCHAR(100),
        bank_code VARCHAR(50),
        is_recurring BOOLEAN DEFAULT FALSE,
        is_investment BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database schema created successfully!');
  } catch (error) {
    console.error('Error creating schema:', error);
    throw error;
  }
}

// Run if this script is executed directly (ES module version)
if (url.fileURLToPath(import.meta.url) === process.argv[1]) {
  createSchema().catch(console.error);
}
