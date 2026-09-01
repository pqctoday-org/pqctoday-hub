// SPDX-License-Identifier: GPL-3.0-only
/**
 * G9/W4 degradation check: where `crossOriginIsolated` is not true, the
 * runtime must fall back to best-effort mode without erroring — and jsdom
 * IS such a context (no COI headers, no shared-memory guarantee), so this
 * suite exercises the real fallback path, not a mock of it. The preemptive
 * lane is proven separately, live, by the two dev-tab e2e kill tests.
 */
import { describe, it, expect } from 'vitest'
import { getInterruptMode, getPyBootState } from './pyRuntime'

describe('pyRuntime — non-isolated degradation (G9/W4)', () => {
  it('this test environment is genuinely non-isolated (else this suite proves nothing)', () => {
    const iso = (globalThis as { crossOriginIsolated?: boolean }).crossOriginIsolated
    expect(iso === undefined || iso === false).toBe(true)
  })

  it('reports best-effort mode instead of erroring', () => {
    expect(getInterruptMode()).toBe('best-effort')
  })

  it('module import alone stays inert — no boot, no worker', () => {
    expect(getPyBootState()).toBe('idle')
  })
})
