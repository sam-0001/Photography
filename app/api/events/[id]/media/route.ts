import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import connectDB from '@/lib/mongodb';
import { ClientEvent, PrivateEventMedia } from '@/lib/models';
import { findEventByIdOrToken } from '@/lib/event-lookup';
import { sanitizeUploadFilename, generateStoredFilename, verifyPathIntegrity } from '@/lib/upload-security';

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

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const query: Record<string, unknown> = { eventId: event._id };
    if (category && category !== 'All' && category !== 'all') {
      query.category = new RegExp(`^${category.trim()}$`, 'i');
    }

    const media = await PrivateEventMedia.find(query)
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: media.length,
      media,
    });
  } catch (err: unknown) {
    console.error('[GET /api/events/[id]/media]', err);
    const message = err instanceof Error ? err.message : 'Internal server error.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
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

    const formData = await req.formData();
    const rawFiles = formData.getAll('files');
    const validFiles = rawFiles.filter(
      (f): f is File => f instanceof File && f.name.length > 0 && f.size > 0
    );

    if (validFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided for event media upload.' },
        { status: 400 }
      );
    }

    const category = (formData.get('category') as string)?.trim() || 'Ceremony';
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'events', event.urlToken);
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const currentCount = event.mediaIds?.length || 0;
    const createdMedia = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const cleanName = sanitizeUploadFilename(file.name);
      const storedFilename = generateStoredFilename(cleanName, i);
      const localFilePath = verifyPathIntegrity(uploadDir, storedFilename);

      const arrayBuffer = await file.arrayBuffer();
      await fs.promises.writeFile(localFilePath, Buffer.from(arrayBuffer));

      const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name);
      const mediaDoc = await PrivateEventMedia.create({
        eventId: event._id,
        urlToken: event.urlToken,
        title: file.name,
        category,
        mediaType: isVideo ? 'video' : 'image',
        url: `/uploads/events/${event.urlToken}/${storedFilename}`,
        thumbnailUrl: `/uploads/events/${event.urlToken}/${storedFilename}`,
        fileSize: file.size,
        isCover: false,
        sortOrder: currentCount + i + 1,
      });

      createdMedia.push(mediaDoc);
    }

    // Atomically link mediaIds to parent ClientEvent
    await ClientEvent.findByIdAndUpdate(event._id, {
      $push: { mediaIds: { $each: createdMedia.map(m => m._id) } },
    });

    return NextResponse.json(
      {
        success: true,
        count: createdMedia.length,
        media: createdMedia,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('[POST /api/events/[id]/media]', err);
    const message = err instanceof Error ? err.message : 'Internal server error.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
