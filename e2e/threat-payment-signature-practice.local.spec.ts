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
  test(`Finance threat evidence leads to the relevant signature check at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/threats?industry=finance-banking&mode=cards&q=FIN-001')
    const record = page.locator('[data-deeplink-id="FIN-001"]')
    await expect(record).toBeVisible()
    await record
      .getByRole('button', {
        name: width === 390 ? /Project Leap Phase 2 tested/ : 'Open dossier',
      })
      .press('Enter')
    const exercise = page.getByRole('region', {
      name: 'Payment signature evidence and practice',
    })
    await expect(exercise.getByText(/acceptance test environment/)).toBeVisible()
    const source = page
      .getByRole('link', { name: /Bank for International Settlements Project Leap Phase 2/ })
      .first()
    await expect(source).toHaveAttribute(
      'href',
      'https://www.bis.org/publications/project-leap-phase-2-quantum-proofing-payment-systems'
    )
    await exercise
      .getByRole('link', { name: 'Practice verifying both signature components' })
      .press('Enter')
    await expect(page).toHaveURL(/\/playground\/hybrid-sigs/)
    await expect(page.getByText(/softhsmv3 WASM ready.*CKM_ML_DSA/i)).toBeVisible()
    await page.getByRole('button', { name: 'Generate Key Pairs', exact: true }).press('Enter')
    const sign = page.getByRole('button', { name: 'Sign', exact: true })
    await expect(sign).toBeEnabled()
    await sign.press('Enter')
    const verify = page.getByRole('button', { name: 'Verify', exact: true })
    const result = page.getByRole('region', { name: 'Verification results' })
    await expect(verify).toBeEnabled()
    await verify.press('Enter')
    await expect(result.getByText('Both components valid', { exact: true })).toBeVisible()
    await page.getByRole('radio', { name: 'Change only the ML-DSA component' }).check()
    await verify.press('Enter')
    await expect(result.getByText('ML-DSA component check did not pass')).toBeVisible()
    await page.goBack()
    await expect(exercise).toBeVisible()
    await expect(page).toHaveURL(/q=FIN-001/)
  })
}
