/**
 * Stress Test Suite: MongoDB Singleton & Connection Lifecycle
 * Location: tests/stress/mongodb-connection.stress.ts
 *
 * Evaluates:
 * 1. Concurrency burst: 50 simultaneous connectDB() calls
 * 2. Connection caching & reuse latency over 100 sequential calls
 * 3. Read/Write pipeline verification under active connection
 * 4. Clean teardown with disconnectDB()
 * 5. Reconnection lifecycle after intentional shutdown
 * 6. Disconnection recovery resilience (stale promise vs reconnect)
 */

import mongoose from 'mongoose';
import { connectDB, disconnectDB, getActiveMongoUri } from '../../lib/mongodb';

interface TestResult {
  test: string;
  passed: boolean;
  durationMs: number;
  details?: string;
  error?: string;
}

export async function runMongoStressTests(): Promise<{ passed: boolean; results: TestResult[] }> {
  const results: TestResult[] = [];
  console.log('\n======================================================================');
  console.log('  STRESS TEST: MongoDB Connection Singleton & Memory-Server Lifecycle');
  console.log('======================================================================\n');

  // Test 1: Rapid Concurrent Connection Burst (50 concurrent requests)
  {
    const start = Date.now();
    try {
      console.log('[Test 1] Dispatching 50 simultaneous connectDB() calls...');
      const promises = Array.from({ length: 50 }, () => connectDB());
      const connections = await Promise.all(promises);
      const duration = Date.now() - start;

      const firstConn = connections[0];
      const allSame = connections.every((conn) => conn === firstConn);
      const isConnected = firstConn.connection.readyState === 1;
      const uri = getActiveMongoUri();

      if (allSame && isConnected && uri) {
        results.push({
          test: 'T1.1: 50 Concurrent connectDB() calls deduplicate to single connection',
          passed: true,
          durationMs: duration,
          details: `All 50 resolved to identical instance in ${duration}ms; readyState=${firstConn.connection.readyState}; URI=${uri}`,
        });
        console.log(`  ✓ T1.1 Passed: 50 concurrent calls deduplicated cleanly (${duration}ms)`);
      } else {
        results.push({
          test: 'T1.1: 50 Concurrent connectDB() calls deduplicate to single connection',
          passed: false,
          durationMs: duration,
          error: `Deduplication failed: allSame=${allSame}, isConnected=${isConnected}, uri=${uri}`,
        });
        console.log(`  ✗ T1.1 Failed: Deduplication mismatch`);
      }
    } catch (err: unknown) {
      results.push({
        test: 'T1.1: 50 Concurrent connectDB() calls deduplicate to single connection',
        passed: false,
        durationMs: Date.now() - start,
        error: String(err),
      });
      console.log(`  ✗ T1.1 Exception:`, err);
    }
  }

  // Test 2: Connection Reuse & Microsecond-Level Latency
  {
    const start = Date.now();
    try {
      console.log('[Test 2] Benchmarking 100 sequential connectDB() calls against cached singleton...');
      for (let i = 0; i < 100; i++) {
        const conn = await connectDB();
        if (conn.connection.readyState !== 1) {
          throw new Error(`Connection readyState became ${conn.connection.readyState} at iteration ${i}`);
        }
      }
      const duration = Date.now() - start;
      results.push({
        test: 'T1.2: 100 Sequential cached connectDB() calls exhibit negligible overhead',
        passed: true,
        durationMs: duration,
        details: `100 invocations completed in ${duration}ms (~${(duration / 100).toFixed(3)}ms/call)`,
      });
      console.log(`  ✓ T1.2 Passed: 100 cached invocations completed in ${duration}ms`);
    } catch (err: unknown) {
      results.push({
        test: 'T1.2: 100 Sequential cached connectDB() calls exhibit negligible overhead',
        passed: false,
        durationMs: Date.now() - start,
        error: String(err),
      });
      console.log(`  ✗ T1.2 Failed:`, err);
    }
  }

  // Test 3: Document Read/Write Pipeline Verification
  {
    const start = Date.now();
    try {
      console.log('[Test 3] Verifying real collection I/O operations via connection...');
      const conn = await connectDB();
      const testCol = conn.connection.collection('__stress_test_ping__');
      const insertRes = await testCol.insertOne({ ping: 'pong', timestamp: new Date() });
      const findDoc = await testCol.findOne({ _id: insertRes.insertedId });
      await testCol.drop();
      const duration = Date.now() - start;

      const ok = Boolean(findDoc && findDoc.ping === 'pong');
      results.push({
        test: 'T1.3: Real collection write/read/drop roundtrip succeeds on cached connection',
        passed: ok,
        durationMs: duration,
        details: `Inserted and verified doc ${insertRes.insertedId} in ${duration}ms`,
      });
      console.log(`  ${ok ? '✓' : '✗'} T1.3: Real collection I/O roundtrip (ok=${ok})`);
    } catch (err: unknown) {
      results.push({
        test: 'T1.3: Real collection write/read/drop roundtrip succeeds on cached connection',
        passed: false,
        durationMs: Date.now() - start,
        error: String(err),
      });
      console.log(`  ✗ T1.3 Exception:`, err);
    }
  }

  // Test 4: Teardown & Clean Disconnection (disconnectDB)
  {
    const start = Date.now();
    try {
      console.log('[Test 4] Executing clean teardown via disconnectDB()...');
      await disconnectDB();
      const duration = Date.now() - start;

      const cache = (globalThis as unknown as { mongooseCache?: Record<string, unknown> }).mongooseCache;
      const connNull = cache?.conn === null;
      const mongoServerNull = cache?.mongoServer === null;
      const promiseNull = cache?.promise === null;
      const uriNull = cache?.uri === null;
      const readyState = mongoose.connection.readyState; // 0 = disconnected

      const isClean = connNull && mongoServerNull && promiseNull && uriNull && readyState === 0;
      results.push({
        test: 'T1.4: disconnectDB() stops memory-server and clears global cache',
        passed: isClean,
        durationMs: duration,
        details: `connNull=${connNull}, mongoServerNull=${mongoServerNull}, promiseNull=${promiseNull}, uriNull=${uriNull}, readyState=${readyState}`,
      });
      console.log(`  ${isClean ? '✓' : '✗'} T1.4: Disconnect teardown is clean (clean=${isClean})`);
    } catch (err: unknown) {
      results.push({
        test: 'T1.4: disconnectDB() stops memory-server and clears global cache',
        passed: false,
        durationMs: Date.now() - start,
        error: String(err),
      });
      console.log(`  ✗ T1.4 Exception:`, err);
    }
  }

  // Test 5: Reconnection Lifecycle After Teardown
  {
    const start = Date.now();
    try {
      console.log('[Test 5] Testing reconnection lifecycle after complete teardown...');
      const reconnected = await connectDB();
      const duration = Date.now() - start;

      const isReady = reconnected.connection.readyState === 1;
      const newUri = getActiveMongoUri();

      // Test write/read again on new instance
      const testCol = reconnected.connection.collection('__stress_test_ping_post_reconnect__');
      await testCol.insertOne({ cycle: 2 });
      const found = await testCol.findOne({ cycle: 2 });
      await testCol.drop();

      const passed = isReady && Boolean(newUri) && Boolean(found);
      results.push({
        test: 'T1.5: Reconnection after disconnectDB() successfully spawns new working instance',
        passed,
        durationMs: duration,
        details: `readyState=${reconnected.connection.readyState}, newUri=${newUri}, writeVerified=${Boolean(found)}`,
      });
      console.log(`  ${passed ? '✓' : '✗'} T1.5: Reconnection successful (${duration}ms)`);
    } catch (err: unknown) {
      results.push({
        test: 'T1.5: Reconnection after disconnectDB() successfully spawns new working instance',
        passed: false,
        durationMs: Date.now() - start,
        error: String(err),
      });
      console.log(`  ✗ T1.5 Exception:`, err);
    }
  }

  // Test 6: External / Unexpected Disconnect Resilience (Adversarial Check)
  {
    const start = Date.now();
    try {
      console.log('[Test 6] Testing resilience to unexpected disconnect (mongoose.disconnect() without disconnectDB())...');
      // Simulate connection drop or external disconnect
      await mongoose.disconnect();
      const droppedState = mongoose.connection.readyState; // 0 = disconnected
      console.log(`  Simulated disconnect: mongoose readyState=${droppedState}`);

      // Now call connectDB() again: will it detect the dropped connection and reconnect?
      const conn = await connectDB();
      const recoveredState = conn.connection.readyState;
      const duration = Date.now() - start;

      if (recoveredState === 1) {
        results.push({
          test: 'T1.6: connectDB() auto-reconnects if connection unexpectedly dropped',
          passed: true,
          durationMs: duration,
          details: `Successfully recovered from state 0 to state 1`,
        });
        console.log(`  ✓ T1.6 Passed: Auto-reconnect succeeded (state=${recoveredState})`);
      } else {
        results.push({
          test: 'T1.6: connectDB() auto-reconnects if connection unexpectedly dropped',
          passed: false,
          durationMs: duration,
          error: `Stale promise/connection returned: expected readyState=1 but got readyState=${recoveredState}. Cached promise was not invalidated on disconnect!`,
        });
        console.log(`  ✗ T1.6 VULNERABILITY CONFIRMED: connectDB() returned dead connection with readyState=${recoveredState}`);
      }
    } catch (err: unknown) {
      results.push({
        test: 'T1.6: connectDB() auto-reconnects if connection unexpectedly dropped',
        passed: false,
        durationMs: Date.now() - start,
        error: String(err),
      });
      console.log(`  ✗ T1.6 Exception:`, err);
    }
  }

  // Final cleanup
  await disconnectDB();

  const allPassed = results.every((r) => r.passed);
  console.log('\n--- MongoDB Connection Stress Summary ---');
  console.log(`Total: ${results.length} | Passed: ${results.filter((r) => r.passed).length} | Failed: ${results.filter((r) => !r.passed).length}`);
  return { passed: allPassed, results };
}

if (process.argv[1]?.includes('mongodb-connection.stress')) {
  runMongoStressTests().then((res) => {
    process.exit(res.passed ? 0 : 1);
  });
}
