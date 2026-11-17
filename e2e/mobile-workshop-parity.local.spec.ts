// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

const candidates = [
  'digital-assets',
  'acvp-lab-workflow',
  'cc-eucc-certification',
  'crypto-product-certification',
  'fips-140-3-certification',
  'media-drm-pqc',
  'tls-basics',
  'mls-group-messaging',
  'pqc-hw-acceleration',
  'pci-certification',
  'software-supply-chain-pqc',
  'talking-about-pqc',
]

for (const id of candidates) {
  test(`phone workshop navigation: ${id}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`/learn/${id}?tab=workshop&step=0`)
    const workshop = page.getByRole('tab', { name: 'Workshop', exact: true })
    await expect(workshop).toBeVisible()
    await workshop.click()
    await expect(page.locator('#mobile-workshop')).toBeVisible()
    for (let state = 0; state < 30; state++) {
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true)
      const next = page.locator('[data-workshop-target="learn-stepper-next"]')
      if (!(await next.count())) break
      await next.click()
      await page.keyboard.press('Escape')
      const keepGoing = page.getByRole('button', { name: 'Keep going', exact: true })
      if (await keepGoing.isVisible()) await keepGoing.click()
      if (state === 29) throw new Error('Workshop did not reach its final step')
    }
    expect(errors).toEqual([])
  })
}
