// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`breach scenario findings and export follow the selected sector at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/business/tools/breach-simulator')
    const sector = page.getByRole('button', { name: 'Industry sector', exact: true })
    const findings = page
      .getByRole('heading', { name: 'Key Findings', exact: true })
      .locator('../..')
    await expect(sector).toContainText('Other')
    await page.getByRole('button', { name: 'Load fictional finance scenario' }).click()
    await expect(sector).toContainText('Finance & Banking')

    await sector.click()
    await page.getByRole('option', { name: 'Healthcare', exact: true }).click()
    // Current published catalogue: 19 cross-industry, 1 healthcare, 13 in the telecommunications sector grouping.
    await expect(findings).toContainText('20 high or critical entries that apply to Healthcare')
    await sector.click()
    await page.getByRole('option', { name: 'Telecommunications', exact: true }).click()
    await expect(findings).toContainText(
      '32 high or critical entries that apply to Telecommunications'
    )

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '.md', exact: true }).click(),
    ])
    const markdown = await text(await download.createReadStream())
    expect(markdown).toContain('# PQC Breach Scenario — Telecommunications')
    expect(markdown).toContain('32 high or critical entries that apply to Telecommunications')
    expect(markdown).not.toContain('entries that apply to Healthcare')
  })
}
