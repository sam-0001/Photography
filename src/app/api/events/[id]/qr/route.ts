import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import connectDB from '@/lib/mongodb';
import { ClientEvent } from '@/lib/models';
import { findEventByIdOrToken } from '@/lib/event-lookup';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const event = await findEventByIdOrToken(id);

    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found.' }, { status: 404 });
    }

    const origin = req.headers.get('origin') ||
      req.headers.get('x-forwarded-proto') + '://' + req.headers.get('host') ||
      'http://localhost:3000';

    const galleryUrl = `${origin}/gallery/${event.urlToken}`;

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'png';
    const isPreview = searchParams.get('preview') === '1';

    if (format === 'svg') {
      const svgString = await QRCode.toString(galleryUrl, {
        type: 'svg',
        errorCorrectionLevel: 'H',
        margin: 2,
        color: {
          dark: '#000000',
          light: '#fef9f2',
        },
      });

      await ClientEvent.findByIdAndUpdate(event._id, {
        qrCodeDataUrl: `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`,
      });

      const headers: Record<string, string> = {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      };
      if (!isPreview) {
        headers['Content-Disposition'] = `attachment; filename="gallery-qr-${event.urlToken}.svg"`;
      }

      return new NextResponse(svgString, { status: 200, headers });
    }

    // Default: PNG
    const pngBuffer = await QRCode.toBuffer(galleryUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 512,
      color: {
        dark: '#000000',
        light: '#fef9f2',
      },
    });

    const dataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`;
    await ClientEvent.findByIdAndUpdate(event._id, { qrCodeDataUrl: dataUrl });

    const headers: Record<string, string> = {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    };
    if (!isPreview) {
      headers['Content-Disposition'] = `attachment; filename="gallery-qr-${event.urlToken}.png"`;
    }

    return new NextResponse(new Uint8Array(pngBuffer), { status: 200, headers });
  } catch (err: unknown) {
    console.error('[GET /api/events/[id]/qr]', err);
    const message = err instanceof Error ? err.message : 'Internal server error.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
