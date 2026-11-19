// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

test('API Security & JWT distinguishes future signature forgery from HNDL', async ({ page }) => {
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
  await page.goto('/learn/api-security-jwt')
  await expect(
    page.getByText(/Public-key-signed JWTs such as RS256 and ES256 face a future forgery risk/)
  ).toBeVisible()
  await expect(
    page.getByText(/not a harvest-now-decrypt-later threat or a claim that every existing token/)
  ).toBeVisible()
  await expect(page.getByText(/HMAC-based HS256 has a different quantum risk/)).toBeVisible()
})
