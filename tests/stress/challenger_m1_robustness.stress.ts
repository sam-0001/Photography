/**
 * Challenger Stress & Robustness Suite for Milestone 1
 * Location: tests/stress/challenger_m1_robustness.stress.ts
 * 
 * Empirically challenges:
 * 1. lib/mongodb.ts:
 *    - 100 rapid concurrent calls to connectDB()
 *    - Connection deduplication & latency
 *    - Memory-server teardown & cleanup
 *    - Reconnection lifecycle
 *    - Resilience against dropped connection / stale cached promise
 * 2. app/api/enquiries/route.ts:
 *    - Rapid concurrent valid submissions
 *    - Invalid payloads (missing fields, invalid formats, unparseable dates)
 *    - Schema constraint boundary checks (maxlength, enum validation)
 *    - Malformed payloads and type poisoning (NoSQL injection, primitive types, array)
 *    - International Unicode & special character preservation
 */

import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB, disconnectDB, getActiveMongoUri } from '../../lib/mongodb';
import { Enquiry } from '../../lib/models';
import { POST, GET } from '../../app/api/enquiries/route';

interface EmpiricalResult {
  id: string;
  category: 'MONGODB' | 'ENQUIRIES_API' | 'CLEANUP';
  name: string;
  passed: boolean;
  severityIfFailed: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  observed: string;
  expected: string;
  durationMs: number;
}

const testResults: EmpiricalResult[] = [];

function createPostReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

export async function runChallengerSuite(): Promise<{ passed: boolean; results: EmpiricalResult[] }> {
  console.log('========================================================================');
  console.log('  CHALLENGER ADVERSARIAL STRESS TEST: MILESTONE 1 ROBUSTNESS');
  console.log('========================================================================\n');

  // ===========================================================================
  // SECTION 1: lib/mongodb.ts Stress & Lifecycle
  // ===========================================================================
  console.log('>>> SECTION 1: lib/mongodb.ts Concurrency & Lifecycle');

  // Test 1.1: 100 Concurrent connectDB() calls
  {
    const start = Date.now();
    try {
      console.log('  [1.1] Dispatching 100 simultaneous connectDB() calls...');
      const promises = Array.from({ length: 100 }, () => connectDB());
      const connections = await Promise.all(promises);
      const duration = Date.now() - start;

      const first = connections[0];
      const allIdentical = connections.every((c) => c === first);
      const isReady = first.connection.readyState === 1;
      const uri = getActiveMongoUri();

      const pass = allIdentical && isReady && Boolean(uri);
      testResults.push({
        id: 'CHAL-M1-01',
        category: 'MONGODB',
        name: '100 Concurrent connectDB() calls deduplicate to single connection instance',
        passed: pass,
        severityIfFailed: 'CRITICAL',
        observed: `allIdentical=${allIdentical}, readyState=${first.connection.readyState}, uri=${uri}, elapsed=${duration}ms`,
        expected: 'All 100 calls resolve to the exact same mongoose instance with readyState=1 and active URI',
        durationMs: duration,
      });
      console.log(`    ${pass ? '✓' : '✗'} 1.1: Concurrency deduplication (pass=${pass}, ${duration}ms)`);
    } catch (err: unknown) {
      testResults.push({
        id: 'CHAL-M1-01',
        category: 'MONGODB',
        name: '100 Concurrent connectDB() calls deduplicate to single connection instance',
        passed: false,
        severityIfFailed: 'CRITICAL',
        observed: `Threw exception: ${err}`,
        expected: 'Clean resolution of all 100 promises',
        durationMs: Date.now() - start,
      });
      console.log('    ✗ 1.1 Exception:', err);
    }
  }

  // Test 1.2: Connection reuse overhead
  {
    const start = Date.now();
    try {
      console.log('  [1.2] Measuring connection reuse overhead across 100 sequential calls...');
      for (let i = 0; i < 100; i++) {
        const conn = await connectDB();
        if (conn.connection.readyState !== 1) {
          throw new Error(`readyState dropped to ${conn.connection.readyState} at iteration ${i}`);
        }
      }
      const duration = Date.now() - start;
      const pass = duration < 200; // should be nearly instantaneous (<2ms per call)
      testResults.push({
        id: 'CHAL-M1-02',
        category: 'MONGODB',
        name: '100 Sequential cached connectDB() calls complete under 200ms without state degradation',
        passed: pass,
        severityIfFailed: 'HIGH',
        observed: `100 sequential calls completed in ${duration}ms (~${(duration / 100).toFixed(3)}ms/call)`,
        expected: '<200ms total execution with readyState=1 throughout',
        durationMs: duration,
      });
      console.log(`    ${pass ? '✓' : '✗'} 1.2: Connection cache reuse (${duration}ms)`);
    } catch (err: unknown) {
      testResults.push({
        id: 'CHAL-M1-02',
        category: 'MONGODB',
        name: '100 Sequential cached connectDB() calls complete under 200ms without state degradation',
        passed: false,
        severityIfFailed: 'HIGH',
        observed: `Threw exception: ${err}`,
        expected: 'Zero errors on connection cache reuse',
        durationMs: Date.now() - start,
      });
    }
  }

  // Test 1.3: Clean teardown via disconnectDB()
  {
    const start = Date.now();
    try {
      console.log('  [1.3] Verifying clean teardown and resource release via disconnectDB()...');
      await disconnectDB();
      const duration = Date.now() - start;

      const cache = (globalThis as unknown as { mongooseCache?: Record<string, unknown> }).mongooseCache;
      const connClean = cache?.conn === null;
      const serverClean = cache?.mongoServer === null;
      const promiseClean = cache?.promise === null;
      const uriClean = cache?.uri === null;
      const readyState = mongoose.connection.readyState;

      const pass = connClean && serverClean && promiseClean && uriClean && readyState === 0;
      testResults.push({
        id: 'CHAL-M1-03',
        category: 'CLEANUP',
        name: 'disconnectDB() terminates MongoMemoryServer and clears all global cache references',
        passed: pass,
        severityIfFailed: 'HIGH',
        observed: `connClean=${connClean}, serverClean=${serverClean}, promiseClean=${promiseClean}, uriClean=${uriClean}, readyState=${readyState}`,
        expected: 'All cached pointers null and mongoose readyState=0',
        durationMs: duration,
      });
      console.log(`    ${pass ? '✓' : '✗'} 1.3: Clean teardown (pass=${pass})`);
    } catch (err: unknown) {
      testResults.push({
        id: 'CHAL-M1-03',
        category: 'CLEANUP',
        name: 'disconnectDB() terminates MongoMemoryServer and clears all global cache references',
        passed: false,
        severityIfFailed: 'HIGH',
        observed: `Threw exception: ${err}`,
        expected: 'Clean disconnect without exception',
        durationMs: Date.now() - start,
      });
    }
  }

  // Test 1.4: Reconnection lifecycle post-disconnect
  {
    const start = Date.now();
    try {
      console.log('  [1.4] Testing reconnection and I/O after clean disconnect...');
      const conn = await connectDB();
      const uri = getActiveMongoUri();
      const isReady = conn.connection.readyState === 1;

      // Verify read/write
      const testCol = conn.connection.collection('__challenger_roundtrip__');
      await testCol.insertOne({ challenger: 'test', ts: Date.now() });
      const found = await testCol.findOne({ challenger: 'test' });
      await testCol.drop();

      const pass = isReady && Boolean(uri) && Boolean(found);
      const duration = Date.now() - start;
      testResults.push({
        id: 'CHAL-M1-04',
        category: 'MONGODB',
        name: 'connectDB() after disconnectDB() reliably initializes new server and performs I/O',
        passed: pass,
        severityIfFailed: 'CRITICAL',
        observed: `readyState=${conn.connection.readyState}, uri=${uri}, ioVerified=${Boolean(found)}, elapsed=${duration}ms`,
        expected: 'Successful reconnection with functional read/write/drop capability',
        durationMs: duration,
      });
      console.log(`    ${pass ? '✓' : '✗'} 1.4: Post-teardown reinitialization (pass=${pass})`);
    } catch (err: unknown) {
      testResults.push({
        id: 'CHAL-M1-04',
        category: 'MONGODB',
        name: 'connectDB() after disconnectDB() reliably initializes new server and performs I/O',
        passed: false,
        severityIfFailed: 'CRITICAL',
        observed: `Threw exception: ${err}`,
        expected: 'Clean reinitialization without error',
        durationMs: Date.now() - start,
      });
    }
  }

  // Test 1.5: Adversarial - Connection drop resilience (stale cached promise bug)
  {
    const start = Date.now();
    try {
      console.log('  [1.5] ADVERSARIAL: Testing resilience against unexpected disconnect (stale cached promise)...');
      // Simulate an unannounced socket/connection drop
      await mongoose.disconnect();
      const droppedState = mongoose.connection.readyState;

      // Attempt to connect again
      const conn = await connectDB();
      const recoveredState = conn.connection.readyState;
      const duration = Date.now() - start;

      const pass = recoveredState === 1;
      testResults.push({
        id: 'CHAL-M1-05',
        category: 'MONGODB',
        name: 'connectDB() detects disconnected state and reconnects instead of returning dead cached promise',
        passed: pass,
        severityIfFailed: 'CRITICAL',
        observed: `Simulated dropped readyState=${droppedState}; recovered readyState=${recoveredState}. (cached.promise returned stale resolved connection)`,
        expected: 'connectDB() must detect readyState!==1, invalidate stale promise/conn, and reconnect to readyState=1',
        durationMs: duration,
      });
      console.log(`    ${pass ? '✓' : '✗'} 1.5: Disconnection recovery (pass=${pass}, state=${recoveredState})`);
      if (!pass) {
        console.log('      [DEFECT CONFIRMED] lib/mongodb.ts leaves stale cached.promise; cannot self-heal from dropped connection.');
      }
    } catch (err: unknown) {
      testResults.push({
        id: 'CHAL-M1-05',
        category: 'MONGODB',
        name: 'connectDB() detects disconnected state and reconnects instead of returning dead cached promise',
        passed: false,
        severityIfFailed: 'CRITICAL',
        observed: `Threw exception: ${err}`,
        expected: 'connectDB() should reconnect cleanly',
        durationMs: Date.now() - start,
      });
    } finally {
      // Restore valid connection for subsequent tests
      await disconnectDB();
      await connectDB();
    }
  }

  console.log();

  // ===========================================================================
  // SECTION 2: app/api/enquiries/route.ts API Robustness & Validation
  // ===========================================================================
  console.log('>>> SECTION 2: app/api/enquiries/route.ts Robustness & Validation');

  // Ensure DB is connected and clean
  await connectDB();
  await Enquiry.deleteMany({});

  // Test 2.1: Concurrent Valid Submissions
  {
    const start = Date.now();
    try {
      console.log('  [2.1] Submitting 30 concurrent valid enquiry payloads...');
      const payloads = Array.from({ length: 30 }, (_, i) => ({
        fullName: `Client Monograph ${i + 1}`,
        email: `monograph.client.${i + 1}@atelier-challenge.com`,
        phone: `+33 1 42 68 55 ${String(i).padStart(2, '0')}`,
        commissionNature: 'Multi-day Wedding Monograph',
        estimatedDate: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
        venue: `Villa Balbiano Suite ${i + 1}, Lake Como, Italy`,
        visionNotes: `Curated 35mm film documentation for event ${i + 1}.`,
      }));

      const responses = await Promise.all(payloads.map((p) => POST(createPostReq(p))));
      const bodies = await Promise.all(responses.map((r) => r.json()));
      const duration = Date.now() - start;

      const all201 = responses.every((r) => r.status === 201);
      const allHaveIds = bodies.every((b) => typeof b.enquiryId === 'string' && /^[0-9a-fA-F]{24}$/.test(b.enquiryId));
      const uniqueIds = new Set(bodies.map((b) => b.enquiryId)).size === 30;
      const dbCount = await Enquiry.countDocuments({});

      const pass = all201 && allHaveIds && uniqueIds && dbCount === 30;
      testResults.push({
        id: 'CHAL-M1-06',
        category: 'ENQUIRIES_API',
        name: '30 Concurrent valid enquiry submissions return HTTP 201 and persist without lost writes',
        passed: pass,
        severityIfFailed: 'CRITICAL',
        observed: `all201=${all201}, allHaveIds=${allHaveIds}, uniqueCount=${uniqueIds ? 30 : 'non-unique'}, dbCount=${dbCount}/30, elapsed=${duration}ms`,
        expected: 'All 30 succeed with 201, unique 24-char hex ObjectIds, and 30 documents saved in DB',
        durationMs: duration,
      });
      console.log(`    ${pass ? '✓' : '✗'} 2.1: Concurrent submissions (pass=${pass}, saved=${dbCount}/30, ${duration}ms)`);
    } catch (err: unknown) {
      testResults.push({
        id: 'CHAL-M1-06',
        category: 'ENQUIRIES_API',
        name: '30 Concurrent valid enquiry submissions return HTTP 201 and persist without lost writes',
        passed: false,
        severityIfFailed: 'CRITICAL',
        observed: `Threw exception: ${err}`,
        expected: 'Clean 201 responses for all concurrent requests',
        durationMs: Date.now() - start,
      });
    }
  }

  // Test 2.2: Standard Invalid Payloads (Missing / Malformed Fields) -> Expect HTTP 400
  {
    console.log('  [2.2] Testing standard validation rejections (HTTP 400)...');
    const invalidInputs = [
      { field: 'missing fullName', body: { email: 'test@example.com', commissionNature: 'Other', estimatedDate: '2026-10-10', venue: 'Paris' } },
      { field: 'short fullName (1 char)', body: { fullName: 'A', email: 'test@example.com', commissionNature: 'Other', estimatedDate: '2026-10-10', venue: 'Paris' } },
      { field: 'whitespace fullName', body: { fullName: '   ', email: 'test@example.com', commissionNature: 'Other', estimatedDate: '2026-10-10', venue: 'Paris' } },
      { field: 'missing email', body: { fullName: 'Jane Doe', commissionNature: 'Other', estimatedDate: '2026-10-10', venue: 'Paris' } },
      { field: 'invalid email (no @)', body: { fullName: 'Jane Doe', email: 'janedoe.com', commissionNature: 'Other', estimatedDate: '2026-10-10', venue: 'Paris' } },
      { field: 'invalid email (spaces)', body: { fullName: 'Jane Doe', email: 'jane @domain.com', commissionNature: 'Other', estimatedDate: '2026-10-10', venue: 'Paris' } },
      { field: 'missing commissionNature', body: { fullName: 'Jane Doe', email: 'test@example.com', estimatedDate: '2026-10-10', venue: 'Paris' } },
      { field: 'missing estimatedDate', body: { fullName: 'Jane Doe', email: 'test@example.com', commissionNature: 'Other', venue: 'Paris' } },
      { field: 'unparseable estimatedDate', body: { fullName: 'Jane Doe', email: 'test@example.com', commissionNature: 'Other', estimatedDate: 'not-a-date', venue: 'Paris' } },
      { field: 'missing venue', body: { fullName: 'Jane Doe', email: 'test@example.com', commissionNature: 'Other', estimatedDate: '2026-10-10' } },
      { field: 'whitespace venue', body: { fullName: 'Jane Doe', email: 'test@example.com', commissionNature: 'Other', estimatedDate: '2026-10-10', venue: '   ' } },
    ];

    for (const [idx, item] of invalidInputs.entries()) {
      const start = Date.now();
      try {
        const res = await POST(createPostReq(item.body));
        const json = await res.json();
        const duration = Date.now() - start;

        const pass = res.status === 400 && json.success === false && Boolean(json.error);
        testResults.push({
          id: `CHAL-M1-07-${idx + 1}`,
          category: 'ENQUIRIES_API',
          name: `Invalid payload rejection: ${item.field}`,
          passed: pass,
          severityIfFailed: 'HIGH',
          observed: `HTTP ${res.status}: error="${json.error}"`,
          expected: 'HTTP 400 Bad Request with { success: false, error: string }',
          durationMs: duration,
        });
      } catch (err: unknown) {
        testResults.push({
          id: `CHAL-M1-07-${idx + 1}`,
          category: 'ENQUIRIES_API',
          name: `Invalid payload rejection: ${item.field}`,
          passed: false,
          severityIfFailed: 'HIGH',
          observed: `Threw exception: ${err}`,
          expected: 'HTTP 400 Bad Request',
          durationMs: Date.now() - start,
        });
      }
    }
    const standardPassCount = testResults.filter((r) => r.id.startsWith('CHAL-M1-07') && r.passed).length;
    console.log(`    ✓ 2.2: Standard invalid inputs: ${standardPassCount}/${invalidInputs.length} returned HTTP 400`);
  }

  // Test 2.3: Schema Boundary & Enum Violations (Adversarial check: 400 vs 500)
  {
    console.log('  [2.3] ADVERSARIAL: Testing schema boundary conditions (enum & maxlength)...');

    const boundaryCases = [
      {
        testId: 'CHAL-M1-08',
        name: 'Invalid commissionNature enum tier',
        body: {
          fullName: 'Adversarial Client',
          email: 'adversarial@atelier.com',
          commissionNature: 'Bogus Tier Name That Does Not Exist',
          estimatedDate: '2026-10-10',
          venue: 'Villa Balbiano',
        },
        desc: 'commissionNature not in accepted enum values',
      },
      {
        testId: 'CHAL-M1-09',
        name: 'Oversized fullName (>120 chars)',
        body: {
          fullName: 'A'.repeat(150),
          email: 'adversarial@atelier.com',
          commissionNature: 'Other',
          estimatedDate: '2026-10-10',
          venue: 'Villa Balbiano',
        },
        desc: 'fullName exceeds Mongoose Schema maxlength of 120',
      },
      {
        testId: 'CHAL-M1-10',
        name: 'Oversized venue (>250 chars)',
        body: {
          fullName: 'Adversarial Client',
          email: 'adversarial@atelier.com',
          commissionNature: 'Other',
          estimatedDate: '2026-10-10',
          venue: 'V'.repeat(300),
        },
        desc: 'venue exceeds Mongoose Schema maxlength of 250',
      },
      {
        testId: 'CHAL-M1-11',
        name: 'Oversized visionNotes (>3000 chars)',
        body: {
          fullName: 'Adversarial Client',
          email: 'adversarial@atelier.com',
          commissionNature: 'Other',
          estimatedDate: '2026-10-10',
          venue: 'Villa Balbiano',
          visionNotes: 'X'.repeat(3500),
        },
        desc: 'visionNotes exceeds Mongoose Schema maxlength of 3000',
      },
    ];

    for (const bCase of boundaryCases) {
      const start = Date.now();
      try {
        const res = await POST(createPostReq(bCase.body));
        const json = await res.json();
        const duration = Date.now() - start;

        // Interface contract in PROJECT.md:
        // Error: HTTP 400 Bad Request { "error": "Validation error message" }
        // Client input errors MUST return 400, never 500!
        const pass = res.status === 400;
        testResults.push({
          id: bCase.testId,
          category: 'ENQUIRIES_API',
          name: `Schema boundary rejection: ${bCase.name}`,
          passed: pass,
          severityIfFailed: 'HIGH',
          observed: `Returned HTTP ${res.status}: body=${JSON.stringify(json)}`,
          expected: `HTTP 400 Bad Request (client error for ${bCase.desc})`,
          durationMs: duration,
        });
        console.log(`    ${pass ? '✓' : '✗'} 2.3: ${bCase.name} (status=${res.status}, expected=400)`);
        if (!pass && res.status === 500) {
          console.log(`      [DEFECT CONFIRMED] Mongoose ValidationError triggers unhandled HTTP 500 crash instead of HTTP 400.`);
        }
      } catch (err: unknown) {
        testResults.push({
          id: bCase.testId,
          category: 'ENQUIRIES_API',
          name: `Schema boundary rejection: ${bCase.name}`,
          passed: false,
          severityIfFailed: 'HIGH',
          observed: `Threw exception: ${err}`,
          expected: 'HTTP 400 Bad Request',
          durationMs: Date.now() - start,
        });
      }
    }
  }

  // Test 2.4: Malformed Body & NoSQL Injection Payloads
  {
    console.log('  [2.4] Testing malformed bodies, NoSQL injection, and type safety...');
    const edgeCases = [
      { name: 'Non-JSON empty body', payload: '' },
      { name: 'JSON array []', payload: [] },
      { name: 'JSON number primitive 12345', payload: 12345 },
      { name: 'JSON boolean primitive true', payload: true },
      { name: 'NoSQL operator injection { $ne: null } in email', payload: { fullName: 'NoSQL Attacker', email: { $ne: null }, commissionNature: 'Other', estimatedDate: '2026-10-10', venue: 'Paris' } },
      { name: 'NoSQL operator injection { $gt: "" } in fullName', payload: { fullName: { $gt: '' }, email: 'attacker@atelier.com', commissionNature: 'Other', estimatedDate: '2026-10-10', venue: 'Paris' } },
    ];

    for (const [idx, ec] of edgeCases.entries()) {
      const start = Date.now();
      try {
        const res = await POST(createPostReq(ec.payload));
        const duration = Date.now() - start;

        const pass = res.status === 400;
        testResults.push({
          id: `CHAL-M1-12-${idx + 1}`,
          category: 'ENQUIRIES_API',
          name: `Type poisoning / injection handled safely: ${ec.name}`,
          passed: pass,
          severityIfFailed: 'HIGH',
          observed: `HTTP ${res.status}`,
          expected: 'HTTP 400 Bad Request',
          durationMs: duration,
        });
      } catch (err: unknown) {
        testResults.push({
          id: `CHAL-M1-12-${idx + 1}`,
          category: 'ENQUIRIES_API',
          name: `Type poisoning / injection handled safely: ${ec.name}`,
          passed: false,
          severityIfFailed: 'HIGH',
          observed: `Threw exception: ${err}`,
          expected: 'HTTP 400 Bad Request',
          durationMs: Date.now() - start,
        });
      }
    }
    const typePassCount = testResults.filter((r) => r.id.startsWith('CHAL-M1-12') && r.passed).length;
    console.log(`    ✓ 2.4: Malformed / Injection handling: ${typePassCount}/${edgeCases.length} returned HTTP 400`);
  }

  // Test 2.5: Internationalization, Unicode, and HTML Special Characters
  {
    console.log('  [2.5] Testing Unicode, international characters, and HTML script tags...');
    const start = Date.now();
    try {
      const unicodePayload = {
        fullName: 'Princesse Éléonore & 鈴木 健太 💍',
        email: 'eleonore.kenta@atelier-international.ch',
        phone: '+41 22 730 01 01',
        commissionNature: 'Intimate Destination Pre-Wedding',
        estimatedDate: '2026-11-20T10:00:00.000Z',
        venue: 'Grand Hôtel du Cap-Ferrat, Côte d’Azur, France 🇫🇷',
        visionNotes: '<script>alert("editorial")</script> & Special chars: & " \' < > / \\ 🌟',
      };

      const res = await POST(createPostReq(unicodePayload));
      const json = await res.json();
      const duration = Date.now() - start;

      const is201 = res.status === 201;
      const saved = await Enquiry.findById(json.enquiryId);

      const preserved =
        saved?.fullName === unicodePayload.fullName &&
        saved?.venue === unicodePayload.venue &&
        saved?.visionNotes === unicodePayload.visionNotes;

      const pass = is201 && Boolean(saved) && preserved;
      testResults.push({
        id: 'CHAL-M1-13',
        category: 'ENQUIRIES_API',
        name: 'Multi-lingual Unicode, emoji, and raw characters are stored verbatim without data loss',
        passed: pass,
        severityIfFailed: 'HIGH',
        observed: `is201=${is201}, preserved=${preserved}, savedName="${saved?.fullName}"`,
        expected: 'HTTP 201 and verbatim fidelity in MongoDB document',
        durationMs: duration,
      });
      console.log(`    ${pass ? '✓' : '✗'} 2.5: Unicode and special characters fidelity (pass=${pass})`);
    } catch (err: unknown) {
      testResults.push({
        id: 'CHAL-M1-13',
        category: 'ENQUIRIES_API',
        name: 'Multi-lingual Unicode, emoji, and raw characters are stored verbatim without data loss',
        passed: false,
        severityIfFailed: 'HIGH',
        observed: `Threw exception: ${err}`,
        expected: 'HTTP 201 with accurate document storage',
        durationMs: Date.now() - start,
      });
    }
  }

  // Cleanup
  await disconnectDB();

  // ===========================================================================
  // SUMMARY REPORT
  // ===========================================================================
  console.log('\n========================================================================');
  console.log('  CHALLENGER STRESS SUITE: RESULTS SUMMARY');
  console.log('========================================================================\n');

  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;

  console.log(`  TOTAL TESTS EXECUTED : ${total}`);
  console.log(`  PASSED               : ${passed}`);
  console.log(`  FAILED               : ${failed}`);
  console.log(`  PASS RATE            : ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('--- FAILURE BREAKDOWN ---');
    testResults
      .filter((r) => !r.passed)
      .forEach((f, idx) => {
        console.log(`  ${idx + 1}. [${f.id}] [${f.severityIfFailed}] ${f.name}`);
        console.log(`     Observed: ${f.observed}`);
        console.log(`     Expected: ${f.expected}`);
      });
    console.log();
  }

  const allPassed = failed === 0;
  return { passed: allPassed, results: testResults };
}

if (process.argv[1]?.includes('challenger_m1_robustness.stress')) {
  runChallengerSuite().then((res) => {
    process.exit(res.passed ? 0 : 1);
  });
}
