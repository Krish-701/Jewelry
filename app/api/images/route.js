import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getImagePath } from '@/lib/storage';

// Helper to get image
function serveImage(filename) {
    const filepath = getImagePath(filename);
    
    if (!fs.existsSync(filepath)) {
        return null;
    }
    
    const ext = path.extname(filename).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    
    const buffer = fs.readFileSync(filepath);
    
    return new NextResponse(buffer, {
        headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=31536000',
        },
    });
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const filename = searchParams.get('filename');
        
        if (!filename) {
            return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
        }
        
        // Security: prevent directory traversal
        const safeFilename = path.basename(filename);
        const response = serveImage(safeFilename);
        
        if (!response) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }
        
        return response;
    } catch (error) {
        console.error('Image serve error:', error);
        return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
    }
}
