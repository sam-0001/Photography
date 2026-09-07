import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Admin } from '@/lib/models';
import { SignJWT } from 'jose';

export const dynamic = 'force-dynamic';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length === 0) {
    // Generate a random secret if missing in production to prevent hardcoded vulnerabilities.
    // Note: This will cause tokens to invalidate every time the server restarts/cold-starts.
    return new TextEncoder().encode(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  }
  return new TextEncoder().encode(secret);
};
const JWT_SECRET = getJwtSecret();

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password required' }, { status: 400 });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Wrong username or password. Please contact the owner.' }, { status: 401 });
    }

    const isValid = await admin.comparePassword(password);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Wrong username or password. Please contact the owner.' }, { status: 401 });
    }

    // Generate JWT (expires in 36 hours as requested)
    const token = await new SignJWT({ id: admin._id.toString(), username: admin.username, role: admin.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('36h')
      .sign(JWT_SECRET);

    const response = NextResponse.json({ success: true, message: 'Logged in successfully' });
    
    // Set HTTP-only cookie
    response.cookies.set({
      name: 'admin_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 36 * 60 * 60, // 36 hours in seconds
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
