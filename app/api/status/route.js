import { NextResponse } from 'next/server';
import { checkJob } from '@/lib/ai-provider';
import { saveImage, updateHistoryEntry } from '@/lib/storage';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('jobId');

        if (!jobId) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }

        const result = await checkJob(jobId);
        
        // If job completed and has image, save to disk if not already saved
        if (result.status === 'completed' && result.imageUrl && !result.savedToDisk) {
            // Extract base64 from data URI
            const base64Match = result.imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
            if (base64Match) {
                const mimeType = `image/${base64Match[1]}`;
                const base64Data = base64Match[2];
                const imageUrl = saveImage(jobId, base64Data, mimeType);
                const imageFilename = `${jobId}.${mimeType.includes('png') ? 'png' : 'jpg'}`;
                
                // Update history entry
                updateHistoryEntry(jobId, {
                    status: 'completed',
                    imageUrl,
                    imageFilename,
                });
                
                result.imageUrl = imageUrl;
                result.savedToDisk = true;
            }
        }
        
        return NextResponse.json(result);
    } catch (error) {
        console.error('Status check error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to check status' },
            { status: 500 }
        );
    }
}
