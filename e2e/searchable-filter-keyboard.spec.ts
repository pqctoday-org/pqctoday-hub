// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`Compliance checklist at ${width}px: search a jurisdiction and select with the keyboard`, async ({
    page,
  }) => {
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
    })
    await page.goto('/business/tools/compliance-checklist')
    const trigger = page.getByRole('button', { name: 'Primary jurisdiction', exact: true })
    await trigger.press('Enter')
    const search = page.getByRole('textbox', { name: 'Search Primary jurisdiction', exact: true })
    await expect(search).toBeFocused()
    await search.fill('Germany')
    await search.press('ArrowUp')
    const choice = page.getByRole('option', { name: 'Germany', exact: true })
    await expect(choice).toBeFocused()
    const listbox = page.getByRole('listbox', { name: 'Primary jurisdiction', exact: true })
    await expect(listbox).toBeVisible()
    await choice.press('Enter')
    await expect(listbox).toHaveCount(0)
    await expect(trigger).toContainText('Germany')
    await expect(trigger).toBeFocused()
  })
}
