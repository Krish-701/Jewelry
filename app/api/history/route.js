import { NextResponse } from 'next/server';
import { getHistory, deleteHistoryEntry, readPrompt } from '@/lib/storage';

export async function GET() {
    try {
        const history = getHistory();
        
        // Enrich history with prompt text if available
        const enrichedHistory = history.map(entry => ({
            ...entry,
            promptText: readPrompt(entry.jobId),
        }));
        
        return NextResponse.json({ history: enrichedHistory });
    } catch (error) {
        console.error('History fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('jobId');
        
        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }
        
        const success = deleteHistoryEntry(jobId);
        
        if (success) {
            return NextResponse.json({ success: true, message: 'Entry deleted' });
        } else {
            return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
        }
    } catch (error) {
        console.error('History delete error:', error);
        return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }
}
