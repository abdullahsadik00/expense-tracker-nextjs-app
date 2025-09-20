// src/db/schema.ts
import { pgTable, serial, varchar, decimal, date, boolean, timestamp, integer, text } from 'drizzle-orm/pg-core';

// Accounts
export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }),
  balance: decimal('balance', { precision: 15, scale: 2 }).default('0.00'),
  currency: varchar('currency', { length: 3 }).default('INR'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Categories
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  type: varchar('type', { length: 10 }),
});

// Transactions
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').references(() => accounts.id),
  categoryId: integer('category_id').references(() => categories.id),
  date: date('date').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  type: varchar('type', { length: 10 }),
  description: text('description'),
  merchant: varchar('merchant', { length: 255 }),
  referenceId: varchar('reference_id', { length: 100 }),
  bankCode: varchar('bank_code', { length: 50 }),
  isRecurring: boolean('is_recurring').default(false),
  isInvestment: boolean('is_investment').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});