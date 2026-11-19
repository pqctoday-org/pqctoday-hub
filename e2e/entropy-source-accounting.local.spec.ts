// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

async function expectNoSeriousAxeViolations(page: import('@playwright/test').Page) {
  await page.waitForTimeout(300)
  await injectAxe(page)
  const violations = await getViolations(page, 'main', {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  })
  expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
}

const routes = ['/learn/entropy-randomness?tab=workshop&step=4', '/playground/source-combining']
for (const route of routes) {
  for (const width of [1280, 390]) {
    test(`source assumptions control the credited entropy at ${width}px on ${route}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(() => {
        localStorage.setItem(
          'pqc-disclaimer-storage',
          JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
        )
      })
      await page.goto(route)
      await expectNoSeriousAxeViolations(page)
      const credit = page.getByTestId('entropy-credited')
      await page.getByRole('button', { name: 'Correlated sources', exact: true }).click()
      await expect(credit).toContainText('256 bits')
      await expect(
        page.getByText(
          'Without established independence, only one source is credited in this concatenation.'
        )
      ).toBeVisible()

      const independence = page.getByRole('button', {
        name: 'Are the sources independent?',
        exact: true,
      })
      await independence.click()
      await page.getByRole('option', { name: /^Independent \(separate/ }).click()
      await expect(credit).toContainText('512 bits')
      await expectNoSeriousAxeViolations(page)
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
        .toBeLessThanOrEqual(1)

      await independence.click()
      await page.getByRole('option', { name: 'Unknown', exact: true }).click()
      await expect(credit).toContainText('256 bits')
      const download = page.waitForEvent('download')
      await page.getByRole('button', { name: 'Download run record (JSON)', exact: true }).click()
      const report = JSON.parse(await text(await (await download).createReadStream()))
      expect(report.inputs.assumptions.independence).toBe('unknown')
      expect(report.inputs.entropyAccount.creditedInputBits).toBe(256)
      expect(report.inputs.verdict.id).toBe('not-enough-evidence')

      await page.getByRole('button', { name: 'Repeated fixed input', exact: true }).click()
      await expect(credit).toContainText('0 bits')
      await expect(
        page.getByText('No fresh entropy is credited when samples are reused or stale.')
      ).toBeVisible()

      const freshness = page.getByRole('button', { name: 'Freshness of the input', exact: true })
      await freshness.click()
      await page.getByRole('option', { name: 'Fresh samples for every request' }).click()
      await expect(credit).toContainText('512 bits')
    })
  }
}
