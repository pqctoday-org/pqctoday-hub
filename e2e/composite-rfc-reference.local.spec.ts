// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

const source = 'https://www.rfc-editor.org/rfc/rfc10073.html'
const libraryRef = 'RFC-10073-Composite-ML-DSA-for-Use-in-X-509-Public-Key-Infra'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
  })
})

for (const width of [1280, 390]) {
  test(`RFC 10073 reference distinguishes maximum and fixed sizes at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    for (const profile of [
      {
        id: 'id-mldsa44-ecdsa-p256-sha256',
        name: 'id-MLDSA44-ECDSA-P256-SHA256',
        sizes: ['1,377 B', '83 B', 'Up to 2,492 B'],
      },
      {
        id: 'id-mldsa44-ed25519-sha512',
        name: 'id-MLDSA44-Ed25519-SHA512',
        sizes: ['1,344 B', '64 B', '2,484 B'],
      },
      {
        id: 'id-mldsa44-rsa2048-pss-sha256',
        name: 'id-MLDSA44-RSA2048-PSS-SHA256',
        sizes: ['Up to 1,582 B', 'Up to 1,226 B', '2,676 B'],
      },
    ]) {
      await page.goto(`/algorithms?mobileUx=1&tab=detailed&algo=${profile.id}`)
      const details = page.getByRole('dialog', { name: profile.name, exact: true })
      await expect(
        details.getByRole('link', { name: 'Status source', exact: true })
      ).toHaveAttribute('href', source)
      for (const size of profile.sizes) {
        await expect(details.getByText(size, { exact: true })).toBeVisible()
      }
    }
  })
}

test('Industry Use Cases point from the composite signature to the published Library source', async ({
  page,
}) => {
  await page.goto('/algorithms?tab=landscape&usecase=it-composite-certs')
  await expect(page.getByText(/Both components must verify/)).toBeVisible()
  await expect(page.getByText(/TLS 1.3 authentication uses its own negotiation/)).toBeVisible()
  const link = page.getByRole('link', { name: 'RFC 10073', exact: true }).first()
  await expect(link).toHaveAttribute('href', `/library?ref=${libraryRef}`)
  await link.click()
  await expect(page).toHaveURL(new RegExp(libraryRef))
  await expect(page.locator(`a[href="${source}"]`).first()).toBeVisible()
})
