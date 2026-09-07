/**
 * Tier 1: Core Feature Coverage Test Suite
 * Validates all 10 core system features with ≥5 assertions each (≥50 total assertions).
 * Reference: PROJECT.md, ORIGINAL_REQUEST.md
 */

import { ApiClient } from './helpers/api-client';
import { TestHarness } from './helpers/assert';
import { VALID_INQUIRIES, CLIENT_EVENTS, SAMPLE_PRIVATE_MEDIA, generateUniqueToken } from './helpers/fixtures';

export async function runTier1Tests(client: ApiClient, harness: TestHarness) {
  console.log('\n======================================================================');
  console.log('  RUNNING TIER 1: CORE FEATURE COVERAGE (≥5 Assertions per Feature)');
  console.log('======================================================================\n');

  // --------------------------------------------------------------------------
  // Feature 1: Public Atelier Showcase Rendering
  // --------------------------------------------------------------------------
  harness.setTest('Feature 1: Public Atelier Showcase Rendering');
  console.log('  [Feature 1] Public Atelier Showcase Rendering');
  const homeRes = await client.get('/');
  harness.assertStatus(homeRes, 200, 'F1.1: GET / returns HTTP 200 OK');
  harness.assertContains(homeRes.rawText, 'Atelier', 'F1.2: Page HTML contains "Atelier" navigation');
  harness.assertContains(homeRes.rawText, 'Portfolio', 'F1.3: Page HTML contains "Portfolio" section');
  harness.assertContains(homeRes.rawText, 'Inquire', 'F1.4: Page HTML contains "Inquire" call-to-action');
  harness.assertContains(homeRes.rawText, 'Brother', 'F1.5: Page HTML contains studio brand name');
  harness.assertContains(homeRes.rawText, '2026', 'F1.6: Page HTML contains copyright year');

  // --------------------------------------------------------------------------
  // Feature 2: Inquire Form Saves to MongoDB
  // --------------------------------------------------------------------------
  harness.setTest('Feature 2: Inquire Form Submission & Persistence');
  console.log('  [Feature 2] Inquire Form Submission & Persistence');
  
  // F2.1: Standard Wedding Inquiry
  const stdInquiry = VALID_INQUIRIES.standard();
  const stdRes = await client.post('/api/enquiries', stdInquiry);
  harness.assertStatus(stdRes, 201, 'F2.1: Valid standard inquiry returns HTTP 201 Created');
  harness.assertTrue(stdRes.data?.success, 'F2.2: Standard inquiry response includes success: true');
  harness.assertValidObjectId(stdRes.data?.enquiryId, 'F2.3: Returns valid 24-character hex MongoDB enquiryId');

  // F2.2: Minimal Inquiry
  const minInquiry = VALID_INQUIRIES.minimal();
  const minRes = await client.post('/api/enquiries', minInquiry);
  harness.assertStatus(minRes, 201, 'F2.4: Minimal inquiry with required fields returns HTTP 201');
  harness.assertTrue(minRes.data?.success, 'F2.5: Minimal inquiry response includes success: true');

  // F2.3: Destination Wedding Inquiry
  const destInquiry = VALID_INQUIRIES.destination();
  const destRes = await client.post('/api/enquiries', destInquiry);
  harness.assertStatus(destRes, 201, 'F2.6: Destination inquiry returns HTTP 201');

  // --------------------------------------------------------------------------
  // Feature 3: Admin Creates Client Event
  // --------------------------------------------------------------------------
  harness.setTest('Feature 3: Admin Creates Client Event');
  console.log('  [Feature 3] Admin Creates Client Event');
  const uniqueTokenF3 = generateUniqueToken('f3-event');
  const eventPayloadF3 = CLIENT_EVENTS.createPayload({
    eventName: "Matteo & Sofia — Villa d'Este Celebration",
    clientName: "Matteo & Sofia",
    urlToken: uniqueTokenF3,
    pin: "3819",
    visibilityStatus: "published"
  });

  const createEventRes = await client.post('/api/admin/events', eventPayloadF3);
  harness.assertStatus(createEventRes, 201, 'F3.1: Admin POST /api/admin/events returns HTTP 201 Created');
  harness.assertTrue(createEventRes.data?.success, 'F3.2: Create event response has success: true');
  harness.assertEqual(createEventRes.data?.event?.urlToken, uniqueTokenF3, 'F3.3: Created event contains assigned unique urlToken');
  harness.assertEqual(createEventRes.data?.event?.clientName, "Matteo & Sofia", 'F3.4: Created event matches clientName');
  harness.assertEqual(createEventRes.data?.event?.visibilityStatus, "published", 'F3.5: Default visibility is published');

  // --------------------------------------------------------------------------
  // Feature 4: Admin Toggles Gallery Visibility
  // --------------------------------------------------------------------------
  harness.setTest('Feature 4: Admin Toggles Gallery Visibility');
  console.log('  [Feature 4] Admin Toggles Gallery Visibility');
  const eventIdF4 = createEventRes.data?.event?._id || uniqueTokenF3;

  // Toggle to private
  const togPrivateRes = await client.patch(`/api/admin/events/${eventIdF4}/visibility`, { visibilityStatus: 'private' });
  harness.assertStatus(togPrivateRes, 200, 'F4.1: PATCH visibility to private returns HTTP 200');
  harness.assertEqual(togPrivateRes.data?.visibilityStatus, 'private', 'F4.2: Response reflects visibilityStatus: private');

  // Toggle to hidden
  const togHiddenRes = await client.patch(`/api/admin/events/${eventIdF4}/visibility`, { visibilityStatus: 'hidden' });
  harness.assertStatus(togHiddenRes, 200, 'F4.3: PATCH visibility to hidden returns HTTP 200');
  harness.assertEqual(togHiddenRes.data?.visibilityStatus, 'hidden', 'F4.4: Response reflects visibilityStatus: hidden');

  // Restore to published
  const togPubRes = await client.patch(`/api/admin/events/${eventIdF4}/visibility`, { visibilityStatus: 'published' });
  harness.assertStatus(togPubRes, 200, 'F4.5: PATCH visibility back to published returns HTTP 200');
  harness.assertEqual(togPubRes.data?.visibilityStatus, 'published', 'F4.6: Response reflects restored published status');

  // --------------------------------------------------------------------------
  // Feature 5: Admin Sets and Updates 4-Digit PIN
  // --------------------------------------------------------------------------
  harness.setTest('Feature 5: Admin Sets & Updates 4-Digit PIN');
  console.log('  [Feature 5] Admin Sets & Updates 4-Digit PIN');
  const uniqueTokenF5 = generateUniqueToken('f5-pin');
  const eventF5 = await client.post('/api/admin/events', CLIENT_EVENTS.createPayload({
    urlToken: uniqueTokenF5,
    pin: "1234"
  }));
  const eventIdF5 = eventF5.data?.event?._id || uniqueTokenF5;

  // Update PIN to 5678
  const updatePinRes = await client.patch(`/api/admin/events/${eventIdF5}/pin`, { pin: "5678" });
  harness.assertStatus(updatePinRes, 200, 'F5.1: PATCH /api/admin/events/:id/pin with valid 4 digits returns HTTP 200');
  harness.assertTrue(updatePinRes.data?.success, 'F5.2: Update PIN response includes success: true');
  harness.assertTrue(updatePinRes.data?.hasPin, 'F5.3: Response confirms hasPin is true');

  // Clear PIN
  const clearPinRes = await client.patch(`/api/admin/events/${eventIdF5}/pin`, { pin: null });
  harness.assertStatus(clearPinRes, 200, 'F5.4: PATCH with pin: null returns HTTP 200');
  harness.assertFalse(clearPinRes.data?.hasPin, 'F5.5: Response confirms hasPin is false after clearing');

  // Re-set PIN to 9999
  const resetPinRes = await client.patch(`/api/admin/events/${eventIdF5}/pin`, { pin: "9999" });
  harness.assertStatus(resetPinRes, 200, 'F5.6: Re-setting PIN to 9999 returns HTTP 200');
  harness.assertTrue(resetPinRes.data?.hasPin, 'F5.7: Confirms hasPin is true again');

  // --------------------------------------------------------------------------
  // Feature 6: Client Gallery Prompts for PIN
  // --------------------------------------------------------------------------
  harness.setTest('Feature 6: Client Gallery Prompts for PIN');
  console.log('  [Feature 6] Client Gallery Prompts for PIN');
  const tokenF6 = generateUniqueToken('f6-gate');
  await client.post('/api/admin/events', CLIENT_EVENTS.createPayload({
    eventName: "Lucas & Camille Nuptials",
    urlToken: tokenF6,
    pin: "8821"
  }));

  // Create clean client without any existing cookies
  const unauthedClient = new ApiClient(client.baseUrl);
  const gateRes = await unauthedClient.get(`/api/gallery/${tokenF6}`);
  harness.assertStatus(gateRes, 200, 'F6.1: Accessing PIN-protected gallery returns HTTP 200');
  harness.assertTrue(gateRes.data?.requiresPin, 'F6.2: Response flags requiresPin: true');
  harness.assertEqual(gateRes.data?.event?.eventName, "Lucas & Camille Nuptials", 'F6.3: Returns public eventName');
  harness.assertTrue(gateRes.data?.media === undefined || gateRes.data?.media?.length === 0, 'F6.4: Strict security: Private media array is omitted from unauthenticated response');
  harness.assertTrue(gateRes.data?.pinHash === undefined, 'F6.5: Strict security: pinHash is never leaked to client');

  // --------------------------------------------------------------------------
  // Feature 7: Correct PIN Unlocks Gallery
  // --------------------------------------------------------------------------
  harness.setTest('Feature 7: Correct PIN Unlocks Gallery');
  console.log('  [Feature 7] Correct PIN Unlocks Gallery');
  const guestClient = new ApiClient(client.baseUrl);
  const unlockRes = await guestClient.post(`/api/gallery/${tokenF6}/verify-pin`, { pin: "8821" });
  harness.assertStatus(unlockRes, 200, 'F7.1: Submitting correct PIN returns HTTP 200 OK');
  harness.assertTrue(unlockRes.data?.success, 'F7.2: Unlock response has success: true');
  harness.assertTrue(Array.isArray(unlockRes.data?.media), 'F7.3: Returns private media array upon unlock');
  harness.assertTrue(Boolean(unlockRes.cookies[`gallery_token_${tokenF6}`]), 'F7.4: Verification sets persistent gallery session cookie');

  // Subsequent visit with cookie persists access
  const recheckRes = await guestClient.get(`/api/gallery/${tokenF6}`);
  harness.assertStatus(recheckRes, 200, 'F7.5: Subsequent visit with cookie returns HTTP 200');
  harness.assertTrue(recheckRes.data?.unlocked, 'F7.6: Session persists: gallery reported as unlocked without re-entering PIN');

  // --------------------------------------------------------------------------
  // Feature 8: Incorrect PIN Denies Access
  // --------------------------------------------------------------------------
  harness.setTest('Feature 8: Incorrect PIN Denies Access');
  console.log('  [Feature 8] Incorrect PIN Denies Access');
  const rogueClient = new ApiClient(client.baseUrl);
  const badPinRes = await rogueClient.post(`/api/gallery/${tokenF6}/verify-pin`, { pin: "0000" });
  harness.assertStatus(badPinRes, 401, 'F8.1: Submitting incorrect PIN returns HTTP 401 Unauthorized');
  harness.assertFalse(badPinRes.data?.success, 'F8.2: Response body flags success: false');
  harness.assertContains(badPinRes.data?.error || badPinRes.rawText, 'Invalid PIN', 'F8.3: Descriptive error message returned');
  harness.assertTrue(badPinRes.data?.media === undefined, 'F8.4: Private media is strictly withheld on invalid PIN');
  harness.assertFalse(Boolean(rogueClient.getCookie(`gallery_token_${tokenF6}`)), 'F8.5: No authorization cookie is granted on failure');

  // --------------------------------------------------------------------------
  // Feature 9: Private Media Displays Event Photos
  // --------------------------------------------------------------------------
  harness.setTest('Feature 9: Private Media Displays Event Photos');
  console.log('  [Feature 9] Private Media Displays Event Photos');
  const tokenF9 = generateUniqueToken('f9-media');
  const eventF9Res = await client.post('/api/admin/events', CLIENT_EVENTS.createPayload({
    urlToken: tokenF9,
    pin: "4455"
  }));
  const eventIdF9 = eventF9Res.data?.event?._id || tokenF9;

  // Add 2 media items
  for (const item of SAMPLE_PRIVATE_MEDIA.slice(0, 2)) {
    const addMediaRes = await client.post(`/api/admin/events/${eventIdF9}/media`, item);
    harness.assertStatus(addMediaRes, 201, `F9.add: Admin successfully adds private photo "${item.title}"`);
  }

  // Unlock and inspect media
  const photoGuest = new ApiClient(client.baseUrl);
  const verifiedPhotoRes = await photoGuest.post(`/api/gallery/${tokenF9}/verify-pin`, { pin: "4455" });
  harness.assertStatus(verifiedPhotoRes, 200, 'F9.1: Correct PIN returns HTTP 200');
  const mediaList = verifiedPhotoRes.data?.media || [];
  harness.assertTrue(mediaList.length >= 2, 'F9.2: Private media array contains all uploaded event photos');
  harness.assertEqual(mediaList[0]?.title, SAMPLE_PRIVATE_MEDIA[0].title, 'F9.3: First photo title matches uploaded asset');
  harness.assertEqual(mediaList[0]?.category, "Ceremony", 'F9.4: Category is correctly classified as "Ceremony"');
  harness.assertTrue(Boolean(mediaList[0]?.url), 'F9.5: Media asset contains valid image URL');
  harness.assertEqual(mediaList[0]?.exif?.camera, "Leica M11-P", 'F9.6: EXIF camera metadata is accurately populated');

  // --------------------------------------------------------------------------
  // Feature 10: QR Code Generation System
  // --------------------------------------------------------------------------
  harness.setTest('Feature 10: QR Code Generation System');
  console.log('  [Feature 10] QR Code Generation System');
  const tokenF10 = generateUniqueToken('f10-qr');
  await client.post('/api/admin/events', CLIENT_EVENTS.createPayload({
    urlToken: tokenF10
  }));

  const qrRes = await client.get(`/api/gallery/${tokenF10}/qr`);
  harness.assertStatus(qrRes, 200, 'F10.1: GET /api/gallery/:token/qr returns HTTP 200 OK');
  harness.assertTrue(qrRes.data?.success, 'F10.2: QR response indicates success: true');
  harness.assertContains(qrRes.data?.galleryUrl, tokenF10, 'F10.3: QR galleryUrl encodes the correct event token');
  harness.assertMatches(qrRes.data?.qrDataUrl || '', /^data:image\/[a-zA-Z]+;base64,/, 'F10.4: qrDataUrl is a valid base64 data-URL');
  harness.assertEqual(qrRes.data?.token, tokenF10, 'F10.5: Response echoes the event token');
}
