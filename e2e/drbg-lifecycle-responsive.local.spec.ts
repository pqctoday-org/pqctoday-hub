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
  test(`DRBG instantiate, generate, reseed and reset at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))

    await page.goto('/playground/drbg-demo')
    await expect(page.getByText(/Standards status checked 18 November 2026/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Rev. 2 pre-draft' })).toHaveAttribute(
      'href',
      'https://csrc.nist.gov/pubs/sp/800/90/a/r2/iprd'
    )
    const state = page
      .getByRole('heading', { name: 'Internal State Tracker', exact: true })
      .locator('..')
    await expect(state).toContainText('reseed_counter: 0')
    await expectNoSeriousAxeViolations(page)

    await page.getByRole('textbox', { name: 'Custom nonce (hex, optional)' }).fill('xyz')
    await page.getByRole('button', { name: 'Instantiate HMAC_DRBG', exact: true }).click()
    await expect(
      page.getByText('Custom nonce must contain complete hexadecimal bytes.')
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Generate', exact: true })).toBeDisabled()

    await page.getByRole('textbox', { name: 'Custom nonce (hex, optional)' }).fill('0011aabb')
    await page.getByRole('textbox', { name: 'Personalization (String)' }).fill('release-245-check')
    await page.getByRole('button', { name: 'Instantiate HMAC_DRBG', exact: true }).click()
    await expect(state).toContainText('reseed_counter: 1')
    await expect(page.getByRole('spinbutton', { name: 'Bytes' })).toHaveValue('32')
    await page.getByRole('textbox', { name: 'Additional Input (Opt.)' }).fill('request-1')
    const generate = page.getByRole('button', { name: 'Generate', exact: true })
    await generate.focus()
    await page.keyboard.press('Space')
    await expect(state).toContainText('reseed_counter: 2')
    await expect(page.getByText('Last Generated Output (32 bytes)')).toBeVisible()
    await expect(page.getByText(/Generated 32 bytes — reseed_counter now 2/)).toBeVisible()

    await page.getByRole('button', { name: 'Reseed', exact: true }).click()
    await expect(state).toContainText('reseed_counter: 1')
    await expect(page.getByText(/Reseeded/)).toBeVisible()
    await page.getByRole('button', { name: 'Generate', exact: true }).click()
    await expect(state).toContainText('reseed_counter: 2')

    await page.getByRole('button', { name: 'Reset DRBG', exact: true }).click()
    await expect(state).toContainText('reseed_counter: 0')
    await expect(page.getByText('Last Generated Output (32 bytes)')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Generate', exact: true })).toBeDisabled()

    await page.getByRole('button', { name: 'Run known-answer check', exact: true }).click()
    const kat = page.getByTestId('drbg-kat-result')
    await expect(kat).toContainText('16/16 vectors matched byte for byte', { timeout: 30_000 })
    await expect(kat).toContainText(/Sabotage check passed/)
    await expect(kat.getByTestId('drbg-published-bytes')).toHaveText(
      await kat.getByTestId('drbg-computed-bytes').textContent()
    )
    await expectNoSeriousAxeViolations(page)
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1)
    expect(pageErrors).toEqual([])
  })
}
