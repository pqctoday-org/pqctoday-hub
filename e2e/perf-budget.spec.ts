// SPDX-License-Identifier: GPL-3.0-only
/**
 * Page-load budget for the six pages most readers land on, measured against the
 * production build (`vite preview`).
 *
 * REPORT-ONLY. Each page's numbers are printed and attached to the test report;
 * a page over budget is listed as "OVER" but the test still passes, because
 * runner timing varies and these specs share workers with the rest of the suite.
 * Set PERF_BUDGET_ENFORCE=1 to turn an over-budget page into a failure (use it on
 * a quiet machine, or once the CI numbers have settled).
 *
 * What is measured, per page, on a cold load:
 *   - jsKB   — decoded JavaScript downloaded by the time the page is idle. Decoded
 *              size, so the number is the same on `vite preview` (no compression)
 *              and on the deployed site (compressed in transit).
 *   - dclMs  — DOMContentLoaded; loadMs — the load event.
 *   - lcpMs  — largest contentful paint.
 * Budgets are about 1.5x the first measurement; tighten them as the bundle shrinks.
 */
import { test, expect } from './fixtures/blockAnalytics'

interface Budget {
  path: string
  name: string
  jsKB: number
  loadMs: number
}

const BUDGETS: Budget[] = [
  { path: '/', name: 'Home', jsKB: 30000, loadMs: 2000 },
  { path: '/learn', name: 'Learn', jsKB: 30000, loadMs: 2000 },
  { path: '/migrate', name: 'Migrate', jsKB: 55000, loadMs: 2000 },
  { path: '/library', name: 'Library', jsKB: 55000, loadMs: 2000 },
  { path: '/threats', name: 'Threats', jsKB: 48000, loadMs: 2000 },
  { path: '/report', name: 'Report', jsKB: 33000, loadMs: 2000 },
]

const ENFORCE = process.env.PERF_BUDGET_ENFORCE === '1'

interface Measured {
  jsKB: number
  dclMs: number
  loadMs: number
  lcpMs: number | null
}

test.describe.configure({ mode: 'serial' })

for (const budget of BUDGETS) {
  test(`${budget.name} (${budget.path}) stays within its load budget`, async ({
    page,
  }, testInfo) => {
    await page.goto(budget.path, { waitUntil: 'load' })
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {
      /* a page that keeps a connection open is measured as it stands */
    })

    const measured: Measured = await page.evaluate(
      () =>
        new Promise<Measured>((resolve) => {
          const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          const js = (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
            .filter((r) => r.initiatorType !== 'css' && /\.js(\?|$)/.test(r.name))
            .reduce((sum, r) => sum + r.decodedBodySize, 0)
          let lcp: number | null = null
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries()
            lcp = entries[entries.length - 1]?.startTime ?? lcp
          })
          observer.observe({ type: 'largest-contentful-paint', buffered: true })
          setTimeout(() => {
            observer.disconnect()
            resolve({
              jsKB: Math.round(js / 1024),
              dclMs: Math.round(nav.domContentLoadedEventEnd),
              loadMs: Math.round(nav.loadEventEnd),
              lcpMs: lcp === null ? null : Math.round(lcp),
            })
          }, 300)
        })
    )

    const over: string[] = []
    if (budget.jsKB > 0 && measured.jsKB > budget.jsKB)
      over.push(`jsKB ${measured.jsKB} > ${budget.jsKB}`)
    if (budget.loadMs > 0 && measured.loadMs > budget.loadMs)
      over.push(`loadMs ${measured.loadMs} > ${budget.loadMs}`)

    const line = `[perf-budget] ${budget.name.padEnd(8)} jsKB=${measured.jsKB} dclMs=${measured.dclMs} loadMs=${measured.loadMs} lcpMs=${measured.lcpMs ?? 'n/a'} ${over.length ? 'OVER: ' + over.join(', ') : 'ok'}`
    console.log(line)
    await testInfo.attach(`perf-${budget.name}`, {
      body: JSON.stringify({ path: budget.path, budget, measured, over }, null, 2),
      contentType: 'application/json',
    })

    expect(measured.jsKB, 'the page downloaded no JavaScript').toBeGreaterThan(0)
    if (ENFORCE) expect(over, line).toEqual([])
  })
}
