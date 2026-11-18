// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { MOBILE_WORKSHOP_READY } from '../src/data/mobileWorkshops'

const sample = ['crypto-agility', 'code-signing', 'cbom', 'tls-basics', 'pqc-business-case']
const modules = process.env.FULL_WORKSHOP_FOCUS_CENSUS ? [...MOBILE_WORKSHOP_READY] : sample

for (const id of modules) {
  for (const width of [1280, 390]) {
    test(`${id} moves keyboard focus to the new workshop heading at ${width}px`, async ({
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
        localStorage.setItem('pqc-tour-completed', 'true')
      })
      await page.goto(`/learn/${id}?tab=workshop&step=0`)
      await page.addLocatorHandler(
        page.getByRole('button', { name: 'Keep going', exact: true }),
        async (button) => {
          await button.click()
        }
      )
      const workshop =
        width === 390
          ? page.locator('#mobile-workshop')
          : page.getByRole('tabpanel', { name: 'Workshop', exact: true })
      await expect(workshop).toBeVisible()
      const next = page.locator('[data-workshop-target="learn-stepper-next"]')
      const previous = page.locator('[data-workshop-target="learn-stepper-prev"]')
      test.skip(!(await next.count()), 'Uses a different progression interface')
      const steps = workshop.getByRole('navigation', { name: 'Workshop steps' }).getByRole('button')
      const first = steps.first()
      const second = steps.nth(1)
      const firstHeading = workshop.getByRole('heading', {
        level: 2,
        name: (await first.getAttribute('aria-label'))!.replace(/ \(current\)$/, ''),
        exact: true,
      })
      const secondHeading = workshop.getByRole('heading', {
        level: 2,
        name: (await second.getAttribute('aria-label'))!.replace(/ \(optional reference\)$/, ''),
        exact: true,
      })
      await expect(firstHeading.first()).toBeVisible()
      await expect(firstHeading.first()).not.toBeFocused()
      await next.press('Enter')
      await expect(secondHeading.first()).toBeFocused()
      await expect(secondHeading.first()).toBeInViewport()
      await expect(second).toHaveAttribute('aria-current', 'step')
      await page.keyboard.press('Enter')
      await expect(secondHeading.first()).toBeFocused()
      await expect(second).toHaveAttribute('aria-current', 'step')
      await previous.press('Enter')
      await expect(firstHeading.first()).toBeFocused()
      await expect(firstHeading.first()).toBeInViewport()
      await expect(first).toHaveAccessibleName(/completed/)
      await expect(second).not.toHaveAccessibleName(/completed/)
    })
  }
}
