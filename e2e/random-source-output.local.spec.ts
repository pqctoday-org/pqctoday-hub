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
  test(`compares complete labelled Web Crypto and OpenSSL samples at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/playground/rng-demo')
    await expectNoSeriousAxeViolations(page)
    await page.getByRole('button', { name: 'Explore more sources', exact: true }).click()
    await page.getByRole('button', { name: 'Toggle source: OpenSSL WASM' }).click()
    await page.getByRole('button', { name: 'Toggle source: Timestamp LCG' }).click()
    await page.getByRole('button', { name: 'Cannot tell from appearance' }).click()
    const generate = page.getByRole('button', { name: 'Generate', exact: true })
    await generate.focus()
    await page.keyboard.press('Space')
    const web = page.getByRole('region', { name: 'Web Crypto API output' })
    const openssl = page.getByRole('region', { name: 'OpenSSL WASM output' })
    await expect(web).toContainText('128 bytes returned')
    await expect(openssl).toContainText('128 bytes returned')
    await expect(web).toContainText('crypto.getRandomValues()')
    await expect(openssl).toContainText('openssl rand')
    const webBytes = (await web.locator('pre').textContent())!.replace(/\s/g, '')
    const opensslBytes = (await openssl.locator('pre').textContent())!.replace(/\s/g, '')
    expect(webBytes).toMatch(/^[0-9a-f]{256}$/i)
    expect(opensslBytes).toMatch(/^[0-9a-f]{256}$/i)
    expect(opensslBytes).not.toBe(webBytes)

    await page.getByRole('button', { name: 'Run Output Checks', exact: true }).click()
    await expect(page.getByText(/Every source here is generator output/).first()).toBeVisible()
    await page
      .getByRole('button', { name: 'Appearance alone cannot establish unpredictability' })
      .click()
    await expect(page.getByTestId('experiment-conclusion')).toContainText(
      'Security depends on the generator design'
    )
    await expectNoSeriousAxeViolations(page)
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1)
  })
}
