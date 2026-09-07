/**
 * Embedded HTTP Specification Contract Server for Brother's Photography.
 * Implements the exact REST contracts and security gates defined in PROJECT.md.
 * Used for contract testing and test suite verification.
 */

import http from 'node:http';
import crypto from 'node:crypto';
import { SAMPLE_PRIVATE_MEDIA } from './fixtures';

export interface MockStore {
  enquiries: Record<string, unknown>[];
  clientEvents: Map<string, Record<string, unknown>>;
  eventMedia: Map<string, Record<string, unknown>[]>;
}

export function createMockStore(): MockStore {
  const store: MockStore = {
    enquiries: [],
    clientEvents: new Map(),
    eventMedia: new Map()
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
    eventDate: "2024-10-14T00:00:00.000Z",
    venue: "Villa Balbiano, Lake Como, Italy",
    description: "The Lake Como & Udaipur Nuptial Collection",
    urlToken: flagshipToken,
    pinHash: crypto.createHash('sha256').update('2025-salt').digest('hex'),
    pinSalt: 'salt',
    rawPinForContract: '2025',
    visibilityStatus: 'published',
    downloadsEnabled: true,
    sharingEnabled: true,
    viewCount: 142,
    downloadCount: 38,
    createdAt: new Date().toISOString()
  });

  store.eventMedia.set(flagshipToken, [...SAMPLE_PRIVATE_MEDIA]);

  return store;
}

export function startMockContractServer(port = 0, store: MockStore = createMockStore()): Promise<{
  server: http.Server;
  port: number;
  baseUrl: string;
  store: MockStore;
  close: () => Promise<void>;
}> {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const pathname = url.pathname;
      const method = req.method || 'GET';

      // Parse body if present
      let rawBody = '';
      for await (const chunk of req) {
        rawBody += chunk;
      }
      let body: Record<string, unknown> | null = null;
      if (rawBody) {
        try {
          body = JSON.parse(rawBody);
        } catch {
          body = null;
        }
      }

      // Parse cookies
      const cookieHeader = req.headers.cookie || '';
      const cookies: Record<string, string> = {};
      cookieHeader.split(';').forEach((pair) => {
        const [k, v] = pair.trim().split('=');
        if (k && v) cookies[k] = v;
      });

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

      // 1. Root Showcase Page
      if (pathname === '/' && method === 'GET') {
        return sendHtml(200, `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Brother's Atelier | Archival & Editorial Photography</title>
  <meta name="description" content="Stories Worth Remembering. Professional Photography & Cinematography." />
</head>
<body class="bg-[#FAF8F5] text-[#1A1918]">
  <header>
    <nav class="atelier-nav">
      <a href="/">Atelier</a>
      <a href="/portfolio">Portfolio</a>
      <a href="/films">Films</a>
      <a href="/studio">Studio</a>
      <a href="/services">Bespoke Services</a>
      <a href="#inquire">Inquire</a>
    </nav>
  </header>
  <main>
    <section class="hero-monograph">
      <h1>Brother's Photography Atelier</h1>
      <p>Fine-art editorial photography for high-profile nuptials.</p>
    </section>
  </main>
  <footer>
    <p>© 2026 Brother's Atelier. All rights reserved.</p>
  </footer>
</body>
</html>`);
      }

      // 2. Public Inquiries: POST /api/enquiries
      if (pathname === '/api/enquiries' && method === 'POST') {
        if (!body || typeof body !== 'object') {
          return sendJson(400, { error: 'Invalid JSON payload' });
        }
        const fullName = body.fullName as string | undefined;
        const email = body.email as string | undefined;
        const venue = body.venue as string | undefined;
        const commissionNature = body.commissionNature as string | undefined;
        const estimatedDate = body.estimatedDate as string | undefined;

        if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
          return sendJson(400, { error: 'Full name is required' });
        }
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
          return sendJson(400, { error: 'A valid email address is required' });
        }
        if (!venue || typeof venue !== 'string' || !venue.trim()) {
          return sendJson(400, { error: 'Venue / destination is required' });
        }
        if (!commissionNature) {
          return sendJson(400, { error: 'Commission nature is required' });
        }
        if (!estimatedDate) {
          return sendJson(400, { error: 'Estimated date is required' });
        }

        const enquiryId = crypto.randomBytes(12).toString('hex');
        const enquiry = {
          _id: enquiryId,
          ...body,
          status: 'new',
          createdAt: new Date().toISOString()
        };
        store.enquiries.push(enquiry);
        return sendJson(201, { success: true, enquiryId });
      }

      // 3. Admin Events: POST /api/admin/events
      if (pathname === '/api/admin/events' && method === 'POST') {
        if (!body || typeof body !== 'object') {
          return sendJson(400, { error: 'Invalid JSON payload' });
        }
        const eventName = body.eventName as string | undefined;
        const clientName = body.clientName as string | undefined;
        const eventDate = body.eventDate as string | undefined;
        const urlToken = body.urlToken as string | undefined;
        const pin = body.pin as string | undefined;
        const visibilityStatus = body.visibilityStatus as string | undefined;

        if (!eventName || !clientName || !eventDate) {
          return sendJson(400, { error: 'Missing required event fields (eventName, clientName, eventDate)' });
        }

        const token = urlToken || `event-${Date.now()}`;
        if (store.clientEvents.has(token)) {
          return sendJson(400, { error: `Event with token "${token}" already exists` });
        }

        const eventId = crypto.randomBytes(12).toString('hex');
        const pinSalt = 'salt_' + Date.now();
        const pinHash = pin ? crypto.createHash('sha256').update(`${pin}-${pinSalt}`).digest('hex') : null;

        const newEvent = {
          _id: eventId,
          id: eventId,
          eventName,
          clientName,
          clientEmail: body.clientEmail || '',
          clientPhone: body.clientPhone || '',
          eventDate,
          venue: body.venue || '',
          description: body.description || '',
          urlToken: token,
          pinHash,
          pinSalt,
          rawPinForContract: pin || null,
          visibilityStatus: visibilityStatus || 'published',
          downloadsEnabled: body.downloadsEnabled !== false,
          sharingEnabled: body.sharingEnabled !== false,
          viewCount: 0,
          downloadCount: 0,
          createdAt: new Date().toISOString()
        };

        store.clientEvents.set(token, newEvent);
        store.eventMedia.set(token, []);
        return sendJson(201, { success: true, event: newEvent });
      }

      // 4. Admin Events List: GET /api/admin/events
      if (pathname === '/api/admin/events' && method === 'GET') {
        const events = Array.from(store.clientEvents.values());
        return sendJson(200, { success: true, events });
      }

      // 5. Admin Event Visibility: PATCH /api/admin/events/:id/visibility
      const visMatch = pathname.match(/^\/api\/admin\/events\/([^/]+)\/visibility$/);
      if (visMatch && method === 'PATCH') {
        const idOrToken = visMatch[1];
        const event = Array.from(store.clientEvents.values()).find(e => e._id === idOrToken || e.urlToken === idOrToken);
        if (!event) {
          return sendJson(404, { error: 'Event not found' });
        }
        const visibilityStatus = body?.visibilityStatus as string | undefined;
        if (!visibilityStatus || !['published', 'private', 'hidden'].includes(visibilityStatus)) {
          return sendJson(400, { error: 'Invalid visibility status. Must be published, private, or hidden.' });
        }
        event.visibilityStatus = visibilityStatus;
        return sendJson(200, { success: true, visibilityStatus: event.visibilityStatus });
      }

      // 6. Admin Event PIN: PATCH /api/admin/events/:id/pin
      const pinMatch = pathname.match(/^\/api\/admin\/events\/([^/]+)\/pin$/);
      if (pinMatch && method === 'PATCH') {
        const idOrToken = pinMatch[1];
        const event = Array.from(store.clientEvents.values()).find(e => e._id === idOrToken || e.urlToken === idOrToken);
        if (!event) {
          return sendJson(404, { error: 'Event not found' });
        }
        const pin = body?.pin;
        if (pin !== null && pin !== undefined) {
          if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
            return sendJson(400, { error: 'PIN must be exactly 4 digits' });
          }
          event.pinSalt = 'salt_' + Date.now();
          event.pinHash = crypto.createHash('sha256').update(`${pin}-${event.pinSalt}`).digest('hex');
          event.rawPinForContract = pin;
        } else {
          event.pinHash = null;
          event.rawPinForContract = null;
        }
        return sendJson(200, {
          success: true,
          hasPin: Boolean(event.pinHash),
          message: event.pinHash ? 'PIN updated successfully' : 'PIN removed'
        });
      }

      // 7. Admin Add Media: POST /api/admin/events/:id/media
      const mediaMatch = pathname.match(/^\/api\/admin\/events\/([^/]+)\/media$/);
      if (mediaMatch && method === 'POST') {
        const idOrToken = mediaMatch[1];
        const event = Array.from(store.clientEvents.values()).find(e => e._id === idOrToken || e.urlToken === idOrToken);
        if (!event) {
          return sendJson(404, { error: 'Event not found' });
        }
        const token = event.urlToken as string;
        const currentMedia = store.eventMedia.get(token) || [];
        const newMediaItem = {
          _id: crypto.randomBytes(12).toString('hex'),
          eventId: event._id,
          urlToken: token,
          ...body,
          createdAt: new Date().toISOString()
        };
        currentMedia.push(newMediaItem);
        store.eventMedia.set(token, currentMedia);
        return sendJson(201, { success: true, mediaItem: newMediaItem });
      }

      // 8. Client Gallery: GET /api/gallery/:token
      const galleryMatch = pathname.match(/^\/api\/gallery\/([^/]+)$/);
      if (galleryMatch && method === 'GET') {
        const token = galleryMatch[1];
        const event = store.clientEvents.get(token);
        if (!event) {
          return sendJson(404, { error: 'Gallery not found' });
        }

        // Check if hidden -> 403 Forbidden
        if (event.visibilityStatus === 'hidden') {
          return sendJson(403, {
            error: 'Gallery unavailable',
            status: 'hidden',
            message: 'This gallery is currently hidden or archived.'
          });
        }

        const hasValidSession = cookies[`gallery_token_${token}`] === 'valid';
        const hasPin = Boolean(event.pinHash);

        // If PIN is required and client is not verified
        if (hasPin && !hasValidSession) {
          return sendJson(200, {
            requiresPin: true,
            event: {
              eventName: event.eventName,
              clientName: event.clientName,
              eventDate: event.eventDate,
              venue: event.venue,
              description: event.description
            }
          });
        }

        // Unlocked / No PIN required
        const media = store.eventMedia.get(token) || [];
        return sendJson(200, {
          requiresPin: false,
          unlocked: true,
          event: {
            eventName: event.eventName,
            clientName: event.clientName,
            eventDate: event.eventDate,
            venue: event.venue,
            description: event.description
          },
          media
        });
      }

      // 9. Client Verify PIN: POST /api/gallery/:token/verify-pin
      const verifyMatch = pathname.match(/^\/api\/gallery\/([^/]+)\/verify-pin$/);
      if (verifyMatch && method === 'POST') {
        const token = verifyMatch[1];
        const event = store.clientEvents.get(token);
        if (!event) {
          return sendJson(404, { error: 'Gallery not found' });
        }

        if (event.visibilityStatus === 'hidden') {
          return sendJson(403, { error: 'Gallery unavailable', status: 'hidden' });
        }

        const pin = body?.pin;
        if (!pin || typeof pin !== 'string') {
          return sendJson(400, { error: 'PIN is required' });
        }

        // Verify PIN
        const isMatch = event.rawPinForContract === pin;
        if (!isMatch) {
          return sendJson(401, { success: false, error: 'Invalid PIN code.' });
        }

        const media = store.eventMedia.get(token) || [];
        return sendJson(
          200,
          {
            success: true,
            accessToken: `vault_token_${Date.now()}`,
            media
          },
          {
            'Set-Cookie': `gallery_token_${token}=valid; Path=/; HttpOnly; SameSite=Lax`
          }
        );
      }

      // 10. QR Code: GET /api/gallery/:token/qr
      const qrMatch = pathname.match(/^\/api\/gallery\/([^/]+)\/qr$/);
      if (qrMatch && method === 'GET') {
        const token = qrMatch[1];
        const event = store.clientEvents.get(token);
        if (!event) {
          return sendJson(404, { error: 'Gallery not found' });
        }

        const galleryUrl = `https://brothers-atelier.com/gallery/${token}`;
        const qrDataUrl = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
        return sendJson(200, {
          success: true,
          token,
          galleryUrl,
          qrDataUrl
        });
      }

      // Fallthrough
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
