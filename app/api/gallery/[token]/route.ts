import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ClientEvent, PrivateEventMedia } from '@/lib/models';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

interface IEvent {
  _id: string;
  eventName: string;
  clientName: string;
  eventDate: Date;
  venue: string;
  pinHash?: string | null;
  downloadsEnabled: boolean;
  visibilityStatus: string;
  mediaIds?: string[];
}

interface IMedia {
  _id: string;
  url: string;
  mediaType: string;
  caption?: string;
  thumbnailUrl?: string;
  eventId: string;
}

/**
 * GET /api/gallery/[token]
 * Returns gallery metadata (no media) so the client can decide if PIN entry is needed.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectDB();
    const { token } = await params;
    const event = await ClientEvent.findOne({ urlToken: token }).lean() as IEvent | null;

    if (!event) return NextResponse.json({ error: 'Gallery not found.' }, { status: 404 });
    if (event.visibilityStatus === 'hidden')
      return NextResponse.json({ error: 'This gallery is currently disabled.' }, { status: 403 });

    return NextResponse.json({
      eventName: event.eventName,
      clientName: event.clientName,
      eventDate: event.eventDate,
      venue: event.venue,
      hasPin: Boolean(event.pinHash),
      downloadsEnabled: event.downloadsEnabled,
      visibilityStatus: event.visibilityStatus,
      mediaCount: event.mediaIds?.length || 0,
    });
  } catch (err) {
    console.error('[GET /api/gallery/[token]]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

/**
 * POST /api/gallery/[token]
 * Verifies optional PIN and returns full media list on success.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connectDB();
    const { token } = await params;
    const { pin } = await req.json();

    const event = await ClientEvent.findOne({ urlToken: token }).lean() as IEvent | null;
    if (!event) return NextResponse.json({ error: 'Gallery not found.' }, { status: 404 });
    if (event.visibilityStatus === 'hidden')
      return NextResponse.json({ error: 'Gallery is disabled.' }, { status: 403 });

    if (event.pinHash) {
      if (!pin) return NextResponse.json({ error: 'PIN required.' }, { status: 401 });
      const valid = await bcrypt.compare(String(pin), event.pinHash);
      if (!valid) return NextResponse.json({ error: 'Incorrect PIN.' }, { status: 401 });
    }

    const media = await PrivateEventMedia.find({ eventId: event._id }).lean() as unknown as IMedia[];
    await ClientEvent.findByIdAndUpdate(event._id, { $inc: { viewCount: 1 } });

    return NextResponse.json({
      eventName: event.eventName,
      clientName: event.clientName,
      eventDate: event.eventDate,
      venue: event.venue,
      downloadsEnabled: event.downloadsEnabled,
      media: media.map((m) => ({
        _id: m._id,
        url: m.url,
        mediaType: m.mediaType,
        caption: m.caption,
        thumbnailUrl: m.thumbnailUrl,
      })),
    });
  } catch (err) {
    console.error('[POST /api/gallery/[token]]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
