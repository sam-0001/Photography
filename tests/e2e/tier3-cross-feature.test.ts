/**
 * Tier 3: Cross-Feature Combinations & State Machine Workflows
 * Reference: PROJECT.md, ORIGINAL_REQUEST.md
 */

import { ApiClient } from './helpers/api-client';
import { TestHarness } from './helpers/assert';
import { VALID_INQUIRIES, CLIENT_EVENTS, SAMPLE_PRIVATE_MEDIA, generateUniqueToken } from './helpers/fixtures';

export async function runTier3Tests(client: ApiClient, harness: TestHarness) {
  console.log('\n======================================================================');
  console.log('  RUNNING TIER 3: CROSS-FEATURE INTEGRATION & STATE TRANSITIONS');
  console.log('======================================================================\n');

  harness.setTest('Tier 3: Multi-Step Cross-Feature Lifecycle');
  console.log('  [Tier 3] Multi-Step Lifecycle: Inquiry -> Event -> PIN -> Visibility -> Client Access');

  // Step 1: Prospective client submits an inquiry
  const inquiryData = VALID_INQUIRIES.standard();
  const inquiryRes = await client.post('/api/enquiries', inquiryData);
  harness.assertStatus(inquiryRes, 201, 'T3.1: Public inquiry successfully submitted');
  const inquiryId = inquiryRes.data?.enquiryId;
  harness.assertValidObjectId(inquiryId, 'T3.2: Inquiry persisted with valid ID');

  // Step 2: Admin creates dedicated Client Event vault for the client
  const vaultToken = generateUniqueToken('t3-vault');
  const eventPayload = CLIENT_EVENTS.createPayload({
    eventName: `${inquiryData.fullName} Wedding Monograph`,
    clientName: inquiryData.fullName,
    clientEmail: inquiryData.email,
    venue: inquiryData.venue,
    urlToken: vaultToken,
    pin: "1122",
    visibilityStatus: "published"
  });

  const createEventRes = await client.post('/api/admin/events', eventPayload);
  harness.assertStatus(createEventRes, 201, 'T3.3: Admin registers client event vault');
  const eventId = createEventRes.data?.event?._id || vaultToken;

  // Step 3: Admin uploads 3 event photographs
  for (const item of SAMPLE_PRIVATE_MEDIA.slice(0, 3)) {
    const uploadRes = await client.post(`/api/admin/events/${eventId}/media`, item);
    harness.assertStatus(uploadRes, 201, `T3.media: Uploaded asset "${item.title}"`);
  }

  // Step 4: Client visits gallery URL - asserts PIN gate prompt
  const clientSession = new ApiClient(client.baseUrl);
  const promptRes = await clientSession.get(`/api/gallery/${vaultToken}`);
  harness.assertStatus(promptRes, 200, 'T3.4: Client visits gallery and receives response');
  harness.assertTrue(promptRes.data?.requiresPin, 'T3.5: Client is gated: requiresPin is true');
  harness.assertTrue(promptRes.data?.media === undefined, 'T3.6: Private media is strictly hidden before PIN validation');

  // Step 5: Client enters invalid PIN
  const failRes = await clientSession.post(`/api/gallery/${vaultToken}/verify-pin`, { pin: "9999" });
  harness.assertStatus(failRes, 401, 'T3.7: Wrong PIN denied access with HTTP 401');

  // Step 6: Client enters correct PIN "1122"
  const unlockRes = await clientSession.post(`/api/gallery/${vaultToken}/verify-pin`, { pin: "1122" });
  harness.assertStatus(unlockRes, 200, 'T3.8: Correct PIN successfully unlocks gallery');
  harness.assertEqual(unlockRes.data?.media?.length, 3, 'T3.9: Unlocked response contains exactly the 3 uploaded photos');

  // Step 7: Admin toggles gallery to "hidden"
  const hideRes = await client.patch(`/api/admin/events/${eventId}/visibility`, { visibilityStatus: 'hidden' });
  harness.assertStatus(hideRes, 200, 'T3.10: Admin sets gallery visibility to hidden');

  // Step 8: Client tries to access gallery again with established session
  const lockedOutRes = await clientSession.get(`/api/gallery/${vaultToken}`);
  harness.assertStatus(lockedOutRes, 403, 'T3.11: Client with active session is immediately blocked with HTTP 403 Forbidden');

  // Step 9: Admin updates PIN to "3344" and restores visibility to "published"
  const updatePinRes = await client.patch(`/api/admin/events/${eventId}/pin`, { pin: "3344" });
  harness.assertStatus(updatePinRes, 200, 'T3.12: Admin updates PIN to 3344');
  const restoreRes = await client.patch(`/api/admin/events/${eventId}/visibility`, { visibilityStatus: 'published' });
  harness.assertStatus(restoreRes, 200, 'T3.13: Admin restores visibility to published');

  // Step 10: Client verifies access with new PIN
  const newClientSession = new ApiClient(client.baseUrl);
  const reUnlockRes = await newClientSession.post(`/api/gallery/${vaultToken}/verify-pin`, { pin: "3344" });
  harness.assertStatus(reUnlockRes, 200, 'T3.14: Client successfully unlocks gallery with updated PIN');
  harness.assertTrue(reUnlockRes.data?.media?.length >= 3, 'T3.15: Media library intact after state modifications');
}
