// SPDX-License-Identifier: GPL-3.0-only
/**
 * Fails the unit run when any test's heap passes a budget: 85% of the V8 heap
 * limit the workers run with (they inherit NODE_OPTIONS from this process, so
 * ~3.5 GB locally under the ~4 GB default, ~5.2 GB in CI under 6 GB),
 * so a test that creeps toward the worker's ~4 GB V8 limit fails by name instead
 * of crashing its worker with SIGABRT and an anonymous "Errors 1" (what happened
 * to LibraryViewRedesign.test.tsx on #826, 2026-10-03).
 *
 * Reads `diagnostic().heap`, which Vitest records per test when `logHeapUsage`
 * is on. It is heap in use at the end of the test, garbage included, so treat
 * it as pressure, not a leak measurement: on a full parallel run the heaviest
 * Library tests reached ~2.9-3.0 GB this way while needing ~2.0 GB alone, which
 * is why the budget is relative to the limit rather than a flat 3 GB.
 * HEAP_BUDGET_MB overrides the budget; HEAP_BUDGET_MB=0 turns the check off.
 */
import { getHeapStatistics } from 'node:v8'
import type { Reporter, TestModule } from 'vitest/node'

const MB = 1024 * 1024

export default class HeapBudgetReporter implements Reporter {
  private readonly budgetMb =
    process.env.HEAP_BUDGET_MB !== undefined
      ? Number(process.env.HEAP_BUDGET_MB)
      : Math.round((0.85 * getHeapStatistics().heap_size_limit) / MB)

  onTestRunEnd(testModules: ReadonlyArray<TestModule>): void {
    if (!this.budgetMb) return
    const over: string[] = []
    for (const mod of testModules) {
      for (const test of mod.children.allTests()) {
        const heap = test.diagnostic()?.heap
        if (heap !== undefined && heap > this.budgetMb * MB) {
          over.push(`  ${Math.round(heap / MB)} MB  ${mod.moduleId} > ${test.fullName}`)
        }
      }
    }
    if (!over.length) return
    console.error(
      `\nHeap budget exceeded: ${over.length} test(s) used more than ${this.budgetMb} MB of heap ` +
        `(85% of the ${Math.round(getHeapStatistics().heap_size_limit / MB)} MB heap limit). ` +
        `Reduce what the test loads, or split the file.\n` +
        over.join('\n') +
        '\n'
    )
    process.exitCode = 1
  }
}
