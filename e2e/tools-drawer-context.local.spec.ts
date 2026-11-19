// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

async function expectDialogAccessible(
  page: import('@playwright/test').Page,
  dialog: import('@playwright/test').Locator
) {
  await expect
    .poll(async () => dialog.evaluate((element) => getComputedStyle(element).opacity))
    .toBe('1')
  await page.waitForTimeout(350)
  const element = await dialog.elementHandle()
  expect(element).not.toBeNull()
  const violations = await getViolations(page, element!, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  })
  expect(violations).toEqual([])
}

test.beforeEach(async ({ page }) => {
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
})

for (const width of [1280, 390]) {
  test(`The tools drawer preserves the page while checking a reference at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.getByRole('button', { name: /^Developer \/ Engineer/ }).press('Enter')
    await page.goto('/leaders?q=Bill+Newhouse')
    const communitySearch = page.getByRole('searchbox', {
      name: 'Search community by name or role',
    })
    await communitySearch.fill('')
    await communitySearch.pressSequentially('Bill Newhouse')
    await expect(communitySearch).toHaveValue('Bill Newhouse')
    await expect(page).toHaveURL(/\/leaders\?q=Bill\+Newhouse/)
    const trigger = page.getByRole('button', {
      name: width === 390 ? /^More(?: — unread updates)?$/ : 'Open PQC Assistant',
    })
    await trigger.press('Enter')
    if (width === 390) {
      await page
        .getByTestId('mobile-page-actions-sheet')
        .getByRole('button', { name: /^Assistant/ })
        .press('Enter')
    }
    const tabs = page.getByRole('tablist', { name: 'Tools drawer tabs' })
    await injectAxe(page)
    const assistantDialog = page.getByRole('dialog', { name: 'PQC Assistant' })
    await expectDialogAccessible(page, assistantDialog)
    const assistant = tabs.getByRole('tab', { name: 'Assistant' })
    await expect(assistant).toHaveAttribute('aria-selected', 'true')
    await assistant.press('End')
    const faq = tabs.getByRole('tab', { name: 'FAQ' })
    await expect(faq).toBeFocused()
    await expect(faq).toHaveAttribute('aria-selected', 'true')
    const pane = page.getByRole('tabpanel', { name: 'FAQ' })
    await expect(pane).toBeVisible()
    await expectDialogAccessible(page, page.getByRole('dialog', { name: 'FAQ', exact: true }))
    const search = pane.getByRole('searchbox', { name: 'Search questions' })
    await expect(search).toHaveValue('')
    await search.fill('certificate for hybrid TLS?')
    await pane
      .getByRole('button', {
        name: 'Which certificate can authenticate a hybrid TLS 1.3 handshake?',
      })
      .press('Enter')
    await expect(
      pane.getByRole('link', { name: 'RFC 10073 composite ML-DSA in X.509' })
    ).toBeVisible()
    await expect(page).toHaveURL(/\/leaders\?q=Bill\+Newhouse/)
    await page.keyboard.press('Escape')
    await expect(pane).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await expect(
      page.getByRole('searchbox', { name: 'Search community by name or role' })
    ).toHaveValue('Bill Newhouse')
  })
}
