import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ClientEvent, PrivateEventMedia } from '@/lib/models';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const event = await ClientEvent.findById(id);
    if (!event) return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });

    const body = await req.json();
    const folderUrl = body.folderUrl;
    if (!folderUrl) return NextResponse.json({ success: false, error: 'Folder URL required' }, { status: 400 });

    // Extract folder ID from URL (e.g., https://drive.google.com/drive/folders/1aBcD2eFgH3iJ4kL5mN6oP7qR8sT9uV?usp=sharing)
    const match = folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/) || folderUrl.match(/id=([a-zA-Z0-9_-]+)/);
    const folderId = match ? match[1] : null;
    
    if (!folderId) {
      return NextResponse.json({ success: false, error: 'Could not extract Folder ID from the URL provided.' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'GOOGLE_DRIVE_API_KEY is not set on the server.' }, { status: 500 });
    }

    // Call Google Drive API (v3) to list files in the public folder
    let driveApiUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&pageSize=1000&fields=files(id,name,mimeType,thumbnailLink)&key=${apiKey}`;
    
    const driveRes = await fetch(driveApiUrl);
    const driveData = await driveRes.json();

    if (!driveRes.ok) {
      console.error('Drive API Error:', driveData);
      return NextResponse.json({ success: false, error: 'Failed to read Google Drive folder. Make sure it is set to "Anyone with the link can view".' }, { status: 400 });
    }

    const files = driveData.files || [];
    if (files.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'Folder is empty or not public.' });
    }

    // Filter for images/videos
    const mediaFiles = files.filter((f: any) => f.mimeType.startsWith('image/') || f.mimeType.startsWith('video/'));

    // Create PrivateEventMedia documents using Google Drive direct viewer links
    const newMediaDocs = [];
    const currentCount = await PrivateEventMedia.countDocuments({ eventId: id });
    
    // Fetch existing media to prevent duplicates
    const existingMedia = await PrivateEventMedia.find({ eventId: id }, 'title url');
    const existingNames = new Set(existingMedia.map(m => m.title));
    const existingUrls = new Set(existingMedia.map(m => m.url));

    let addedCount = 0;

    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i];
      const isVideo = file.mimeType.startsWith('video/');
      
      // For videos, we must use the native preview iframe player.
      // For images, the Drive API 'thumbnailLink' expires after a few hours.
      // And 'uc?id=' is often blocked by CORS.
      // The most reliable permanent image URL is the undocumented thumbnail endpoint.
      let directUrl = '';
      let thumbnailUrl = '';

      if (isVideo) {
        directUrl = `https://drive.google.com/file/d/${file.id}/preview`;
        thumbnailUrl = `https://drive.google.com/thumbnail?id=${file.id}&sz=w600`;
      } else {
        directUrl = `https://drive.google.com/thumbnail?id=${file.id}&sz=w2000`; // High-res for lightbox
        thumbnailUrl = `https://drive.google.com/thumbnail?id=${file.id}&sz=w600`; // Compressed for grid
      }
      
      // Prevent duplicates by checking if the filename or exact URL already exists in this gallery
      if (existingNames.has(file.name) || existingUrls.has(directUrl)) {
        continue;
      }
      
      const mediaDoc = await PrivateEventMedia.create({
        eventId: id,
        urlToken: event.urlToken,
        title: file.name,
        mediaType: isVideo ? 'video' : 'image',
        url: directUrl,
        thumbnailUrl: thumbnailUrl,
        sortOrder: currentCount + addedCount + 1,
      });
      newMediaDocs.push(mediaDoc._id);
      addedCount++;
    }

    if (newMediaDocs.length > 0) {
      // Update Event with the new media IDs
      await ClientEvent.findByIdAndUpdate(id, { $push: { mediaIds: { $each: newMediaDocs } } });
    }

    return NextResponse.json({ success: true, count: addedCount, totalFound: mediaFiles.length });

  } catch (err: unknown) {
    console.error('[POST /api/events/[id]/drive-sync]', err);
    return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 });
  }
}
