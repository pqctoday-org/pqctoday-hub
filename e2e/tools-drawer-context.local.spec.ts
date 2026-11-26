// SPDX-License-Identifier: AGPL-3.0-only
import { getViolations, injectAxe } from 'axe-playwright'
import { test, expect } from './fixtures/blockAnalytics'
import { PHONE, WIDE, ask, drawerOf, isPhone, openerOf, seedHub } from './fixtures/assistantDrawer'

/**
 * The drawer leaves the page as it was. A search typed on the Community page, and its address, are
 * still there while the Assistant answers and after it closes, and keyboard focus goes back to what
 * opened the drawer. On a phone the FAQ is a sheet of its own, with the same promise.
 */
for (const [name, viewport] of [
  ['1280 px', WIDE],
  ['390 px', PHONE],
] as const) {
  test(`The Assistant drawer preserves the page while answering a question at ${name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await seedHub(page, { persona: 'developer' })
    await page.goto('/leaders?q=Bill+Newhouse')
    const search = page.getByRole('searchbox', { name: 'Search community by name or role' })
    await search.fill('')
    await search.pressSequentially('Bill Newhouse')
    await expect(search).toHaveValue('Bill Newhouse')
    await expect(page).toHaveURL(/\/leaders\?q=Bill\+Newhouse/)

    const trigger = openerOf(page)
    await trigger.focus()
    await page.keyboard.press('Enter')
    if (isPhone(page)) {
      await page
        .getByTestId('mobile-page-actions-sheet')
        .getByRole('button', { name: /^Assistant/ })
        .press('Enter')
    }
    const drawer = drawerOf(page)
    await expect(drawer).toBeVisible()
    await injectAxe(page)
    await expect.poll(() => drawer.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
    await page.waitForTimeout(350)
    expect(
      await getViolations(page, '[data-assistant-layout]', {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      })
    ).toEqual([])

    // Ask about a certificate for hybrid TLS: the answer comes with Hub resources, and the page behind keeps its search.
    const answer = await ask(
      page,
      drawer,
      'Which certificate can authenticate a hybrid TLS 1.3 handshake?'
    )
    await expect(answer.getByRole('group', { name: 'Hub resources in this answer' })).toBeVisible()
    await expect(page).toHaveURL(/\/leaders\?q=Bill\+Newhouse/)

    await page.keyboard.press('Escape')
    await expect(drawerOf(page)).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await expect(
      page.getByRole('searchbox', { name: 'Search community by name or role' })
    ).toHaveValue('Bill Newhouse')
  })
}

test('On a phone the FAQ is a sheet that keeps the page, and Escape returns focus to More', async ({
  page,
}) => {
  await page.setViewportSize(PHONE)
  await seedHub(page, { persona: 'developer' })
  await page.goto('/leaders?q=Bill+Newhouse')
  const trigger = openerOf(page)
  await trigger.focus()
  await page.keyboard.press('Enter')
  await page
    .getByTestId('mobile-page-actions-sheet')
    .getByRole('button', { name: /^FAQ/ })
    .press('Enter')
  const faq = page.getByRole('dialog', { name: 'FAQ', exact: true })
  await expect(faq).toBeVisible()
  await injectAxe(page)
  await expect.poll(() => faq.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
  await page.waitForTimeout(350)
  const element = await faq.elementHandle()
  expect(
    await getViolations(page, element!, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } })
  ).toEqual([])
  const faqSearch = faq.getByRole('searchbox', { name: 'Search questions' })
  await expect(faqSearch).toHaveValue('')
  await faqSearch.fill('certificate for hybrid TLS?')
  await faq
    .getByRole('button', { name: 'Which certificate can authenticate a hybrid TLS 1.3 handshake?' })
    .press('Enter')
  await expect(faq.getByRole('link', { name: 'RFC 10073 composite ML-DSA in X.509' })).toBeVisible()
  await expect(page).toHaveURL(/\/leaders\?q=Bill\+Newhouse/)
  await page.keyboard.press('Escape')
  await expect(faq).toHaveCount(0)
  await expect(trigger).toBeFocused()
  await expect(
    page.getByRole('searchbox', { name: 'Search community by name or role' })
  ).toHaveValue('Bill Newhouse')
})
