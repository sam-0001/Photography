import { NextRequest, NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let force = false;

    const url = new URL(request.url);
    if (url.searchParams.get('force') === 'true') {
      force = true;
    } else {
      const body = await request.json().catch(() => null);
      if (body && typeof body === 'object' && (body as { force?: boolean }).force === true) {
        force = true;
      }
    }

    const result = await seedDatabase({ force });

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error('[POST /api/seed] Route handler error:', error);
    const err = error as { message?: string };
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Internal server error during database seeding.',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';

    const result = await seedDatabase({ force });

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error('[GET /api/seed] Route handler error:', error);
    const err = error as { message?: string };
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Internal server error during database seeding.',
      },
      { status: 500 }
    );
  }
}
