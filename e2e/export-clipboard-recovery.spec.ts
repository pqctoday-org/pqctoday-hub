// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const { route, heading, width } of [
  { route: '/business/tools/raci-builder', heading: 'RACI', width: 1280 },
  {
    route: '/business/tools/vendor-scorecard',
    heading: 'Vendor PQC Readiness Scorecard',
    width: 390,
  },
  { route: '/business/tools/cost-model-explorer', heading: 'Cost Model Comparison', width: 390 },
]) {
  test(`${route}: denied clipboard keeps focus and permits an actual Markdown download`, async ({
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
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: () => Promise.reject(new DOMException('Clipboard denied', 'NotAllowedError')),
        },
      })
      const exec = document.execCommand.bind(document)
      document.execCommand = (command, ...args) => {
        if (command === 'copy') throw new DOMException('Clipboard denied', 'NotAllowedError')
        return exec(command, ...args)
      }
    })
    await page.goto(route)
    const copy = page.getByRole('button', { name: 'Copy', exact: true })
    await copy.press('Enter')
    await expect(
      page.getByRole('status').filter({ hasText: 'Clipboard access failed.' })
    ).toBeVisible()
    await expect(copy).toBeFocused()
    expect(
      await page
        .locator('textarea')
        .evaluateAll((fields) =>
          fields.some((field) => field.style.position === 'fixed' && field.style.opacity === '0')
        )
    ).toBe(false)

    const pending = page.waitForEvent('download')
    await page.getByRole('button', { name: '.md', exact: true }).click()
    let markdown = ''
    for await (const chunk of await (await pending).createReadStream()) markdown += chunk.toString()
    expect(markdown).toContain(heading)
  })
}
