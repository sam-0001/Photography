/**
 * Tier 2: Boundary, Edge Cases, Negative Scenarios & Security Hardening
 * Reference: PROJECT.md, ORIGINAL_REQUEST.md
 */

import { ApiClient } from './helpers/api-client';
import { TestHarness } from './helpers/assert';
import { INVALID_INQUIRIES, CLIENT_EVENTS, generateUniqueToken } from './helpers/fixtures';

export async function runTier2Tests(client: ApiClient, harness: TestHarness) {
  console.log('\n======================================================================');
  console.log('  RUNNING TIER 2: BOUNDARY & CORNER CASES');
  console.log('======================================================================\n');

  // --------------------------------------------------------------------------
  // 1. Inquiries Validation: Malformed Email & Missing Fields
  // --------------------------------------------------------------------------
  harness.setTest('Tier 2.1: Inquiries Form Validation');
  console.log('  [Tier 2.1] Inquiries Form Validation');

  // Malformed email
  const badEmailRes = await client.post('/api/enquiries', INVALID_INQUIRIES.malformedEmail());
  harness.assertStatus(badEmailRes, 400, 'T2.1.1: Malformed email returns HTTP 400 Bad Request');
  harness.assertContains(badEmailRes.data?.error || badEmailRes.rawText, 'valid email', 'T2.1.2: Error message specifies invalid email');

  // Missing full name
  const missingNameRes = await client.post('/api/enquiries', INVALID_INQUIRIES.missingFullName());
  harness.assertStatus(missingNameRes, 400, 'T2.1.3: Missing full name returns HTTP 400 Bad Request');

  // Missing venue
  const missingVenueRes = await client.post('/api/enquiries', INVALID_INQUIRIES.missingVenue());
  harness.assertStatus(missingVenueRes, 400, 'T2.1.4: Missing venue returns HTTP 400 Bad Request');

  // Empty payload
  const emptyRes = await client.post('/api/enquiries', INVALID_INQUIRIES.emptyPayload());
  harness.assertStatus(emptyRes, 400, 'T2.1.5: Empty POST payload returns HTTP 400 Bad Request');

  // --------------------------------------------------------------------------
  // 2. Admin Event Validation: Duplicate Tokens & Missing Fields
  // --------------------------------------------------------------------------
  harness.setTest('Tier 2.2: Admin Event Creation Boundaries');
  console.log('  [Tier 2.2] Admin Event Creation Boundaries');

  // Missing required fields
  const missingEventRes = await client.post('/api/admin/events', { eventName: "Incomplete Event" });
  harness.assertStatus(missingEventRes, 400, 'T2.2.1: Missing clientName/eventDate returns HTTP 400 Bad Request');

  // Duplicate URL token rejection
  const dupToken = generateUniqueToken('t2-dup');
  await client.post('/api/admin/events', CLIENT_EVENTS.createPayload({ urlToken: dupToken }));
  const dupRes = await client.post('/api/admin/events', CLIENT_EVENTS.createPayload({ urlToken: dupToken }));
  harness.assertStatus(dupRes, 400, 'T2.2.2: Duplicate URL token registration returns HTTP 400 Bad Request');

  // --------------------------------------------------------------------------
  // 3. PIN Formatting & Boundary Validation
  // --------------------------------------------------------------------------
  harness.setTest('Tier 2.3: 4-Digit PIN Format Boundaries');
  console.log('  [Tier 2.3] 4-Digit PIN Format Boundaries');

  const tokenPinTest = generateUniqueToken('t2-pin-fmt');
  const eventPinRes = await client.post('/api/admin/events', CLIENT_EVENTS.createPayload({
    urlToken: tokenPinTest,
    pin: "1234"
  }));
  const eventId = eventPinRes.data?.event?._id || tokenPinTest;

  // Too short (3 digits)
  const shortPinRes = await client.patch(`/api/admin/events/${eventId}/pin`, { pin: "123" });
  harness.assertStatus(shortPinRes, 400, 'T2.3.1: 3-digit PIN rejected with HTTP 400 Bad Request');

  // Too long (5 digits)
  const longPinRes = await client.patch(`/api/admin/events/${eventId}/pin`, { pin: "12345" });
  harness.assertStatus(longPinRes, 400, 'T2.3.2: 5-digit PIN rejected with HTTP 400 Bad Request');

  // Non-numeric alphanumeric string
  const alphaPinRes = await client.patch(`/api/admin/events/${eventId}/pin`, { pin: "abcd" });
  harness.assertStatus(alphaPinRes, 400, 'T2.3.3: Alphanumeric non-digit PIN rejected with HTTP 400 Bad Request');

  // --------------------------------------------------------------------------
  // 4. Hidden Gallery Access Rejection (HTTP 403)
  // --------------------------------------------------------------------------
  harness.setTest('Tier 2.4: Hidden Gallery Access Rejection (HTTP 403)');
  console.log('  [Tier 2.4] Hidden Gallery Access Rejection (HTTP 403)');

  const hiddenToken = generateUniqueToken('t2-hidden');
  const hiddenEventRes = await client.post('/api/admin/events', CLIENT_EVENTS.createPayload({
    urlToken: hiddenToken,
    visibilityStatus: 'hidden',
    pin: "9999"
  }));
  const hiddenId = hiddenEventRes.data?.event?._id || hiddenToken;

  // Attempt to access hidden gallery
  const accessHiddenRes = await client.get(`/api/gallery/${hiddenToken}`);
  harness.assertStatus(accessHiddenRes, 403, 'T2.4.1: Accessing hidden gallery returns HTTP 403 Forbidden');
  harness.assertEqual(accessHiddenRes.data?.status, 'hidden', 'T2.4.2: Response body explicitly identifies status: "hidden"');

  // Attempt to verify PIN against a hidden gallery
  const verifyHiddenRes = await client.post(`/api/gallery/${hiddenToken}/verify-pin`, { pin: "9999" });
  harness.assertStatus(verifyHiddenRes, 403, 'T2.4.3: PIN verification against hidden gallery returns HTTP 403 Forbidden');

  // Toggle to published -> access becomes permissible
  await client.patch(`/api/admin/events/${hiddenId}/visibility`, { visibilityStatus: 'published' });
  const restoredRes = await client.get(`/api/gallery/${hiddenToken}`);
  harness.assertStatus(restoredRes, 200, 'T2.4.4: Unhiding gallery restores HTTP 200 access');

  // --------------------------------------------------------------------------
  // 5. Brute-Force Resilience & Resistance
  // --------------------------------------------------------------------------
  harness.setTest('Tier 2.5: Brute-Force PIN Resilience');
  console.log('  [Tier 2.5] Brute-Force PIN Resilience');

  const bruteToken = generateUniqueToken('t2-brute');
  await client.post('/api/admin/events', CLIENT_EVENTS.createPayload({
    urlToken: bruteToken,
    pin: "4321"
  }));

  const wrongPins = ["0001", "0002", "0003", "0004", "0005"];
  let allDenied = true;
  for (const wp of wrongPins) {
    const attempt = await client.post(`/api/gallery/${bruteToken}/verify-pin`, { pin: wp });
    if (attempt.status !== 401 && attempt.status !== 429) {
      allDenied = false;
    }
  }
  harness.assertTrue(allDenied, 'T2.5.1: Multiple rapid wrong PIN attempts are consistently denied (401 or 429)');
  
  // Verify correct PIN still succeeds after failed attempts
  const correctAttempt = await client.post(`/api/gallery/${bruteToken}/verify-pin`, { pin: "4321" });
  harness.assertStatus(correctAttempt, 200, 'T2.5.2: Legitimate PIN verification succeeds after failed attempts');

  // --------------------------------------------------------------------------
  // 6. Non-Existent Tokens (HTTP 404)
  // --------------------------------------------------------------------------
  harness.setTest('Tier 2.6: Non-Existent Tokens (HTTP 404)');
  console.log('  [Tier 2.6] Non-Existent Tokens (HTTP 404)');

  const nonExistentToken = `non-existent-token-${Date.now()}-xyz`;
  const notFoundGallery = await client.get(`/api/gallery/${nonExistentToken}`);
  harness.assertStatus(notFoundGallery, 404, 'T2.6.1: Non-existent gallery token returns HTTP 404 Not Found');

  const notFoundPin = await client.post(`/api/gallery/${nonExistentToken}/verify-pin`, { pin: "1234" });
  harness.assertStatus(notFoundPin, 404, 'T2.6.2: PIN verification for non-existent token returns HTTP 404 Not Found');

  const notFoundQr = await client.get(`/api/gallery/${nonExistentToken}/qr`);
  harness.assertStatus(notFoundQr, 404, 'T2.6.3: QR generation for non-existent token returns HTTP 404 Not Found');
}
