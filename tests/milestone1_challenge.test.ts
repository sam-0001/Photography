/**
 * Milestone 1 Empirical Challenge & Adversarial Test Suite
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

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failed++;
    const msg = `  ✗ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`;
    console.error(msg);
    failures.push(msg);
  }
}

async function runChallengeSuite() {
  console.log('================================================================');
  console.log('  MILESTONE 1 EMPIRICAL CHALLENGE SUITE');
  console.log('================================================================\n');

  try {
    // Connect to database (uses embedded mongodb-memory-server if MONGODB_URI not set)
    console.log('[Setup] Connecting to database...');
    await connectDB();
    console.log('[Setup] Connected.\n');

    // Ensure clean state initially
    await Admin.deleteMany({});
    await ClientEvent.deleteMany({});
    await Enquiry.deleteMany({});
    await PortfolioMedia.deleteMany({});
    await PrivateEventMedia.deleteMany({});

    // Ensure indexes are built
    await ClientEvent.init();
    await Admin.init();
    await Enquiry.init();
    await PortfolioMedia.init();
    await PrivateEventMedia.init();

    // -------------------------------------------------------------------------
    // TEST SECTION 1: Seed Idempotency
    // -------------------------------------------------------------------------
    console.log('--- SECTION 1: Seed Idempotency & Re-entrancy ---');

    // First run
    const result1 = await seedDatabase();
    assert(result1.success === true, 'Seed Run 1 succeeds', JSON.stringify(result1));
    assert(result1.seeded === true, 'Seed Run 1 actually seeded records');

    const adminCount1 = await Admin.countDocuments({ username: 'admin' });
    const eventCount1 = await ClientEvent.countDocuments({ urlToken: 'rahul-priya-2025' });
    const totalAdmins1 = await Admin.countDocuments({});
    const totalEvents1 = await ClientEvent.countDocuments({});
    const totalMedia1 = await PrivateEventMedia.countDocuments({ urlToken: 'rahul-priya-2025' });

    assert(adminCount1 === 1, 'Exactly 1 admin with username "admin" after run 1', `Found ${adminCount1}`);
    assert(eventCount1 === 1, 'Exactly 1 event with urlToken "rahul-priya-2025" after run 1', `Found ${eventCount1}`);
    assert(totalAdmins1 === 1, 'Total admins in collection is 1 after run 1', `Found ${totalAdmins1}`);
    assert(totalEvents1 === 1, 'Total client events in collection is 1 after run 1', `Found ${totalEvents1}`);
    assert(totalMedia1 === 6, 'Flagship event has 6 private media photos after run 1', `Found ${totalMedia1}`);

    // Second run (idempotent, force=false)
    const result2 = await seedDatabase();
    assert(result2.success === true, 'Seed Run 2 succeeds without error');
    assert(result2.seeded === false, 'Seed Run 2 detects existing data (seeded=false)');

    const adminCount2 = await Admin.countDocuments({ username: 'admin' });
    const eventCount2 = await ClientEvent.countDocuments({ urlToken: 'rahul-priya-2025' });
    const totalAdmins2 = await Admin.countDocuments({});
    const totalEvents2 = await ClientEvent.countDocuments({});
    const totalMedia2 = await PrivateEventMedia.countDocuments({ urlToken: 'rahul-priya-2025' });

    assert(adminCount2 === 1, 'Seed Run 2 produces NO duplicate admin (still exactly 1)', `Found ${adminCount2}`);
    assert(eventCount2 === 1, 'Seed Run 2 produces NO duplicate flagship event (still exactly 1)', `Found ${eventCount2}`);
    assert(totalAdmins2 === 1, 'Total admins unchanged after Run 2', `Found ${totalAdmins2}`);
    assert(totalEvents2 === 1, 'Total events unchanged after Run 2', `Found ${totalEvents2}`);
    assert(totalMedia2 === 6, 'Private media count unchanged after Run 2', `Found ${totalMedia2}`);

    // Third run (idempotent, force=false)
    const result3 = await seedDatabase();
    assert(result3.success === true && result3.seeded === false, 'Seed Run 3 remains idempotent');
    const totalAdmins3 = await Admin.countDocuments({});
    const totalEvents3 = await ClientEvent.countDocuments({});
    assert(totalAdmins3 === 1 && totalEvents3 === 1, 'Seed Run 3 maintains 1 admin and 1 event');

    // Force re-seed run
    const resultForce = await seedDatabase({ force: true });
    assert(resultForce.success === true && resultForce.seeded === true, 'Seed with force=true executes clean re-seed');
    const adminCountForce = await Admin.countDocuments({ username: 'admin' });
    const eventCountForce = await ClientEvent.countDocuments({ urlToken: 'rahul-priya-2025' });
    assert(adminCountForce === 1, 'Force re-seed leaves exactly 1 admin', `Found ${adminCountForce}`);
    assert(eventCountForce === 1, 'Force re-seed leaves exactly 1 flagship event', `Found ${eventCountForce}`);

    console.log();

    // -------------------------------------------------------------------------
    // TEST SECTION 2: PIN Security & Verification Logic
    // -------------------------------------------------------------------------
    console.log('--- SECTION 2: PIN Security & Verification Logic ---');

    const flagshipEvent = await ClientEvent.findOne({ urlToken: 'rahul-priya-2025' });
    assert(flagshipEvent !== null, 'Flagship event rahul-priya-2025 exists in database');

    const pinHash = flagshipEvent?.pinHash;
    assert(typeof pinHash === 'string' && pinHash.startsWith('$2'), 'pinHash is present on Mongoose document and is a valid bcrypt hash');

    // Correct PIN '2025'
    const isMatchCorrect = await bcrypt.compare('2025', pinHash || '');
    assert(isMatchCorrect === true, 'bcrypt.compare("2025", pinHash) returns true for correct PIN');

    // Wrong PIN '0000'
    const isMatchWrong = await bcrypt.compare('0000', pinHash || '');
    assert(isMatchWrong === false, 'bcrypt.compare("0000", pinHash) returns false for wrong PIN "0000"');

    // Wrong PIN '1234'
    const isMatchWrong2 = await bcrypt.compare('1234', pinHash || '');
    assert(isMatchWrong2 === false, 'bcrypt.compare("1234", pinHash) returns false for wrong PIN "1234"');

    // Empty PIN ''
    const isMatchEmpty = await bcrypt.compare('', pinHash || '');
    assert(isMatchEmpty === false, 'bcrypt.compare("", pinHash) returns false for empty string');

    // Untrimmed PIN ' 2025 '
    const isMatchUntrimmed = await bcrypt.compare(' 2025 ', pinHash || '');
    assert(isMatchUntrimmed === false, 'bcrypt.compare(" 2025 ", pinHash) fails without trimming (whitespace sensitive)');

    // Virtual property hasPin
    assert(flagshipEvent?.hasPin === true, 'Virtual hasPin is true when pinHash is present');

    // Test event without PIN
    const noPinEvent = new ClientEvent({
      eventName: 'Open Showcase Event',
      clientName: 'Public Client',
      eventDate: new Date(),
      urlToken: 'open-showcase-test',
      pinHash: null,
      visibilityStatus: 'published',
    });
    await noPinEvent.save();
    assert(noPinEvent.hasPin === false, 'Virtual hasPin is false when pinHash is null');

    console.log();

    // -------------------------------------------------------------------------
    // TEST SECTION 3: Serialization & Leak Prevention
    // -------------------------------------------------------------------------
    console.log('--- SECTION 3: Serialization & pinHash Leak Prevention ---');

    // Retrieve full event document
    const docToSerialize = await ClientEvent.findOne({ urlToken: 'rahul-priya-2025' });
    assert(docToSerialize !== null, 'Retrieved document for serialization check');

    // Direct JSON.stringify(event)
    const jsonString = JSON.stringify(docToSerialize);
    assert(!jsonString.includes('pinHash'), 'JSON.stringify(event) does NOT contain "pinHash"');

    if (jsonString.includes('pinHash')) {
      console.error('CRITICAL LEAK: jsonString contains pinHash:', jsonString);
    }

    const parsed = JSON.parse(jsonString);
    assert(parsed.pinHash === undefined, 'JSON.parse(JSON.stringify(event)).pinHash is undefined');
    assert(parsed.eventName === 'Rahul & Priya — The Two-Continent Nuptials', 'Serialized event retains public properties (eventName)');
    assert(parsed.hasPin === true, 'Serialized event includes virtual hasPin');

    // Test Response.json simulation (as done in Next.js route handlers)
    const simulatedResponse = JSON.parse(JSON.stringify(docToSerialize.toJSON()));
    assert(simulatedResponse.pinHash === undefined, 'docToSerialize.toJSON() excludes pinHash');

    // Admin model passwordHash exclusion
    const adminDoc = await Admin.findOne({ username: 'admin' });
    assert(adminDoc !== null, 'Admin document retrieved');
    const adminJson = JSON.stringify(adminDoc);
    assert(!adminJson.includes('passwordHash'), 'JSON.stringify(adminDoc) does NOT contain "passwordHash"');
    const parsedAdmin = JSON.parse(adminJson);
    assert(parsedAdmin.passwordHash === undefined, 'parsedAdmin.passwordHash is undefined');

    // Lean query behavior check (Documenting whether .lean() includes pinHash)
    const leanDoc = await ClientEvent.findOne({ urlToken: 'rahul-priya-2025' }).lean();
    const leanHasPinHash = leanDoc !== null && 'pinHash' in leanDoc && leanDoc.pinHash !== undefined;
    console.log(`  [Inspection] ClientEvent.findOne().lean() includes pinHash: ${leanHasPinHash}`);

    console.log();

    // -------------------------------------------------------------------------
    // TEST SECTION 4: urlToken Uniqueness Constraint
    // -------------------------------------------------------------------------
    console.log('--- SECTION 4: urlToken Uniqueness Constraint ---');

    // Attempt to insert duplicate urlToken 'rahul-priya-2025'
    let duplicateRejected = false;
    let duplicateErrorCode: number | undefined = undefined;

    try {
      await ClientEvent.create({
        eventName: 'Impostor Nuptials',
        clientName: 'Fraudulent Client',
        eventDate: new Date(),
        urlToken: 'rahul-priya-2025', // DUPLICATE
        visibilityStatus: 'published',
      });
    } catch (err: unknown) {
      const mongoErr = err as { code?: number };
      duplicateRejected = true;
      duplicateErrorCode = mongoErr.code;
    }

    assert(duplicateRejected === true, 'Duplicate urlToken "rahul-priya-2025" is rejected with an error');
    assert(duplicateErrorCode === 11000, 'Duplicate rejection triggers MongoDB E11000 duplicate key error', `Code: ${duplicateErrorCode}`);

    // Attempt duplicate with uppercase/spaces: ' RAHUL-PRIYA-2025 '
    // Since schema has trim: true, lowercase: true, it should normalize to 'rahul-priya-2025' and collide
    let normalizedDuplicateRejected = false;
    let normalizedErrorCode: number | undefined = undefined;

    try {
      await ClientEvent.create({
        eventName: 'Case Variation Nuptials',
        clientName: 'Variant Client',
        eventDate: new Date(),
        urlToken: ' RAHUL-PRIYA-2025 ', // DUPLICATE after trim & lowercase
        visibilityStatus: 'published',
      });
    } catch (err: unknown) {
      const mongoErr = err as { code?: number };
      normalizedDuplicateRejected = true;
      normalizedErrorCode = mongoErr.code;
    }

    assert(normalizedDuplicateRejected === true, 'Trimmed/lowercased duplicate urlToken " RAHUL-PRIYA-2025 " is rejected');
    assert(normalizedErrorCode === 11000, 'Trimmed duplicate triggers MongoDB E11000 duplicate key error');

    // Attempt missing urlToken
    let missingTokenRejected = false;
    try {
      const invalidEvent = new ClientEvent({
        eventName: 'Missing Token Event',
        clientName: 'No Token Client',
        eventDate: new Date(),
        // urlToken omitted
      });
      await invalidEvent.validate();
    } catch (err: unknown) {
      const valErr = err as { errors?: Record<string, unknown> };
      missingTokenRejected = Boolean(valErr.errors?.urlToken);
    }
    assert(missingTokenRejected === true, 'Missing urlToken triggers schema validation error');

    console.log();

    // -------------------------------------------------------------------------
    // TEST SECTION 5: Data Model Schema Constraints & Invariants
    // -------------------------------------------------------------------------
    console.log('--- SECTION 5: Additional Model Invariants & Constraints ---');

    // ClientEvent: visibilityStatus enum validation
    let invalidVisibilityRejected = false;
    try {
      const invalidVisEvent = new ClientEvent({
        eventName: 'Invalid Visibility Event',
        clientName: 'Vis Client',
        eventDate: new Date(),
        urlToken: 'invalid-vis-token',
        visibilityStatus: 'super_secret' as unknown as 'published',
      });
      await invalidVisEvent.validate();
    } catch (err: unknown) {
      const valErr = err as { errors?: Record<string, unknown> };
      invalidVisibilityRejected = Boolean(valErr.errors?.visibilityStatus);
    }
    assert(invalidVisibilityRejected === true, 'Invalid visibilityStatus "super_secret" is rejected by enum validation');

    // Enquiry: email format validation
    let invalidEmailRejected = false;
    try {
      const invalidEnquiry = new Enquiry({
        fullName: 'Test User',
        email: 'not-an-email',
        commissionNature: 'Multi-day Wedding Monograph',
        estimatedDate: new Date(),
        venue: 'Test Venue',
      });
      await invalidEnquiry.validate();
    } catch (err: unknown) {
      const valErr = err as { errors?: Record<string, unknown> };
      invalidEmailRejected = Boolean(valErr.errors?.email);
    }
    assert(invalidEmailRejected === true, 'Invalid email "not-an-email" is rejected by Enquiry email regex');

    // Admin: unique username constraint
    let duplicateAdminRejected = false;
    try {
      await Admin.create({
        username: 'admin', // DUPLICATE
        email: 'another-admin@atelier.com',
        passwordHash: 'dummyhash',
        role: 'superadmin',
      });
    } catch (err: unknown) {
      const mongoErr = err as { code?: number };
      duplicateAdminRejected = mongoErr.code === 11000;
    }
    assert(duplicateAdminRejected === true, 'Duplicate Admin username "admin" is rejected with E11000');

    // Admin: password comparison instance method
    const testAdmin = await Admin.findOne({ username: 'admin' });
    if (testAdmin) {
      const correctPw = await testAdmin.comparePassword('atelier2025');
      const wrongPw = await testAdmin.comparePassword('wrongpassword');
      assert(correctPw === true, 'admin.comparePassword("atelier2025") succeeds');
      assert(wrongPw === false, 'admin.comparePassword("wrongpassword") fails');
    } else {
      assert(false, 'testAdmin found for password comparison check');
    }

    console.log();
  } catch (globalError) {
    console.error('GLOBAL TEST ERROR:', globalError);
    failed++;
    failures.push(`Global unexpected error: ${globalError}`);
  } finally {
    // Clean up
    await disconnectDB();
  }

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  console.log('================================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) {
    console.error('FAILURES:');
    failures.forEach((f) => console.error(f));
    process.exit(1);
  } else {
    console.log('All empirical challenge tests passed successfully!');
    process.exit(0);
  }
}

runChallengeSuite();
