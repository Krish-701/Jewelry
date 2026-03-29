import { NextResponse } from 'next/server';
import { analyzeJewelry } from '@/lib/ai-provider';

export async function POST(request) {
    try {
        const { images } = await request.json();

        if (!images || images.length === 0) {
            return NextResponse.json({ error: 'No images provided' }, { status: 400 });
        }

        // Send ALL images together for analysis
        const analysis = await analyzeJewelry(images);

        return NextResponse.json({ analysis });
    } catch (error) {
        console.error('Analyze error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to analyze jewelry' },
            { status: 500 }
        );
    }
}
