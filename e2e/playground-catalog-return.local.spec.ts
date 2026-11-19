// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

const cases = [
  ['hybrid-certs', 'hybrid certificates', 'Hybrid Certificates'],
  ['tpm-playground', 'TPM 2.0 PQC', 'TPM 2.0 PQC Playground'],
  ['slh-dsa', 'SLH-DSA Sign', 'SLH-DSA Sign & Verify'],
  ['lms-hss', 'stateful hash signatures', 'Stateful Hash Signatures'],
  ['hybrid-encrypt', 'hybrid kem + ecdh', 'Hybrid KEM + ECDH'],
  ['envelope-encrypt', 'envelope encryption', 'Envelope Encryption'],
  ['suci-flow', '5G SUCI Construction', '5G SUCI Construction'],
  ['rng-demo', 'random generation', 'Random Generation'],
  ['drbg-demo', 'SP 800-90A DRBG', 'SP 800-90A DRBG'],
  ['pki-workshop', 'PKI Workshop', 'PKI Workshop'],
  ['merkle-proof', 'merkle tree workshop', 'Merkle Tree Workshop'],
  ['digital-id', 'EUDI Wallet Architecture', 'EUDI Wallet Architecture'],
] as const

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
  const applicableCases =
    width === 390
      ? [...cases, ['cacp-kmip', 'KMIP Control Plane', 'KMIP Control Plane'] as const]
      : cases
  for (const [id, query, title] of applicableCases) {
    test(`${title} preserves its catalogue query and keyboard position at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/playground?runs=0')
      const search = page.getByRole('searchbox', { name: 'Search tools' })
      await search.fill(query)
      const card = page.locator(`[data-playground-result="${id}"]`)
      const opener =
        width === 390
          ? card.getByRole('button', {
              name: new RegExp(title.replace(/[.*+?^$${}()|[\]\\]/g, '\\$&')),
            })
          : card.getByRole('link', { name: title, exact: true })
      await expect(opener).toBeVisible()
      await opener.press('Enter')
      if (width === 390) {
        await page.getByRole('dialog').getByRole('link', { name: 'Open tool' }).press('Enter')
      }
      const expectedTool = id === 'cacp-kmip' ? 'cacp' : id
      await expect(page).toHaveURL(new RegExp(`/playground/${expectedTool}$`))
      await page.reload()
      await page
        .getByRole(id === 'cacp-kmip' ? 'link' : 'button', { name: 'Back to tool results' })
        .press('Enter')
      await expect(search).toHaveValue(query)
      await expect(opener).toBeFocused()
      const restored = new URL(page.url()).searchParams
      expect(restored.get('q')).toBe(query)
      expect(restored.get('runs')).toBe('0')
      await search.fill('impossible catalogue phrase 42')
      await expect(card).toHaveCount(0)
      await search.fill(query)
      await expect(card).toBeVisible()
    })
  }
}
