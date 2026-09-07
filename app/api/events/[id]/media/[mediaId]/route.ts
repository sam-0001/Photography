import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { ClientEvent, PrivateEventMedia } from '@/lib/models';
import { findEventByIdOrToken } from '@/lib/event-lookup';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  try {
    await connectDB();
    const { id, mediaId } = await params;
    const event = await findEventByIdOrToken(id);

    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found.' }, { status: 404 });
    }

    if (!mediaId || !mongoose.Types.ObjectId.isValid(mediaId.trim())) {
      return NextResponse.json({ success: false, error: 'Media item not found.' }, { status: 404 });
    }

    const mediaItem = await PrivateEventMedia.findOne({
      _id: mediaId.trim(),
      eventId: event._id,
    });

    if (!mediaItem) {
      return NextResponse.json({ success: false, error: 'Media item not found.' }, { status: 404 });
    }

    // Remove from MongoDB
    await PrivateEventMedia.findByIdAndDelete(mediaItem._id);
    await ClientEvent.findByIdAndUpdate(event._id, {
      $pull: { mediaIds: mediaItem._id },
    });

    // Best-effort local file cleanup
    try {
      const relativeUrl = mediaItem.url.replace(/^\//, '').replace(/^public\//, '');
      const localFsPath = path.join(process.cwd(), 'public', relativeUrl);
      const baseEventsDir = path.resolve(process.cwd(), 'public', 'uploads', 'events');
      if (path.resolve(localFsPath).startsWith(baseEventsDir) && fs.existsSync(localFsPath)) {
        await fs.promises.unlink(localFsPath);
      }
    } catch (cleanErr) {
      console.warn('[DELETE event media] Non-fatal file deletion warning:', cleanErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Media item deleted successfully.',
      deletedMediaId: mediaId,
    });
  } catch (err: unknown) {
    console.error('[DELETE /api/events/[id]/media/[mediaId]]', err);
    const message = err instanceof Error ? err.message : 'Internal server error.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  try {
    await connectDB();
    const { id, mediaId } = await params;
    const event = await findEventByIdOrToken(id);

    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found.' }, { status: 404 });
    }

    if (!mediaId || !mongoose.Types.ObjectId.isValid(mediaId.trim())) {
      return NextResponse.json({ success: false, error: 'Media item not found.' }, { status: 404 });
    }

    const body = await req.json();
    const mediaItem = await PrivateEventMedia.findOne({
      _id: mediaId.trim(),
      eventId: event._id,
    });

    if (!mediaItem) {
      return NextResponse.json({ success: false, error: 'Media item not found.' }, { status: 404 });
    }

    if (body.isCover === true) {
      // Unset cover on all other media for this event
      await PrivateEventMedia.updateMany(
        { eventId: event._id, _id: { $ne: mediaItem._id } },
        { $set: { isCover: false } }
      );
      mediaItem.isCover = true;
      await mediaItem.save();
    } else if (body.isCover === false) {
      mediaItem.isCover = false;
      await mediaItem.save();
    }

    if (body.caption !== undefined) {
      mediaItem.caption = body.caption;
      await mediaItem.save();
    }

    if (body.category !== undefined) {
      mediaItem.category = body.category;
      await mediaItem.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Media item updated successfully.',
      media: mediaItem,
    });
  } catch (err: unknown) {
    console.error('[PATCH /api/events/[id]/media/[mediaId]]', err);
    const message = err instanceof Error ? err.message : 'Internal server error.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
