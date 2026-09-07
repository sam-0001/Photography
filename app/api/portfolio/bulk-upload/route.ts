import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import connectDB from '@/lib/mongodb';
import { PortfolioMedia } from '@/lib/models';
import { sanitizeUploadFilename, generateStoredFilename, verifyPathIntegrity } from '@/lib/upload-security';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const formData = await req.formData();
    const rawFiles = formData.getAll('files');
    const validFiles = rawFiles.filter(
      (f): f is File => f instanceof File && f.name.length > 0 && f.size > 0
    );

    if (validFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided for bulk upload.' },
        { status: 400 }
      );
    }

    const category = (formData.get('category') as string)?.trim() || 'Weddings';
    const isFeatured = formData.get('isFeatured') === 'true';
    const customTitle = (formData.get('title') as string)?.trim();
    const customSubtitle = (formData.get('subtitle') as string)?.trim();

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'portfolio');
    await fs.promises.mkdir(uploadDir, { recursive: true });

    const currentCount = await PortfolioMedia.countDocuments();
    const createdMedia = [];

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const cleanName = sanitizeUploadFilename(file.name);
      const storedFilename = generateStoredFilename(cleanName, i);
      const localFilePath = verifyPathIntegrity(uploadDir, storedFilename);

      const arrayBuffer = await file.arrayBuffer();
      await fs.promises.writeFile(localFilePath, Buffer.from(arrayBuffer));

      const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name);
      
      const titleToUse = customTitle || file.name;
      
      const mediaDoc = await PortfolioMedia.create({
        title: titleToUse,
        subtitle: customSubtitle || undefined,
        category,
        mediaType: isVideo ? 'video' : 'image',
        url: `/uploads/portfolio/${storedFilename}`,
        thumbnailUrl: `/uploads/portfolio/${storedFilename}`,
        aspectRatio: '4:5',
        isPublished: true,
        isFeatured,
        sortOrder: currentCount + i + 1,
      });

      createdMedia.push(mediaDoc);
    }

    return NextResponse.json(
      {
        success: true,
        count: createdMedia.length,
        media: createdMedia,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('[POST /api/portfolio/bulk-upload]', err);
    const message = err instanceof Error ? err.message : 'Internal server error.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
