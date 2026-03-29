import { NextResponse } from 'next/server';
import { getCurrentConfig } from '@/lib/ai-provider';

export async function GET() {
    try {
        const config = getCurrentConfig();
        return NextResponse.json(config);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
