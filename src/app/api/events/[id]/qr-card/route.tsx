import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';
import QRCode from 'qrcode';
import connectDB from '@/lib/mongodb';
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

    const qrDataUrl = await QRCode.toDataURL(galleryUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400,
      color: {
        dark: '#1d1b18',
        light: '#ffffff',
      },
    });

    const isWedding = event.category?.toLowerCase().includes('wedding');
    const title = event.title || event.clientNames || 'Private Event';
    const subtitle = isWedding ? 'Happy married life, here are your timeless memories.' : 'Scan to view your private gallery.';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FAF8F5',
            border: '20px solid #ffffff',
            padding: '40px',
            fontFamily: 'serif',
          }}
        >
          {/* Inner frame */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              border: '2px solid #ccc5bd',
              padding: '60px 40px',
              backgroundColor: '#ffffff',
            }}
          >
            <span style={{ fontSize: 24, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#775927', marginBottom: 20, fontFamily: 'sans-serif' }}>
              {event.category || 'Atelier Collection'}
            </span>
            
            <h1 style={{ fontSize: 72, fontWeight: 400, color: '#1d1b18', margin: '0 0 20px 0', textAlign: 'center' }}>
              {title}
            </h1>
            
            <p style={{ fontSize: 32, fontStyle: 'italic', color: '#4a4640', marginBottom: 60, textAlign: 'center' }}>
              {subtitle}
            </p>

            <img
              src={qrDataUrl}
              width={400}
              height={400}
              style={{ border: '1px solid #ccc5bd', padding: '10px', backgroundColor: '#fff' }}
            />
            
            <span style={{ fontSize: 20, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#1d1b18', marginTop: 60, fontFamily: 'sans-serif' }}>
              SCAN TO VIEW GALLERY
            </span>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1440,
        headers: {
          'Content-Disposition': `attachment; filename="gallery-aesthetic-qr-${event.urlToken}.png"`,
        }
      }
    );
  } catch (err: unknown) {
    console.error('[GET /api/events/[id]/qr-card]', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
