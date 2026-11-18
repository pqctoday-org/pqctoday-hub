// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const fixture of [
  { name: 'Playground, pure', route: '/playground/suci-flow?profile=C&pqcMode=pure' },
  { name: 'Learn, hybrid', route: '/learn/5g-security?tab=workshop&profile=C&pqcMode=hybrid' },
]) {
  test(`${fixture.name}: Profile C compares matching and unrelated receiver keys on the same envelope`, async ({
    page,
  }) => {
    test.setTimeout(120_000)
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
    })
    await page.goto(fixture.route)
    if (fixture.name.startsWith('Learn')) {
      await page.getByRole('tab', { name: 'Workshop', exact: true }).click()
    }
    await expect(page.getByText(/Running in PKCS#11/)).toBeVisible({ timeout: 45_000 })
    const next = page.getByRole('button', { name: 'Next Step', exact: true })
    const decrypt = page.getByRole('button', { name: 'Decrypt PSC1 Envelope at SIDF' })
    for (let step = 0; step < 15; step++) {
      if (await decrypt.isVisible()) break
      await page.getByRole('button', { name: 'Execute Step', exact: true }).click()
      await expect(next).toBeEnabled({ timeout: 15_000 })
      await next.click()
    }
    await decrypt.click()
    await expect(page.getByText(/\[SUCCESS\] SUPI Recovered: 310260123456789/)).toBeVisible({
      timeout: 15_000,
    })
    await page
      .getByRole('button', { name: /OpenSSL/i, exact: false })
      .filter({ hasText: /^OpenSSL/ })
      .last()
      .click()
    await expect(page.getByText(/Wrong-key control/)).toBeVisible()
    await expect(page.getByText(/Result: \[FAIL\] MAC invalid/)).toBeVisible()
    await expect(page.getByText(/Decrypting MSIN.*ABORTED/)).toBeVisible()
    await expect(page.getByText(/\[SUCCESS\] SUPI Recovered/)).toHaveCount(0)
    await page
      .getByRole('button', { name: /^SoftHSM3/ })
      .last()
      .click()
    await expect(page.getByText(/\[SUCCESS\] SUPI Recovered: 310260123456789/)).toBeVisible()
  })
}
