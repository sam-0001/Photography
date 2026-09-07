/**
 * Embedded HTTP Specification Contract Server for Brother's Photography — Phase 2 (R1-R4)
 * Implements authoritative REST contracts for:
 *   - Bulk portfolio upload (POST /api/portfolio/bulk-upload)
 *   - Event media management (POST, GET, DELETE /api/events/:id/media)
 *   - Binary QR code generation (GET /api/events/:id/qrcode)
 *   - Multi-page dynamic routes (/about, /services, /portfolio, /films, /studio, /testimonials, /contact)
 *   - Mobile navigation drawer presentation
 * Used for contract verification and isolated self-testing.
 */

import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
import { SAMPLE_PRIVATE_MEDIA } from './fixtures';

export interface MockStorePhase2 {
  enquiries: Record<string, unknown>[];
  clientEvents: Map<string, Record<string, unknown>>;
  eventMedia: Map<string, Record<string, unknown>[]>;
  portfolioMedia: Record<string, unknown>[];
}

export function createMockStorePhase2(): MockStorePhase2 {
  const store: MockStorePhase2 = {
    enquiries: [],
    clientEvents: new Map(),
    eventMedia: new Map(),
    portfolioMedia: []
  };

  // Seed default flagship event
  const flagshipToken = 'rahul-priya-2025';
  const flagshipId = '507f1f77bcf86cd799439011';
  store.clientEvents.set(flagshipToken, {
    _id: flagshipId,
    id: flagshipId,
    eventName: "Rahul & Priya — The Two-Continent Nuptials",
    clientName: "Rahul & Priya",
    clientEmail: "priya.rahul@como-nuptials.com",
    clientPhone: "+39 02 8904 1234",
    eventDate: "2025-10-14T00:00:00.000Z",
    venue: "Villa Balbiano, Lake Como, Italy",
    description: "The Lake Como & Udaipur Nuptial Collection",
    urlToken: flagshipToken,
    pinHash: crypto.createHash('sha256').update('2025-salt').digest('hex'),
    pinSalt: 'salt',
    rawPinForContract: '2025',
    visibilityStatus: 'published',
    downloadsEnabled: true,
    sharingEnabled: true,
    mediaIds: [],
    viewCount: 142,
    downloadCount: 38,
    createdAt: new Date().toISOString()
  });

  store.eventMedia.set(flagshipToken, [...SAMPLE_PRIVATE_MEDIA]);

  // Seed initial portfolio media
  store.portfolioMedia.push(
    {
      _id: '607f1f77bcf86cd799439001',
      title: 'Monograph in Lake Como',
      subtitle: 'Villa Balbiano Editorial',
      category: 'Weddings',
      mediaType: 'image',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552',
      aspectRatio: '4:5',
      isPublished: true,
      isFeatured: true,
      sortOrder: 1,
      createdAt: new Date().toISOString()
    },
    {
      _id: '607f1f77bcf86cd799439002',
      title: 'Grand Canal Golden Hour',
      subtitle: 'Venice 35mm Analog',
      category: 'Pre-Wedding',
      mediaType: 'image',
      url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a',
      aspectRatio: '4:5',
      isPublished: true,
      isFeatured: true,
      sortOrder: 2,
      createdAt: new Date().toISOString()
    },
    {
      _id: '607f1f77bcf86cd799439003',
      title: 'The Solstice Vows',
      subtitle: '16mm Cinematic Trailer',
      category: 'Films',
      mediaType: 'video',
      url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6',
      aspectRatio: '16:9',
      isPublished: true,
      isFeatured: true,
      sortOrder: 3,
      createdAt: new Date().toISOString()
    }
  );

  return store;
}

interface ParsedMultipart {
  fields: Record<string, string>;
  files: Array<{ filename: string; contentType: string; data: Buffer }>;
}

function parseMultipartBody(buffer: Buffer, boundary: string): ParsedMultipart {
  const result: ParsedMultipart = { fields: {}, files: [] };
  const boundaryDelimiter = `--${boundary}`;
  const boundaryBuffer = Buffer.from(boundaryDelimiter);

  let start = buffer.indexOf(boundaryBuffer);
  while (start !== -1) {
    start += boundaryBuffer.length;
    // Check if end of multipart
    if (buffer.slice(start, start + 2).toString() === '--') {
      break;
    }
    // Skip newline
    if (buffer.slice(start, start + 2).toString() === '\r\n') {
      start += 2;
    }

    const nextBoundary = buffer.indexOf(boundaryBuffer, start);
    if (nextBoundary === -1) break;

    const partBuffer = buffer.slice(start, nextBoundary - 2); // Exclude \r\n before boundary
    start = nextBoundary;

    // Split headers and content
    const headerEndIndex = partBuffer.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEndIndex === -1) continue;

    const headerStr = partBuffer.slice(0, headerEndIndex).toString('utf-8');
    const content = partBuffer.slice(headerEndIndex + 4);

    const dispositionMatch = headerStr.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i);
    if (dispositionMatch) {
      const fieldName = dispositionMatch[1];
      const filename = dispositionMatch[2];
      const contentTypeMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);
      const contentType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';

      if (filename) {
        result.files.push({ filename, contentType, data: content });
      } else {
        result.fields[fieldName] = content.toString('utf-8').trim();
      }
    }
  }

  return result;
}

export function startMockContractServerPhase2(
  port = 0,
  store: MockStorePhase2 = createMockStorePhase2()
): Promise<{
  server: http.Server;
  port: number;
  baseUrl: string;
  store: MockStorePhase2;
  close: () => Promise<void>;
}> {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const pathname = url.pathname;
      const method = req.method || 'GET';

      // Read raw binary chunks
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const rawBuffer = Buffer.concat(chunks);
      const rawText = rawBuffer.toString('utf-8');

      let jsonBody: Record<string, unknown> | null = null;
      if (rawText && req.headers['content-type']?.includes('application/json')) {
        try {
          jsonBody = JSON.parse(rawText);
        } catch {
          jsonBody = null;
        }
      }

      // Parse multipart if present
      let multipart: ParsedMultipart | null = null;
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('multipart/form-data')) {
        const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
        if (boundaryMatch) {
          const boundary = boundaryMatch[1].trim().replace(/^"|"$/g, '');
          multipart = parseMultipartBody(rawBuffer, boundary);
        }
      }

      const sendJson = (status: number, data: unknown, headers: Record<string, string> = {}) => {
        res.writeHead(status, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          ...headers
        });
        res.end(JSON.stringify(data));
      };

      const sendHtml = (status: number, html: string) => {
        res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      };

      // ----------------------------------------------------------------------
      // R1: Public Routes & Dynamic Showcase
      // ----------------------------------------------------------------------

      // Shared Navigation HTML with Off-Canvas Mobile Drawer
      const navMarkup = `
        <header>
          <nav class="atelier-nav" aria-label="Main Navigation">
            <a href="/" class="brand">Brother's Atelier</a>
            <div class="desktop-links">
              <a href="/about">Heritage</a>
              <a href="/services">Bespoke Services</a>
              <a href="/portfolio">Portfolio</a>
              <a href="/films">Cinema</a>
              <a href="/studio">Studio</a>
              <a href="/testimonials">Accolades</a>
              <a href="/contact">Inquire</a>
            </div>
            <button type="button" aria-label="Open mobile navigation" class="mobile-nav-toggle" id="mobile-menu-open">
              <span class="sr-only">Open menu</span>
              <svg width="24" height="24" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          </nav>
          <div id="mobile-nav-drawer" class="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation" style="display:none;">
            <div class="mobile-nav-backdrop" id="mobile-backdrop"></div>
            <div class="mobile-nav-panel">
              <button type="button" aria-label="Close mobile navigation" id="mobile-menu-close">✕</button>
              <nav class="mobile-drawer-links">
                <a href="/about">About & Philosophy</a>
                <a href="/services">Services & Pricing</a>
                <a href="/portfolio">Selected Portfolio</a>
                <a href="/films">Cinematic Films</a>
                <a href="/studio">Atelier Studio</a>
                <a href="/testimonials">Client Testimonials</a>
                <a href="/contact">Inquire Commission</a>
              </nav>
            </div>
          </div>
        </header>
      `;

      // 1. Root / Homepage
      if (pathname === '/' && method === 'GET') {
        return sendHtml(200, `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" /><title>Brother's Atelier | Archival & Editorial Photography</title>
</head>
<body class="bg-[#FAF8F5]">
  ${navMarkup}
  <main>
    <h1>Brother's Photography Atelier</h1>
    <p>Fine-art editorial photography for high-profile nuptials.</p>
    <a href="/portfolio">Portfolio</a>
    <a href="/contact">Inquire</a>
    <section class="dynamic-highlights">
      ${store.portfolioMedia.map((m) => `<div class="portfolio-item-highlight"><h3>${m.title}</h3><span>${m.category}</span></div>`).join('')}
    </section>
  </main>
  <footer><p>© 2026 Brother's Atelier. All rights reserved.</p></footer>
</body>
</html>`);
      }

      // 2. /about Route
      if (pathname === '/about' && method === 'GET') {
        return sendHtml(200, `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>Studio Heritage & Philosophy | Brother's Photography</title></head>
<body>
  ${navMarkup}
  <main>
    <section class="hero-heritage">
      <h1>Studio Heritage & Philosophy</h1>
      <p class="philosophy-statement">Archival integrity, medium format analog craft, and timeless editorial composition.</p>
      <div class="curator-profile">Directed by Brother's Photography Atelier Masters</div>
    </section>
  </main>
  <footer><p>© 2026 Brother's Atelier</p></footer>
</body></html>`);
      }

      // 3. /services Route
      if (pathname === '/services' && method === 'GET') {
        return sendHtml(200, `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>Bespoke Commission Tiers | Brother's Photography</title></head>
<body>
  ${navMarkup}
  <main>
    <section class="commission-tiers">
      <h1>Bespoke Services & Commission Investment</h1>
      <div class="tier-card"><h3>The Monograph Collection</h3><p>Multi-day editorial wedding coverage with heirloom leather albums.</p></div>
      <div class="tier-card"><h3>Cinematic 16mm Analog</h3><p>Master motion picture capture.</p></div>
    </section>
  </main>
  <footer><p>© 2026 Brother's Atelier</p></footer>
</body></html>`);
      }

      // 4. /portfolio Route (Dynamic Backend Integration)
      if (pathname === '/portfolio' && method === 'GET') {
        const itemsHtml = store.portfolioMedia
          .map((m) => `<article class="portfolio-card" data-category="${m.category}"><img src="${m.url}" alt="${m.title}" /><h3>${m.title}</h3><span class="category-badge">${m.category}</span></article>`)
          .join('\n');
        return sendHtml(200, `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>Dynamic Portfolio Showcase | Brother's Photography</title></head>
<body>
  ${navMarkup}
  <main>
    <h1>Curated Portfolio Archive</h1>
    <div class="portfolio-gallery-grid" id="portfolio-grid">
      ${itemsHtml}
    </div>
  </main>
  <footer><p>© 2026 Brother's Atelier</p></footer>
</body></html>`);
      }

      // 5. /films Route
      if (pathname === '/films' && method === 'GET') {
        const filmItems = store.portfolioMedia.filter((m) => m.mediaType === 'video' || m.category === 'Films');
        return sendHtml(200, `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>Cinematic Films | Brother's Photography</title></head>
<body>
  ${navMarkup}
  <main>
    <h1>Cinematic Films & Motion Monographs</h1>
    <div class="cinema-reels">
      ${filmItems.map((f) => `<div class="film-item"><h3>${f.title}</h3><p>${f.subtitle || ''}</p></div>`).join('')}
    </div>
  </main>
  <footer><p>© 2026 Brother's Atelier</p></footer>
</body></html>`);
      }

      // 6. /studio Route
      if (pathname === '/studio' && method === 'GET') {
        return sendHtml(200, `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>The Physical Atelier & Darkroom | Brother's Photography</title></head>
<body>
  ${navMarkup}
  <main>
    <h1>Physical Atelier & Silver Halide Darkroom</h1>
    <p>Custom medium-format optics, archival fiber printing, and private client viewing salon.</p>
  </main>
  <footer><p>© 2026 Brother's Atelier</p></footer>
</body></html>`);
      }

      // 7. /testimonials Route
      if (pathname === '/testimonials' && method === 'GET') {
        return sendHtml(200, `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>Client Accolades & Reviews | Brother's Photography</title></head>
<body>
  ${navMarkup}
  <main>
    <h1>Client Accolades & Experiences</h1>
    <blockquote>"Brother's Photography captured our Lake Como celebration with unparalleled editorial elegance." — Priya & Rahul</blockquote>
  </main>
  <footer><p>© 2026 Brother's Atelier</p></footer>
</body></html>`);
      }

      // 8. /contact Route
      if (pathname === '/contact' && method === 'GET') {
        return sendHtml(200, `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>Inquire & Commission Booking | Brother's Photography</title></head>
<body>
  ${navMarkup}
  <main>
    <h1>Commission an Archival Monograph</h1>
    <form id="contact-inquiry-form" action="/api/enquiries" method="POST">
      <input type="text" name="fullName" placeholder="Full Name" required />
      <input type="email" name="email" placeholder="Email Address" required />
      <input type="text" name="venue" placeholder="Venue or Destination" required />
      <input type="text" name="commissionNature" placeholder="Commission Nature" required />
      <button type="submit">Submit Inquiry</button>
    </form>
  </main>
  <footer><p>© 2026 Brother's Atelier</p></footer>
</body></html>`);
      }

      // ----------------------------------------------------------------------
      // R2: Bulk Upload & Storage Pipeline
      // ----------------------------------------------------------------------

      // 9. Bulk Portfolio Upload: POST /api/portfolio/bulk-upload
      if (pathname === '/api/portfolio/bulk-upload' && method === 'POST') {
        if (!multipart || multipart.files.length === 0) {
          return sendJson(400, { error: 'No files provided for bulk upload.' });
        }

        const category = multipart.fields.category || 'Weddings';
        const isFeatured = multipart.fields.isFeatured === 'true';

        // Local upload dir
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'portfolio');
        try {
          fs.mkdirSync(uploadDir, { recursive: true });
        } catch {
          // ignore
        }

        const createdItems: Record<string, unknown>[] = [];
        for (const file of multipart.files) {
          const timestamp = Date.now();
          const base = path.basename(file.filename);
          const cleanName = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.\.+/g, '_');
          const storedFilename = `${timestamp}-${cleanName}`;
          const localFilePath = path.join(uploadDir, storedFilename);

          try {
            fs.writeFileSync(localFilePath, file.data);
          } catch {
            // write failed or test environment
          }

          const mediaItem = {
            _id: crypto.randomBytes(12).toString('hex'),
            title: file.filename,
            category,
            mediaType: file.contentType.startsWith('video/') ? 'video' : 'image',
            url: `/uploads/portfolio/${storedFilename}`,
            thumbnailUrl: `/uploads/portfolio/${storedFilename}`,
            isFeatured,
            isPublished: true,
            sortOrder: store.portfolioMedia.length + 1,
            createdAt: new Date().toISOString()
          };

          store.portfolioMedia.push(mediaItem);
          createdItems.push(mediaItem);
        }

        return sendJson(201, {
          success: true,
          count: createdItems.length,
          media: createdItems
        });
      }

      // 10. Client Event Media Upload: POST /api/events/:id/media
      const eventMediaUploadMatch = pathname.match(/^\/api\/events\/([^/]+)\/media$/);
      if (eventMediaUploadMatch && method === 'POST') {
        const idOrToken = eventMediaUploadMatch[1];
        const event = Array.from(store.clientEvents.values()).find(
          (e) => e._id === idOrToken || e.id === idOrToken || e.urlToken === idOrToken
        );
        if (!event) {
          return sendJson(404, { error: 'Event not found' });
        }

        if (!multipart || multipart.files.length === 0) {
          return sendJson(400, { error: 'No files provided for event media upload.' });
        }

        const token = event.urlToken as string;
        const category = multipart.fields.category || 'Ceremony';
        const currentMedia = store.eventMedia.get(token) || [];

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'events', token);
        try {
          fs.mkdirSync(uploadDir, { recursive: true });
        } catch {
          // ignore
        }

        const uploadedItems: Record<string, unknown>[] = [];
        for (const file of multipart.files) {
          const timestamp = Date.now();
          const base = path.basename(file.filename);
          const cleanName = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.\.+/g, '_');
          const storedFilename = `${timestamp}-${cleanName}`;
          const localFilePath = path.join(uploadDir, storedFilename);

          try {
            fs.writeFileSync(localFilePath, file.data);
          } catch {
            // ignore
          }

          const mediaItem = {
            _id: crypto.randomBytes(12).toString('hex'),
            eventId: event._id,
            urlToken: token,
            title: file.filename,
            category,
            mediaType: file.contentType.startsWith('video/') ? 'video' : 'image',
            url: `/uploads/events/${token}/${storedFilename}`,
            thumbnailUrl: `/uploads/events/${token}/${storedFilename}`,
            fileSize: file.data.length,
            isCover: false,
            sortOrder: currentMedia.length + 1,
            createdAt: new Date().toISOString()
          };

          currentMedia.push(mediaItem);
          uploadedItems.push(mediaItem);
        }

        store.eventMedia.set(token, currentMedia);

        return sendJson(201, {
          success: true,
          count: uploadedItems.length,
          media: uploadedItems
        });
      }

      // 11. Client Event Media List: GET /api/events/:id/media
      if (eventMediaUploadMatch && method === 'GET') {
        const idOrToken = eventMediaUploadMatch[1];
        const event = Array.from(store.clientEvents.values()).find(
          (e) => e._id === idOrToken || e.id === idOrToken || e.urlToken === idOrToken
        );
        if (!event) {
          return sendJson(404, { error: 'Event not found' });
        }
        const media = store.eventMedia.get(event.urlToken as string) || [];
        return sendJson(200, { success: true, count: media.length, media });
      }

      // 12. Delete Event Media: DELETE /api/events/:id/media/:mediaId
      const deleteMediaMatch = pathname.match(/^\/api\/events\/([^/]+)\/media\/([^/]+)$/);
      if (deleteMediaMatch && method === 'DELETE') {
        const idOrToken = deleteMediaMatch[1];
        const mediaId = deleteMediaMatch[2];
        const event = Array.from(store.clientEvents.values()).find(
          (e) => e._id === idOrToken || e.id === idOrToken || e.urlToken === idOrToken
        );
        if (!event) {
          return sendJson(404, { error: 'Event not found' });
        }

        const token = event.urlToken as string;
        const currentMedia = store.eventMedia.get(token) || [];
        const index = currentMedia.findIndex((m) => m._id === mediaId);
        if (index === -1) {
          return sendJson(404, { error: 'Media item not found' });
        }

        currentMedia.splice(index, 1);
        store.eventMedia.set(token, currentMedia);
        return sendJson(200, { success: true, message: 'Media item deleted', deletedMediaId: mediaId });
      }

      // ----------------------------------------------------------------------
      // R3: Binary QR Code Generation
      // ----------------------------------------------------------------------

      // 13. QR Code Endpoint: GET /api/events/:id/qrcode
      const qrCodeMatch = pathname.match(/^\/api\/events\/([^/]+)\/qrcode$/);
      if (qrCodeMatch && method === 'GET') {
        const idOrToken = qrCodeMatch[1];
        const event = Array.from(store.clientEvents.values()).find(
          (e) => e._id === idOrToken || e.id === idOrToken || e.urlToken === idOrToken
        );
        if (!event) {
          return sendJson(404, { error: 'Event not found' });
        }

        const format = (url.searchParams.get('format') || 'png').toLowerCase();
        const isDownload = url.searchParams.get('download') === 'true';
        const hostHeader = req.headers.host || 'localhost:3000';
        const galleryUrl = `http://${hostHeader}/gallery/${event.urlToken}`;

        if (format === 'svg') {
          const svgString = await QRCode.toString(galleryUrl, { type: 'svg', margin: 2 });
          const headers: Record<string, string> = {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600'
          };
          if (isDownload) {
            headers['Content-Disposition'] = `attachment; filename="qrcode-${event.urlToken}.svg"`;
          }
          res.writeHead(200, headers);
          return res.end(svgString);
        } else {
          // Default: PNG
          const pngBuffer = await QRCode.toBuffer(galleryUrl, {
            type: 'png',
            width: 512,
            margin: 2,
            color: { dark: '#1A1918', light: '#FAF8F5' }
          });
          const headers: Record<string, string> = {
            'Content-Type': 'image/png',
            'Content-Length': String(pngBuffer.length),
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600'
          };
          if (isDownload) {
            headers['Content-Disposition'] = `attachment; filename="qrcode-${event.urlToken}.png"`;
          }
          res.writeHead(200, headers);
          return res.end(pngBuffer);
        }
      }

      // ----------------------------------------------------------------------
      // Compatibility with Phase 1 Endpoints
      // ----------------------------------------------------------------------

      // Portfolio query GET /api/portfolio
      if (pathname === '/api/portfolio' && method === 'GET') {
        const category = url.searchParams.get('category');
        const featured = url.searchParams.get('featured') === 'true';

        let items = store.portfolioMedia;
        if (category && category !== 'All') {
          items = items.filter((m) => m.category === category);
        }
        if (featured) {
          items = items.filter((m) => m.isFeatured === true);
        }

        return sendJson(200, { media: items });
      }

      // Portfolio single item POST /api/portfolio
      if (pathname === '/api/portfolio' && method === 'POST') {
        if (!jsonBody) return sendJson(400, { error: 'Invalid JSON body' });
        const item = {
          _id: crypto.randomBytes(12).toString('hex'),
          ...jsonBody,
          createdAt: new Date().toISOString()
        };
        store.portfolioMedia.push(item);
        return sendJson(201, { success: true, item });
      }

      // Enquiries POST /api/enquiries
      if (pathname === '/api/enquiries' && method === 'POST') {
        const body = jsonBody || {};
        const fullName = (body.fullName || body.name) as string | undefined;
        const email = body.email as string | undefined;
        const venue = body.venue as string | undefined;

        if (!fullName || !email || !venue) {
          return sendJson(400, { error: 'Missing required enquiry fields (name/fullName, email, venue)' });
        }

        const enquiryId = crypto.randomBytes(12).toString('hex');
        store.enquiries.push({ _id: enquiryId, ...body, createdAt: new Date().toISOString() });
        return sendJson(201, { success: true, enquiryId });
      }

      // Events list & creation
      if (pathname === '/api/events' && method === 'GET') {
        return sendJson(200, { events: Array.from(store.clientEvents.values()) });
      }

      if (pathname === '/api/events' && method === 'POST') {
        if (!jsonBody) return sendJson(400, { error: 'Invalid JSON payload' });
        const { eventName, clientName, eventDate, urlToken, pin, visibilityStatus } = jsonBody as Record<string, string>;
        if (!eventName || !clientName || !eventDate) {
          return sendJson(400, { error: 'Event name, client name and date are required.' });
        }

        const token = urlToken || `event-${Date.now()}`;
        const eventId = crypto.randomBytes(12).toString('hex');
        const hostHeader = req.headers.host || 'localhost:3000';
        const galleryUrl = `http://${hostHeader}/gallery/${token}`;
        const qrCodeDataUrl = await QRCode.toDataURL(galleryUrl);

        const newEvent = {
          _id: eventId,
          id: eventId,
          eventName,
          clientName,
          clientEmail: jsonBody.clientEmail || '',
          eventDate,
          venue: jsonBody.venue || '',
          urlToken: token,
          pinHash: pin ? crypto.createHash('sha256').update(pin).digest('hex') : null,
          rawPinForContract: pin || null,
          visibilityStatus: visibilityStatus || 'published',
          downloadsEnabled: true,
          sharingEnabled: true,
          qrCodeDataUrl,
          createdAt: new Date().toISOString()
        };

        store.clientEvents.set(token, newEvent);
        store.eventMedia.set(token, []);
        return sendJson(201, { success: true, event: newEvent });
      }

      // Client Gallery GET /api/gallery/:token
      const galleryMatch = pathname.match(/^\/api\/gallery\/([^/]+)$/);
      if (galleryMatch && method === 'GET') {
        const token = galleryMatch[1];
        const event = store.clientEvents.get(token);
        if (!event) return sendJson(404, { error: 'Gallery not found' });
        const media = store.eventMedia.get(token) || [];
        return sendJson(200, { requiresPin: false, unlocked: true, event, media });
      }

      return sendJson(404, { error: `Endpoint not found: ${method} ${pathname}` });
    });

    server.listen(port, () => {
      const address = server.address() as { port: number } | null;
      const resolvedPort = address?.port || port;
      resolve({
        server,
        port: resolvedPort,
        baseUrl: `http://localhost:${resolvedPort}`,
        store,
        close: () => new Promise((resClose) => server.close(() => resClose()))
      });
    });
  });
}
