import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

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

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Define protected routes
  const isAdminRoute = path.startsWith('/admin') && !path.startsWith('/admin/login');
  
  // APIs to protect (write operations mostly, but for simplicity let's protect specific admin endpoints)
  // For the photography app, any POST/PUT/DELETE on /api/portfolio, /api/events, /api/stories should be protected.
  // Actually, protecting the entire /admin path is the main requirement.
  
  if (isAdminRoute) {
    const token = req.cookies.get('admin_token')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    
    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch (err) {
      // Token is invalid or expired (36h)
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }
  
  // Protect API write operations
  if (path.startsWith('/api/') && !path.startsWith('/api/admin/login') && !path.startsWith('/api/admin/setup') && !path.startsWith('/api/gallery') && !path.startsWith('/api/enquiries')) {
    // Note: If you want to allow GET requests (like fetching portfolio), we should only block non-GET
    if (req.method !== 'GET') {
      const token = req.cookies.get('admin_token')?.value;
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      try {
        await jwtVerify(token, JWT_SECRET);
      } catch (err) {
        return NextResponse.json({ error: 'Unauthorized or token expired' }, { status: 401 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*'
  ],
};
