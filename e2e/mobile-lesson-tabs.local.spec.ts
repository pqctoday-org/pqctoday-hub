// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { MOBILE_WORKSHOP_READY } from '../src/data/mobileWorkshops'

const sample = ['crypto-agility', 'code-signing', 'pki-workshop', 'digital-id', 'pqc-business-case']
const modules = process.env.FULL_MOBILE_LESSON_TABS ? [...MOBILE_WORKSHOP_READY] : sample

for (const id of modules) {
  test(`${id} phone lesson tabs expose the selected panel and support keyboard switching`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 })
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
    await page.goto(`/learn/${id}`)
    const keepGoing = page.getByRole('button', { name: 'Keep going', exact: true })
    await page.addLocatorHandler(keepGoing, async (button) => {
      await button.click()
    })

    const tabs = page.getByRole('tablist', { name: 'Module view' })
    const learn = tabs.getByRole('tab', { name: 'Learn', exact: true })
    const workshop = tabs.getByRole('tab', { name: 'Workshop', exact: true })
    await expect(learn).toHaveAttribute('aria-selected', 'true')
    await learn.press('ArrowRight')
    await expect(workshop).toBeFocused()
    await expect(workshop).toHaveAttribute('aria-selected', 'true')
    await expect(learn).toHaveAttribute('tabindex', '-1')
    await expect(page.getByRole('tabpanel', { name: 'Workshop', exact: true })).toBeVisible()
    await expect(page).toHaveURL(/tab=workshop/)

    await workshop.press('Home')
    await expect(learn).toBeFocused()
    await expect(learn).toHaveAttribute('aria-selected', 'true')
    await expect(workshop).toHaveAttribute('tabindex', '-1')
    const learnPanel = page.getByRole('tabpanel', { name: 'Learn', exact: true })
    await expect(learnPanel).toBeVisible()
    expect(await learn.getAttribute('aria-controls')).toBe(await learnPanel.getAttribute('id'))
    await expect(page.getByRole('tabpanel', { name: 'Workshop', exact: true })).toHaveCount(0)
  })
}
