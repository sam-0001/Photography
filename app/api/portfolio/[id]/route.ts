import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { PortfolioMedia } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const item = await PortfolioMedia.findByIdAndUpdate(id, body, { new: true });
    if (!item) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    return NextResponse.json({ success: true, item });
  } catch (err) {
    console.error('[PATCH /api/portfolio/[id]]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    await PortfolioMedia.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/portfolio/[id]]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
