// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`search at ${width}px clears a miss and opens a result for the new query`, async ({
    page,
  }) => {
    test.setTimeout(100_000)
    await page.setViewportSize({ width, height: 900 })
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
    await page.goto('/faq')
    await expect(
      page.getByRole('heading', { level: 1, name: /frequently asked questions/i })
    ).toBeVisible()
    const trigger = page.getByRole('button', { name: /^Search/ }).first()
    // Use the visible control at both widths so the phone case verifies the
    // touch entry point as well as the responsive search flow.
    await trigger.click()

    const dialog = page.getByRole('dialog', { name: 'Search PQC Today' })
    const input = dialog.getByRole('combobox', { name: 'Search' })
    await input.fill('ML-DSA')
    await expect(dialog.getByRole('option').first()).toBeVisible({ timeout: 55_000 })
    await input.fill('zzzyqvzqvxzzzqvzzxqzzvxqzvxzzqvvzx')
    await expect(dialog.getByRole('status')).toContainText('No results for')
    await input.press('Enter')
    await expect(page).toHaveURL(/\/faq$/)

    await dialog.getByRole('button', { name: 'Clear and search again' }).click()
    await expect(input).toBeFocused()
    await expect(input).toHaveValue('')
    await input.fill('ML-KEM')
    await expect(dialog.getByRole('option').first()).toBeVisible()
    await expect(input).toHaveAttribute('aria-activedescendant', /command-palette-option-/)
    await input.press('Enter')
    await expect(dialog).toHaveCount(0)
    await expect(page).not.toHaveURL(/\/faq$/)
  })
}
