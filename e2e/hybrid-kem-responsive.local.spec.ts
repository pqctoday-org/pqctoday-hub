// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

async function expectNoSeriousAxeViolations(page: import('@playwright/test').Page) {
  await page.waitForTimeout(300)
  await injectAxe(page)
  const violations = await getViolations(page, 'main', {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  })
  expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
}

for (const width of [1280, 390]) {
  test(`hybrid KEM/ECDH exercise completes at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem(
        'pqc-hsm-mode-storage',
        JSON.stringify({ state: { liveHsmEnabled: true }, version: 1 })
      )
    })
    await page.goto('/playground/hybrid-encrypt')
    await expect(
      page.getByRole('heading', { name: 'Hybrid Key Establishment (X25519 + ML-KEM-768)' })
    ).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Live HSM Mode Active')).toBeVisible({ timeout: 60_000 })
    await expectNoSeriousAxeViolations(page)

    const actions = [
      'Generate Alice Keypair',
      'Generate Bob Keypair',
      'Compute ECDH',
      'Generate ML-KEM Keypair',
      'Encapsulate',
      'Decapsulate & Combine',
    ]
    for (const [index, action] of actions.entries()) {
      const actionButton = page.getByRole('button', { name: action, exact: true })
      if (index === 0) {
        await actionButton.focus()
        await page.keyboard.press('Space')
      } else {
        await actionButton.click()
      }
      await expect(
        page.getByText(/C_GenerateKeyPair|C_DeriveKey|C_EncapsulateKey|C_DecapsulateKey/).first()
      ).toBeVisible({
        timeout: 30_000,
      })
      if (index < actions.length - 1) {
        await page.getByRole('button', { name: 'Next Step' }).click()
      }
    }

    await expect(page.getByText(/KEM match: ✓ Verified/)).toBeVisible()
    await expect(page.getByText('32-byte hybrid session key:', { exact: true })).toBeVisible()
    await expectNoSeriousAxeViolations(page)
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1)
  })
}
