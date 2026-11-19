// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

async function seed(page: import('@playwright/test').Page) {
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
    localStorage.setItem('pqc-tour-completed', 'true')
    localStorage.setItem(
      'pqc-hsm-mode-storage',
      JSON.stringify({ state: { liveHsmEnabled: true }, version: 1 })
    )
  })
}

async function expectNoSeriousAxeViolations(page: import('@playwright/test').Page) {
  await page.waitForTimeout(300)
  await injectAxe(page)
  const violations = await getViolations(page, 'main', {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  })
  expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
}

for (const width of [1280, 390]) {
  test(`SLH-DSA real sign/verify and tamper recovery at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000)
    await seed(page)
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/playground/slh-dsa')
    await expect(page.getByRole('heading', { name: 'SLH-DSA Live Demo (FIPS 205)' })).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByText('Live HSM Mode Active')).toBeVisible({ timeout: 60_000 })
    await expectNoSeriousAxeViolations(page)

    const message = page.getByRole('textbox', { name: 'Message to sign' })
    await message.fill('Firmware manifest approved by PQC Today')
    await page.getByRole('button', { name: '1. Generate Key Pair' }).click()
    await expect(page.getByText(/32 bytes — extracted via C_GetAttributeValue/)).toBeVisible({
      timeout: 30_000,
    })
    await page.getByRole('button', { name: '2. Sign Message' }).click()
    await expect(page.getByText('7,856 B (7.7 KB)', { exact: true }).last()).toBeVisible({
      timeout: 30_000,
    })

    const verify = page.getByRole('button', { name: '3. Verify Signature' })
    await verify.focus()
    await page.keyboard.press('Space')
    await expect(page.getByText('Signature Valid', { exact: true })).toBeVisible({
      timeout: 30_000,
    })

    await message.fill('Firmware manifest changed after signing')
    await expect(page.getByText('Signature Valid', { exact: true })).toHaveCount(0)
    await verify.click()
    await expect(page.getByText('Signature Invalid', { exact: true })).toBeVisible({
      timeout: 30_000,
    })

    const log = page.getByTestId('pkcs11-log-panel')
    await expect(log).toContainText('C_GenerateKeyPair')
    await expect(log).toContainText('C_Sign')
    await expect(log).toContainText('C_Verify')
    await page.getByRole('button', { name: 'Start Over' }).click()
    await expect(page.getByText('Signature Invalid', { exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: '3. Verify Signature' })).toBeDisabled()
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1)
    await expectNoSeriousAxeViolations(page)
  })
}
