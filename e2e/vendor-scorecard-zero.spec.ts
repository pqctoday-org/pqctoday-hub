// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const { route, width } of [
  { route: '/business/tools/vendor-scorecard', width: 1280 },
  { route: '/learn/vendor-risk?tab=workshop&step=1', width: 390 },
]) {
  test(`${route}: distinguish an explicit zero from a missing assessment through export and reload`, async ({
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
    })
    await page.goto(route)
    const score = page
      .getByText('PQC Readiness — Manual assessment', { exact: true })
      .locator('..')
      .locator('[aria-live="polite"]')
    const algorithm = page.getByRole('button', { name: /^PQC Algorithm Support Catalogue entry/ })
    const fips = page.getByRole('button', { name: /^FIPS 140-3 Validation Product entry/ })
    const zero = page.getByRole('button', { name: 'Record zero', exact: true })
    const clear = page.getByRole('button', { name: 'Clear score', exact: true })
    await expect(score).toHaveText('Not assessed')
    if (!(await page.getByRole('slider', { name: 'PQC Algorithm Support' }).count())) {
      await algorithm.click()
    }
    await zero.click()
    await expect(score).toHaveText('0')

    await fips.click()
    await page.getByRole('slider', { name: 'FIPS 140-3 Validation' }).press('End')
    await expect(score).toHaveText(String(Math.round((100 * 20) / (25 + 20))))

    async function download() {
      const pending = page.waitForEvent('download')
      await page.getByRole('button', { name: '.md', exact: true }).click()
      let markdown = ''
      for await (const chunk of await (await pending).createReadStream())
        markdown += chunk.toString()
      return markdown
    }
    const measured = await download()
    expect(measured).toContain('Manual readiness score: 44/100')
    expect(measured).toContain('| PQC Algorithm Support | 0/100 | 25% | Manual |')
    expect(measured).toContain('| Published PQC Roadmap | Not assessed | 15% (not counted) |')
    await page.reload()
    await expect(score).toHaveText('44')

    if (!(await page.getByRole('slider', { name: 'PQC Algorithm Support' }).count())) {
      await algorithm.click()
    }
    await clear.click()
    await expect(score).toHaveText('100')
    expect(await download()).toContain('| PQC Algorithm Support | Not assessed |')

    await fips.click()
    await clear.click()
    await expect(score).toHaveText('Not assessed')
    expect(await download()).toContain('Manual readiness score: Not assessed')
    await page.reload()
    await expect(score).toHaveText('Not assessed')
  })
}

test('the Supply Chain Matrix keeps an unassessed vendor out of the low-readiness band', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    localStorage.setItem(
      'pqc-migrate-selection',
      JSON.stringify({ state: { myProducts: ['aws-lc'] }, version: 11 })
    )
  })
  await page.goto('/learn/vendor-risk?tab=workshop&step=1')
  for (const label of [
    'PQC Algorithm Support',
    'FIPS 140-3 Validation',
    'Published PQC Roadmap',
    'Crypto Agility',
    'SBOM/CBOM Delivery',
    'Hybrid Mode Support',
  ]) {
    await page.getByRole('button', { name: new RegExp(`^${label}`) }).click()
    await page.getByRole('spinbutton', { name: `Weight for ${label} (%)`, exact: true }).fill('0')
  }
  const steps = page.getByRole('navigation', { name: 'Workshop steps' })
  await steps.getByRole('button', { name: /Supply Chain Matrix/ }).click()
  const matrix = page.getByRole('table').filter({ hasText: 'Readiness Score' })
  await expect(matrix.getByRole('cell', { name: 'Not assessed', exact: true })).toBeVisible()
  await expect(matrix.getByRole('cell', { name: 'Low', exact: true })).toHaveCount(0)
})
