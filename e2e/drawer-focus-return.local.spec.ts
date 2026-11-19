// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

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
      name: phone ? /^More(?: — unread updates)?$/ : 'Open PQC Assistant',
    })
    for (const dismiss of ['Escape', 'Close']) {
      await expect(trigger).toBeVisible()
      await trigger.focus()
      await page.keyboard.press('Enter')
      if (phone) {
        await page
          .getByTestId('mobile-page-actions-sheet')
          .getByRole('button', { name: /^Assistant/ })
          .press('Enter')
      }
      const assistant = page.getByRole('dialog', { name: 'PQC Assistant' })
      await expect(assistant).toBeVisible()
      const faq = assistant.getByRole('tab', { name: 'FAQ' })
      await faq.press('Enter')
      const faqDrawer = page.getByRole('dialog', { name: 'FAQ', exact: true })
      await expect(faqDrawer).toBeVisible()
      if (dismiss === 'Escape') {
        await page.keyboard.press('Escape')
      } else {
        await faqDrawer.getByRole('button', { name: 'Close assistant' }).press('Enter')
      }
      await expect(faqDrawer).toBeHidden()
      await expect(trigger).toBeFocused()
    }

    if (phone) {
      await page.keyboard.press('Enter')
      await page
        .getByTestId('mobile-page-actions-sheet')
        .getByRole('button', { name: /^Journey/ })
        .press('Enter')
      const journey = page.getByRole('dialog', { name: 'Journey History' })
      await expect(journey).toBeVisible()
      await journey.getByRole('button', { name: 'Close assistant' }).press('Enter')
      await expect(journey).toBeHidden()
      await expect(trigger).toBeFocused()
    }
  })
}
