#!/usr/bin/env python3
"""
Script to convert multi-line bank statement data into SQL INSERT statements for transactions table
"""

import re
from datetime import datetime

# Category mapping based on transaction descriptions
CATEGORY_MAPPING = {
    # Income categories
    'SALARY': 1,
    'BUSINESS': 2,
    'FREELANCE': 3,
    'INVESTMENT': 4,
    'RETURN': 4,

    # Expense categories
    'GROCERIES': 5,
    'SHOPPING': 6,
    'DINING': 7,
    'RESTAURANT': 7,
    'UTILITIES': 8,
    'WIFI': 9,
    'ELECTRICITY': 10,
    'GAS': 11,
    'ENTERTAINMENT': 12,
    'TRANSPORT': 13,
    'TRANSPORTATION': 13,
    'HEALTHCARE': 14,
    'MEDICAL': 14,

    # Investment categories
    'SIP': 15,
    'INVESTMENT': 15,
    'MUTUAL': 15,

    # Savings categories
    'SAVINGS': 16,
    'HOUSE': 16,

    # Transfer categories
    'TRANSFER': 17,
    'NEFT': 17,
    'UPI': 17,
    'IMPS': 17,
    'CASH WITHDRAWAL': 17
}

# Bank account mapping
BANK_ACCOUNT_MAPPING = {
    'SBI': 1,
    'BARODA': 2
}

def parse_amount(amount_str):
    """Parse amount string and return float"""
    if not amount_str or amount_str == '-':
        return 0.0
    return float(amount_str.replace(',', ''))

def detect_category(description, amount, transaction_type):
    """Detect category based on transaction description"""
    description_upper = description.upper()

    if 'SIP' in description_upper and transaction_type == 'expense':
        return 15
    if 'HOUSE' in description_upper and transaction_type == 'expense':
        return 16
    if 'CASH WITHDRAWAL' in description_upper:
        return 17
    if any(word in description_upper for word in ['TRANSFER', 'NEFT', 'UPI', 'IMPS']):
        return 17

    for keyword, category_id in CATEGORY_MAPPING.items():
        if keyword in description_upper:
            return category_id

    return 1 if transaction_type == 'income' else 6

def detect_bank_account(description):
    """Detect bank account based on transaction description"""
    description_upper = description.upper()
    for keyword, account_id in BANK_ACCOUNT_MAPPING.items():
        if keyword in description_upper:
            return account_id
    return 1  # Default SBI

def extract_merchant(description):
    """Extract merchant name from description"""
    desc = description.upper()

    patterns = [
        (r'TRANSFER TO\s+[^-]*-?\s*(.+)', 'TRANSFER TO'),
        (r'TRANSFER FROM\s+[^-]*-?\s*(.+)', 'TRANSFER FROM'),
        (r'UPI/[A-Z]+/([^/]+)', 'UPI'),
        (r'NEFT\*[^*]+\*([^*]+)', 'NEFT'),
        (r'CASH WITHDRAWAL\s+(.+)', 'CASH WITHDRAWAL')
    ]

    for pattern, prefix in patterns:
        match = re.search(pattern, desc)
        if match:
            merchant = match.group(1).strip()
            merchant = re.sub(r'[\d\*\-]', ' ', merchant).strip()
            merchant = ' '.join(merchant.split()[:4])
            return merchant.title() if merchant else None

    words = description.split()
    if len(words) > 3:
        skip_words = ['TRANSFER', 'TO', 'FROM', 'UPI', 'NEFT', 'CASH', 'WITHDRAWAL']
        meaningful_words = [w for w in words if w.upper() not in skip_words][:3]
        return ' '.join(meaningful_words).title()

    return description[:30].title()

def clean_description(description):
    desc = ' '.join(description.split())
    return desc[:97] + '...' if len(desc) > 100 else desc

def parse_transactions(raw_data):
    transactions = []
    lines = raw_data.strip().split('\n')

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        date_match = re.match(r'(\d{2} \w{3} \d{4})', line)
        if date_match:
            date_str = date_match.group(1)
            first_line_rest = line[len(date_str):].strip()
            description_lines = [first_line_rest]
            i += 1

            while i < len(lines):
                next_line = lines[i].strip()

                if re.search(r'\d+\.\d{2}', next_line) and (
                    ' -' in next_line or '- ' in next_line
                ):
                    amount_line = next_line
                    i += 1

                    balance_line = lines[i].strip() if i < len(lines) else ''
                    i += 1

                    # ✅ NEW: Better logic for debit vs credit
                    amount_line_clean = amount_line.replace(',', '')
                    debit = 0.0
                    credit = 0.0

                    match_credit = re.match(r'-\s*(\d+\.\d{2})', amount_line_clean)
                    match_debit = re.match(r'(\d+\.\d{2})\s*-', amount_line_clean)

                    if match_credit:
                        credit = parse_amount(match_credit.group(1))
                    elif match_debit:
                        debit = parse_amount(match_debit.group(1))

                    if debit > 0 and credit == 0:
                        amount = debit
                        transaction_type = 'expense'
                    elif credit > 0 and debit == 0:
                        amount = credit
                        transaction_type = 'income'
                    else:
                        amount = debit if debit > 0 else credit
                        transaction_type = 'expense' if debit > 0 else 'income'

                    balance_match = re.search(r'(\d+\.\d{2})', balance_line)
                    balance = parse_amount(balance_match.group(1)) if balance_match else 0.0

                    description = ' '.join(description_lines).strip()
                    merchant = extract_merchant(description)
                    category_id = detect_category(description, amount, transaction_type)
                    bank_account_id = detect_bank_account(description)

                    transaction = {
                        'bank_account_id': bank_account_id,
                        'category_id': category_id,
                        'transaction_date': datetime.strptime(date_str, '%d %b %Y').strftime('%Y-%m-%d'),
                        'amount': amount,
                        'type': transaction_type,
                        'description': clean_description(description),
                        'merchant': merchant,
                        'closing_balance': balance,
                        'notes': f"Original: {description}"
                    }

                    transactions.append(transaction)
                    break
                else:
                    description_lines.append(next_line)
                    i += 1
        else:
            i += 1

    return transactions

def generate_sql_insert(transaction):
    return f"""INSERT INTO transactions (
    bank_account_id,
    category_id,
    transaction_date,
    amount,
    type,
    description,
    merchant,
    closing_balance,
    notes,
    is_recurring,
    is_investment,
    created_at,
    transaction_owner
) VALUES (
    {transaction['bank_account_id']},
    {transaction['category_id']},
    '{transaction['transaction_date']}',
    {transaction['amount']:.2f},
    '{transaction['type']}',
    '{transaction['description'].replace("'", "''")}',
    {'NULL' if not transaction['merchant'] else f"'{transaction['merchant'].replace("'", "''")}'"},
    {transaction['closing_balance']:.2f},
    '{transaction['notes'].replace("'", "''")}',
    false,
    {str(transaction['category_id'] in [15, 16, 4]).lower()},
    CURRENT_TIMESTAMP,
    NULL
);"""

def main():
    raw_data = """
01 JUL 2025 TRANSFER FROM 99509044300 -
NEFT*UTIB0000070*AXISP00684760
584*BEE LOGICAL SOFT
- 43262.00
45412.18
02 JUL 2025 TRANSFER TO 4897693162093 -
UPI/DR/518309839975/DUMMY
NAME/barb/3216010002/sip
1500.00 -
43912.18
03 JUL 2025 - CASH WITHDRAWAL SELF
22000.00 -
21912.18
03 JUL 2025 TRANSFER TO 4897694162092 -
UPI/DR/518468003897/NEW
BADH/YESB/q871810046/gulab
140.00 -
21772.18
03 JUL 2025 TRANSFER FROM 4897736162097 -
UPI/CR/107459710587/NITESH
S/HDFC/nitesh.paw/UPI
- 2000.00
23772.18
03 JUL 2025 TRANSFER TO 4897694162092 -
UPI/DR/518426590563/PRADIP
K/SBIN/9763179290/UPI
88.00 -
23684.18
03 JUL 2025 TRANSFER TO 4897694162092 -
UPI/DR/518476333359/ASHA
UTT/JSFB/shindeutta/auto
81.91 -
23602.27
03 JUL 2025 TRANSFER FROM 4897736162097 -
UPI/CR/518483522938/Faiza
Fe/SBIN/faizasheik/UPI
- 200.00
23802.27
"""

    print("-- Generated SQL INSERT statements for transactions table")
    print("-- Bank statement data converted successfully\n")

    transactions = parse_transactions(raw_data)

    for i, transaction in enumerate(transactions, 1):
        print(f"-- Transaction {i}: {transaction['transaction_date']} - {transaction['description'][:50]}...")
        print(generate_sql_insert(transaction))
        print()

    print(f"-- Total transactions processed: {len(transactions)}")
    print("-- Please review and adjust category_id and bank_account_id as needed")

if __name__ == "__main__":
    main()
