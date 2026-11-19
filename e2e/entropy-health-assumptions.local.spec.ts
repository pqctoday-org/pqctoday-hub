// SPDX-License-Identifier: AGPL-3.0-only
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

for (const width of [1280, 390]) {
  test(`repetition-count cutoff follows the stated entropy assumption at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/playground/entropy-test')
    await expectNoSeriousAxeViolations(page)
    const paste = page.getByRole('button', { name: 'Paste Hex', exact: true })
    await paste.click()
    const input = page.getByRole('textbox', { name: 'Sample bytes in hexadecimal' })
    const load = page.getByRole('button', { name: 'Load', exact: true })
    await input.fill('0000000000')
    await load.click()
    const run = page.getByRole('button', { name: 'Run the checks', exact: true })
    await run.focus()
    await page.keyboard.press('Space')
    const repetition = page.getByRole('group', { name: 'Repetition Count', exact: true })
    await expect(repetition).toContainText('Failure signalled')
    await expect(repetition).toContainText('Longest run: 5')
    await expect(repetition).toContainText('C threshold: 4')
    await page.getByRole('button', { name: 'Assumed min-entropy', exact: true }).click()
    await page.getByRole('option', { name: '2 bits per sample', exact: true }).click()
    await expect(repetition).toHaveCount(0)
    await run.click()
    await expect(repetition).toContainText('No failure signalled')
    await expect(repetition).toContainText('Longest run: 5')
    await expect(repetition).toContainText('C threshold: 11')
    await input.fill('00')
    await load.click()
    await run.click()
    await expect(repetition).toContainText('Insufficient data')
    await expect(repetition).not.toContainText('Failure signalled')
    await expect(
      page.getByRole('group', { name: 'Adaptive Proportion', exact: true })
    ).toContainText('Insufficient data')
    await expectNoSeriousAxeViolations(page)
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1)
  })
}
