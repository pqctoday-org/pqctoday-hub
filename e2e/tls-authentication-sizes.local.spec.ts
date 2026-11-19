// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

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
  test(`the TLS workshop sizes the actual RSA public key encoding at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/learn/tls-basics?tab=workshop')
    const references = page.getByText('Signature and public key sizes', { exact: true })
    await expect(references).toHaveCount(2)
    for (const reference of await references.all()) {
      await reference.click()
      const table = reference.locator('..').getByRole('table', {
        name: 'TLS signature and public key encodings',
      })
      await expect(table.getByRole('row', { name: /^rsa_pss_rsae_sha256/ })).toContainText(
        '256 B modulus'
      )
      await expect(table.getByRole('row', { name: /^ecdsa_secp256r1_sha256/ })).toContainText(
        '65 B uncompressed point'
      )
      await expect(table.getByRole('row', { name: /^mldsa65/ })).toContainText('1,952 B raw key')
    }

    const measure = page.locator('details').filter({
      has: page.getByText('Measure a public key buffer', { exact: true }),
    })
    await measure.getByText('Measure a public key buffer').click()
    await measure.getByRole('button', { name: 'Generate and measure RSA-2048' }).press('Space')
    const result = measure.getByRole('status')
    await expect(result).toContainText('Measured DER SPKI: 294 bytes.')
    await expect(result).toContainText('needs 38 more bytes')
    const budget = measure.getByRole('spinbutton', { name: 'Buffer capacity (bytes)' })
    await budget.fill('294')
    await expect(result).toContainText('fits with 0 bytes to spare')
    await budget.fill('293')
    await expect(result).toContainText('needs 1 more byte')
  })

  for (const [module, correction] of [
    ['secrets-management-pqc', /Other confidential data in the same captured session/],
    ['email-signing', /each handshake that performs an asymmetric key exchange/],
    ['automotive-pqc', /RFC 9846 Section 5.1/],
    ['iot-pqc', /trust anchor distributed separately/],
  ] as const) {
    test(`${module} shows the current TLS scope at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`/learn/${module}?tab=learn`)
      if (module === 'secrets-management-pqc') {
        await page
          .getByRole('button', { name: 'HNDL Risk for Secrets in Transit and at Rest' })
          .click()
      }
      await expect(page.getByText(correction)).toBeVisible()
    })
  }
}
