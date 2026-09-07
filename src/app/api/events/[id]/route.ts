import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ClientEvent } from '@/lib/models';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = {};

    if (body.visibilityStatus !== undefined) update.visibilityStatus = body.visibilityStatus;
    if (body.downloadsEnabled !== undefined) update.downloadsEnabled = body.downloadsEnabled;
    if (body.pin !== undefined) {
      update.pinHash = body.pin ? await bcrypt.hash(String(body.pin), 10) : null;
    }

    const event = await ClientEvent.findByIdAndUpdate(id, update, { new: true });
    if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/events/[id]]', err);
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
    await ClientEvent.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/events/[id]]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
