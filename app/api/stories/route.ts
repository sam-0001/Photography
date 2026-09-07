import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { PortfolioStory } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const stories = await PortfolioStory.find().sort({ sortOrder: 1, createdAt: -1 });
    return NextResponse.json({ success: true, stories });
  } catch (err: unknown) {
    console.error('[GET /api/stories]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    
    // Auto-increment sortOrder
    const count = await PortfolioStory.countDocuments();
    const story = await PortfolioStory.create({ ...body, sortOrder: count + 1 });
    
    return NextResponse.json({ success: true, story }, { status: 201 });
  } catch (err: unknown) {
    console.error('[POST /api/stories]', err);
    const message = err instanceof Error ? err.message : 'Failed to create story';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
