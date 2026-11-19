// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

const routes = ['/learn/tls-basics?tab=workshop', '/playground/tls-simulator']
for (const route of routes) {
  for (const width of [1280, 390]) {
    test(`TLS key exchange and peer trust are independent at ${width}px on ${route}`, async ({
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
      for (const peer of ['Client', 'Server']) {
        const identity = page.getByRole('button', { name: `${peer} Identity:`, exact: true })
        await identity.click()
        const options = page.getByRole('listbox', { name: `${peer} Identity:`, exact: true })
        await expect(options.getByRole('option', { name: 'Default (ML-DSA-87)' })).toBeVisible()
        await expect(options.getByRole('option', { name: /composite/i })).toHaveCount(0)
        await page.keyboard.press('Escape')
      }
      await expect(
        page.getByRole('link', { name: 'Hybrid Certificates Playground' })
      ).toHaveAttribute('href', '/playground/hybrid-certs')

      const success = page
        .locator('p')
        .filter({ hasText: 'Your TLS 1.3 handshake completed successfully.' })
      const failure = page.getByText('The TLS handshake failed.', { exact: true })
      const run = page.getByRole('button', { name: /^(Start Full Interaction|Run Again)$/ })
      await run.click()
      await expect(success).toContainText(/X25519MLKEM768 key exchange/i, { timeout: 25_000 })
      await expect(success).toContainText(/authenticated with rsa_pss_rsae_sha256/i)

      const hybridGroups = page.getByRole('button', { name: /^X25519MLKEM768/ })
      await expect(hybridGroups).toHaveCount(2)
      for (const group of await hybridGroups.all()) {
        await expect(group).toHaveAttribute('aria-pressed', 'true')
        await group.focus()
        await group.press('Space')
        await expect(group).toBeFocused()
        await expect(group).toHaveAttribute('aria-pressed', 'false')
      }
      await run.click()
      await expect(success).toContainText(/using X25519 key exchange/i)
      await expect(success).toContainText(/authenticated with rsa_pss_rsae_sha256/i)

      const trust = page.getByRole('textbox', { name: 'Client trusted sample CA' })
      const originalCa = await trust.inputValue()
      expect(originalCa).toContain('BEGIN CERTIFICATE')
      const retainedCa = originalCa.trimEnd() + '\n\n'
      await trust.fill(retainedCa)
      await page.getByRole('button', { name: 'Server Identity:', exact: true }).click()
      await page.getByRole('option', { name: 'Default (ML-DSA-44)', exact: true }).click()
      await expect(trust).toHaveValue(retainedCa)
      await run.click()
      await expect(failure).toBeVisible()
      await expect(page.getByText(/Certificate verification error — the server/)).toBeVisible()
      await expect(success).toHaveCount(0)

      await page
        .getByRole('button', { name: 'Use matching sample CA', exact: true })
        .first()
        .click()
      await expect(trust).not.toHaveValue(retainedCa)
      await run.click()
      await expect(success).toContainText(/using X25519 key exchange/i)
      await expect(success).toContainText('authenticated with ML-DSA-44')
      await expect(failure).toHaveCount(0)
    })
  }
}
