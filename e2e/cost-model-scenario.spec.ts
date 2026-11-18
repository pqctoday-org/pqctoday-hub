// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const { route, width } of [
  { route: '/business/tools/cost-model-explorer', width: 1280 },
  { route: '/learn/pqc-business-case?tab=workshop', width: 390 },
]) {
  test(`${route}: scenario changes clear the old simulation and the export uses the current estimates`, async ({
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
    for (const label of [
      'Systems in scope',
      'Annual IT budget',
      'Complexity / legacy factor',
      'Planning horizon (years)',
    ]) {
      await page.getByRole('slider', { name: label, exact: true }).press('Home')
    }
    const run = page.getByRole('button', { name: 'Run Monte Carlo', exact: true })
    const percentiles = page.getByRole('region', { name: 'Monte Carlo animation percentiles' })
    await run.click()
    await expect(page.getByText('1,000 / 1,000 draws', { exact: true })).toBeVisible()
    // Independently replayed seed 42 against the documented triangular parameters.
    for (const value of ['$830K', '$926K', '$1.1M']) {
      await expect(percentiles.getByText(value, { exact: true })).toBeVisible()
    }

    await page.getByRole('slider', { name: 'Planning horizon (years)' }).press('ArrowRight')
    await expect(percentiles).toHaveCount(0)
    await expect(page.getByText('0 / 1,000 draws', { exact: true })).toBeVisible()
    await run.click()
    await expect(page.getByText('1,000 / 1,000 draws', { exact: true })).toBeVisible()
    for (const value of ['$1.5M', '$1.6M', '$1.7M']) {
      await expect(percentiles.getByText(value, { exact: true })).toBeVisible()
    }

    const pending = page.waitForEvent('download')
    await page.getByRole('button', { name: '.md', exact: true }).click()
    let markdown = ''
    for await (const chunk of await (await pending).createReadStream()) markdown += chunk.toString()
    expect(markdown).toContain('10 systems · $5.0M IT budget · 0.5× complexity · 2yr')
    expect(markdown).toContain('| Parametric (budget-anchored) | $800K |')
    expect(markdown).toContain('| Bottom-up (activity-based) | $1.5M |')
    expect(markdown).toContain('| Analogical (illustrative anchor) | $1.5M |')
    expect(markdown).toContain('Monte Carlo P50) | $1.6M (P10–P90 $1.5M–$1.7M)')
    expect(markdown).toContain('1000 seeded draws (seed 42)')
  })
}
