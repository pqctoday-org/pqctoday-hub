// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const { route, open, note } of [
  {
    route: 'hsm-pqc',
    open: 'PKCS#11 v3.2 PQC Mechanisms',
    note: /RSA public-key value is the modulus width/,
  },
  {
    route: 'kms-pqc',
    note: /Budget certificate and network sizes using the actual encodings/,
  },
  {
    route: 'secure-boot-pqc',
    open: 'ML-DSA-65 for Firmware Signature Migration',
    note: /signature entries are DER upper bounds/,
  },
]) {
  test(`${route} exposes the encoding scope alongside key sizes`, async ({ page }) => {
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
    await page.goto(`/learn/${route}?tab=learn`)
    if (open) await page.getByRole('button', { name: open, exact: true }).click()
    await expect(page.getByText(note)).toBeVisible({ timeout: 20_000 })
  })
}
