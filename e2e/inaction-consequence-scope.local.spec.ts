// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

for (const route of [
  '/business/tools/cost-of-inaction',
  '/learn/pqc-business-case?tab=workshop&step=3',
]) {
  for (const width of [1280, 390]) {
    test(`cost of inaction includes a consequence only for its confirmed scope at ${width}px on ${route}`, async ({
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
      await page.goto(route)
      const panel = page.locator('details').filter({
        has: page.getByText('Optional organization-verified consequence', { exact: true }),
      })
      const open = () => panel.getByText('Optional organization-verified consequence').click()
      const download = async () => {
        const [file] = await Promise.all([
          page.waitForEvent('download'),
          page.getByRole('button', { name: '.md', exact: true }).click(),
        ])
        return text(await file.createReadStream())
      }
      const delay = page.getByRole('slider', { name: /Migration delay:/ })
      await delay.press('Home')
      await delay.press('ArrowRight')
      await expect(delay).toHaveValue('2')
      await page.getByRole('slider', { name: /Migration takes:/ }).press('Home')
      await page.getByRole('slider', { name: /Discount rate:/ }).press('Home')

      await open()
      const include = panel.getByRole('button', { name: 'Include consequence in this scenario' })
      const year = await page.evaluate(() => new Date().getFullYear())
      await panel.getByLabel('Verified consequence effective year').fill(String(year))
      await panel.getByLabel('Verified annual consequence').fill('1000000')
      await panel.getByLabel('Verified one-time consequence').fill('250000')
      await expect(include).toBeDisabled()
      const reference = panel.getByLabel('Verified consequence source or owner')
      await reference.fill('SAMPLE-LEGAL-042')
      await expect(panel.getByRole('status')).toContainText('Excluded for Finance & Banking')
      expect(await download()).toContain('| Learner-verified annual consequence | $0 |')
      await include.press('Space')
      await expect(panel.getByRole('status')).toContainText('Included for Finance & Banking')
      const included = await download()
      expect(included).toContain('| Learner-verified annual consequence | $2.0M |')
      expect(included).toContain('| Learner-verified one-time consequence | $250K |')
      expect(included).toContain('| Verified consequence scope | Finance & Banking /')
      expect(included).toContain('| Verified consequence source | SAMPLE-LEGAL-042 |')

      await page.reload()
      await open()
      await expect(panel.getByRole('status')).toContainText('Included for Finance & Banking')
      await page.getByRole('button', { name: 'Finance & Banking', exact: true }).click()
      await page.getByRole('option', { name: 'Healthcare', exact: true }).click()
      await expect(panel.getByRole('status')).toContainText('Excluded for Healthcare')
      const otherIndustry = await download()
      expect(otherIndustry).toContain('| Learner-verified annual consequence | $0 |')
      expect(otherIndustry).not.toContain('SAMPLE-LEGAL-042')
      await page.getByRole('button', { name: 'Healthcare', exact: true }).click()
      await page.getByRole('option', { name: 'Finance & Banking', exact: true }).click()
      await expect(panel.getByRole('status')).toContainText('Included for Finance & Banking')

      await reference.fill('SAMPLE-LEGAL-NEW')
      await expect(panel.getByRole('status')).toContainText('Excluded for Finance & Banking')
      expect(await download()).toContain('| Learner-verified one-time consequence | $0 |')
    })
  }
}
