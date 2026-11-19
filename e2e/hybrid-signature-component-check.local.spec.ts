// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

test.beforeEach(async ({ page }) => {
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
})

for (const width of [1280, 390]) {
  for (const route of [
    '/playground/hybrid-sigs',
    '/learn/hybrid-crypto?tab=workshop&step=3&sv=2',
  ]) {
    test(`both hybrid components are required at ${width}px on ${route}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(route)
      await expect(page.getByText(/softhsmv3 WASM ready.*CKM_ML_DSA/i)).toBeVisible()
      const panel = page.getByRole('region', { name: 'Verification results' })
      const verify = page.getByRole('button', { name: 'Verify', exact: true })
      for (const construction of ['Concatenation', 'Nesting']) {
        await page
          .getByRole('button', { name: construction, exact: true })
          .and(page.locator('button:not([aria-pressed])'))
          .click()
        await page.getByRole('button', { name: 'Generate Key Pairs', exact: true }).press('Enter')
        await expect(page.getByRole('button', { name: 'Sign', exact: true })).toBeEnabled()
        await page.getByRole('button', { name: 'Sign', exact: true }).press('Enter')
        await expect(verify).toBeEnabled()
        await verify.press('Enter')
        await expect(panel.getByText('Both components valid', { exact: true })).toBeVisible()

        const verifyChoice = async (label: string) => {
          await page.getByRole('radio', { name: label, exact: true }).check()
          await expect(panel).toHaveCount(0)
          await verify.press('Enter')
        }
        await verifyChoice('Change only the EC component')
        await expect(panel.getByText('Failed', { exact: true })).toBeVisible()
        await expect(panel.getByText('EC component check did not pass')).toBeVisible()
        await expect(
          panel.getByText(
            construction === 'Nesting'
              ? 'ML-DSA component check did not pass'
              : 'ML-DSA component check passed'
          )
        ).toBeVisible()

        await verifyChoice('Change only the ML-DSA component')
        await expect(panel.getByText('Failed', { exact: true })).toBeVisible()
        await expect(panel.getByText('EC component check passed')).toBeVisible()
        await expect(panel.getByText('ML-DSA component check did not pass')).toBeVisible()

        await verifyChoice('Original components')
        await expect(panel.getByText('Both components valid', { exact: true })).toBeVisible()
      }
    })
  }
}
