/**
 * Stress Test Suite: Enquiries API Robustness & Validation Hardening
 * Location: tests/stress/enquiries-api.stress.ts
 *
 * Tests:
 * 1. 50 Concurrent valid enquiry submissions (data persistence, no lost writes)
 * 2. Strict field validation rejection (HTTP 400)
 * 3. Boundary & Mongoose schema constraint validation (commissionNature enum, string length limits)
 * 4. Malformed request bodies (null, array, non-JSON)
 * 5. Injection & Unicode resilience
 * 6. GET /api/enquiries query parameter bounds & pagination stress
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '../../app/api/enquiries/route';
import { connectDB, disconnectDB } from '../../lib/mongodb';
import { Enquiry } from '../../lib/models';

interface TestResult {
  test: string;
  passed: boolean;
  durationMs: number;
  details?: string;
  error?: string;
}

function createJsonPostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function createGetRequest(queryString: string = ''): NextRequest {
  return new NextRequest(`http://localhost:3000/api/enquiries${queryString ? '?' + queryString : ''}`, {
    method: 'GET',
  });
}

export async function runEnquiriesApiStressTests(): Promise<{ passed: boolean; results: TestResult[] }> {
  const results: TestResult[] = [];
  console.log('\n======================================================================');
  console.log('  STRESS TEST: Enquiries API Robustness & Schema Validation');
  console.log('======================================================================\n');

  await connectDB();
  // Clear enquiries collection before stress test
  await Enquiry.deleteMany({});

  // -------------------------------------------------------------
  // Test 1: 50 Concurrent Valid Submissions
  // -------------------------------------------------------------
  {
    const start = Date.now();
    try {
      console.log('[Test 1] Executing 50 concurrent valid POST /api/enquiries submissions...');
      const validPayloads = Array.from({ length: 50 }, (_, i) => ({
        fullName: `Client Monograph ${i + 1}`,
        email: `monograph.client.${i + 1}@atelier-test.com`,
        phone: `+33 1 42 68 55 ${String(i).padStart(2, '0')}`,
        commissionNature: 'Multi-day Wedding Monograph',
        estimatedDate: new Date(Date.now() + (i + 10) * 86400000).toISOString(),
        venue: `Villa Balbiano Suite ${i + 1}, Lake Como, Italy`,
        visionNotes: `Curated 35mm film documentation for event ${i + 1}.`,
      }));

      const requests = validPayloads.map((payload) => createJsonPostRequest(payload));
      const responses = await Promise.all(requests.map((req) => POST(req)));
      const duration = Date.now() - start;

      const statuses = responses.map((r) => r.status);
      const all201 = statuses.every((s) => s === 201);

      const jsonBodies = await Promise.all(responses.map((r) => r.json()));
      const enquiryIds = jsonBodies.map((b) => b.enquiryId);
      const uniqueIds = new Set(enquiryIds);
      const allHaveValidHexId = enquiryIds.every((id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id));
      const allUnique = uniqueIds.size === 50;

      // Verify directly in MongoDB
      const dbCount = await Enquiry.countDocuments({});
      const allInDb = dbCount === 50;

      const passed = all201 && allHaveValidHexId && allUnique && allInDb;
      results.push({
        test: 'T2.1: 50 Concurrent valid POST submissions persist with unique IDs (HTTP 201)',
        passed,
        durationMs: duration,
        details: `All 201=${all201}, uniqueIds=${uniqueIds.size}/50, dbCount=${dbCount}/50, duration=${duration}ms`,
      });
      console.log(`  ${passed ? '✓' : '✗'} T2.1: 50 Concurrent submissions (passed=${passed}, count=${dbCount}, time=${duration}ms)`);
    } catch (err: unknown) {
      results.push({
        test: 'T2.1: 50 Concurrent valid POST submissions persist with unique IDs (HTTP 201)',
        passed: false,
        durationMs: Date.now() - start,
        error: String(err),
      });
      console.log(`  ✗ T2.1 Exception:`, err);
    }
  }

  // -------------------------------------------------------------
  // Test 2: Standard Validation Failures (HTTP 400 Bad Request)
  // -------------------------------------------------------------
  {
    const invalidCases = [
      { name: 'Missing fullName', body: { email: 'test@example.com', commissionNature: 'Other', estimatedDate: '2026-10-10', venue: 'Paris' } },
      { name: 'Whitespace fullName', body: { fullName: '   ', email: 'test@example.com', commissionNature: 'Other', estimatedDate: '2026-10-10', venue: 'Paris' } },
      { name: '1-char fullName', body: { fullName: 'A', email: 'test@example.com', commissionNature: 'Other', estimatedDate: '2026-10-10', venue: 'Paris' } },
      { name: 'Missing email', body: { fullName: 'Jane Doe', commissionNature: 'Other', estimatedDate: '2026-10-10', venue: 'Paris' } },
      { name: 'Invalid email (no @)', body: { fullName: 'Jane Doe', email: 'janedoe.com', commissionNature: 'Other', estimatedDate: '2026-10-10', venue: 'Paris' } },
      { name: 'Invalid email (no domain)', body: { fullName: 'Jane Doe', email: 'jane@', commissionNature: 'Other', estimatedDate: '2026-10-10', venue: 'Paris' } },
      { name: 'Missing commissionNature', body: { fullName: 'Jane Doe', email: 'test@example.com', estimatedDate: '2026-10-10', venue: 'Paris' } },
      { name: 'Missing estimatedDate', body: { fullName: 'Jane Doe', email: 'test@example.com', commissionNature: 'Other', venue: 'Paris' } },
      { name: 'Unparseable estimatedDate', body: { fullName: 'Jane Doe', email: 'test@example.com', commissionNature: 'Other', estimatedDate: 'invalid-date-string', venue: 'Paris' } },
      { name: 'Missing venue', body: { fullName: 'Jane Doe', email: 'test@example.com', commissionNature: 'Other', estimatedDate: '2026-10-10' } },
      { name: 'Empty string venue', body: { fullName: 'Jane Doe', email: 'test@example.com', commissionNature: 'Other', estimatedDate: '2026-10-10', venue: '   ' } },
    ];

    console.log('[Test 2] Testing boundary validation rejections (HTTP 400)...');
    for (const testCase of invalidCases) {
      const start = Date.now();
      try {
        const req = createJsonPostRequest(testCase.body);
        const res = await POST(req);
        const json = await res.json();
        const duration = Date.now() - start;

        const passed = res.status === 400 && json.success === false && Boolean(json.error);
        results.push({
          test: `T2.2: ${testCase.name} rejected with HTTP 400`,
          passed,
          durationMs: duration,
          details: `status=${res.status}, error="${json.error}"`,
        });
        if (!passed) {
          console.log(`  ✗ T2.2 Failed: ${testCase.name} got status ${res.status}`);
        }
      } catch (err: unknown) {
        results.push({
          test: `T2.2: ${testCase.name} rejected with HTTP 400`,
          passed: false,
          durationMs: Date.now() - start,
          error: String(err),
        });
      }
    }
    const t2Passed = results.filter((r) => r.test.startsWith('T2.2') && r.passed).length;
    console.log(`  ✓ T2.2 Passed: ${t2Passed}/${invalidCases.length} standard validation boundaries correctly rejected with HTTP 400`);
  }

  // -------------------------------------------------------------
  // Test 3: Adversarial Schema Discrepancy Stress Tests
  // (Testing where route validation may let invalid input pass to Mongoose)
  // -------------------------------------------------------------
  {
    console.log('[Test 3] Testing adversarial schema discrepancies (enum violations, length limits)...');

    // Scenario 3.1: Invalid Commission Nature Enum
    {
      const start = Date.now();
      const req = createJsonPostRequest({
        fullName: 'Adversarial Client',
        email: 'client@adversarial.com',
        commissionNature: 'NonExistentTier-DeepSpace-Photography',
        estimatedDate: '2026-10-10',
        venue: 'Mars Rover Lab',
      });
      const res = await POST(req);
      const json = await res.json();
      const duration = Date.now() - start;

      // According to PROJECT.md:
      // Error: HTTP 400 Bad Request { "error": "Validation error message" }
      // A validation error for an unsupported commission tier should be HTTP 400, not HTTP 500!
      const passed = res.status === 400;
      results.push({
        test: 'T2.3.1: Invalid commissionNature enum rejected with HTTP 400 (not HTTP 500 crash)',
        passed,
        durationMs: duration,
        details: `Status=${res.status}, body=${JSON.stringify(json)}`,
        error: res.status !== 400 ? `Returned HTTP ${res.status} instead of HTTP 400. Mongoose enum validation caused unhandled 500.` : undefined,
      });
      console.log(`  ${passed ? '✓' : '✗'} T2.3.1: Invalid commissionNature enum (status=${res.status}, expected 400)`);
    }

    // Scenario 3.2: Oversized fullName (> 120 chars, schema limit)
    {
      const start = Date.now();
      const req = createJsonPostRequest({
        fullName: 'A'.repeat(150),
        email: 'client@adversarial.com',
        commissionNature: 'Other',
        estimatedDate: '2026-10-10',
        venue: 'Paris Studio',
      });
      const res = await POST(req);
      const json = await res.json();
      const duration = Date.now() - start;

      const passed = res.status === 400;
      results.push({
        test: 'T2.3.2: Oversized fullName (>120 chars) rejected with HTTP 400 (not HTTP 500 crash)',
        passed,
        durationMs: duration,
        details: `Status=${res.status}, body=${JSON.stringify(json)}`,
        error: res.status !== 400 ? `Returned HTTP ${res.status} instead of HTTP 400. Mongoose maxlength validation caused unhandled 500.` : undefined,
      });
      console.log(`  ${passed ? '✓' : '✗'} T2.3.2: Oversized fullName (status=${res.status}, expected 400)`);
    }

    // Scenario 3.3: Oversized venue (> 250 chars, schema limit)
    {
      const start = Date.now();
      const req = createJsonPostRequest({
        fullName: 'Adversarial Client',
        email: 'client@adversarial.com',
        commissionNature: 'Other',
        estimatedDate: '2026-10-10',
        venue: 'V'.repeat(300),
      });
      const res = await POST(req);
      const json = await res.json();
      const duration = Date.now() - start;

      const passed = res.status === 400;
      results.push({
        test: 'T2.3.3: Oversized venue (>250 chars) rejected with HTTP 400 (not HTTP 500 crash)',
        passed,
        durationMs: duration,
        details: `Status=${res.status}, body=${JSON.stringify(json)}`,
        error: res.status !== 400 ? `Returned HTTP ${res.status} instead of HTTP 400. Mongoose maxlength validation caused unhandled 500.` : undefined,
      });
      console.log(`  ${passed ? '✓' : '✗'} T2.3.3: Oversized venue (status=${res.status}, expected 400)`);
    }

    // Scenario 3.4: Oversized visionNotes (> 3000 chars, schema limit)
    {
      const start = Date.now();
      const req = createJsonPostRequest({
        fullName: 'Adversarial Client',
        email: 'client@adversarial.com',
        commissionNature: 'Other',
        estimatedDate: '2026-10-10',
        venue: 'Paris Studio',
        visionNotes: 'N'.repeat(3500),
      });
      const res = await POST(req);
      const json = await res.json();
      const duration = Date.now() - start;

      const passed = res.status === 400;
      results.push({
        test: 'T2.3.4: Oversized visionNotes (>3000 chars) rejected with HTTP 400 (not HTTP 500 crash)',
        passed,
        durationMs: duration,
        details: `Status=${res.status}, body=${JSON.stringify(json)}`,
        error: res.status !== 400 ? `Returned HTTP ${res.status} instead of HTTP 400. Mongoose maxlength validation caused unhandled 500.` : undefined,
      });
      console.log(`  ${passed ? '✓' : '✗'} T2.3.4: Oversized visionNotes (status=${res.status}, expected 400)`);
    }
  }

  // -------------------------------------------------------------
  // Test 4: Malformed Request Payloads & Type Poisoning
  // -------------------------------------------------------------
  {
    console.log('[Test 4] Testing malformed request bodies and type poisoning...');
    const malformedCases = [
      { name: 'Empty string raw body', body: '' },
      { name: 'Invalid JSON syntax', body: '{"fullName": "broken json' },
      { name: 'Array body []', body: [] },
      { name: 'Primitive number body', body: 12345 },
      { name: 'Primitive boolean body', body: true },
      { name: 'NoSQL operator injection in email', body: { fullName: 'NoSQL Attacker', email: { $ne: null }, commissionNature: 'Other', estimatedDate: '2026-10-10', venue: 'Paris' } },
      { name: 'NoSQL operator injection in fullName', body: { fullName: { $gt: '' }, email: 'attacker@evil.com', commissionNature: 'Other', estimatedDate: '2026-10-10', venue: 'Paris' } },
      { name: 'Prototype pollution attempt', body: { __proto__: { isAdmin: true }, fullName: 'Polluter', email: 'pollute@test.com', commissionNature: 'Other', estimatedDate: '2026-10-10', venue: 'Paris' } },
    ];

    for (const testCase of malformedCases) {
      const start = Date.now();
      try {
        const req = createJsonPostRequest(testCase.body);
        const res = await POST(req);
        const duration = Date.now() - start;

        // Must reject with 400 or handle safely (if proto pollution, must not crash or poison)
        const passed = res.status === 400 || (testCase.name.includes('Prototype') && res.status === 201);
        results.push({
          test: `T2.4: ${testCase.name} handled securely`,
          passed,
          durationMs: duration,
          details: `status=${res.status}`,
        });
        if (!passed) {
          console.log(`  ✗ T2.4 Failed: ${testCase.name} got status ${res.status}`);
        }
      } catch (err: unknown) {
        results.push({
          test: `T2.4: ${testCase.name} handled securely`,
          passed: false,
          durationMs: Date.now() - start,
          error: String(err),
        });
      }
    }
    const t4Passed = results.filter((r) => r.test.startsWith('T2.4') && r.passed).length;
    console.log(`  ✓ T2.4 Passed: ${t4Passed}/${malformedCases.length} malformed inputs safely handled`);
  }

  // -------------------------------------------------------------
  // Test 5: Unicode, Accents, and Script Tag Resilience
  // -------------------------------------------------------------
  {
    console.log('[Test 5] Testing international characters, emoji, and script tag storage...');
    const start = Date.now();
    try {
      const unicodePayload = {
        fullName: 'Éléonore François & 鈴木 健太 💍',
        email: 'eleonore.kenta@international-atelier.co.uk',
        phone: '+81 90 1234 5678',
        commissionNature: 'Intimate Destination Pre-Wedding',
        estimatedDate: '2026-11-20T10:00:00.000Z',
        venue: 'Grand Hôtel du Cap-Ferrat, Côte d’Azur, France 🇫🇷',
        visionNotes: '<script>alert("editorial")</script> & Special chars: & " \' < > / \\ 🌟',
      };

      const req = createJsonPostRequest(unicodePayload);
      const res = await POST(req);
      const json = await res.json();
      const duration = Date.now() - start;

      const is201 = res.status === 201;
      const savedDoc = await Enquiry.findById(json.enquiryId);

      const unicodePreserved =
        savedDoc?.fullName === unicodePayload.fullName &&
        savedDoc?.venue === unicodePayload.venue &&
        savedDoc?.visionNotes === unicodePayload.visionNotes;

      const passed = is201 && Boolean(savedDoc) && unicodePreserved;
      results.push({
        test: 'T2.5: Multi-lingual Unicode, emoji, and script tags stored accurately without distortion',
        passed,
        durationMs: duration,
        details: `Saved fullName="${savedDoc?.fullName}", venue="${savedDoc?.venue}"`,
      });
      console.log(`  ${passed ? '✓' : '✗'} T2.5: Unicode & internationalization resilience (passed=${passed})`);
    } catch (err: unknown) {
      results.push({
        test: 'T2.5: Multi-lingual Unicode, emoji, and script tags stored accurately without distortion',
        passed: false,
        durationMs: Date.now() - start,
        error: String(err),
      });
      console.log(`  ✗ T2.5 Exception:`, err);
    }
  }

  // -------------------------------------------------------------
  // Test 6: GET /api/enquiries Pagination and Query Boundaries
  // -------------------------------------------------------------
  {
    console.log('[Test 6] Testing GET /api/enquiries endpoint query bounds...');
    interface EnquiryResponseItem {
      status?: string;
      [key: string]: unknown;
    }

    interface EnquiryApiResponse {
      success?: boolean;
      count?: number;
      total?: number;
      page?: number;
      enquiries?: EnquiryResponseItem[];
      [key: string]: unknown;
    }

    const getTests: Array<{
      name: string;
      query: string;
      check: (json: EnquiryApiResponse) => boolean;
    }> = [
      { name: 'Default fetch', query: '', check: (json: EnquiryApiResponse) => Boolean(json.success && (json.count ?? 0) > 0 && (json.total ?? 0) > 0) },
      { name: 'Status filter ?status=new', query: 'status=new', check: (json: EnquiryApiResponse) => Boolean(json.success && json.enquiries?.every((e: EnquiryResponseItem) => e.status === 'new')) },
      { name: 'Limit boundary ?limit=10', query: 'limit=10', check: (json: EnquiryApiResponse) => Boolean(json.success && (json.enquiries?.length ?? 0) <= 10) },
      { name: 'Limit clamping ?limit=1000 (clamped to 100)', query: 'limit=1000', check: (json: EnquiryApiResponse) => Boolean(json.success && (json.enquiries?.length ?? 0) <= 100) },
      { name: 'Pagination page=2&limit=5', query: 'page=2&limit=5', check: (json: EnquiryApiResponse) => Boolean(json.success && json.page === 2) },
      { name: 'Zero/Negative limit ?limit=0 (clamped to 1)', query: 'limit=0', check: (json: EnquiryApiResponse) => Boolean(json.success && (json.enquiries?.length ?? 0) >= 1) },
    ];

    for (const gt of getTests) {
      const start = Date.now();
      try {
        const req = createGetRequest(gt.query);
        const res = await GET(req);
        const json = await res.json();
        const duration = Date.now() - start;

        const passed = res.status === 200 && gt.check(json);
        results.push({
          test: `T2.6: GET /api/enquiries ${gt.name}`,
          passed,
          durationMs: duration,
          details: `status=${res.status}, count=${json.count}, total=${json.total}`,
        });
      } catch (err: unknown) {
        results.push({
          test: `T2.6: GET /api/enquiries ${gt.name}`,
          passed: false,
          durationMs: Date.now() - start,
          error: String(err),
        });
      }
    }
    const t6Passed = results.filter((r) => r.test.startsWith('T2.6') && r.passed).length;
    console.log(`  ✓ T2.6 Passed: ${t6Passed}/${getTests.length} GET query parameter boundary tests succeeded`);
  }

  // Cleanup
  await disconnectDB();

  const allPassed = results.every((r) => r.passed);
  console.log('\n--- Enquiries API Stress Summary ---');
  console.log(`Total: ${results.length} | Passed: ${results.filter((r) => r.passed).length} | Failed: ${results.filter((r) => !r.passed).length}`);
  return { passed: allPassed, results };
}

if (process.argv[1]?.includes('enquiries-api.stress')) {
  runEnquiriesApiStressTests().then((res) => {
    process.exit(res.passed ? 0 : 1);
  });
}
