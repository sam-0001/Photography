import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { Enquiry } from '@/lib/models';

export const dynamic = 'force-dynamic';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COMMISSION_NATURE_MAP: Record<string, string> = {
  // Direct schema matches
  'Multi-day Wedding Monograph': 'Multi-day Wedding Monograph',
  'Intimate Destination Pre-Wedding': 'Intimate Destination Pre-Wedding',
  'Bespoke Editorial Portraiture': 'Bespoke Editorial Portraiture',
  'Commercial Fine-Art Campaign': 'Commercial Fine-Art Campaign',
  'Other': 'Other',

  // Form eventType aliases
  'Wedding': 'Multi-day Wedding Monograph',
  'Weddings': 'Multi-day Wedding Monograph',
  'Pre-Wedding': 'Intimate Destination Pre-Wedding',
  'Pre-Weddings': 'Intimate Destination Pre-Wedding',
  'Engagement': 'Intimate Destination Pre-Wedding',
  'Portrait Session': 'Bespoke Editorial Portraiture',
  'Portraits': 'Bespoke Editorial Portraiture',
  'Portrait': 'Bespoke Editorial Portraiture',
  'Commercial': 'Commercial Fine-Art Campaign',
  'Birthday': 'Other',
  'Event / Party': 'Other',
  'Celebrations': 'Other',
  'Album / Print': 'Other',
  'Films': 'Other',
  'Cinematic Films': 'Other',
};

/**
 * POST /api/enquiries
 * Handles public Inquire form submissions.
 * Validates fields, normalizes parameters, persists to MongoDB 'enquiries' collection, returns 201 with enquiryId.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Malformed request: Expected JSON body.' },
        { status: 400 }
      );
    }

    // Support both canonical schema keys and browser form aliases
    const rawFullName = (body.fullName ?? body.name) as unknown;
    const rawEmail = body.email as unknown;
    const rawPhone = body.phone as unknown;
    const rawCommissionNature = (body.commissionNature ?? body.eventType) as unknown;
    const rawEstimatedDate = (body.estimatedDate ?? body.eventDate) as unknown;
    const rawVenue = (body.venue ?? body.location) as unknown;
    const rawVisionNotes = (body.visionNotes ?? body.message ?? body.notes) as unknown;

    // 1. Full Name Validation
    if (!rawFullName || typeof rawFullName !== 'string' || rawFullName.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed: 'fullName' is required and must be at least 2 characters.",
        },
        { status: 400 }
      );
    }

    // 2. Email Validation
    if (!rawEmail || typeof rawEmail !== 'string' || !EMAIL_REGEX.test(rawEmail.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed: 'email' is required and must be a valid email address.",
        },
        { status: 400 }
      );
    }

    // 3. Commission Nature Tier Normalization & Validation
    if (!rawCommissionNature || typeof rawCommissionNature !== 'string' || rawCommissionNature.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed: 'commissionNature' tier is required.",
        },
        { status: 400 }
      );
    }

    const trimmedNature = rawCommissionNature.trim();
    let finalCommissionNature = trimmedNature;
    if (COMMISSION_NATURE_MAP[trimmedNature]) {
      finalCommissionNature = COMMISSION_NATURE_MAP[trimmedNature];
    } else if (!body.commissionNature && body.eventType) {
      finalCommissionNature = 'Other';
    }

    // 4. Estimated Date Validation
    if (!rawEstimatedDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed: 'estimatedDate' is required.",
        },
        { status: 400 }
      );
    }

    const parsedDate = new Date(rawEstimatedDate as string | number);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed: 'estimatedDate' must be a valid parseable date.",
        },
        { status: 400 }
      );
    }

    // 5. Venue Validation
    if (!rawVenue || typeof rawVenue !== 'string' || rawVenue.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed: 'venue' and destination is required.",
        },
        { status: 400 }
      );
    }

    // Connect to MongoDB Singleton
    await connectDB();

    // Save Enquiry Document
    const newEnquiry = await Enquiry.create({
      fullName: rawFullName.trim(),
      email: rawEmail.trim().toLowerCase(),
      phone: typeof rawPhone === 'string' ? rawPhone.trim() : '',
      commissionNature: finalCommissionNature,
      estimatedDate: parsedDate,
      venue: rawVenue.trim(),
      visionNotes: typeof rawVisionNotes === 'string' ? rawVisionNotes.trim() : '',
      status: 'new',
    });

    // Return HTTP 201 Created with enquiryId
    return NextResponse.json(
      {
        success: true,
        enquiryId: newEnquiry._id.toString(),
        message: 'Commission inquiry successfully recorded in studio archive.',
        enquiry: {
          id: newEnquiry._id.toString(),
          fullName: newEnquiry.fullName,
          email: newEnquiry.email,
          status: newEnquiry.status,
          createdAt: newEnquiry.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string };
    const isValidationError =
      err?.name === 'ValidationError' ||
      err?.name === 'CastError' ||
      error instanceof mongoose.Error.ValidationError ||
      error instanceof mongoose.Error.CastError;

    if (isValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: err?.message || 'Validation error while persisting commission enquiry.',
        },
        { status: 400 }
      );
    }

    console.error('[POST /api/enquiries] Unhandled error:', error);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Internal server error while persisting commission enquiry.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/enquiries
 * Retrieves list of enquiries for triage or admin review.
 * Supports optional `status` filter, `limit`, and `page` pagination.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '50', 10), 1), 100);
    const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1);
    const skip = (page - 1) * limit;

    await connectDB();

    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }

    const [enquiries, total] = await Promise.all([
      Enquiry.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Enquiry.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        success: true,
        count: enquiries.length,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        enquiries,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('[GET /api/enquiries] Unhandled error:', error);
    const err = error as { message?: string };
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Internal server error while fetching enquiries.',
      },
      { status: 500 }
    );
  }
}
