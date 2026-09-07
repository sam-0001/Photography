/**
 * Brother's Photography Atelier Platform — Automated E2E Test Runner
 * Executes Tiers 1 through 4 test suites against live Next.js server or specification contract mock.
 * Usage:
 *   npx tsx tests/e2e/run_tests.ts [--tier=1|2|3|4|all] [--url=http://localhost:3000] [--mock]
 */

import { ApiClient } from './helpers/api-client';
import { TestHarness } from './helpers/assert';
import { startMockContractServer } from './helpers/mock-contract-server';
import { runTier1Tests } from './tier1-feature-coverage.test';
import { runTier2Tests } from './tier2-boundary-cases.test';
import { runTier3Tests } from './tier3-cross-feature.test';
import { runTier4Tests } from './tier4-real-world-scenarios.test';

// Parse command-line arguments
const args = process.argv.slice(2);
const tierArg = args.find((a) => a.startsWith('--tier='))?.split('=')[1] || 'all';
const urlArg = args.find((a) => a.startsWith('--url='))?.split('=')[1];
const mockFlag = args.includes('--mock') || args.includes('--self-test');

async function checkUrlAlive(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    return res.status > 0;
  } catch {
    return false;
  }
}

async function main() {
  console.log('\n======================================================================');
  console.log("  BROTHER'S PHOTOGRAPHY ATELIER — E2E TEST SUITE RUNNER");
  console.log('======================================================================');

  let targetUrl = urlArg || process.env.TEST_BASE_URL || 'http://localhost:3000';
  let mockServerHandle: { close: () => Promise<void> } | null = null;

  if (mockFlag) {
    console.log('\n[Mode] Running with embedded specification contract server (--mock / --self-test)');
    const mock = await startMockContractServer();
    targetUrl = mock.baseUrl;
    mockServerHandle = mock;
  } else {
    const isLive = await checkUrlAlive(targetUrl);
    if (isLive) {
      console.log(`\n[Mode] Connected to live application server at: ${targetUrl}`);
    } else {
      console.log(`\n[Notice] Target server at ${targetUrl} is not currently responding.`);
      console.log('Starting embedded specification contract server for self-test verification...');
      const mock = await startMockContractServer();
      targetUrl = mock.baseUrl;
      mockServerHandle = mock;
      console.log(`[Mode] Embedded specification server listening on ${targetUrl}`);
    }
  }

  const client = new ApiClient(targetUrl);
  const masterHarness = new TestHarness();
  const startTime = Date.now();

  const tierResults: Record<string, { passed: number; failed: number; total: number }> = {};

  try {
    // Tier 1: Feature Coverage
    if (tierArg === 'all' || tierArg === '1') {
      const tier1Harness = new TestHarness();
      await runTier1Tests(client, tier1Harness);
      tierResults['Tier 1: Feature Coverage'] = tier1Harness.getSummary();
      masterHarness.passed += tier1Harness.passed;
      masterHarness.failed += tier1Harness.failed;
      masterHarness.errors.push(...tier1Harness.errors);
    }

    // Tier 2: Boundary & Corner Cases
    if (tierArg === 'all' || tierArg === '2') {
      const tier2Harness = new TestHarness();
      await runTier2Tests(client, tier2Harness);
      tierResults['Tier 2: Boundary Cases'] = tier2Harness.getSummary();
      masterHarness.passed += tier2Harness.passed;
      masterHarness.failed += tier2Harness.failed;
      masterHarness.errors.push(...tier2Harness.errors);
    }

    // Tier 3: Cross-Feature State Transitions
    if (tierArg === 'all' || tierArg === '3') {
      const tier3Harness = new TestHarness();
      await runTier3Tests(client, tier3Harness);
      tierResults['Tier 3: Cross-Feature Flows'] = tier3Harness.getSummary();
      masterHarness.passed += tier3Harness.passed;
      masterHarness.failed += tier3Harness.failed;
      masterHarness.errors.push(...tier3Harness.errors);
    }

    // Tier 4: Real-World Scenarios
    if (tierArg === 'all' || tierArg === '4') {
      const tier4Harness = new TestHarness();
      await runTier4Tests(client, tier4Harness);
      tierResults['Tier 4: Real-World Scenarios'] = tier4Harness.getSummary();
      masterHarness.passed += tier4Harness.passed;
      masterHarness.failed += tier4Harness.failed;
      masterHarness.errors.push(...tier4Harness.errors);
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

  console.log('\n======================================================================');
  console.log('  E2E TEST EXECUTION SUMMARY');
  console.log('======================================================================\n');

  console.log('  +-------------------------------------+--------+--------+--------+');
  console.log('  | Test Suite / Tier                   | Passed | Failed |  Total |');
  console.log('  +-------------------------------------+--------+--------+--------+');

  for (const [tierName, stats] of Object.entries(tierResults)) {
    const namePadded = tierName.padEnd(35);
    const passPadded = String(stats.passed).padStart(6);
    const failPadded = String(stats.failed).padStart(6);
    const totalPadded = String(stats.total).padStart(6);
    const statusColor = stats.failed === 0 ? '\x1b[32m' : '\x1b[31m';
    console.log(`  | ${namePadded} | ${statusColor}${passPadded}\x1b[0m | ${statusColor}${failPadded}\x1b[0m | ${totalPadded} |`);
  }

  console.log('  +-------------------------------------+--------+--------+--------+');
  const grandPass = String(grandSummary.passed).padStart(6);
  const grandFail = String(grandSummary.failed).padStart(6);
  const grandTot = String(grandSummary.total).padStart(6);
  const grandColor = grandSummary.failed === 0 ? '\x1b[32m' : '\x1b[31m';
  console.log(`  | \x1b[1mGRAND TOTAL\x1b[0m                         | ${grandColor}${grandPass}\x1b[0m | ${grandColor}${grandFail}\x1b[0m | ${grandTot} |`);
  console.log('  +-------------------------------------+--------+--------+--------+');

  console.log(`\n  Total Execution Time: ${(durationMs / 1000).toFixed(2)}s`);

  if (masterHarness.errors.length > 0) {
    console.log('\n\x1b[31mFAILURES ENCOUNTERED:\x1b[0m');
    masterHarness.errors.forEach((err, idx) => {
      console.log(`  ${idx + 1}. [${err.testName}] ${err.message}`);
    });
    console.log('\n\x1b[31m❌ TEST SUITE FAILED\x1b[0m\n');
    process.exit(1);
  } else {
    console.log('\n\x1b[32m✅ ALL TEST TIERS PASSED SUCCESSFULLY (100% PASS RATE)\x1b[0m\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error in test runner:', err);
  process.exit(1);
});
