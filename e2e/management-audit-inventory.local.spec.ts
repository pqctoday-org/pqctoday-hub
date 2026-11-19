// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { test, expect } from './fixtures/blockAnalytics'

for (const [name, route] of [
  ['Business', '/business/tools/management-tools-audit'],
  ['Learn', '/learn/crypto-mgmt-modernization?tab=workshop&step=5'],
]) {
  for (const width of [1280, 390]) {
    test(`${name} management audit derives coverage and exports its count basis at ${width}px`, async ({
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
      const scanner = page.getByRole('group', { name: 'Crypto Scanners', exact: true })
      const adjusted = page.getByTestId('coverage-adjusted')
      const download = async () => {
        const pending = page.waitForEvent('download')
        await page.getByRole('button', { name: '.md', exact: true }).click()
        const file = await pending
        expect(file.suggestedFilename()).toBe('management-tools-audit.md')
        return text(await file.createReadStream())
      }
      await scanner.getByRole('button', { name: 'Automated' }).click()
      await scanner.getByRole('slider').press('End')
      await expect(adjusted).toHaveText('18%')
      await scanner.getByRole('button', { name: 'Enter inventory counts' }).click()
      await expect(adjusted).toHaveText('Unavailable')
      const inScope = scanner.getByRole('textbox', { name: 'Systems in scope' })
      const covered = scanner.getByRole('textbox', { name: 'Observed covered systems' })
      await inScope.fill('64')
      await covered.fill('31')
      await expect(scanner.getByText('48.44%', { exact: true })).toBeVisible()
      await expect(adjusted).toHaveText('9%')
      await expect(page.getByText(/Automated, but only 48.44%/)).toBeVisible()
      const gapExport = await download()
      expect(gapExport).toContain('48.44% | 31 of 64 systems, entered inventory counts')
      expect(gapExport).toContain('Crypto Scanners — Automated, but only 48.44%')

      await covered.fill('65')
      await expect(scanner.getByRole('status')).toContainText('between zero and that number')
      await expect(adjusted).toHaveText('Unavailable')
      const invalidExport = await download()
      expect(invalidExport).toContain('Coverage-adjusted readiness:** Unavailable')
      expect(invalidExport).not.toContain('31 of 64')
      expect(invalidExport).toContain('Crypto Scanners: correct the inventory counts.')

      await covered.fill('32')
      await expect(scanner.getByText('50%', { exact: true })).toBeVisible()
      await expect(adjusted).toHaveText('9%')
      const recoveredExport = await download()
      expect(recoveredExport).toContain('50% | 32 of 64 systems, entered inventory counts')
      expect(recoveredExport).not.toContain('### Crypto Scanners')
      await page.reload()
      await expect(inScope).toHaveValue('64')
      await expect(covered).toHaveValue('32')
      await scanner.getByRole('button', { name: 'Use estimate slider' }).click()
      await expect(scanner.getByRole('slider')).toHaveValue('100')
      await expect(adjusted).toHaveText('18%')
      await scanner.getByRole('button', { name: 'Enter inventory counts' }).click()
      await expect(covered).toHaveValue('32')
      await expect(adjusted).toHaveText('9%')
    })
  }
}
