import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { Transaction } from '@/types';

const importExistingData = async () => {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'transactions.json');
    console.log('Reading & writing to:', filePath); // Optional debug log

    const rawData = readFileSync(filePath, 'utf8');
    const transactions: Transaction[] = JSON.parse(rawData);

    const enhancedTransactions = transactions.map(t => ({
      ...t,
      Account: 'personal',
      IsInvestment: (t.Category?.toLowerCase() ?? '').includes('investment'),
      IsRecurring: ['rent', 'electricity', 'wifi', 'telephone'].some(word =>
        t.Details.toLowerCase().includes(word)
      ),
    }));

    writeFileSync(filePath, JSON.stringify(enhancedTransactions, null, 2));
    console.log('Data imported successfully!');
  } catch (error) {
    console.error('Error importing data:', error);
  }
};

importExistingData();