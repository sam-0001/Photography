import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { PortfolioStory } from '@/lib/models';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await connectDB();
    const body = await req.json();
    const story = await PortfolioStory.findByIdAndUpdate(resolvedParams.id, body, { new: true, runValidators: true });
    
    if (!story) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, story });
  } catch (err: unknown) {
    console.error('[PATCH /api/stories/[id]]', err);
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await connectDB();
    const story = await PortfolioStory.findByIdAndDelete(resolvedParams.id);
    if (!story) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, id: resolvedParams.id });
  } catch (err: unknown) {
    console.error('[DELETE /api/stories/[id]]', err);
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 400 });
  }
}
