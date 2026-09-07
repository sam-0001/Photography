/**
 * Tier 4: Real-World Scenarios — High-Fidelity Client Commission Simulation
 * Scenario: Vikram & Ananya Destination Wedding (Lake Como & Udaipur)
 * Reference: PROJECT.md, ORIGINAL_REQUEST.md
 */

import { ApiClient } from './helpers/api-client';
import { TestHarness } from './helpers/assert';
import { VALID_INQUIRIES, CLIENT_EVENTS, SAMPLE_PRIVATE_MEDIA, generateUniqueToken } from './helpers/fixtures';

export async function runTier4Tests(client: ApiClient, harness: TestHarness) {
  console.log('\n======================================================================');
  console.log('  RUNNING TIER 4: REAL-WORLD APPLICATION SCENARIOS');
  console.log('  Scenario: Vikram & Ananya — Destination Wedding Monograph Delivery');
  console.log('======================================================================\n');

  harness.setTest('Tier 4: Vikram & Ananya Destination Wedding Simulation');

  // --------------------------------------------------------------------------
  // Phase 1: Client Inbound Inquiry
  // --------------------------------------------------------------------------
  console.log('  [Phase 1] Couple Browses Atelier & Submits Commission Inquiry');
  const coupleInquiry = VALID_INQUIRIES.destination();
  const inquiryRes = await client.post('/api/enquiries', coupleInquiry);
  harness.assertStatus(inquiryRes, 201, 'T4.1: Couple submits destination wedding inquiry');
  harness.assertValidObjectId(inquiryRes.data?.enquiryId, 'T4.2: Studio CRM registers enquiry document');

  // --------------------------------------------------------------------------
  // Phase 2: Studio Director Sets Up Private Event Vault
  // --------------------------------------------------------------------------
  console.log('  [Phase 2] Studio Director Creates Private Client Event Vault');
  const coupleSlug = generateUniqueToken('vikram-ananya');
  const eventPayload = CLIENT_EVENTS.createPayload({
    eventName: "Vikram & Ananya — The Two-Continent Nuptials",
    clientName: "Vikram & Ananya",
    clientEmail: coupleInquiry.email,
    eventDate: "2026-10-14T00:00:00.000Z",
    venue: "Villa Balbiano, Lake Como, Italy",
    description: "Lake Como Ceremony, Villa Balbiano Twilight Portraits, and 35mm Darkroom Rolls.",
    urlToken: coupleSlug,
    pin: "7392",
    visibilityStatus: "published"
  });

  const createVaultRes = await client.post('/api/admin/events', eventPayload);
  harness.assertStatus(createVaultRes, 201, 'T4.3: Private Event Vault registered in MongoDB');
  const eventId = createVaultRes.data?.event?._id || coupleSlug;
  harness.assertEqual(createVaultRes.data?.event?.urlToken, coupleSlug, 'T4.4: Custom URL token assigned');

  // --------------------------------------------------------------------------
  // Phase 3: Darkroom Lab Curation & Asset Upload
  // --------------------------------------------------------------------------
  console.log('  [Phase 3] Darkroom Curates & Uploads Master Photographs with EXIF');
  for (const photo of SAMPLE_PRIVATE_MEDIA) {
    const uploadRes = await client.post(`/api/admin/events/${eventId}/media`, photo);
    harness.assertStatus(uploadRes, 201, `T4.upload: Uploaded "${photo.title}" (${photo.category})`);
  }

  // --------------------------------------------------------------------------
  // Phase 4: QR Table Tent Card Generation
  // --------------------------------------------------------------------------
  console.log('  [Phase 4] Studio Generates Physical QR Collateral for Reception Tables');
  const qrRes = await client.get(`/api/gallery/${coupleSlug}/qr`);
  harness.assertStatus(qrRes, 200, 'T4.5: QR code generated for table tent cards');
  harness.assertContains(qrRes.data?.galleryUrl, coupleSlug, 'T4.6: QR destination encodes couple unique gallery slug');
  harness.assertTrue(qrRes.data?.qrDataUrl?.startsWith('data:image/'), 'T4.7: QR payload contains renderable image data-URL');

  // --------------------------------------------------------------------------
  // Phase 5: Guest & Couple Reception Experience (PIN Gate & Unlock)
  // --------------------------------------------------------------------------
  console.log('  [Phase 5] Guests Scan QR Code & Encounter 4-Digit Security Gate');
  const guestBrowser = new ApiClient(client.baseUrl);

  // Initial access prompt
  const initialVisit = await guestBrowser.get(`/api/gallery/${coupleSlug}`);
  harness.assertStatus(initialVisit, 200, 'T4.8: Guest lands on private gallery URL');
  harness.assertTrue(initialVisit.data?.requiresPin, 'T4.9: Security gate active: PIN required');
  harness.assertEqual(initialVisit.data?.event?.clientName, "Vikram & Ananya", 'T4.10: Gallery renders couple name');
  harness.assertTrue(initialVisit.data?.media === undefined, 'T4.11: Zero photographs leaked before authentication');

  // Unauthorized guest attempts wrong PIN
  const rogueGuest = new ApiClient(client.baseUrl);
  const rogueAttempt = await rogueGuest.post(`/api/gallery/${coupleSlug}/verify-pin`, { pin: "0000" });
  harness.assertStatus(rogueAttempt, 401, 'T4.12: Rogue guest with wrong PIN rejected (HTTP 401)');

  // Couple enters legitimate PIN 7392
  console.log('  [Phase 6] Couple Inputs Authentic 4-Digit PIN');
  const unlockRes = await guestBrowser.post(`/api/gallery/${coupleSlug}/verify-pin`, { pin: "7392" });
  harness.assertStatus(unlockRes, 200, 'T4.13: Authentic PIN unlocks gallery vault');
  const photos = unlockRes.data?.media || [];
  harness.assertEqual(photos.length, SAMPLE_PRIVATE_MEDIA.length, 'T4.14: Full photo collection delivered (4 photos)');

  // Inspect EXIF accuracy
  const leicaPhoto = photos.find(
    (p: any) => (p as { exif?: { camera?: string; lens?: string } })?.exif?.camera === 'Leica M11-P'
  ) as { exif?: { camera?: string; lens?: string } } | undefined;
  harness.assertTrue(Boolean(leicaPhoto), 'T4.15: Leica M11-P photograph present in collection');
  harness.assertEqual(leicaPhoto?.exif?.lens, '50mm Summilux-M f/1.4', 'T4.16: Lens EXIF metadata accurate');

  // --------------------------------------------------------------------------
  // Phase 7: Post-Event Privacy Archival (Visibility: Hidden)
  // --------------------------------------------------------------------------
  console.log('  [Phase 7] Studio Suspends Gallery for Retouching (Visibility: Hidden)');
  await client.patch(`/api/admin/events/${eventId}/visibility`, { visibilityStatus: 'hidden' });
  const suspendedVisit = await guestBrowser.get(`/api/gallery/${coupleSlug}`);
  harness.assertStatus(suspendedVisit, 403, 'T4.17: Hidden gallery returns HTTP 403 Forbidden to authenticated guests');

  // Restore visibility
  await client.patch(`/api/admin/events/${eventId}/visibility`, { visibilityStatus: 'published' });
  const restoredVisit = await guestBrowser.get(`/api/gallery/${coupleSlug}`);
  harness.assertStatus(restoredVisit, 200, 'T4.18: Restoring visibility immediately restores access');
}
