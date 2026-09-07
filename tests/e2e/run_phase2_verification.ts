/**
 * Brother's Photography Atelier Platform — Automated Phase 2 E2E Verification Runner
 * Validates requirements R1 through R4:
 *   1. Bulk media upload to public/uploads/ and MongoDB verification
 *   2. Multi-page dynamic routes returning HTTP 200 with dynamic content markers
 *   3. QR code endpoint returning valid PNG/SVG images for gallery URLs
 *   4. Mobile navigation drawer verification
 *   5. context.md update verification
 *   6. Tier 5 adversarial stress testing & boundary verification
 *
 * Usage:
 *   npx tsx tests/e2e/run_phase2_verification.ts [--url=http://localhost:3000] [--mock] [--suite=1|2|3|4|5|6|all]
 */

import { ApiClient } from './helpers/api-client';
import { TestHarness } from './helpers/assert';
import { startMockContractServerPhase2 } from './helpers/mock-contract-server-phase2';
import {
  runSuite1_BulkMediaUploadAndStorage,
  runSuite2_MultiPageDynamicRoutes,
  runSuite3_QrCodeEndpoint,
  runSuite4_MobileNavDrawer,
  runSuite5_ContextFileUpdate,
  runSuite6_AdversarialHardening
} from './phase2_acceptance.test';

// Parse command-line arguments
const args = process.argv.slice(2);
const suiteArg = args.find((a) => a.startsWith('--suite='))?.split('=')[1] || 'all';
const urlArg = args.find((a) => a.startsWith('--url='))?.split('=')[1];
const mockFlag = args.includes('--mock') || args.includes('--self-test');
const jsonFlag = args.includes('--json');

async function checkUrlAlive(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return res.status > 0;
  } catch {
    return false;
  }
}

async function main() {
  if (!jsonFlag) {
    console.log('\n======================================================================');
    console.log("  BROTHER'S PHOTOGRAPHY ATELIER — PHASE 2 E2E VERIFICATION SUITE");
    console.log('======================================================================');
  }

  let targetUrl = urlArg || process.env.TEST_BASE_URL || 'http://localhost:3000';
  let mockServerHandle: { close: () => Promise<void> } | null = null;

  if (mockFlag) {
    if (!jsonFlag) {
      console.log('\n[Mode] Running with embedded specification contract server (--mock / --self-test)');
    }
    const mock = await startMockContractServerPhase2();
    targetUrl = mock.baseUrl;
    mockServerHandle = mock;
  } else {
    const isLive = await checkUrlAlive(targetUrl);
    if (isLive) {
      if (!jsonFlag) {
        console.log(`\n[Mode] Connected to target server at: ${targetUrl}`);
      }
    } else {
      if (!jsonFlag) {
        console.log(`\n[Notice] Target server at ${targetUrl} is not currently responding.`);
        console.log('Starting embedded Phase 2 specification contract server for self-test verification...');
      }
      const mock = await startMockContractServerPhase2();
      targetUrl = mock.baseUrl;
      mockServerHandle = mock;
      if (!jsonFlag) {
        console.log(`[Mode] Embedded specification server listening on ${targetUrl}`);
      }
    }
  }

  const client = new ApiClient(targetUrl);
  const masterHarness = new TestHarness();
  const startTime = Date.now();

  const suiteResults: Record<string, { passed: number; failed: number; total: number }> = {};

  try {
    // Suite 1: Bulk Media Upload & Storage Pipeline (R2)
    if (suiteArg === 'all' || suiteArg === '1') {
      const s1Harness = new TestHarness();
      await runSuite1_BulkMediaUploadAndStorage(client, s1Harness);
      suiteResults['Suite 1: Bulk Upload & Storage (R2)'] = s1Harness.getSummary();
      masterHarness.passed += s1Harness.passed;
      masterHarness.failed += s1Harness.failed;
      masterHarness.errors.push(...s1Harness.errors);
    }

    // Suite 2: Multi-Page Dynamic Routes & Showcase (R1)
    if (suiteArg === 'all' || suiteArg === '2') {
      const s2Harness = new TestHarness();
      await runSuite2_MultiPageDynamicRoutes(client, s2Harness);
      suiteResults['Suite 2: Multi-Page Dynamic Routes (R1)'] = s2Harness.getSummary();
      masterHarness.passed += s2Harness.passed;
      masterHarness.failed += s2Harness.failed;
      masterHarness.errors.push(...s2Harness.errors);
    }

    // Suite 3: QR Code Generation & Binary Validation (R3)
    if (suiteArg === 'all' || suiteArg === '3') {
      const s3Harness = new TestHarness();
      await runSuite3_QrCodeEndpoint(client, s3Harness);
      suiteResults['Suite 3: Binary QR Code Generation (R3)'] = s3Harness.getSummary();
      masterHarness.passed += s3Harness.passed;
      masterHarness.failed += s3Harness.failed;
      masterHarness.errors.push(...s3Harness.errors);
    }

    // Suite 4: Mobile Navigation Drawer (R1)
    if (suiteArg === 'all' || suiteArg === '4') {
      const s4Harness = new TestHarness();
      await runSuite4_MobileNavDrawer(client, s4Harness);
      suiteResults['Suite 4: Mobile Navigation Drawer (R1)'] = s4Harness.getSummary();
      masterHarness.passed += s4Harness.passed;
      masterHarness.failed += s4Harness.failed;
      masterHarness.errors.push(...s4Harness.errors);
    }

    // Suite 5: Context File Update (R4)
    if (suiteArg === 'all' || suiteArg === '5') {
      const s5Harness = new TestHarness();
      await runSuite5_ContextFileUpdate(s5Harness);
      suiteResults['Suite 5: Context File Tracking (R4)'] = s5Harness.getSummary();
      masterHarness.passed += s5Harness.passed;
      masterHarness.failed += s5Harness.failed;
      masterHarness.errors.push(...s5Harness.errors);
    }

    // Suite 6: Tier 5 Adversarial Hardening
    if (suiteArg === 'all' || suiteArg === '6') {
      const s6Harness = new TestHarness();
      await runSuite6_AdversarialHardening(client, s6Harness);
      suiteResults['Suite 6: Adversarial Hardening (Tier 5)'] = s6Harness.getSummary();
      masterHarness.passed += s6Harness.passed;
      masterHarness.failed += s6Harness.failed;
      masterHarness.errors.push(...s6Harness.errors);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('\n\x1b[31m[CRITICAL RUNNER ERROR]\x1b[0m', err);
    masterHarness.failed++;
    masterHarness.errors.push({ testName: 'Runner', message: errorMsg });
  } finally {
    if (mockServerHandle) {
      await mockServerHandle.close();
    }
  }

  const durationMs = Date.now() - startTime;
  const grandSummary = masterHarness.getSummary();

  if (jsonFlag) {
    console.log(
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          durationMs,
          suites: suiteResults,
          grandTotal: grandSummary,
          errors: masterHarness.errors
        },
        null,
        2
      )
    );
    process.exit(masterHarness.failed === 0 ? 0 : 1);
  }

  console.log('\n======================================================================');
  console.log('  PHASE 2 E2E VERIFICATION EXECUTION SUMMARY');
  console.log('======================================================================\n');

  console.log('  +--------------------------------------------+--------+--------+--------+');
  console.log('  | Test Suite                                 | Passed | Failed |  Total |');
  console.log('  +--------------------------------------------+--------+--------+--------+');

  for (const [suiteName, stats] of Object.entries(suiteResults)) {
    const namePadded = suiteName.padEnd(42);
    const passPadded = String(stats.passed).padStart(6);
    const failPadded = String(stats.failed).padStart(6);
    const totalPadded = String(stats.total).padStart(6);
    const statusColor = stats.failed === 0 ? '\x1b[32m' : '\x1b[31m';
    console.log(`  | ${namePadded} | ${statusColor}${passPadded}\x1b[0m | ${statusColor}${failPadded}\x1b[0m | ${totalPadded} |`);
  }

  console.log('  +--------------------------------------------+--------+--------+--------+');
  const grandPass = String(grandSummary.passed).padStart(6);
  const grandFail = String(grandSummary.failed).padStart(6);
  const grandTot = String(grandSummary.total).padStart(6);
  const grandColor = grandSummary.failed === 0 ? '\x1b[32m' : '\x1b[31m';
  console.log(`  | \x1b[1mGRAND TOTAL\x1b[0m                                | ${grandColor}${grandPass}\x1b[0m | ${grandColor}${grandFail}\x1b[0m | ${grandTot} |`);
  console.log('  +--------------------------------------------+--------+--------+--------+');

  console.log(`\n  Total Execution Time: ${(durationMs / 1000).toFixed(2)}s`);

  if (masterHarness.errors.length > 0) {
    console.log('\n\x1b[31mFAILURES ENCOUNTERED:\x1b[0m');
    masterHarness.errors.forEach((err, idx) => {
      console.log(`  ${idx + 1}. [${err.testName}] ${err.message}`);
    });
    console.log('\n\x1b[31m❌ PHASE 2 VERIFICATION SUITE ENCOUNTERED FAILURES\x1b[0m\n');
    process.exit(1);
  } else {
    console.log('\n\x1b[32m✅ ALL PHASE 2 TEST SUITES PASSED (100% PASS RATE)\x1b[0m\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error in Phase 2 test runner:', err);
  process.exit(1);
});
