// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`data classifications distinguish retention from confidentiality at ${width}px`, async ({
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
      localStorage.setItem('pqc-tour-completed', 'true')
    })
    await page.goto('/learn/data-asset-sensitivity?tab=workshop')
    const inventory = page.getByRole('region', { name: 'Asset inventory table' })
    const record = (name: string) => inventory.getByRole('row').filter({ hasText: name })
    const add = async (name: string, horizon: string) => {
      await page.getByLabel('Asset Name').fill(name)
      await page.getByRole('button', { name: 'Confidentiality period', exact: true }).click()
      await page.getByRole('option', { name: horizon, exact: true }).click()
      await page.getByRole('button', { name: 'Add Asset', exact: true }).click()
      await expect(record(name)).toBeVisible()
    }

    const retention = page.getByRole('button', { name: 'Retention period', exact: true })
    await retention.click()
    await page.getByRole('option', { name: 'Under 1 year', exact: true }).click()
    await add('Short status message', 'Under 1 year')
    await add('Confidential transaction history', '10–25 years')
    await expect(record('Short status message').getByRole('cell', { name: '2034' })).toBeVisible()
    await expect(
      record('Confidential transaction history').getByRole('cell', { name: '2017 (at risk)' })
    ).toBeVisible()
    await expect(
      record('Root CA Signing Key').getByRole('cell', { name: 'Not applicable' })
    ).toHaveCount(2)

    await page
      .getByRole('navigation', { name: 'Workshop steps' })
      .getByRole('button', { name: /Priority Map/ })
      .click()
    const [report] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export Markdown', exact: true }).click(),
    ])
    const markdown = await text(await report.createReadStream())
    const section = (name: string) => markdown.split(/^### /m).find((part) => part.includes(name))
    const long = section('Confidential transaction history')
    const short = section('Short status message')
    expect(long).toContain('**Retention:** under-1y')
    expect(short).toContain('**Retention:** under-1y')
    expect(long).toContain('**Confidentiality period:** 10–25 years')
    expect(short).toContain('**Confidentiality period:** Under 1 year')
    expect(long).toContain('**HNDL threshold year:** 2017')
    expect(short).toContain('**HNDL threshold year:** 2034')
    expect(section('Root CA Signing Key')).toContain('**HNDL threshold year:** Not applicable')
    expect(markdown.indexOf('Confidential transaction history')).toBeLessThan(
      markdown.indexOf('Short status message')
    )
    expect(markdown).toContain('https://csrc.nist.gov/glossary/term/security_life_of_data')
  })
}
