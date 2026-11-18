// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const viewport of [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'phone', width: 390, height: 844 },
]) {
  test(`${viewport.name}: removing ECDSA fallback blocks only the older verifier`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
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
    await page.goto('/learn/crypto-agility?tab=workshop')
    await page.getByRole('tab', { name: 'Workshop', exact: true }).click()
    const exercise = page.getByRole('region', { name: 'Test a signing rollout' })
    const fallback = exercise.getByRole('checkbox', { name: 'Allow ECDSA fallback' })
    const run = exercise.getByRole('button', { name: 'Test both verifiers' })
    const result = exercise.getByRole('status')
    await fallback.focus()
    await run.click()
    await expect(result).toContainText('Verified with ECDSA P-256')
    await expect(result).toContainText('Verified with ML-DSA-65')
    await fallback.uncheck()
    await expect(result).toBeEmpty()
    await run.click()
    await expect(result).toContainText('Blocked before signing')
    await expect(result).toContainText('Verified with ML-DSA-65')
    await fallback.check()
    await run.click()
    await expect(result).toContainText('Verified with ECDSA P-256')
  })
}
