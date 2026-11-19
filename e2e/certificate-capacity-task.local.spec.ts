// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

for (const width of [1280, 390]) {
  test(`certificate capacity estimate is usable and exportable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-learning-persona',
        JSON.stringify({
          state: {
            selectedPersona: 'ops',
            hasAcknowledgedExecutiveGrcSplit: true,
            hasSeenPersonaPicker: true,
            selectedRegion: 'global',
            selectedIndustries: [],
            suppressSuggestion: true,
            experienceLevel: 'expert',
            advancedViewsUnlocked: true,
          },
          version: 3,
        })
      )
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
    await page.goto('/playground/cert-capacity')
    await expect(
      page.getByRole('heading', { name: 'Certificate size and storage explorer' })
    ).toBeVisible()

    const certCount = page.getByRole('spinbutton', { name: 'Active leaf certificates' })
    const renewal = page.getByRole('spinbutton', { name: 'Leaf renewal interval (days)' })
    const handshakes = page.getByRole('spinbutton', { name: 'Full TLS handshakes per second' })
    const template = page.getByRole('spinbutton', {
      name: 'Other certificate structure and extensions (bytes per certificate)',
    })
    await certCount.fill('1000')
    await renewal.fill('240')
    await handshakes.fill('100')

    const row = page.getByRole('row', { name: /ML-DSA-65/ })
    await expect(row).toContainText('5,795')
    await expect(row).toContainText('11,590')
    await expect(row).toContainText('14.55')
    await expect(page.getByText(/each leaf averages 1\.521 renewals per year/)).toBeVisible()

    // A rejected renewal interval must preserve the last valid estimate.
    await renewal.fill('0')
    await expect(renewal).toHaveValue('240')
    await expect(row).toContainText('5,795')

    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export educational estimate (CSV)' }).click()
    const csv = readFileSync(await (await download).path(), 'utf8')
    expect(csv).toContain('ML-DSA-65')
    expect(csv).toContain('5795')
    expect(csv).toContain('11590')
    expect(csv).toContain('14899')

    await template.fill('1024')
    await expect(row).toContainText('6,307')
    await expect(row).toContainText('12,614')
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    ).toBeLessThanOrEqual(1)

    await injectAxe(page)
    const violations = await getViolations(page, 'main', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })
    expect(
      violations.filter(({ impact }) => impact === 'serious' || impact === 'critical'),
      `serious/critical WCAG 2 A/AA violations at ${width}px`
    ).toEqual([])

    const save = page.getByTestId('save-to-operations-pack')
    await save.click()
    await expect(save).toHaveText('Saved to operations pack')
    const openPack = page.getByRole('link', { name: 'Open the pack' })
    await expect(openPack).toHaveAttribute('href', '/business#operations-pack')
    if (width === 1280) {
      await openPack.click()
      await expect(page).toHaveURL(/\/business#operations-pack/)
      await expect(page.getByTestId('operations-pack-count')).toContainText(
        '1 of 12 sections saved'
      )
    }
  })
}
