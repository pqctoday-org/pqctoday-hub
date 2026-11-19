// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

async function expectNoSeriousAxeViolations(page: import('@playwright/test').Page) {
  await page.waitForTimeout(350)
  await injectAxe(page)
  const violations = await getViolations(page, 'main', {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
  })
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  if (serious.length) {
    console.log(
      'Serious axe findings:',
      JSON.stringify(
        serious.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({ target: n.target, html: n.html.slice(0, 240) })),
        })),
        null,
        2
      )
    )
  }
  expect(serious).toEqual([])
}

test('Profile C pure SUCI completes and recovers subscriber identity on phone width', async ({
  page,
}) => {
  test.setTimeout(300_000)
  await page.setViewportSize({ width: 390, height: 900 })
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
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto('/playground/suci-flow?profile=C&pqcMode=pure')
  await expect(page.getByText(/Running in PKCS#11/)).toBeVisible({ timeout: 45_000 })
  await expectNoSeriousAxeViolations(page)
  await page.getByRole('button', { name: 'Reference Vectors', exact: true }).click()
  const source = page.getByRole('link', {
    name: 'Source: 3GPP TS 33.501 Annex C.4 (V19.7.0, Release 19)',
    exact: true,
  })
  await expect(source).toHaveAttribute(
    'href',
    'https://www.etsi.org/deliver/etsi_ts/133500_133599/133501/19.07.00_60/ts_133501v190700p.pdf'
  )
  await expectNoSeriousAxeViolations(page)
  await page.getByRole('button', { name: 'Close reference vectors', exact: true }).click()

  const next = page.getByRole('button', { name: 'Next Step', exact: true })
  const decrypt = page.getByRole('button', { name: 'Decrypt PSC1 Envelope at SIDF' })
  for (let step = 0; step < 15; step++) {
    if (await decrypt.isVisible()) break
    await page.getByRole('button', { name: 'Execute Step', exact: true }).click()
    await expect(next).toBeEnabled({ timeout: 20_000 })
    await next.click()
  }
  await expect(decrypt).toBeVisible()
  await decrypt.click()
  await expect(page.getByText(/\[SUCCESS\] SUPI Recovered: 310260123456789/)).toBeVisible({
    timeout: 20_000,
  })
  await expectNoSeriousAxeViolations(page)
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
    .toBeLessThanOrEqual(1)
  expect(pageErrors).toEqual([])
})
