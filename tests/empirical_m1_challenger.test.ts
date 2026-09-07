/**
 * Empirical Challenger Test Suite for Milestone 1
 * Location: tests/empirical_m1_challenger.test.ts
 * 
 * Verifies:
 * 1. Seed idempotency (multiple runs, duplicate checks for Admin & ClientEvent)
 * 2. PIN verification logic (bcrypt.compare against rahul-priya-2025 with '2025' vs '0000', edge cases)
 * 3. Serialization security (JSON.stringify does not contain pinHash, Response.json simulation, lean() gotcha check)
 * 4. urlToken uniqueness constraint (E11000 duplicate key error, case sensitivity/trimming)
 * 5. Data model schema constraints and invariants
 */

import { connectDB, disconnectDB } from '../lib/mongodb';
import { Admin, ClientEvent, Enquiry, PortfolioMedia, PrivateEventMedia } from '../lib/models';
import { seedDatabase } from '../lib/seed';
import bcrypt from 'bcryptjs';

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: TestResult[] = [];

function recordTest(category: string, name: string, condition: boolean, details?: string, error?: string) {
  const item: TestResult = { category, name, passed: condition, details, error };
  results.push(item);
  if (condition) {
    console.log(`  ✓ [PASS] [${category}] ${name}`);
  } else {
    console.error(`  ✗ [FAIL] [${category}] ${name}${details ? ` — Details: ${details}` : ''}${error ? ` — Error: ${error}` : ''}`);
  }
}

async function runEmpiricalChallenger() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║   EMPIRICAL CHALLENGER VERIFICATION SUITE — MILESTONE 1             ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  try {
    console.log('[Setup] Connecting to MongoDB...');
    await connectDB();
    console.log('[Setup] Connected.\n');

    // Clean initial collections
    await Admin.deleteMany({});
    await ClientEvent.deleteMany({});
    await Enquiry.deleteMany({});
    await PortfolioMedia.deleteMany({});
    await PrivateEventMedia.deleteMany({});

    // Ensure index registration
    await ClientEvent.init();
    await Admin.init();
    await Enquiry.init();
    await PortfolioMedia.init();
    await PrivateEventMedia.init();

    // =========================================================================
    // 1. SEED IDEMPOTENCY AND INTEGRITY
    // =========================================================================
    console.log('--- 1. Seed Idempotency & Re-entrancy Tests ---');

    // Run 1: Initial seed
    const seedRun1 = await seedDatabase();
    recordTest('Seed', 'Run 1 returns success=true', seedRun1.success === true);
    recordTest('Seed', 'Run 1 returns seeded=true', seedRun1.seeded === true);

    const adminCount1 = await Admin.countDocuments({ username: 'admin' });
    const eventCount1 = await ClientEvent.countDocuments({ urlToken: 'rahul-priya-2025' });
    const totalAdmins1 = await Admin.countDocuments({});
    const totalEvents1 = await ClientEvent.countDocuments({});
    const totalMedia1 = await PrivateEventMedia.countDocuments({ urlToken: 'rahul-priya-2025' });
    const totalStories1 = await PortfolioMedia.countDocuments({});
    const totalEnquiries1 = await Enquiry.countDocuments({});

    recordTest('Seed', 'Exactly 1 admin user ("admin") created in Run 1', adminCount1 === 1, `Found ${adminCount1}`);
    recordTest('Seed', 'Exactly 1 flagship event ("rahul-priya-2025") created in Run 1', eventCount1 === 1, `Found ${eventCount1}`);
    recordTest('Seed', 'Total admin collection count is 1 in Run 1', totalAdmins1 === 1, `Found ${totalAdmins1}`);
    recordTest('Seed', 'Total client events collection count is 1 in Run 1', totalEvents1 === 1, `Found ${totalEvents1}`);
    recordTest('Seed', 'Flagship event has 6 private media photos in Run 1', totalMedia1 === 6, `Found ${totalMedia1}`);
    recordTest('Seed', 'Portfolio has 5 curated stories in Run 1', totalStories1 === 5, `Found ${totalStories1}`);
    recordTest('Seed', 'Enquiries collection has 5 initial demo records in Run 1', totalEnquiries1 === 5, `Found ${totalEnquiries1}`);

    // Run 2: Re-run seed (idempotent check, force=false)
    const seedRun2 = await seedDatabase();
    recordTest('Seed', 'Run 2 returns success=true without error', seedRun2.success === true);
    recordTest('Seed', 'Run 2 detects existing data (seeded=false)', seedRun2.seeded === false);

    const adminCount2 = await Admin.countDocuments({ username: 'admin' });
    const eventCount2 = await ClientEvent.countDocuments({ urlToken: 'rahul-priya-2025' });
    const totalAdmins2 = await Admin.countDocuments({});
    const totalEvents2 = await ClientEvent.countDocuments({});
    const totalMedia2 = await PrivateEventMedia.countDocuments({ urlToken: 'rahul-priya-2025' });
    const totalStories2 = await PortfolioMedia.countDocuments({});
    const totalEnquiries2 = await Enquiry.countDocuments({});

    recordTest('Seed', 'No duplicate admin created after Run 2 (count stays 1)', adminCount2 === 1 && totalAdmins2 === 1, `Found adminCount=${adminCount2}, total=${totalAdmins2}`);
    recordTest('Seed', 'No duplicate event created after Run 2 (count stays 1)', eventCount2 === 1 && totalEvents2 === 1, `Found eventCount=${eventCount2}, total=${totalEvents2}`);
    recordTest('Seed', 'Private media count unaffected after Run 2 (stays 6)', totalMedia2 === 6, `Found ${totalMedia2}`);
    recordTest('Seed', 'Portfolio stories count unaffected after Run 2 (stays 5)', totalStories2 === 5, `Found ${totalStories2}`);
    recordTest('Seed', 'Enquiries count unaffected after Run 2 (stays 5)', totalEnquiries2 === 5, `Found ${totalEnquiries2}`);

    // Run 3: Third re-run (idempotency stability)
    const seedRun3 = await seedDatabase();
    recordTest('Seed', 'Run 3 remains idempotent (seeded=false)', seedRun3.success === true && seedRun3.seeded === false);
    const totalAdmins3 = await Admin.countDocuments({});
    const totalEvents3 = await ClientEvent.countDocuments({});
    recordTest('Seed', 'Total admins and events remain exactly 1 after Run 3', totalAdmins3 === 1 && totalEvents3 === 1);

    // Force re-seed: verify clean re-initialization
    const seedRunForce = await seedDatabase({ force: true });
    recordTest('Seed', 'Seed with force=true returns success=true and seeded=true', seedRunForce.success === true && seedRunForce.seeded === true);
    const totalAdminsForce = await Admin.countDocuments({});
    const totalEventsForce = await ClientEvent.countDocuments({});
    recordTest('Seed', 'Force re-seed preserves single admin and single event without duplication', totalAdminsForce === 1 && totalEventsForce === 1);

    console.log();

    // =========================================================================
    // 2. PIN VERIFICATION & SECURITY LOGIC
    // =========================================================================
    console.log('--- 2. PIN Verification & Security Logic Tests ---');

    const flagshipEvent = await ClientEvent.findOne({ urlToken: 'rahul-priya-2025' });
    recordTest('PIN Security', 'Flagship event rahul-priya-2025 exists in database', flagshipEvent !== null);

    const pinHash = flagshipEvent?.pinHash;
    const isBcryptHash = typeof pinHash === 'string' && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(pinHash);
    recordTest('PIN Security', 'pinHash is a valid salted bcrypt hash format', isBcryptHash, `pinHash=${pinHash}`);

    // bcrypt.compare against correct PIN '2025'
    const correctPinMatch = await bcrypt.compare('2025', pinHash || '');
    recordTest('PIN Security', 'bcrypt.compare("2025", pinHash) returns true for authentic PIN', correctPinMatch === true);

    // bcrypt.compare against wrong PIN '0000'
    const wrongPinMatch0000 = await bcrypt.compare('0000', pinHash || '');
    recordTest('PIN Security', 'bcrypt.compare("0000", pinHash) returns false for wrong PIN "0000"', wrongPinMatch0000 === false);

    // Additional wrong PIN tests
    const wrongPinMatch1234 = await bcrypt.compare('1234', pinHash || '');
    recordTest('PIN Security', 'bcrypt.compare("1234", pinHash) returns false for wrong PIN "1234"', wrongPinMatch1234 === false);

    const wrongPinMatchEmpty = await bcrypt.compare('', pinHash || '');
    recordTest('PIN Security', 'bcrypt.compare("", pinHash) returns false for empty string', wrongPinMatchEmpty === false);

    const wrongPinMatchUntrimmed = await bcrypt.compare(' 2025 ', pinHash || '');
    recordTest('PIN Security', 'bcrypt.compare(" 2025 ", pinHash) returns false (PIN is whitespace-sensitive)', wrongPinMatchUntrimmed === false);

    // Virtual property: hasPin
    recordTest('PIN Security', 'Virtual property hasPin is true on flagship event', flagshipEvent?.hasPin === true);

    // Event with null PIN: verify hasPin is false
    const openEvent = new ClientEvent({
      eventName: 'Open Exhibition',
      clientName: 'Public',
      eventDate: new Date(),
      urlToken: 'open-exhibition-test',
      pinHash: null,
      visibilityStatus: 'published',
    });
    await openEvent.save();
    recordTest('PIN Security', 'Virtual property hasPin is false when pinHash is null', openEvent.hasPin === false);

    console.log();

    // =========================================================================
    // 3. MODEL SERIALIZATION & PIN LEAKAGE PREVENTION
    // =========================================================================
    console.log('--- 3. Serialization & Leak Prevention Tests ---');

    const eventToSerialize = await ClientEvent.findOne({ urlToken: 'rahul-priya-2025' });
    recordTest('Serialization', 'Retrieved Mongoose document for serialization check', eventToSerialize !== null);

    // Direct JSON.stringify(doc)
    const serializedDirect = JSON.stringify(eventToSerialize);
    const pinHashInDirectString = serializedDirect.includes('pinHash');
    recordTest('Serialization', 'JSON.stringify(event) does NOT contain "pinHash"', !pinHashInDirectString, `direct length=${serializedDirect.length}`);

    const parsedDirect = JSON.parse(serializedDirect);
    recordTest('Serialization', 'JSON.parse(JSON.stringify(event)).pinHash is strictly undefined', parsedDirect.pinHash === undefined);
    recordTest('Serialization', 'JSON.parse(JSON.stringify(event)).eventName is preserved', parsedDirect.eventName === 'Rahul & Priya — The Two-Continent Nuptials');
    recordTest('Serialization', 'Virtual hasPin is present in serialized output', parsedDirect.hasPin === true);
    recordTest('Serialization', 'Virtual isActive is present in serialized output', parsedDirect.isActive === true);

    // Nested object serialization: { success: true, event }
    const nestedSerialized = JSON.stringify({ success: true, event: eventToSerialize });
    recordTest('Serialization', 'JSON.stringify({ event }) nested does NOT contain "pinHash"', !nestedSerialized.includes('pinHash'));

    // doc.toJSON() transform check
    const toJSONResult = eventToSerialize?.toJSON();
    recordTest('Serialization', 'doc.toJSON() explicitly deletes pinHash', toJSONResult && toJSONResult.pinHash === undefined);

    // Admin model passwordHash leak check
    const adminDoc = await Admin.findOne({ username: 'admin' });
    const adminSerialized = JSON.stringify(adminDoc);
    recordTest('Serialization', 'JSON.stringify(adminDoc) does NOT contain "passwordHash"', !adminSerialized.includes('passwordHash'));
    const parsedAdmin = JSON.parse(adminSerialized);
    recordTest('Serialization', 'parsedAdmin.passwordHash is strictly undefined', parsedAdmin.passwordHash === undefined);

    // Forensic Check on .lean() and .toObject() behavior
    const leanDoc = await ClientEvent.findOne({ urlToken: 'rahul-priya-2025' }).lean();
    const leanIncludesPinHash = Boolean(leanDoc && 'pinHash' in leanDoc && leanDoc.pinHash);
    console.log(`  [Forensic Observation] ClientEvent.findOne().lean() includes pinHash: ${leanIncludesPinHash}`);
    // Note: lean() returns POJO directly from Mongo driver, so toJSON transform does not apply.
    // This is documented as a finding for downstream API route developers.

    const objResult = eventToSerialize?.toObject();
    const toObjectIncludesPinHash = Boolean(objResult && 'pinHash' in objResult && objResult.pinHash);
    console.log(`  [Forensic Observation] event.toObject() includes pinHash: ${toObjectIncludesPinHash}`);

    console.log();

    // =========================================================================
    // 4. urlToken UNIQUENESS CONSTRAINT
    // =========================================================================
    console.log('--- 4. urlToken Uniqueness Constraint Tests ---');

    // Exact duplicate attempt
    let duplicateRejected = false;
    let duplicateErrorCode: number | undefined;
    try {
      await ClientEvent.create({
        eventName: 'Duplicate Event Attempt',
        clientName: 'Impostor',
        eventDate: new Date(),
        urlToken: 'rahul-priya-2025', // Duplicate!
        visibilityStatus: 'published',
      });
    } catch (err: unknown) {
      duplicateRejected = true;
      duplicateErrorCode = (err as { code?: number }).code;
    }
    recordTest('Uniqueness', 'Duplicate urlToken "rahul-priya-2025" is rejected', duplicateRejected === true);
    recordTest('Uniqueness', 'Duplicate rejection returns MongoDB E11000 duplicate key error', duplicateErrorCode === 11000, `code=${duplicateErrorCode}`);

    // Case-insensitive and trimmed duplicate attempt
    let normalizedDuplicateRejected = false;
    let normalizedErrorCode: number | undefined;
    try {
      await ClientEvent.create({
        eventName: 'Uppercase Padded Token Event',
        clientName: 'Impostor 2',
        eventDate: new Date(),
        urlToken: '  RAHUL-PRIYA-2025  ', // Normalizes to 'rahul-priya-2025'
        visibilityStatus: 'published',
      });
    } catch (err: unknown) {
      normalizedDuplicateRejected = true;
      normalizedErrorCode = (err as { code?: number }).code;
    }
    recordTest('Uniqueness', 'Trimmed & lowercased duplicate urlToken is rejected with E11000', normalizedDuplicateRejected === true && normalizedErrorCode === 11000, `code=${normalizedErrorCode}`);

    // Missing urlToken validation
    let missingTokenRejected = false;
    try {
      const noTokenEvent = new ClientEvent({
        eventName: 'No Token Event',
        clientName: 'No Token Client',
        eventDate: new Date(),
      });
      await noTokenEvent.validate();
    } catch (err: unknown) {
      const valErr = err as { errors?: Record<string, unknown> };
      missingTokenRejected = Boolean(valErr.errors?.urlToken);
    }
    recordTest('Uniqueness', 'Missing urlToken triggers Mongoose validation error', missingTokenRejected === true);

    // Empty string urlToken validation
    let emptyTokenRejected = false;
    try {
      const emptyTokenEvent = new ClientEvent({
        eventName: 'Empty Token Event',
        clientName: 'Empty Token Client',
        eventDate: new Date(),
        urlToken: '',
      });
      await emptyTokenEvent.validate();
    } catch (err: unknown) {
      const valErr = err as { errors?: Record<string, unknown> };
      emptyTokenRejected = Boolean(valErr.errors?.urlToken);
    }
    recordTest('Uniqueness', 'Empty string urlToken triggers validation error', emptyTokenRejected === true);

    console.log();

    // =========================================================================
    // 5. ADDITIONAL DATA MODEL SCHEMA INVARIANTS
    // =========================================================================
    console.log('--- 5. Additional Schema Invariants & Constraints ---');

    // ClientEvent: visibilityStatus enum
    let invalidVisibilityRejected = false;
    try {
      const invVis = new ClientEvent({
        eventName: 'Bad Visibility',
        clientName: 'Bad Vis Client',
        eventDate: new Date(),
        urlToken: 'bad-vis-token',
        visibilityStatus: 'confidential' as unknown as 'published',
      });
      await invVis.validate();
    } catch (err: unknown) {
      const valErr = err as { errors?: Record<string, unknown> };
      invalidVisibilityRejected = Boolean(valErr.errors?.visibilityStatus);
    }
    recordTest('Schema Invariants', 'Invalid visibilityStatus ("confidential") is rejected by enum validation', invalidVisibilityRejected === true);

    // Enquiry: email regex validation
    let invalidEmailRejected = false;
    try {
      const invEnquiry = new Enquiry({
        fullName: 'Test User',
        email: 'invalid-email-address',
        commissionNature: 'Multi-day Wedding Monograph',
        estimatedDate: new Date(),
        venue: 'Lake Como',
      });
      await invEnquiry.validate();
    } catch (err: unknown) {
      const valErr = err as { errors?: Record<string, unknown> };
      invalidEmailRejected = Boolean(valErr.errors?.email);
    }
    recordTest('Schema Invariants', 'Malformed email is rejected by Enquiry schema regex', invalidEmailRejected === true);

    // Admin: duplicate username constraint
    let duplicateAdminRejected = false;
    try {
      await Admin.create({
        username: 'admin',
        email: 'duplicate-admin@brothersatelier.com',
        passwordHash: 'dummy',
        role: 'superadmin',
      });
    } catch (err: unknown) {
      duplicateAdminRejected = (err as { code?: number }).code === 11000;
    }
    recordTest('Schema Invariants', 'Duplicate Admin username is rejected with E11000', duplicateAdminRejected === true);

    // Admin: password comparison instance method
    const adminForPwTest = await Admin.findOne({ username: 'admin' });
    if (adminForPwTest) {
      const pwSuccess = await adminForPwTest.comparePassword('atelier2025');
      const pwFailure = await adminForPwTest.comparePassword('wrongpassword');
      recordTest('Schema Invariants', 'admin.comparePassword("atelier2025") succeeds for correct password', pwSuccess === true);
      recordTest('Schema Invariants', 'admin.comparePassword("wrongpassword") fails for incorrect password', pwFailure === false);
    } else {
      recordTest('Schema Invariants', 'admin document available for password check', false);
    }

    console.log();

  } catch (err) {
    console.error('CRITICAL SUITE EXCEPTION:', err);
    recordTest('Global', 'Suite execution completed without unexpected crash', false, undefined, String(err));
  } finally {
    await disconnectDB();
  }

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log(`║   CHALLENGE SUITE RESULTS: ${passedCount}/${total} PASSED (${failedCount} FAILED)        ║`);
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  if (failedCount > 0) {
    console.error('FAILURES RECORDED:');
    results.filter((r) => !r.passed).forEach((r, idx) => {
      console.error(`  ${idx + 1}. [${r.category}] ${r.name}`);
      if (r.details) console.error(`     Details: ${r.details}`);
      if (r.error) console.error(`     Error: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('All empirical verification challenge tests PASSED!');
    process.exit(0);
  }
}

runEmpiricalChallenger();
