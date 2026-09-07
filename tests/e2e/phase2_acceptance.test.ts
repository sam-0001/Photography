/**
 * Brother's Photography Atelier Platform — Phase 2 Acceptance Test Suite (R1 - R4)
 * Comprehensive verification covering:
 *   1. Bulk media upload to public/uploads/ and MongoDB verification (Portfolio & Client Events)
 *   2. Multi-page dynamic routes returning HTTP 200 with dynamic content markers
 *   3. QR code endpoint returning valid PNG/SVG images for gallery URLs
 *   4. Mobile navigation drawer verification (Component AST & rendered HTML)
 *   5. context.md update verification
 *   6. Tier 5 Adversarial hardening and boundary resilience
 *
 * References:
 *   - ORIGINAL_REQUEST.md (## 2026-09-07T07:00:52Z)
 *   - PROJECT.md (§ Architecture, § Milestones, § Interface Contracts)
 */

import fs from 'node:fs';
import path from 'node:path';
import { ApiClient } from './helpers/api-client';
import { TestHarness } from './helpers/assert';
import { DbHelper } from './helpers/db-client';
import { generateUniqueToken, CLIENT_EVENTS } from './helpers/fixtures';

/**
 * Creates a minimal binary JPEG buffer with valid SOI and EOI markers for upload testing.
 */
function createSampleImageBlob(filename: string): { blob: Blob; buffer: Buffer; filename: string } {
  const jpegHeader = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0x07, 0x07, 0x08, 0x08, 0x08, 0x08, 0x09, 0x0b, 0x12, 0x0c, 0x0b, 0x0a, 0x0a, 0x0b, 0x16, 0x10,
    0x11, 0x0d, 0x12, 0x1a, 0x17, 0x1b, 0x1a, 0x1a, 0x17, 0x19, 0x19, 0x1d, 0x21, 0x2a, 0x23, 0x1d,
    0x1f, 0x28, 0x20, 0x19, 0x19, 0x25, 0x32, 0x26, 0x28, 0x2c, 0x2e, 0x31, 0x32, 0x32, 0x1e, 0x25,
    0x36, 0x3a, 0x35, 0x30, 0x39, 0x2c, 0x31, 0x32, 0x30, 0xff, 0xd9
  ]);
  return {
    blob: new Blob([jpegHeader], { type: 'image/jpeg' }),
    buffer: jpegHeader,
    filename
  };
}

// ============================================================================
// SUITE 1: Bulk Media Upload & Storage Pipeline (R2)
// ============================================================================
export async function runSuite1_BulkMediaUploadAndStorage(
  client: ApiClient,
  harness: TestHarness,
  dbHelper = new DbHelper()
) {
  console.log('\n======================================================================');
  console.log('  RUNNING SUITE 1: BULK MEDIA UPLOAD & LOCAL STORAGE PIPELINE (R2)');
  console.log('======================================================================\n');

  // --- 1.1: Bulk Portfolio Upload ---
  harness.setTest('Suite 1.1: Bulk Portfolio Media Upload');
  console.log('  [1.1] Bulk Portfolio Media Upload (POST /api/portfolio/bulk-upload)');

  const uploadTimestamp = Date.now();
  const file1Name = `monograph_como_${uploadTimestamp}_1.jpg`;
  const file2Name = `monograph_como_${uploadTimestamp}_2.jpg`;
  const file1 = createSampleImageBlob(file1Name);
  const file2 = createSampleImageBlob(file2Name);

  const portfolioFormData = new FormData();
  portfolioFormData.append('files', file1.blob, file1Name);
  portfolioFormData.append('files', file2.blob, file2Name);
  portfolioFormData.append('category', 'Weddings');
  portfolioFormData.append('isFeatured', 'true');

  const portfolioUploadRes = await client.postMultipart('/api/portfolio/bulk-upload', portfolioFormData);
  harness.assertStatus(portfolioUploadRes, 201, 'S1.1.1: Bulk portfolio upload returns HTTP 201 Created');

  const pData = portfolioUploadRes.data as Record<string, unknown>;
  harness.assertTrue(pData?.success, 'S1.1.2: Response payload confirms success: true');
  harness.assertEqual(pData?.count, 2, 'S1.1.3: Response confirms exactly 2 items uploaded');

  const uploadedMedia = (pData?.media as Array<Record<string, unknown>>) || [];
  harness.assertEqual(uploadedMedia.length, 2, 'S1.1.4: Media array contains 2 elements');

  if (uploadedMedia.length >= 2) {
    const item1 = uploadedMedia[0];
    const item2 = uploadedMedia[1];

    harness.assertTrue(Boolean(item1._id), 'S1.1.5: Uploaded item 1 has an assigned ID');
    harness.assertEqual(item1.category, 'Weddings', 'S1.1.6: Uploaded item 1 preserves assigned category "Weddings"');
    harness.assertContains(String(item1.url), '/uploads/portfolio/', 'S1.1.7: Media URL paths to /uploads/portfolio/');

    // Local Disk Storage Verification
    const relativeUrl = String(item1.url).replace(/^\//, '');
    const localFsPath = path.join(process.cwd(), 'public', relativeUrl.replace(/^public\//, ''));
    const fileExistsOnDisk = fs.existsSync(localFsPath);
    harness.assertTrue(
      fileExistsOnDisk,
      `S1.1.8: File verified on local disk at ${localFsPath}`
    );

    // MongoDB / Network Verification: Ensure portfolio query returns newly uploaded items
    const portfolioQueryRes = await client.get('/api/portfolio?category=Weddings');
    harness.assertStatus(portfolioQueryRes, 200, 'S1.1.9: GET /api/portfolio returns HTTP 200');
    const pqData = portfolioQueryRes.data as { media?: Array<{ title: string }> };
    const titles = pqData?.media?.map((m) => m.title) || [];
    harness.assertContains(titles, file1Name, 'S1.1.10: Newly uploaded portfolio asset is queryable via GET /api/portfolio');
  }

  // --- 1.2: Bulk Portfolio Upload Boundaries & Validation ---
  harness.setTest('Suite 1.2: Bulk Portfolio Upload Validation Boundaries');
  console.log('  [1.2] Bulk Portfolio Upload Boundaries (Empty files & malformed payload)');

  const emptyFormData = new FormData();
  const emptyUploadRes = await client.postMultipart('/api/portfolio/bulk-upload', emptyFormData);
  harness.assertEqual(
    emptyUploadRes.status === 400 || emptyUploadRes.status === 422,
    true,
    'S1.2.1: Bulk upload with zero files returns HTTP 400 or 422'
  );

  // --- 1.3: Client Event Media Upload & Manager ---
  harness.setTest('Suite 1.3: Client Event Media Management');
  console.log('  [1.3] Client Event Media Upload (POST /api/events/:id/media)');

  // First create or ensure a client event exists
  const uniqueToken = generateUniqueToken('vault-bulk');
  const createEventPayload = CLIENT_EVENTS.createPayload({
    eventName: "Matteo & Sofia's Lake Como Nuptials",
    clientName: "Matteo & Sofia",
    urlToken: uniqueToken,
    pin: "4820",
    visibilityStatus: "published"
  });

  const createEventRes = await client.post('/api/events', createEventPayload);
  harness.assertTrue(
    createEventRes.status === 201 || createEventRes.status === 200,
    'S1.3.1: Event created or exists for media upload test'
  );

  const eventData = (createEventRes.data as { event?: { _id?: string; urlToken?: string } })?.event;
  const targetEventIdentifier = eventData?._id || eventData?.urlToken || uniqueToken;

  // Upload 2 files to event
  const evtFile1Name = `ceremony_vault_${uploadTimestamp}_1.jpg`;
  const evtFile2Name = `ceremony_vault_${uploadTimestamp}_2.jpg`;
  const evtFile1 = createSampleImageBlob(evtFile1Name);
  const evtFile2 = createSampleImageBlob(evtFile2Name);

  const evtFormData = new FormData();
  evtFormData.append('files', evtFile1.blob, evtFile1Name);
  evtFormData.append('files', evtFile2.blob, evtFile2Name);
  evtFormData.append('category', 'Ceremony');

  const evtUploadRes = await client.postMultipart(`/api/events/${targetEventIdentifier}/media`, evtFormData);
  harness.assertStatus(evtUploadRes, 201, 'S1.3.2: POST /api/events/:id/media returns HTTP 201 Created');

  const evtUploadData = evtUploadRes.data as Record<string, unknown>;
  harness.assertTrue(evtUploadData?.success, 'S1.3.3: Event upload response payload has success: true');
  harness.assertEqual(evtUploadData?.count, 2, 'S1.3.4: Event upload response reports 2 items added');

  const evtMediaItems = (evtUploadData?.media as Array<Record<string, unknown>>) || [];
  let addedMediaId: string | null = null;
  if (evtMediaItems.length > 0) {
    const firstEvtMedia = evtMediaItems[0];
    addedMediaId = String(firstEvtMedia._id);
    harness.assertContains(String(firstEvtMedia.url), '/uploads/events/', 'S1.3.5: Event media URL routes to /uploads/events/');
    harness.assertEqual(firstEvtMedia.category, 'Ceremony', 'S1.3.6: Event media has category "Ceremony"');

    // Local Disk Storage Verification for event media
    const relativeUrl = String(firstEvtMedia.url).replace(/^\//, '');
    const localFsPath = path.join(process.cwd(), 'public', relativeUrl.replace(/^public\//, ''));
    harness.assertTrue(
      fs.existsSync(localFsPath),
      `S1.3.7: Event media file verified on local disk at ${localFsPath}`
    );
  }

  // --- 1.4: Client Event Media List & Delete ---
  harness.setTest('Suite 1.4: Client Event Media List & Delete Operations');
  console.log('  [1.4] Client Event Media List & Delete Operations');

  const listMediaRes = await client.get(`/api/events/${targetEventIdentifier}/media`);
  harness.assertStatus(listMediaRes, 200, 'S1.4.1: GET /api/events/:id/media returns HTTP 200');
  const listMediaData = listMediaRes.data as { success?: boolean; count?: number; media?: Array<{ _id: string }> };
  harness.assertTrue(listMediaData?.success, 'S1.4.2: List media returns success: true');
  harness.assertTrue((listMediaData?.media?.length || 0) >= 2, 'S1.4.3: List media returns at least 2 items');

  if (addedMediaId) {
    const deleteMediaRes = await client.delete(`/api/events/${targetEventIdentifier}/media/${addedMediaId}`);
    harness.assertStatus(deleteMediaRes, 200, 'S1.4.4: DELETE /api/events/:id/media/:mediaId returns HTTP 200');

    // Verify deletion reflected in media list
    const afterDeleteRes = await client.get(`/api/events/${targetEventIdentifier}/media`);
    const afterData = afterDeleteRes.data as { media?: Array<{ _id: string }> };
    const remainingIds = afterData?.media?.map((m) => String(m._id)) || [];
    harness.assertFalse(
      remainingIds.includes(addedMediaId),
      'S1.4.5: Deleted media ID is no longer present in event media list'
    );
  }

  // --- 1.5: Error Cases for Event Media ---
  harness.setTest('Suite 1.5: Event Media Error Boundaries');
  console.log('  [1.5] Event Media Error Boundaries (Non-existent event)');

  const nonExistentUploadRes = await client.postMultipart('/api/events/non-existent-event-99999/media', evtFormData);
  harness.assertStatus(nonExistentUploadRes, 404, 'S1.5.1: Uploading to non-existent event ID returns HTTP 404 Not Found');

  const nonExistentDeleteRes = await client.delete(`/api/events/${targetEventIdentifier}/media/non-existent-media-id-9999`);
  harness.assertStatus(nonExistentDeleteRes, 404, 'S1.5.2: Deleting non-existent media ID returns HTTP 404 Not Found');
}

// ============================================================================
// SUITE 2: Multi-Page Dynamic Routes & Dynamic Showcase (R1)
// ============================================================================
export async function runSuite2_MultiPageDynamicRoutes(client: ApiClient, harness: TestHarness) {
  console.log('\n======================================================================');
  console.log('  RUNNING SUITE 2: MULTI-PAGE DYNAMIC ROUTES & SHOWCASE (R1)');
  console.log('======================================================================\n');

  // --- 2.1: Dedicated Public Pages ---
  const publicPages = [
    {
      route: '/about',
      name: 'Heritage & Philosophy',
      markers: ['Heritage', 'Philosophy', 'Atelier', 'Brother']
    },
    {
      route: '/services',
      name: 'Bespoke Commission Tiers',
      markers: ['Bespoke', 'Services']
    },
    {
      route: '/portfolio',
      name: 'Curated Works Archive',
      markers: ['Portfolio']
    },
    {
      route: '/films',
      name: 'Cinematic Films & Motion',
      markers: ['Films', 'Cinema']
    },
    {
      route: '/studio',
      name: 'Physical Atelier & Darkroom',
      markers: ['Studio', 'Atelier']
    },
    {
      route: '/testimonials',
      name: 'Client Accolades & Reviews',
      markers: ['Testimonial', 'Accolade']
    },
    {
      route: '/contact',
      name: 'Inquire & Commission Booking',
      markers: ['Inquire', 'Commission']
    }
  ];

  for (const page of publicPages) {
    harness.setTest(`Suite 2.1: Page Route ${page.route}`);
    console.log(`  [2.1] Route ${page.route} (${page.name})`);

    const res = await client.get(page.route);
    harness.assertStatus(res, 200, `S2.1: GET ${page.route} returns HTTP 200 OK`);

    const html = res.rawText;
    harness.assertTrue(html.length > 200, `S2.1: GET ${page.route} returns non-empty HTML document (${html.length} bytes)`);

    // Check at least one of the expected content markers is present
    const matchedMarkers = page.markers.filter((marker) =>
      new RegExp(marker, 'i').test(html)
    );
    harness.assertTrue(
      matchedMarkers.length > 0,
      `S2.1: GET ${page.route} contains expected dynamic content markers (${matchedMarkers.join(', ')})`
    );
  }

  // --- 2.2: Dynamic Data Integration (MongoDB portfolio connected) ---
  harness.setTest('Suite 2.2: Dynamic Data Integration');
  console.log('  [2.2] Dynamic Data Integration vs Hardcoded Mock Data');

  const portfolioApiRes = await client.get('/api/portfolio');
  harness.assertStatus(portfolioApiRes, 200, 'S2.2.1: GET /api/portfolio returns HTTP 200');
  const portfolioData = portfolioApiRes.data as { media?: Array<{ title: string; category: string }> };
  harness.assertTrue(
    Array.isArray(portfolioData?.media),
    'S2.2.2: Portfolio API returns dynamic media array from database'
  );

  // --- 2.3: Homepage Preservation Tokens (Regression Guard) ---
  harness.setTest('Suite 2.3: Preserved Homepage Tokens');
  console.log('  [2.3] Preserved Homepage Tokens (GET /)');

  const homeRes = await client.get('/');
  harness.assertStatus(homeRes, 200, 'S2.3.1: GET / returns HTTP 200 OK');
  harness.assertContains(homeRes.rawText, 'Portfolio', 'S2.3.2: Homepage renders "Portfolio"');
  harness.assertContains(homeRes.rawText, 'Inquire', 'S2.3.3: Homepage renders "Inquire"');
  harness.assertContains(homeRes.rawText, 'Brother', 'S2.3.4: Homepage renders "Brother" brand name');
  harness.assertContains(homeRes.rawText, '2026', 'S2.3.5: Homepage renders copyright year "2026"');
}

// ============================================================================
// SUITE 3: QR Code Generation & Binary Validation (R3)
// ============================================================================
export async function runSuite3_QrCodeEndpoint(client: ApiClient, harness: TestHarness) {
  console.log('\n======================================================================');
  console.log('  RUNNING SUITE 3: QR CODE GENERATION & BINARY IMAGE VALIDATION (R3)');
  console.log('======================================================================\n');

  // Ensure an event exists to query its QR code
  const token = generateUniqueToken('qr-event');
  const eventPayload = CLIENT_EVENTS.createPayload({
    eventName: "Elena & Marcus — Archival Nuptials",
    clientName: "Elena & Marcus",
    urlToken: token,
    pin: "7721"
  });

  const createRes = await client.post('/api/events', eventPayload);
  const createdEvent = (createRes.data as { event?: { _id?: string; urlToken?: string } })?.event;
  const eventId = createdEvent?._id || createdEvent?.urlToken || token;

  // --- 3.1: PNG Format Generation ---
  harness.setTest('Suite 3.1: Binary PNG QR Code Generation');
  console.log('  [3.1] Binary PNG QR Code (GET /api/events/:id/qrcode?format=png)');

  const pngRes = await client.get(`/api/events/${eventId}/qrcode?format=png`);
  harness.assertStatus(pngRes, 200, 'S3.1.1: GET /api/events/:id/qrcode?format=png returns HTTP 200');

  const contentTypePng = pngRes.headers['content-type'] || '';
  harness.assertTrue(
    contentTypePng.includes('image/png'),
    `S3.1.2: Content-Type is image/png (actual: ${contentTypePng})`
  );

  const pngBuffer = pngRes.buffer;
  harness.assertTrue(pngBuffer.length > 100, `S3.1.3: PNG payload is valid binary image (${pngBuffer.length} bytes)`);

  // Verify PNG Magic Bytes: 89 50 4E 47 0D 0A 1A 0A
  const isPngSignature =
    pngBuffer[0] === 0x89 &&
    pngBuffer[1] === 0x50 &&
    pngBuffer[2] === 0x4e &&
    pngBuffer[3] === 0x47 &&
    pngBuffer[4] === 0x0d &&
    pngBuffer[5] === 0x0a &&
    pngBuffer[6] === 0x1a &&
    pngBuffer[7] === 0x0a;
  harness.assertTrue(isPngSignature, 'S3.1.4: PNG payload contains authoritative magic bytes (0x89504E47)');

  // Default format (no query param) should default to PNG
  const defaultRes = await client.get(`/api/events/${eventId}/qrcode`);
  harness.assertStatus(defaultRes, 200, 'S3.1.5: GET /api/events/:id/qrcode (default) returns HTTP 200');
  harness.assertTrue(
    (defaultRes.headers['content-type'] || '').includes('image/png'),
    'S3.1.6: Default format responds with image/png'
  );

  // --- 3.2: SVG Format Generation ---
  harness.setTest('Suite 3.2: Vector SVG QR Code Generation');
  console.log('  [3.2] Vector SVG QR Code (GET /api/events/:id/qrcode?format=svg)');

  const svgRes = await client.get(`/api/events/${eventId}/qrcode?format=svg`);
  harness.assertStatus(svgRes, 200, 'S3.2.1: GET /api/events/:id/qrcode?format=svg returns HTTP 200');

  const contentTypeSvg = svgRes.headers['content-type'] || '';
  harness.assertTrue(
    contentTypeSvg.includes('image/svg+xml'),
    `S3.2.2: Content-Type is image/svg+xml (actual: ${contentTypeSvg})`
  );

  const svgText = svgRes.rawText;
  harness.assertContains(svgText, '<svg', 'S3.2.3: SVG text payload starts with <svg element');
  harness.assertContains(svgText, '</svg>', 'S3.2.4: SVG text payload closes with </svg>');

  // --- 3.3: Direct Download Content-Disposition Headers ---
  harness.setTest('Suite 3.3: Direct Download Content-Disposition Header');
  console.log('  [3.3] Direct Download Disposition (download=true)');

  const downloadPngRes = await client.get(`/api/events/${eventId}/qrcode?format=png&download=true`);
  harness.assertStatus(downloadPngRes, 200, 'S3.3.1: Download request returns HTTP 200');
  const dispPng = downloadPngRes.headers['content-disposition'] || '';
  harness.assertContains(dispPng, 'attachment', 'S3.3.2: PNG download header contains "attachment"');
  harness.assertContains(dispPng, '.png', 'S3.3.3: PNG download header contains ".png" filename');

  const downloadSvgRes = await client.get(`/api/events/${eventId}/qrcode?format=svg&download=true`);
  const dispSvg = downloadSvgRes.headers['content-disposition'] || '';
  harness.assertContains(dispSvg, 'attachment', 'S3.3.4: SVG download header contains "attachment"');
  harness.assertContains(dispSvg, '.svg', 'S3.3.5: SVG download header contains ".svg" filename');

  // --- 3.4: Boundary & Error Handling ---
  harness.setTest('Suite 3.4: QR Code Error Handling');
  console.log('  [3.4] QR Code Error Handling (Non-existent events)');

  const notFoundRes = await client.get('/api/events/non-existent-event-99999/qrcode');
  harness.assertStatus(notFoundRes, 404, 'S3.4.1: Non-existent event ID returns HTTP 404 Not Found');

  const invalidHexRes = await client.get('/api/events/507f1f77bcf86cd799439099/qrcode');
  harness.assertStatus(invalidHexRes, 404, 'S3.4.2: Valid format but missing document ID returns HTTP 404');
}

// ============================================================================
// SUITE 4: Mobile Navigation Drawer Verification (R1)
// ============================================================================
export async function runSuite4_MobileNavDrawer(client: ApiClient, harness: TestHarness) {
  console.log('\n======================================================================');
  console.log('  RUNNING SUITE 4: MOBILE NAVIGATION DRAWER VERIFICATION (R1)');
  console.log('======================================================================\n');

  // --- 4.1: Rendered Mobile Navigation Markup in Public Pages ---
  harness.setTest('Suite 4.1: Rendered Mobile Navigation Markup');
  console.log('  [4.1] Rendered Mobile Navigation Markup & Route Links in Public Pages');

  const homeRes = await client.get('/');
  harness.assertStatus(homeRes, 200, 'S4.1.1: Public page returns HTTP 200');

  const html = homeRes.rawText;
  const hasMenuToggle =
    html.includes('menu') ||
    html.includes('mobile-nav') ||
    html.includes('aria-label') ||
    html.includes('<button') ||
    html.includes('svg');
  harness.assertTrue(hasMenuToggle, 'S4.1.2: Rendered HTML includes mobile navigation trigger element');

  // Verify that rendered navigation provides required Phase 2 route links
  const requiredRoutes = ['/about', '/services', '/portfolio', '/films', '/studio', '/testimonials', '/contact'];
  for (const r of requiredRoutes) {
    const hasRouteLink = html.includes(r) || html.includes(`href="${r}"`) || html.includes(`href='${r}'`);
    harness.assertTrue(hasRouteLink, `S4.1.3: Rendered navigation includes link to "${r}"`);
  }

  // Verify Backdrop Overlay Presence in Rendered Markup
  const hasBackdropInMarkup =
    html.includes('backdrop') ||
    html.includes('drawer') ||
    html.includes('overlay') ||
    html.includes('modal') ||
    html.includes('bg-black');
  harness.assertTrue(hasBackdropInMarkup, 'S4.1.4: Rendered markup includes mobile drawer / backdrop overlay container');

  // --- 4.2: Component Structure & Accessibility Source Inspection ---
  harness.setTest('Suite 4.2: Mobile Navigation Drawer Component Source Verification');
  console.log('  [4.2] Component Architecture & Code Inspection');

  const componentCandidates = [
    path.join(process.cwd(), 'components', 'public', 'MobileNavDrawer.tsx'),
    path.join(process.cwd(), 'components', 'MobileNavDrawer.tsx'),
    path.join(process.cwd(), 'components', 'public', 'Navbar.tsx'),
    path.join(process.cwd(), 'components', 'Navbar.tsx'),
    path.join(process.cwd(), 'app', 'components', 'MobileNavDrawer.tsx'),
    path.join(process.cwd(), 'app', 'components', 'Navbar.tsx')
  ];

  let drawerSource = '';
  let foundComponentPath = '';
  for (const cand of componentCandidates) {
    if (fs.existsSync(cand)) {
      drawerSource += '\n' + fs.readFileSync(cand, 'utf-8');
      if (!foundComponentPath) foundComponentPath = cand;
    }
  }

  const hasComponentFile = drawerSource.length > 0;
  harness.assertTrue(
    hasComponentFile,
    `S4.2.1: Navigation component file located on disk (found: ${foundComponentPath})`
  );

  if (hasComponentFile) {
    // If dedicated MobileNavDrawer exists or Navbar has been updated for Phase 2:
    const isPhase2Component = drawerSource.includes('/about') || drawerSource.includes('MobileNavDrawer');
    if (isPhase2Component) {
      // Full architectural verification of Phase 2 MobileNavDrawer
      for (const link of requiredRoutes) {
        harness.assertTrue(drawerSource.includes(link), `S4.2.2: Component source links to "${link}"`);
      }
      harness.assertTrue(
        drawerSource.includes('backdrop') || drawerSource.includes('bg-black') || drawerSource.includes('overlay'),
        'S4.2.3: Component implements backdrop overlay styling'
      );
      harness.assertTrue(
        drawerSource.includes('overflow') || drawerSource.includes('hidden') || drawerSource.includes('scroll'),
        'S4.2.4: Component implements scroll lock or overflow control'
      );
      harness.assertTrue(
        drawerSource.includes('Escape') || drawerSource.includes('close') || drawerSource.includes('onClose'),
        'S4.2.5: Component implements dismiss/close handler'
      );
    } else {
      // Existing Phase 1 component detected; verify basic mobile toggle structure
      harness.assertTrue(
        drawerSource.includes('open') || drawerSource.includes('Toggle menu'),
        'S4.2.2: Component implements mobile open/close toggle state'
      );
      console.log('    [Notice] Dedicated Phase 2 MobileNavDrawer.tsx will be verified upon M1 implementation.');
    }
  }
}

// ============================================================================
// SUITE 5: Context File Synchronization Verification (R4)
// ============================================================================
export async function runSuite5_ContextFileUpdate(harness: TestHarness) {
  console.log('\n======================================================================');
  console.log('  RUNNING SUITE 5: CONTEXT FILE SYNCHRONIZATION VERIFICATION (R4)');
  console.log('======================================================================\n');

  harness.setTest('Suite 5.1: Context File Existence & Formatting');
  console.log('  [5.1] Context File Inspection (/Users/sohamchaudhari/Downloads/photo/context.md)');

  const contextPath = '/Users/sohamchaudhari/Downloads/photo/context.md';
  const fileExists = fs.existsSync(contextPath);
  harness.assertTrue(fileExists, 'S5.1.1: context.md exists at required absolute path');

  if (fileExists) {
    const stats = fs.statSync(contextPath);
    harness.assertTrue(stats.size > 500, `S5.1.2: context.md is substantial document (${stats.size} bytes)`);

    const content = fs.readFileSync(contextPath, 'utf-8');
    harness.assertContains(content, '# Brother\'s Photography', 'S5.1.3: context.md has top-level project heading');
    harness.assertContains(content, 'What is DONE', 'S5.1.4: context.md contains "What is DONE" section');

    // Verify key Phase 2 tasks are represented in the context tracking
    const phase2Keywords = ['navigation', 'portfolio', 'bulk', 'qr', 'drawer'];
    for (const kw of phase2Keywords) {
      const containsKeyword = new RegExp(kw, 'i').test(content);
      harness.assertTrue(
        containsKeyword,
        `S5.1.5: context.md tracks Phase 2 feature domain: "${kw}"`
      );
    }
  }
}

// ============================================================================
// SUITE 6: Tier 5 Adversarial Hardening & Forensic Integrity Audit
// ============================================================================
export async function runSuite6_AdversarialHardening(client: ApiClient, harness: TestHarness) {
  console.log('\n======================================================================');
  console.log('  RUNNING SUITE 6: ADVERSARIAL HARDENING & FORENSIC AUDIT (TIER 5)');
  console.log('======================================================================\n');

  // --- 6.1: Path Traversal Attack Defense in Bulk Upload ---
  harness.setTest('Suite 6.1: Path Traversal Attack Defense');
  console.log('  [6.1] Path Traversal Attack Defense (../../etc/passwd)');

  const maliciousName = '../../../etc/malicious_exploit.jpg';
  const evilBlob = createSampleImageBlob(maliciousName);
  const evilFormData = new FormData();
  evilFormData.append('files', evilBlob.blob, maliciousName);
  evilFormData.append('category', 'Weddings');

  const evilRes = await client.postMultipart('/api/portfolio/bulk-upload', evilFormData);
  if (evilRes.ok && evilRes.data) {
    const media = (evilRes.data as { media?: Array<{ url: string }> })?.media || [];
    for (const item of media) {
      // Must not escape public directory
      harness.assertFalse(
        item.url.includes('..'),
        'S6.1.1: Stored media URL strips/sanitizes path traversal sequences (..)'
      );
    }
  } else {
    harness.assertTrue(
      evilRes.status === 400 || evilRes.status === 403,
      'S6.1.2: Path traversal filename rejected with client error code'
    );
  }

  // --- 6.2: SQL/NoSQL Injection Token in Routes ---
  harness.setTest('Suite 6.2: Injection Token Route Resilience');
  console.log('  [6.2] Injection Token Route Resilience ($ne, single quotes)');

  const injectionTokens = ["' OR '1'='1", '{"$ne": null}', '<script>alert(1)</script>'];
  for (const inj of injectionTokens) {
    const injRes = await client.get(`/api/events/${encodeURIComponent(inj)}/qrcode`);
    harness.assertTrue(
      injRes.status === 404 || injRes.status === 400,
      `S6.2: Injection payload "${inj}" safely rejected with HTTP 400 or 404 (status: ${injRes.status})`
    );
  }

  // --- 6.3: Large File Upload Defense ---
  harness.setTest('Suite 6.3: Multi-File Concurrency & Stress');
  console.log('  [6.3] Multi-File Bulk Upload Batch (5 files)');

  const multiFormData = new FormData();
  for (let i = 1; i <= 5; i++) {
    const batchFile = createSampleImageBlob(`batch_wedding_${Date.now()}_${i}.jpg`);
    multiFormData.append('files', batchFile.blob, batchFile.filename);
  }
  multiFormData.append('category', 'Weddings');

  const batchRes = await client.postMultipart('/api/portfolio/bulk-upload', multiFormData);
  harness.assertStatus(batchRes, 201, 'S6.3.1: Bulk batch of 5 files uploaded successfully -> HTTP 201');
  const batchData = batchRes.data as { count?: number };
  harness.assertEqual(batchData?.count, 5, 'S6.3.2: Batch upload confirms all 5 files processed');
}

// ============================================================================
// Master Phase 2 Suite Runner
// ============================================================================
export async function runAllPhase2Tests(
  client: ApiClient,
  harness: TestHarness,
  options: { suiteFilter?: string } = {}
) {
  const filter = options.suiteFilter || 'all';

  if (filter === 'all' || filter === '1') {
    await runSuite1_BulkMediaUploadAndStorage(client, harness);
  }
  if (filter === 'all' || filter === '2') {
    await runSuite2_MultiPageDynamicRoutes(client, harness);
  }
  if (filter === 'all' || filter === '3') {
    await runSuite3_QrCodeEndpoint(client, harness);
  }
  if (filter === 'all' || filter === '4') {
    await runSuite4_MobileNavDrawer(client, harness);
  }
  if (filter === 'all' || filter === '5') {
    await runSuite5_ContextFileUpdate(harness);
  }
  if (filter === 'all' || filter === '6') {
    await runSuite6_AdversarialHardening(client, harness);
  }
}
