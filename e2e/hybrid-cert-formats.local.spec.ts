// SPDX-License-Identifier: GPL-3.0-only
/**
 * Hybrid Certificate Formats — final browser smoke (local tier, never in CI).
 *
 * Runs against the production preview build. Drives the real playground:
 * Generate All three times with a Clear in between, a mid-run cancel,
 * navigate-away-and-back, and the Advanced and Historical cards on request.
 * After every Clear the page's diagnostics hook must report zero HSM objects
 * left in the session — the leak check the 2026-09-30 refresh plan requires.
 *
 *   PLAYWRIGHT_DEV_PORT=<free port> npx playwright test --project=local \
 *     e2e/hybrid-cert-formats.local.spec.ts
 */
import { test, expect, type Page } from '@playwright/test'

const CURRENT = [
  'Pure PQC (ML-DSA-65)',
  'Pure PQC (SLH-DSA-128s)',
  'Composite (',
  'Alt-Sig / Catalyst (ECDSA + ML-DSA)',
  'Related Certificates (RFC 9763)',
  'Pure PQC KEM (ML-KEM-768)',
  'Composite KEM (ML-KEM-768 + X25519)',
]

interface Diag {
  hsmObjects: number | null
  trackedHandles: number
  results: string[]
}

async function diag(page: Page): Promise<Diag> {
  return page.evaluate(() =>
    (window as unknown as { __hybridCertDiag: () => Diag }).__hybridCertDiag()
  )
}

async function verifiedCount(page: Page): Promise<number> {
  return page.getByText(/^Verified — \d+\/\d+ checks passed$/).count()
}

test.describe('hybrid certificate formats — browser smoke', () => {
  test.setTimeout(240_000)

  test('Generate All ×3, cancel, navigate, advanced + historical — no leaked HSM objects', async ({
    page,
  }) => {
    const consoleErrors: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text())
    })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0', isFirstVisit: false }, version: 3 })
      )
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem('pqc-hybrid-cert-diag', '1')
    })

    await page.goto('/playground/hybrid-certs')
    await page.getByRole('button', { name: 'Enable', exact: true }).first().click()
    await expect(page.getByText('Live HSM Mode Active')).toBeVisible({ timeout: 60_000 })
    const baseline = (await diag(page)).hsmObjects
    expect(baseline).not.toBeNull()

    const generateAll = page.getByRole('button', { name: /Generate All Current Formats/ })
    const clear = page.getByRole('button', { name: /Clear results/ })

    for (let round = 1; round <= 3; round++) {
      await generateAll.click()
      await expect(generateAll).toBeEnabled({ timeout: 120_000 })
      // Every current format verified; none failed.
      await expect.poll(() => verifiedCount(page), { timeout: 30_000 }).toBe(CURRENT.length)
      await expect(page.getByText(/checks failed$/)).toHaveCount(0)
      // Each current card is present by title.
      for (const title of CURRENT) {
        await expect(
          page
            .getByRole('heading', { name: new RegExp(`^${title.replace(/[()+]/g, '\\$&')}`) })
            .first()
        ).toBeVisible()
      }
      expect((await diag(page)).trackedHandles).toBeGreaterThan(0)
      await clear.click()
      await expect.poll(async () => (await diag(page)).hsmObjects).toBe(baseline)
      expect((await diag(page)).trackedHandles).toBe(0)
    }

    // Cancel mid-run: once the ML-KEM card starts, cancel; the run stops there.
    await generateAll.click()
    await expect(
      page.getByText(/Workshop CA key \+ certificate|ML-KEM key generation/).first()
    ).toBeVisible({ timeout: 60_000 })
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(generateAll).toBeEnabled({ timeout: 60_000 })
    await expect(page.getByText(/^Cancelled during: /)).toHaveCount(1)
    await clear.click()
    await expect.poll(async () => (await diag(page)).hsmObjects).toBe(baseline)

    // Navigate away and back: unmount destroys keys; the page comes back clean.
    await generateAll.click()
    await expect(generateAll).toBeEnabled({ timeout: 120_000 })
    await page.goto('/learn/hybrid-crypto')
    await page.goto('/playground/hybrid-certs')
    await page
      .getByRole('button', { name: 'Enable', exact: true })
      .first()
      .click()
      .catch(() => undefined)
    await expect(page.getByText('Live HSM Mode Active')).toBeVisible({ timeout: 60_000 })
    expect((await diag(page)).trackedHandles).toBe(0)
    expect((await diag(page)).results).toEqual([])

    // Advanced and Historical cards generate only on request and verify.
    for (const section of ['Advanced examples', 'Historical designs']) {
      const region = page.getByRole('region', { name: section })
      const buttons = region.getByRole('button', { name: 'Generate', exact: true })
      const n = await buttons.count()
      expect(n, `${section}: generate buttons`).toBeGreaterThan(0)
      for (let i = 0; i < n; i++) {
        await region.getByRole('button', { name: 'Generate', exact: true }).first().click()
        await expect(region.getByRole('button', { name: 'Generate', exact: true })).toHaveCount(
          n - i - 1,
          { timeout: 60_000 }
        )
      }
      await expect(region.getByText(/^Verified — \d+\/\d+ checks passed$/)).toHaveCount(n, {
        timeout: 60_000,
      })
    }
    await clear.click()
    await expect.poll(async () => (await diag(page)).hsmObjects).toBe(baseline)

    expect(consoleErrors, consoleErrors.join('\n')).toEqual([])
  })
})
