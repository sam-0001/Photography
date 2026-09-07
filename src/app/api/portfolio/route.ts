import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { PortfolioMedia } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const mediaType = searchParams.get('mediaType');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10), 1), 100) : 50;

    const query: Record<string, unknown> = { isPublished: true };

    if (category && category !== 'All' && category !== 'All Works') {
      query.category = new RegExp(`^${category.trim()}$`, 'i');
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (mediaType && ['image', 'video'].includes(mediaType.toLowerCase())) {
      query.mediaType = mediaType.toLowerCase();
    }

    const media = await PortfolioMedia.find(query)
      .sort({ sortOrder: 1, createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ success: true, count: media.length, media });
  } catch (err) {
    console.error('[GET /api/portfolio]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const item = await PortfolioMedia.create(body);
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/portfolio]', err);
    const message = err instanceof Error ? err.message : 'Internal server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
