/**
 * Challenger Adversarial Verification & Stress Test Suite:
 * Dynamic Routes & Regression Token Invariance Across Varied HTTP Clients
 * 
 * Location: tests/stress/challenger_routes_invariance.stress.ts
 * 
 * Empirically tests:
 * 1. Verification of all 8 public routes: /, /about, /services, /portfolio, /films, /studio, /testimonials, /contact
 * 2. HTTP status 200 across all 8 routes
 * 3. Dynamic content markers presence on each route
 * 4. Invariance of all 5 legacy tokens: "Atelier", "Portfolio", "Inquire", "Brother", "2026" on every route
 * 5. Varied HTTP clients:
 *    - Node.js fetch
 *    - cURL default CLI
 *    - cURL Mobile Safari iOS
 *    - cURL Mobile Chrome Android
 *    - cURL Desktop Chrome MacOS
 *    - cURL Desktop Firefox Windows
 *    - cURL Googlebot Crawler
 *    - cURL with Stripped/Empty User-Agent
 *    - cURL with Compressed payload (gzip, deflate, br)
 *    - Python 3 urllib.request
 *    - Python 3 http.client (raw HTTP/1.1 socket)
 * 6. High-concurrency burst: 80 parallel requests (10 per route)
 * 7. HTTP HEAD requests resilience
 * 8. Query parameter fuzzing and boundary resilience
 */

import { execSync } from 'node:child_process';
import http from 'node:http';

interface RouteDefinition {
  path: string;
  name: string;
  dynamicMarkers: string[];
}

const PRIMARY_8_ROUTES: RouteDefinition[] = [
  {
    path: '/',
    name: 'Homepage Magazine Overview',
    dynamicMarkers: ['Atelier', 'Portfolio', 'Inquire', 'Brother', '2026'],
  },
  {
    path: '/about',
    name: 'Studio Heritage & Philosophy',
    dynamicMarkers: ['Heritage', 'Philosophy', 'Atelier', 'Brother'],
  },
  {
    path: '/services',
    name: 'Bespoke Commission Tiers',
    dynamicMarkers: ['Bespoke', 'Services'],
  },
  {
    path: '/portfolio',
    name: 'Curated Works Archive',
    dynamicMarkers: ['Portfolio', 'Weddings'],
  },
  {
    path: '/films',
    name: 'Cinematic Films & Motion',
    dynamicMarkers: ['Films', 'Cinema'],
  },
  {
    path: '/studio',
    name: 'Physical Atelier & Darkroom',
    dynamicMarkers: ['Studio', 'Atelier', 'Pune'],
  },
  {
    path: '/testimonials',
    name: 'Client Accolades & Reviews',
    dynamicMarkers: ['Testimonial', 'Accolade'],
  },
  {
    path: '/contact',
    name: 'Inquire & Commission Concierge',
    dynamicMarkers: ['Inquire', 'Commission'],
  },
];

const LEGACY_TOKENS = ['Atelier', 'Portfolio', 'Inquire', 'Brother', '2026'];

interface TestResult {
  suite: string;
  test: string;
  passed: boolean;
  details?: string;
  durationMs?: number;
}

const results: TestResult[] = [];

function assert(condition: boolean, suite: string, test: string, details?: string, durationMs?: number) {
  results.push({ suite, test, passed: Boolean(condition), details, durationMs });
  const icon = condition ? '✓' : '✗';
  console.log(`  ${icon} [${suite}] ${test}${details ? ` -> ${details}` : ''}`);
}

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function fetchRoute(path: string, options: RequestInit = {}): Promise<{ status: number; text: string; durationMs: number }> {
  const start = Date.now();
  const res = await fetch(`${BASE_URL}${path}`, options);
  const text = await res.text();
  return { status: res.status, text, durationMs: Date.now() - start };
}

export async function runDynamicRoutesStressTests(): Promise<{ passed: number; failed: number; total: number; results: TestResult[] }> {
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║   CHALLENGER: DYNAMIC ROUTES & REGRESSION TOKEN INVARIANCE SUITE   ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  // ===========================================================================
  // 1. BASELINE NODE.JS FETCH: ALL 8 ROUTES HTTP 200, MARKERS & LEGACY TOKENS
  // ===========================================================================
  console.log('>>> SECTION 1: Baseline Route Verification (Node.js fetch)');
  for (const route of PRIMARY_8_ROUTES) {
    const { status, text, durationMs } = await fetchRoute(route.path);
    
    // Status 200
    assert(status === 200, 'Baseline-200', `${route.path} returns HTTP 200`, `Status: ${status} (${durationMs}ms)`, durationMs);
    assert(text.length > 500, 'Baseline-Length', `${route.path} HTML body > 500 bytes`, `Length: ${text.length} bytes`);

    // Dynamic Markers
    const matchedMarkers = route.dynamicMarkers.filter((m) => new RegExp(m, 'i').test(text));
    assert(
      matchedMarkers.length === route.dynamicMarkers.length,
      'Dynamic-Markers',
      `${route.path} contains all dynamic content markers`,
      `Matched: [${matchedMarkers.join(', ')}] of [${route.dynamicMarkers.join(', ')}]`
    );

    // Legacy Tokens Invariance (All 5 must be present)
    const missingLegacy = LEGACY_TOKENS.filter((tok) => !text.includes(tok));
    assert(
      missingLegacy.length === 0,
      'Legacy-Tokens',
      `${route.path} preserves all 5 legacy tokens (Atelier, Portfolio, Inquire, Brother, 2026)`,
      missingLegacy.length === 0 ? 'All 5 present' : `Missing: ${missingLegacy.join(', ')}`
    );
  }

  // ===========================================================================
  // 2. VARIED HTTP CLIENTS INVARIANCE TESTING
  // ===========================================================================
  console.log('\n>>> SECTION 2: Varied HTTP Clients Token & Status Invariance');

  const CLIENT_CONFIGS = [
    {
      name: 'cURL Default CLI',
      command: (url: string) => `curl -s -w "\n%{http_code}" "${url}"`,
    },
    {
      name: 'cURL Mobile Safari iOS',
      command: (url: string) => `curl -s -w "\n%{http_code}" -A "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1" "${url}"`,
    },
    {
      name: 'cURL Mobile Chrome Android',
      command: (url: string) => `curl -s -w "\n%{http_code}" -A "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36" "${url}"`,
    },
    {
      name: 'cURL Desktop Chrome MacOS',
      command: (url: string) => `curl -s -w "\n%{http_code}" -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" "${url}"`,
    },
    {
      name: 'cURL Desktop Firefox Windows',
      command: (url: string) => `curl -s -w "\n%{http_code}" -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0" "${url}"`,
    },
    {
      name: 'cURL Googlebot Crawler',
      command: (url: string) => `curl -s -w "\n%{http_code}" -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" "${url}"`,
    },
    {
      name: 'cURL Stripped / No User-Agent',
      command: (url: string) => `curl -s -w "\n%{http_code}" -H "User-Agent:" "${url}"`,
    },
    {
      name: 'cURL Compressed (gzip/deflate)',
      command: (url: string) => `curl -s -w "\n%{http_code}" --compressed -H "Accept-Encoding: gzip, deflate, br" "${url}"`,
    },
  ];

  for (const client of CLIENT_CONFIGS) {
    console.log(`  [Client Test] ${client.name}`);
    for (const route of PRIMARY_8_ROUTES) {
      const targetUrl = `${BASE_URL}${route.path}`;
      const start = Date.now();
      try {
        const rawOutput = execSync(client.command(targetUrl), { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
        const lines = rawOutput.trimEnd().split('\n');
        const statusCodeStr = lines[lines.length - 1].trim();
        const statusCode = parseInt(statusCodeStr, 10);
        const body = lines.slice(0, -1).join('\n');
        const durationMs = Date.now() - start;

        const is200 = statusCode === 200;
        const missingTokens = LEGACY_TOKENS.filter((tok) => !body.includes(tok));
        const hasAllTokens = missingTokens.length === 0;

        assert(
          is200 && hasAllTokens,
          `Client-${client.name}`,
          `${route.path}: HTTP 200 and all 5 legacy tokens present`,
          `Status: ${statusCode}, Body: ${body.length}B, Missing Tokens: [${missingTokens.join(', ')}] (${durationMs}ms)`,
          durationMs
        );
      } catch (err: any) {
        assert(false, `Client-${client.name}`, `${route.path}: execution failed`, String(err));
      }
    }
  }

  // ===========================================================================
  // 3. PYTHON 3 URLLIB & HTTP.CLIENT CLIENTS
  // ===========================================================================
  console.log('\n>>> SECTION 3: Python 3 Client Invariance (urllib.request & http.client)');

  try {
    const pythonScript = `
import urllib.request, http.client, json

routes = ['/', '/about', '/services', '/portfolio', '/films', '/studio', '/testimonials', '/contact']
legacy_tokens = ['Atelier', 'Portfolio', 'Inquire', 'Brother', '2026']

results = []

# urllib client
for r in routes:
    req = urllib.request.Request('${BASE_URL}' + r, headers={'User-Agent': 'Python-urllib/3.14'})
    with urllib.request.urlopen(req) as resp:
        body = resp.read().decode('utf-8', errors='ignore')
        missing = [t for t in legacy_tokens if t not in body]
        results.append({'client': 'Python urllib', 'route': r, 'status': resp.status, 'missing': missing, 'len': len(body)})

# http.client raw socket
conn = http.client.HTTPConnection('localhost', 3000)
for r in routes:
    conn.request('GET', r, headers={'User-Agent': 'Python-http.client/raw'})
    resp = conn.getresponse()
    body = resp.read().decode('utf-8', errors='ignore')
    missing = [t for t in legacy_tokens if t not in body]
    results.append({'client': 'Python http.client', 'route': r, 'status': resp.status, 'missing': missing, 'len': len(body)})
conn.close()

print(json.dumps(results))
`;
    const pyOutput = execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`, { encoding: 'utf-8' });
    const pyResults: Array<{ client: string; route: string; status: number; missing: string[]; len: number }> = JSON.parse(pyOutput.trim());

    for (const res of pyResults) {
      const isPassed = res.status === 200 && res.missing.length === 0;
      assert(
        isPassed,
        `Client-${res.client}`,
        `${res.route}: HTTP 200 and all 5 legacy tokens present`,
        `Status: ${res.status}, Body: ${res.len}B, Missing: [${res.missing.join(', ')}]`
      );
    }
  } catch (err: any) {
    assert(false, 'Python-Clients', 'Python test execution failed', String(err));
  }

  // ===========================================================================
  // 4. HTTP METHOD RESILIENCE: HEAD REQUESTS
  // ===========================================================================
  console.log('\n>>> SECTION 4: HTTP HEAD Method Resilience');

  for (const route of PRIMARY_8_ROUTES) {
    const start = Date.now();
    const status = await new Promise<number>((resolve, reject) => {
      const parsedUrl = new URL(`${BASE_URL}${route.path}`);
      const req = http.request(
        {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.pathname,
          method: 'HEAD',
        },
        (res) => {
          resolve(res.statusCode || 0);
        }
      );
      req.on('error', reject);
      req.end();
    });
    const durationMs = Date.now() - start;
    assert(
      status === 200,
      'HEAD-Method',
      `HEAD ${route.path} returns HTTP 200 without error`,
      `Status: ${status} (${durationMs}ms)`
    );
  }

  // ===========================================================================
  // 5. QUERY PARAMETER FUZZING & INVARIANCE
  // ===========================================================================
  console.log('\n>>> SECTION 5: Query Parameter Fuzzing & Invariance');

  const FUZZ_CASES = [
    { query: '?utm_source=instagram&utm_medium=bio', desc: 'Marketing UTM params' },
    { query: '?page=1&limit=25&sort=desc', desc: 'Pagination params' },
    { query: '?category=Weddings%20Collection', desc: 'URL-encoded space' },
    { query: '?tag=luxury&tag=monograph', desc: 'Duplicate array params' },
    { query: '?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E', desc: 'XSS script injection attempt' },
    { query: '?payload=%7B%22admin%22%3Atrue%7D', desc: 'JSON object payload in query' },
  ];

  for (const fuzz of FUZZ_CASES) {
    for (const route of PRIMARY_8_ROUTES) {
      const testPath = `${route.path}${fuzz.query}`;
      const res = await fetch(`${BASE_URL}${testPath}`);
      const text = await res.text();
      const missingTokens = LEGACY_TOKENS.filter((tok) => !text.includes(tok));
      assert(
        res.status === 200 && missingTokens.length === 0,
        'Query-Fuzzing',
        `${route.path} with ${fuzz.desc} maintains HTTP 200 & legacy tokens`,
        `Status: ${res.status}, Missing Tokens: [${missingTokens.join(', ')}]`
      );
    }
  }

  // ===========================================================================
  // 6. ADVERSARIAL HIGH-CONCURRENCY BURST (80 Simultaneous Requests)
  // ===========================================================================
  console.log('\n>>> SECTION 6: High-Concurrency Burst (80 Parallel Requests, 10 per route)');

  const burstRequests: Array<Promise<{ path: string; status: number; hasTokens: boolean; durationMs: number }>> = [];
  const burstStart = Date.now();

  for (let i = 0; i < 10; i++) {
    for (const route of PRIMARY_8_ROUTES) {
      burstRequests.push(
        (async () => {
          const reqStart = Date.now();
          const res = await fetch(`${BASE_URL}${route.path}`);
          const text = await res.text();
          const missingTokens = LEGACY_TOKENS.filter((tok) => !text.includes(tok));
          return {
            path: route.path,
            status: res.status,
            hasTokens: missingTokens.length === 0,
            durationMs: Date.now() - reqStart,
          };
        })()
      );
    }
  }

  const burstResults = await Promise.all(burstRequests);
  const totalBurstDuration = Date.now() - burstStart;
  const failedBurst = burstResults.filter((r) => r.status !== 200 || !r.hasTokens);
  const maxReqDuration = Math.max(...burstResults.map((r) => r.durationMs));
  const avgReqDuration = Math.round(burstResults.reduce((acc, r) => acc + r.durationMs, 0) / burstResults.length);

  assert(
    failedBurst.length === 0,
    'Concurrency-Burst',
    `80 simultaneous requests across all 8 routes completed successfully`,
    `Total: 80, Failed: ${failedBurst.length}, Avg: ${avgReqDuration}ms, Max: ${maxReqDuration}ms, Wall Time: ${totalBurstDuration}ms`
  );

  // ===========================================================================
  // 7. AUXILIARY ROUTE & 404 RESILIENCE
  // ===========================================================================
  console.log('\n>>> SECTION 7: Auxiliary Routes & Error Boundary');

  // /albums route check
  const albumsRes = await fetchRoute('/albums');
  const albumsMissingTokens = LEGACY_TOKENS.filter((tok) => !albumsRes.text.includes(tok));
  assert(
    albumsRes.status === 200 && albumsMissingTokens.length === 0,
    'Auxiliary-Routes',
    '/albums auxiliary route returns HTTP 200 and preserves legacy tokens',
    `Status: ${albumsRes.status}, Missing: [${albumsMissingTokens.join(', ')}]`
  );

  // Non-existent route check (should 404 cleanly without 500)
  const notFoundRes = await fetchRoute('/non-existent-atelier-page-9999');
  assert(
    notFoundRes.status === 404,
    'Error-Boundary',
    'Non-existent route returns HTTP 404 (not 500)',
    `Status: ${notFoundRes.status}`
  );

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log('\n======================================================================');
  console.log('  CHALLENGER STRESS TEST SUMMARY');
  console.log('======================================================================');
  console.log(`  Total Invariance Assertions: ${total}`);
  console.log(`  Passed:                     ${passed}`);
  console.log(`  Failed:                     ${failed}`);
  console.log(`  Pass Rate:                  ${((passed / total) * 100).toFixed(1)}%`);
  console.log('======================================================================\n');

  return { passed, failed, total, results };
}

if (require.main === module) {
  runDynamicRoutesStressTests().then((res) => {
    process.exit(res.failed === 0 ? 0 : 1);
  });
}
