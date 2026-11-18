// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

const guides = [
  'arch-quantum-impact',
  'dev-quantum-impact',
  'exec-quantum-impact',
  'ops-quantum-impact',
  'research-quantum-impact',
  'soc-implementation-pqc',
]

for (const guide of guides) {
  for (const width of [1280, 390]) {
    test(`${guide} retains its checked actions and export at ${width}px`, async ({ page }) => {
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
      const planUrl = `/learn/${guide}?tab=workshop&step=2`
      await page.goto(planUrl)
      await page.addLocatorHandler(
        page.getByRole('button', { name: 'Keep going', exact: true }),
        async (button) => {
          await button.click()
        }
      )
      const phasePlan = page.getByRole('heading', { name: 'Phased Action Plan' }).locator('..')
      const action = phasePlan.getByRole('checkbox').first()
      const download = async () => {
        const [file] = await Promise.all([
          page.waitForEvent('download'),
          page.getByRole('button', { name: '.md', exact: true }).click(),
        ])
        return text(await file.createReadStream())
      }

      await expect(action).not.toBeChecked()
      const actionText = (await action.locator('..').innerText()).trim()
      await action.press('Space')
      await expect(action).toBeChecked()
      await expect(page.getByText(/1 of \d+ action items completed/)).toBeVisible()
      expect(await download()).toContain(`- [x] ${actionText}`)
      await page.reload()
      await expect(action).toBeChecked()
      expect(await download()).toContain(`- [x] ${actionText}`)

      page.once('dialog', (dialog) => dialog.accept())
      await page.getByRole('button', { name: 'Reset', exact: true }).click()
      await page.goto(planUrl)
      await expect(action).not.toBeChecked()
      expect(await download()).toContain(`- [ ] ${actionText}`)
    })
  }
}
