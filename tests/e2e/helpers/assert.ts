/**
 * Robust assertion library and test execution accumulator for Brother's Photography E2E tests.
 */

export interface AssertionStats {
  passed: number;
  failed: number;
  total: number;
  errors: Array<{ testName: string; message: string; diff?: string }>;
}

export class TestHarness {
  public passed = 0;
  public failed = 0;
  public errors: Array<{ testName: string; message: string; diff?: string }> = [];
  public currentTest = 'General';

  public setTest(name: string) {
    this.currentTest = name;
  }

  public assert(condition: boolean, message: string, context?: unknown) {
    if (condition) {
      this.passed++;
      console.log(`    \x1b[32m✓\x1b[0m ${message}`);
    } else {
      this.failed++;
      const detail = context ? `\n      Context: ${JSON.stringify(context, null, 2)}` : '';
      const fullMsg = `${message}${detail}`;
      console.log(`    \x1b[31m✗\x1b[0m ${message}`);
      if (context) {
        console.log(`      \x1b[33mContext:\x1b[0m`, context);
      }
      this.errors.push({ testName: this.currentTest, message: fullMsg });
    }
  }

  public assertEqual<T>(actual: T, expected: T, message: string) {
    const passed = actual === expected;
    this.assert(
      passed,
      `${message} (expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)})`,
      passed ? undefined : { expected, actual }
    );
  }

  public assertDeepEqual(actual: unknown, expected: unknown, message: string) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    const passed = actualStr === expectedStr;
    this.assert(
      passed,
      `${message} (deep comparison)`,
      passed ? undefined : { expected, actual }
    );
  }

  public assertTrue(condition: unknown, message: string) {
    this.assert(Boolean(condition), `${message} (expected truthy, got: ${condition})`);
  }

  public assertFalse(condition: unknown, message: string) {
    this.assert(!condition, `${message} (expected falsy, got: ${condition})`);
  }

  public assertStatus(res: { status: number }, expectedStatus: number, message: string) {
    this.assertEqual(
      res.status,
      expectedStatus,
      `${message} -> HTTP Status Code`
    );
  }

  public assertContains(haystack: string | unknown[], needle: unknown, message: string) {
    const passed = typeof haystack === 'string'
      ? haystack.includes(String(needle))
      : Array.isArray(haystack) && haystack.includes(needle);
    this.assert(
      passed,
      `${message} (expected to contain "${needle}")`,
      passed ? undefined : { haystack, needle }
    );
  }

  public assertMatches(str: string, pattern: RegExp, message: string) {
    const passed = pattern.test(str);
    this.assert(
      passed,
      `${message} (expected to match pattern ${pattern})`,
      passed ? undefined : { str, pattern: pattern.toString() }
    );
  }

  public assertValidObjectId(id: unknown, message: string) {
    const passed = typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
    this.assert(
      passed,
      `${message} (valid 24-char hex ObjectId: "${id}")`
    );
  }

  public getSummary(): { passed: number; failed: number; total: number; success: boolean } {
    return {
      passed: this.passed,
      failed: this.failed,
      total: this.passed + this.failed,
      success: this.failed === 0
    };
  }
}
