// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'
import { MOBILE_WORKSHOP_READY } from '../src/data/mobileWorkshops'

const shared = [
  'api-security-jwt',
  'cbom',
  'code-signing',
  'crypto-agility',
  'crypto-registry',
  'database-encryption-pqc',
  'dnssec-pqc',
  'email-signing',
  'hybrid-crypto',
  'vpn-ssh-pqc',
]
const custom = ['5g-security', 'digital-id', 'merkle-tree-certs', 'pki-workshop']
const modules = process.env.FULL_WORKSHOP_PROGRESS_CENSUS
  ? [...MOBILE_WORKSHOP_READY]
  : [...shared, ...custom]

for (const moduleId of modules) {
  for (const width of [1280, 390]) {
    test(`${moduleId} at ${width}px records progression only when the learner advances`, async ({
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
      await page.goto(`/learn/${moduleId}?tab=workshop&step=0`)
      await page.getByRole('tab', { name: 'Workshop', exact: true }).click()
      await page.addLocatorHandler(
        page.getByRole('button', { name: 'Keep going', exact: true }),
        async (button) => {
          await button.click()
        }
      )
      const nav = page.getByRole('navigation', { name: 'Workshop steps', exact: true })
      const shellNext = page.locator('[data-workshop-target="learn-stepper-next"]')
      const hasSharedStepper = (await shellNext.count()) === 1
      test.skip(
        !hasSharedStepper && !custom.includes(moduleId),
        'Uses a different workshop progression interface'
      )
      const steps = nav.getByRole('button')
      const first = steps.first()
      const last = steps.last()
      const next = hasSharedStepper
        ? shellNext
        : page.getByRole('button', { name: /Next Step/ }).last()
      await expect(first).toHaveAttribute('aria-current', 'step', { timeout: 20_000 })
      await last.click()
      await expect(last).toHaveAttribute('aria-current', 'step')
      await expect(nav.getByRole('button', { name: /\(completed\)/ })).toHaveCount(0)
      if (hasSharedStepper) {
        await expect(page.getByRole('button', { name: 'Complete Step', exact: true })).toBeVisible()
      }

      await first.click()
      await next.click()
      await expect(steps.nth(1)).toHaveAttribute('aria-current', 'step')
      await expect(first).toHaveAccessibleName(/\(completed\)/)
      await expect(nav.getByRole('button', { name: /\(completed\)/ })).toHaveCount(1)
      if (hasSharedStepper) {
        await page.reload()
        await expect(first).toHaveAccessibleName(/\(completed\)/, { timeout: 20_000 })
        await expect(nav.getByRole('button', { name: /\(completed\)/ })).toHaveCount(1)
      }
    })
  }
}
