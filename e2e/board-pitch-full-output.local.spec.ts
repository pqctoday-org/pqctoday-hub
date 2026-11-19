// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect } from '@playwright/test'
import { test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`executive Board Pitch carries edited inputs into a downloadable brief at ${width}px`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
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
      localStorage.setItem(
        'pqc-learning-persona',
        JSON.stringify({
          state: { selectedPersona: 'executive', hasAcknowledgedExecutiveGrcSplit: true },
          version: 11,
        })
      )
    })
    await page.goto('/business/tools/board-pitch')

    const summary = page.getByRole('textbox', { name: 'Executive Summary' })
    const budget = page.getByRole('textbox', { name: 'Budget Request' })
    const assumptions = page.getByRole('textbox', { name: 'Sources and assumptions used' })
    await expect(summary).toBeVisible()
    await summary.fill('Approve a two-gateway pilot with a capped $240,000 budget.')
    await budget.fill('$240,000 maximum, released only after peer and rollback tests.')
    await assumptions.fill(
      'Synthetic estimate; sponsor: CTO; decision date: 2027-02-15; ±30% range.'
    )
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Preview', exact: true }).click()
    const preview = page.getByText(/Approve a two-gateway pilot with a capped \$240,000 budget\./)
    await expect(preview).toBeVisible()
    await expect(
      page.getByText(/Synthetic estimate; sponsor: CTO; decision date: 2027-02-15/)
    ).toBeVisible()
    await expect(
      page.getByText(/educational proposal template, not an approved budget/i)
    ).toBeVisible()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /\.md/ }).click(),
    ])
    const markdown = await text(await download.createReadStream())
    expect(download.suggestedFilename()).toMatch(/\.md$/)
    expect(markdown).toContain('Approve a two-gateway pilot with a capped $240,000 budget.')
    expect(markdown).toContain('$240,000 maximum, released only after peer and rollback tests.')
    expect(markdown).toContain(
      'Synthetic estimate; sponsor: CTO; decision date: 2027-02-15; ±30% range.'
    )
    expect(markdown).toContain('This is an educational proposal template, not an approved budget.')
  })
}
