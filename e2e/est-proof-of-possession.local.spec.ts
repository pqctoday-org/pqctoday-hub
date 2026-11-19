// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

const routes = ['/learn/pki-enrollment-protocols?tab=workshop', '/playground/pki-enrollment']
for (const route of routes) {
  for (const width of [1280, 390]) {
    test(`EST sample requires a verifiable signing request at ${width}px on ${route}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(() => {
        localStorage.setItem(
          'pqc-disclaimer-storage',
          JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
        )
      })
      await page.goto(route)
      const learn = route.startsWith('/learn/')
      const generate = page.getByRole('button', { name: 'Generate keypair (OpenSSL WASM)' })
      const algorithm = page.getByRole('button', { name: /^Algorithm:/ })
      const enroll = page.getByRole('button', { name: 'Run simpleenroll (CSR → PKCS#7)' })
      const response = page.getByText(/-----BEGIN PKCS7-----/)
      const next = (number: number) =>
        page
          .getByRole('button', { name: new RegExp(`^Step ${number}\\b`) })
          .first()
          .click()

      await algorithm.click()
      await page.getByRole('option', { name: /^ML-KEM-768/ }).click()
      await generate.click()
      await expect(page.getByText(/Keypair ready: ML-KEM-768/)).toBeVisible({ timeout: 20_000 })
      if (learn) await next(3)
      await enroll.click()
      await expect(page.getByRole('alert')).toContainText(
        'ML-KEM cannot sign the request. No certificate was issued.'
      )
      await expect(page.getByText(/Request PEM — verified PKCS#10 self-signature/)).toHaveCount(0)
      await expect(response).toHaveCount(0)

      if (learn) await next(1)
      await algorithm.click()
      await page.getByRole('option', { name: /^ML-DSA-65/ }).click()
      await generate.click()
      await expect(page.getByText(/Keypair ready: ML-DSA-65/)).toBeVisible()
      if (learn) await next(3)
      await enroll.click()
      await expect(response).toBeVisible({ timeout: 35_000 })
      await expect(page.getByText(/Request PEM — verified PKCS#10 self-signature/)).toBeVisible()
      await expect(
        page.getByText(/Verified CSR and issued certificate contain the same public key/)
      ).toBeVisible()
    })
  }
}
