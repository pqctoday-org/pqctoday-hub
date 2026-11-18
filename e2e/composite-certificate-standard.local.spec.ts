// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`the composite certificate card identifies and checks supported RFC 10073 profiles at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/playground/hybrid-certs')
    const composite = page.getByRole('region', { name: /^Composite \(ML-DSA/ })
    await expect(composite.getByText(/Generate 8 of the 18 profiles/)).toBeVisible()
    await expect(
      composite.getByRole('link', { name: 'RFC 10073 §6', exact: true })
    ).toHaveAttribute('href', 'https://www.rfc-editor.org/rfc/rfc10073.html#section-6')
    const active = page.getByText('Live HSM Mode Active')
    const enable = page.getByRole('button', { name: 'Enable', exact: true })
    await expect(active.or(enable).first()).toBeVisible({ timeout: 20_000 })
    if (await enable.isVisible()) await enable.click()
    await expect(active).toBeVisible({ timeout: 20_000 })

    for (const profile of [
      { oid: '1.3.6.1.5.5.7.6.39', label: 'MLDSA44-Ed25519-SHA512' },
      { oid: '1.3.6.1.5.5.7.6.45', label: 'MLDSA65-ECDSA-P256-SHA512' },
    ]) {
      await composite.getByLabel(/Composite profile/).selectOption(profile.oid)
      await composite.getByRole('button', { name: 'Generate', exact: true }).click()
      await expect(composite.getByText('Verified — 3/3 checks passed')).toBeVisible({
        timeout: 20_000,
      })
      await expect(
        composite.getByText('RFC 10073 self-signature profile and both components')
      ).toBeVisible()
      await expect(
        composite.getByText(`Composite: ${profile.label}`, { exact: true })
      ).toBeVisible()
      await page.getByRole('button', { name: /Clear results/ }).click()
    }
  })
}
