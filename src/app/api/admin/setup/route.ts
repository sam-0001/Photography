import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Admin } from '@/lib/models';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const count = await Admin.countDocuments();
    return NextResponse.json({ success: true, hasAdmin: count > 0 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    // Check if an admin already exists (prevent second registration)
    const count = await Admin.countDocuments();
    if (count > 0) {
      return NextResponse.json({ success: false, error: 'Admin account already exists. Setup is locked.' }, { status: 403 });
    }

    const { name, email, username, password } = await req.json();

    if (!name || !email || !username || !password) {
      return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newAdmin = await Admin.create({
      name,
      email,
      username,
      passwordHash,
      role: 'superadmin'
    });

    return NextResponse.json({ success: true, message: 'First-time setup complete' });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
