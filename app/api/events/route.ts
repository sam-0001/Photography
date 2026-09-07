import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ClientEvent } from '@/lib/models';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const events = await ClientEvent.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ events });
  } catch (err) {
    console.error('[GET /api/events]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      eventName,
      clientName,
      clientEmail,
      clientPhone,
      eventDate,
      venue,
      description,
      pin,
      visibilityStatus,
    } = body;

    if (!eventName?.trim() || !clientName?.trim() || !eventDate) {
      return NextResponse.json(
        { error: 'Event name, client name and date are required.' },
        { status: 400 }
      );
    }

    const urlToken = randomBytes(16).toString('hex');
    const pinHash = pin && pin.trim() ? await bcrypt.hash(pin.trim(), 10) : null;

    const event = await ClientEvent.create({
      eventName: eventName.trim(),
      clientName: clientName.trim(),
      clientEmail: clientEmail?.trim() || '',
      clientPhone: clientPhone?.trim() || '',
      eventDate: new Date(eventDate),
      venue: venue?.trim() || '',
      description: description?.trim() || '',
      urlToken,
      pinHash,
      visibilityStatus: visibilityStatus || 'published',
    });

    return NextResponse.json(
      {
        success: true,
        event: {
          _id: event._id,
          urlToken: event.urlToken,
          eventName: event.eventName,
          clientName: event.clientName,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('[POST /api/events]', err);
    const message = err instanceof Error ? err.message : 'Internal server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
