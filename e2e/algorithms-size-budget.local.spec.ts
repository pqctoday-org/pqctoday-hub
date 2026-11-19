// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

const cases = [
  ['ml-kem-768', 'ML-KEM-768', 'ciphertext', 1088, 203],
  ['ml-dsa-65', 'ML-DSA-65', 'signature', 3309, 204],
  ['slh-dsa-sha2-128s', 'SLH-DSA-SHA2-128s', 'signature', 7856, 205],
] as const

for (const width of [1280, 390]) {
  test(`algorithm details check the raw receiver budget against the source at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    for (const [id, name, field, byteCount, fips] of cases) {
      await page.goto(`/algorithms?algo=${id}`)
      const detail = page.getByRole('dialog', { name, exact: true })
      const input = detail.getByRole('textbox', { name: 'Receiving buffer (bytes)' })
      const status = detail.getByRole('status')
      await expect(
        detail.getByRole('link', { name: new RegExp(`FIPS ${fips} Table`) })
      ).toHaveAttribute('href', `https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.${fips}.pdf`)
      await input.fill(String(byteCount - 1))
      await expect(status).toContainText(`raw ${field} exceeds the buffer by 1`)
      await input.fill(String(byteCount))
      await expect(status).toContainText(`raw ${field} fits. 0 bytes remain.`)
      await input.fill('8 KB')
      await expect(status).toContainText('Enter a whole number of bytes.')
      await input.fill(String(byteCount + 1))
      await expect(status).toContainText('1 byte remains.')
    }
  })
}
