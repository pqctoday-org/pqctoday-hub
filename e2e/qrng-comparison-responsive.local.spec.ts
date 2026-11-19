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
  test(`compares QRNG stand-in, CSPRNG and broken PRNG at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))

    await page.goto('/playground/qrng-demo')
    await expect(page.getByText('Simulation — no QRNG hardware involved.')).toBeVisible()
    await expect(page.getByTestId('qrng-proves-panel')).toContainText('no quantum device')
    await expectNoSeriousAxeViolations(page)

    // A sample-size change invalidates old samples/results, then a fresh run
    // must produce all three independent views and the bounded conclusion.
    await page.getByRole('button', { name: '128 bytes', exact: true }).click()
    await page.getByRole('button', { name: 'Generate CSPRNG', exact: true }).click()
    const run = page.getByRole('button', {
      name: 'Run the Checks on All Three Samples',
      exact: true,
    })
    await run.focus()
    await page.keyboard.press('Space')
    await expect(
      page.getByRole('heading', { name: 'Comparison Results', exact: true })
    ).toBeVisible()
    await expect(page.getByText('What the three sources tell you')).toBeVisible()
    await expect(page.getByText(/Weak PRNG.*only ever emits values/i)).toBeVisible()
    await expect(
      page.getByText(/Statistical tests measure output patterns, not source security/i)
    ).toBeVisible()

    // The public-certificate claims appear with their explicit scope only
    // after the learner completes the comparison.
    await expect(page.getByRole('link', { name: 'Entropy Certificate #E63' })).toHaveAttribute(
      'href',
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/entropy-validations/certificate/63'
    )
    await expect(page.getByText(/#E214 does not certify a quantum noise source/)).toBeVisible()
    await page.getByRole('button', { name: 'Try Another Sample', exact: true }).click()
    await expect(
      page.getByRole('heading', { name: 'Comparison Results', exact: true })
    ).toHaveCount(0)
    await expect(run).toBeDisabled()
    await expect(page.getByText('No data yet — click Generate CSPRNG')).toBeVisible()
    await expectNoSeriousAxeViolations(page)
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(1)
    expect(pageErrors).toEqual([])
  })
}
