import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getImagePath } from '@/lib/storage';

export async function GET(request, { params }) {
    try {
        const { filename } = await params;
        const filepath = getImagePath(filename);
        
        if (!fs.existsSync(filepath)) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
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
    } catch (error) {
        console.error('Image serve error:', error);
        return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
    }
}
