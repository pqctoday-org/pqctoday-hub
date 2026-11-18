// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const viewport of [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'phone', width: 390, height: 844 },
]) {
  test(`${viewport.name}: compare an inventory answer and recover the saved report`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.addInitScript((unknown) => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
      if (localStorage.getItem('pqc-assessment-form')) return
      localStorage.setItem(
        'pqc-assessment-form',
        JSON.stringify({
          version: 0,
          state: {
            assessmentMode: 'comprehensive',
            assessmentStatus: 'complete',
            industry: 'finance',
            country: 'US',
            currentCrypto: unknown ? [] : ['RSA-2048'],
            cryptoUnknown: unknown,
            dataSensitivity: ['high'],
            migrationStatus: 'planning',
            lastWizardUpdate: new Date().toISOString(),
          },
        })
      )
    }, viewport.name === 'phone')
    await page.goto('/report')
    const disclosure = page.getByText('Compare one assessment answer', { exact: true })
    await expect(disclosure).toBeVisible({ timeout: 45_000 })
    await disclosure.focus()
    await disclosure.press('Enter')
    const storedAnswer = await page.evaluate(
      () => JSON.parse(localStorage.getItem('pqc-assessment-form')!).state.cryptoUnknown
    )

    const alternate = storedAnswer
      ? 'Use a sample RSA-2048 inventory'
      : 'Mark algorithms as unknown'
    await page.getByRole('button', { name: alternate }).click()
    const saved = page.getByRole('region', { name: 'Saved answers' })
    const changed = page.getByRole('region', { name: alternate })
    const inventoryAction = /conduct a cryptographic asset inventory/i
    await expect(storedAnswer ? saved : changed).toContainText(inventoryAction)
    await expect(storedAnswer ? changed : saved).not.toContainText(inventoryAction)
    await expect(saved.getByText(/Priority index \d+\/100/)).toBeVisible()
    await expect(changed.getByText(/Priority index \d+\/100/)).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewport.width
    )

    await page.getByRole('button', { name: 'Clear comparison' }).click()
    await expect(saved).toHaveCount(0)
    await page.reload()
    await expect(disclosure).toBeVisible({ timeout: 45_000 })
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem('pqc-assessment-form')!).state.cryptoUnknown
      )
    ).toBe(storedAnswer)
    await expect(saved).toHaveCount(0)
  })
}
