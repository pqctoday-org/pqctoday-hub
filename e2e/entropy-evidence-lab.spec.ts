// SPDX-License-Identifier: GPL-3.0-only
/**
 * Entropy Evidence Lab (SP 800-90B) — the real NIST tool in WebAssembly, in a
 * Web Worker, against the PRODUCTION build (vite preview, which sends the
 * CSP / COOP / COEP headers). HEAVY: the KV260 test runs the full non-IID
 * estimator set on 1,000,000 samples and the 1000 × 1000 restart test. Not in
 * the smoke list; runs in the nightly full suite.
 *
 * KAT discriminators (a stub cannot satisfy them):
 *   • the tool's H_assessed for the KV260 idle recording is 2.8196… and the UI
 *     reports "Matches native reference" — every estimator field bit-identical
 *     to the pinned native Linux/arm64 run of the same NIST commit;
 *   • the stuck synthetic source is refused by the tool itself
 *     ("Symbol alphabet consists of 1 symbol").
 *
 * Wall times are attached as annotations (plan W2). Set
 * EVIDENCE_LAB_SCREENSHOT_DIR to also save a screenshot of every screen.
 */
import { test, expect, type Page } from '@playwright/test'

const URL = '/learn/entropy-randomness?tab=workshop&step=5'
const SHOTS = process.env.EVIDENCE_LAB_SCREENSHOT_DIR

async function prepare(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 999 }, version: 1 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
      // Skip the first-visit persona picker (shown full-screen on phones).
      localStorage.setItem(
        'pqc-learning-persona',
        JSON.stringify({
          state: {
            selectedPersona: 'researcher',
            hasSeenPersonaPicker: true,
            selectedRegion: 'global',
            experienceLevel: 'expert',
            viewAccess: 'unlocked',
            suppressSuggestion: true,
            curiousGuideDismissed: true,
          },
          version: 11,
        })
      )
    } catch {
      /* ignore */
    }
    const w = window as unknown as { __csp: string[] }
    w.__csp = []
    document.addEventListener('securitypolicyviolation', (e) =>
      w.__csp.push(`${e.violatedDirective} ${e.blockedURI}`)
    )
  })
}

async function shot(page: Page, name: string) {
  if (!SHOTS) return
  // The app scrolls inside a container, so a full-page shot stops at the
  // viewport: grow the viewport to the lab's height for the capture.
  const vp = page.viewportSize()!
  const h = await page
    .getByTestId('entropy-evidence-lab')
    .evaluate((el) => el.getBoundingClientRect().height)
  await page.setViewportSize({ width: vp.width, height: Math.min(Math.ceil(h) + 600, 8000) })
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true })
  await page.setViewportSize(vp)
}

async function open(page: Page) {
  const res = await page.goto(URL)
  await expect(page.getByTestId('entropy-evidence-lab')).toBeVisible({ timeout: 30_000 })
  return res
}

async function next(page: Page) {
  await page.getByTestId('evl-next').click()
}

async function toRunScreen(page: Page, caseId: string, tag: string) {
  await page.getByTestId(`evl-case-${caseId}`).click()
  await shot(page, `${tag}-1-dataset`)
  await next(page)
  await expect(page.getByText(/matches the manifest|no pinned hash/).first()).toBeVisible({
    timeout: 30_000,
  })
  await shot(page, `${tag}-2-conditions`)
  await next(page)
  await page.getByTestId('evl-track-non-iid').click()
  await shot(page, `${tag}-3-track`)
  await next(page)
}

test.describe('Entropy Evidence Lab', () => {
  test('runs under COOP/COEP + CSP; a stuck source is refused by the tool', async ({ page }) => {
    await prepare(page)
    const res = await open(page)
    const headers = res!.headers()
    expect(headers['cross-origin-embedder-policy']).toBe('require-corp')
    expect(headers['cross-origin-opener-policy']).toBe('same-origin')
    expect(headers['content-security-policy']).toContain("'wasm-unsafe-eval'")
    expect(await page.evaluate(() => crossOriginIsolated)).toBe(true)

    const workers: string[] = []
    page.on('worker', (w) => workers.push(w.url()))

    await toRunScreen(page, 'syn-stuck', 'stuck')
    await page.getByTestId('evl-seq-run').click()
    const result = page.getByTestId('evl-seq-result')
    await expect(result).toBeVisible({ timeout: 60_000 })
    await expect(result).toContainText('Symbol alphabet consists of 1 symbol')
    await expect(result).toContainText('Matches native reference')
    await shot(page, 'stuck-4-run')
    expect(workers.some((u) => /estimator\.worker/.test(u))).toBe(true)
    expect(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)).toEqual([])
  })

  test('KV260 idle: full non-IID run on 1M samples, restart test, conclusion', async ({ page }) => {
    test.setTimeout(420_000)
    await prepare(page)
    await open(page)
    await toRunScreen(page, 'kv260-idle-sequential', 'kv260')

    let t0 = Date.now()
    await page.getByTestId('evl-seq-run').click()
    await expect(page.getByTestId('evl-seq-result')).toBeVisible({ timeout: 240_000 })
    const nonIidMs = Date.now() - t0
    await expect(page.getByTestId('evl-seq-min')).toContainText('2.8196')
    await expect(page.getByTestId('evl-seq-result')).toContainText('Matches native reference')

    t0 = Date.now()
    await page.getByTestId('evl-restart-run').click()
    await expect(page.getByTestId('evl-restart-result')).toBeVisible({ timeout: 240_000 })
    const restartMs = Date.now() - t0
    await expect(page.getByTestId('evl-restart-result')).toContainText('Restart tests passed')
    await expect(page.getByTestId('evl-restart-result')).toContainText('Matches native reference')
    await shot(page, 'kv260-4-run')

    test
      .info()
      .annotations.push(
        { type: 'non-IID 1M wall ms', description: String(nonIidMs) },
        { type: 'restart wall ms', description: String(restartMs) }
      )
    console.log(`[evidence-lab] non-IID 1M: ${nonIidMs} ms; restart: ${restartMs} ms`)

    await next(page)
    await expect(page.getByTestId('evl-rct')).toContainText('C = 9')
    await shot(page, 'kv260-5-cutoffs')
    await next(page)
    await page.getByTestId('evl-verdict-estimate-for-dataset').click()
    await expect(page.getByTestId('evl-allowed-verdict')).toContainText('2.8196')
    await shot(page, 'kv260-6-conclusion')
    expect(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)).toEqual([])
  })

  test('contrast data passes but is not noise-source evidence (375 px wide)', async ({ page }) => {
    test.setTimeout(240_000)
    await page.setViewportSize({ width: 375, height: 800 })
    await prepare(page)
    await open(page)
    await shot(page, 'mobile-1-dataset')
    await toRunScreen(page, 'imx95-contrast-getrandom', 'mobile')
    await page.getByTestId('evl-seq-run').click()
    await expect(page.getByTestId('evl-seq-result')).toBeVisible({ timeout: 180_000 })
    await expect(page.getByTestId('evl-seq-result')).toContainText('Matches native reference')
    await shot(page, 'mobile-4-run')
    await next(page)
    await next(page)
    await page.getByTestId('evl-verdict-estimate-for-dataset').click()
    await expect(page.getByTestId('evl-verdict-check')).toContainText('claims more')
    await expect(page.getByTestId('evl-allowed-verdict')).toContainText(
      'Not evidence about a noise source'
    )
    await shot(page, 'mobile-6-conclusion')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
