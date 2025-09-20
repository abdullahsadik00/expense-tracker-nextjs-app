import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database"
import { Transaction } from "@/types";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const account = searchParams.get('account');

        const transactions = account ? await Database.getTransactionByAccount(account) : await Database.getTransactions();
        return NextResponse.json(transactions);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const transaction: Transaction = await request.json();
        await Database.addTransaction(transaction);
        return NextResponse.json({ message: 'Transaction added successfully' }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}