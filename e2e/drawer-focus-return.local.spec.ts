// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

/**
 * The drawer has no tabs. It opens from the top bar's Assistant button (a sheet from More on a phone),
 * closes with Escape or Close, and keyboard focus goes back to what opened it. On a phone the FAQ is a
 * sheet of its own; the journey is a page (Learn › Your journey), not a part of the drawer.
 */
for (const width of [1280, 390]) {
  test(`Assistant restores keyboard focus to its opener at ${width}px`, async ({ page }) => {
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
    await page.goto('/playground')
    const phone = width === 390
    const trigger = page.getByRole('button', {
      name: phone ? /^More(?: — unread updates)?$/ : 'Assistant',
      exact: !phone,
    })
    const assistant = page.getByRole('dialog', { name: 'Assistant' })
    const openFromMore = async (name: RegExp) => {
      await page.keyboard.press('Enter')
      await page
        .getByTestId('mobile-page-actions-sheet')
        .getByRole('button', { name })
        .press('Enter')
    }

    for (const dismiss of ['Escape', 'Close']) {
      await expect(trigger).toBeVisible()
      await trigger.focus()
      if (phone) await openFromMore(/^Assistant/)
      else await page.keyboard.press('Enter')
      await expect(
        phone ? assistant : page.getByRole('region', { name: 'Assistant' })
      ).toBeVisible()
      if (dismiss === 'Escape') {
        await page.keyboard.press('Escape')
      } else {
        const drawer = phone ? assistant : page.getByRole('region', { name: 'Assistant' })
        await drawer.getByRole('button', { name: 'Close', exact: true }).press('Enter')
      }
      await expect(phone ? assistant : page.getByRole('region', { name: 'Assistant' })).toBeHidden()
      await expect(trigger).toBeFocused()
    }

    if (phone) {
      // the FAQ is a sheet over the page
      await trigger.focus()
      await openFromMore(/^FAQ/)
      const faq = page.getByRole('dialog', { name: /FAQ|Frequently asked/ })
      await expect(faq).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(faq).toBeHidden()
      await expect(trigger).toBeFocused()

      // Your journey is a page: the menu takes the learner there, and no drawer opens
      await trigger.focus()
      await openFromMore(/^Your journey/)
      await expect(page).toHaveURL(/\/learn\?view=journey/)
      await expect(assistant).toBeHidden()
    }
  })
}
