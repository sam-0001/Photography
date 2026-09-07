/**
 * Master Stress Test Suite for Milestone 1
 * Location: tests/stress/run_all_stress.ts
 *
 * Runs comprehensive empirical tests:
 * 1. MongoDB Connection Singleton & Memory-Server Lifecycle (mongodb-connection.stress.ts)
 * 2. Enquiries API Robustness & Schema Validation (enquiries-api.stress.ts)
 * 3. Seed Database Concurrency & Idempotency
 *
 * Reports pass/fail breakdown and detailed metrics.
 */

import { runMongoStressTests } from './mongodb-connection.stress';
import { runEnquiriesApiStressTests } from './enquiries-api.stress';
import { seedDatabase } from '../../lib/seed';
import { connectDB, disconnectDB } from '../../lib/mongodb';
import { Admin, ClientEvent } from '../../lib/models';

async function runAll() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║        BROTHER\'S PHOTOGRAPHY — MILESTONE 1 STRESS TEST SUITE       ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');

  const suiteResults: Record<string, { total: number; passed: number; failed: number }> = {};

  // Suite 1: MongoDB Connection Singleton & Lifecycle
  const mongoRes = await runMongoStressTests();
  suiteResults['MongoDB Connection & Lifecycle'] = {
    total: mongoRes.results.length,
    passed: mongoRes.results.filter((r) => r.passed).length,
    failed: mongoRes.results.filter((r) => !r.passed).length,
  };

  // Suite 2: Enquiries API Robustness
  const enquiriesRes = await runEnquiriesApiStressTests();
  suiteResults['Enquiries API & Schema Robustness'] = {
    total: enquiriesRes.results.length,
    passed: enquiriesRes.results.filter((r) => r.passed).length,
    failed: enquiriesRes.results.filter((r) => !r.passed).length,
  };

  // Suite 3: Seed Database Concurrency & Idempotency
  console.log('\n======================================================================');
  console.log('  STRESS TEST: Database Pre-Seeding Concurrency & Idempotency');
  console.log('======================================================================\n');
  const seedResults: Array<{ test: string; passed: boolean; details: string }> = [];

  try {
    await connectDB();
    await Admin.deleteMany({});
    await ClientEvent.deleteMany({});

    // Test 3.1: Sequential Idempotency
    const seed1 = await seedDatabase({ force: false });
    const seed2 = await seedDatabase({ force: false });
    const isIdempotent = seed1.success && seed1.seeded && seed2.success && !seed2.seeded;
    seedResults.push({
      test: 'T3.1: Sequential seedDatabase is idempotent (second run skips without error)',
      passed: isIdempotent,
      details: `seed1(seeded=${seed1.seeded}), seed2(seeded=${seed2.seeded})`,
    });
    console.log(`  ${isIdempotent ? '✓' : '✗'} T3.1: Sequential idempotency (passed=${isIdempotent})`);

    // Test 3.2: Concurrent Seed Execution (Race condition test)
    await Admin.deleteMany({});
    await ClientEvent.deleteMany({});
    const [c1, c2] = await Promise.allSettled([
      seedDatabase({ force: false }),
      seedDatabase({ force: false }),
    ]);
    const bothResolvedCleanly =
      c1.status === 'fulfilled' &&
      c2.status === 'fulfilled' &&
      c1.value.success &&
      c2.value.success;

    seedResults.push({
      test: 'T3.2: Concurrent seedDatabase calls execute safely without VersionError/rejection',
      passed: bothResolvedCleanly,
      details: `c1=${c1.status === 'fulfilled' ? c1.value.success : c1.reason}, c2=${c2.status === 'fulfilled' ? c2.value.success : c2.reason}`,
    });
    console.log(`  ${bothResolvedCleanly ? '✓' : '✗'} T3.2: Concurrent seed safety (passed=${bothResolvedCleanly})`);
  } catch (err) {
    console.error('Seed test exception:', err);
  } finally {
    await disconnectDB();
  }

  suiteResults['Database Pre-Seeding'] = {
    total: seedResults.length,
    passed: seedResults.filter((r) => r.passed).length,
    failed: seedResults.filter((r) => !r.passed).length,
  };

  // Grand Summary
  console.log('\n======================================================================');
  console.log('  MILESTONE 1 STRESS TEST EXECUTIVE SUMMARY');
  console.log('======================================================================\n');

  let grandTotal = 0;
  let grandPassed = 0;
  let grandFailed = 0;

  for (const [suite, stats] of Object.entries(suiteResults)) {
    console.log(`  • ${suite}: ${stats.passed}/${stats.total} passed (${stats.failed} failures)`);
    grandTotal += stats.total;
    grandPassed += stats.passed;
    grandFailed += stats.failed;
  }

  console.log('\n----------------------------------------------------------------------');
  console.log(`  OVERALL TOTAL: ${grandPassed}/${grandTotal} passed (${grandFailed} failures)`);
  console.log('----------------------------------------------------------------------\n');

  // List all failures
  const allFailures = [
    ...mongoRes.results.filter((r) => !r.passed),
    ...enquiriesRes.results.filter((r) => !r.passed),
    ...seedResults.filter((r) => !r.passed),
  ];

  if (allFailures.length > 0) {
    console.log('⚠️ IDENTIFIED EMPIRICAL DEFECTS & VULNERABILITIES:');
    allFailures.forEach((f, idx) => {
      console.log(`  ${idx + 1}. [${f.test}]`);
      if (f.error) console.log(`     Error: ${f.error}`);
      if (f.details) console.log(`     Details: ${f.details}`);
    });
  }

  return { grandPassed, grandTotal, grandFailed, allFailures };
}

runAll().then((summary) => {
  process.exit(summary.grandFailed === 0 ? 0 : 1);
});
