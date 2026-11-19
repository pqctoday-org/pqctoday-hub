// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures/blockAnalytics'

async function markdown(page: Page) {
  const [file] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: '.md', exact: true }).click(),
  ])
  return text(await file.createReadStream())
}

test.beforeEach(async ({ page }) => {
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
})

for (const width of [1280, 390]) {
  test(`delay inputs and Markdown identify each breach benchmark edition at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/business/tools/cost-of-inaction')
    const assumptions = page.getByRole('region', { name: 'Scenario assumptions' })
    for (const [previous, sector, amount, provenance] of [
      ['', 'Finance & Banking', '$6,300,000', 'IBM 2026 global sector average (USD)'],
      [
        'Finance & Banking',
        'Energy & Utilities',
        '$5,200,000',
        'IBM 2026 global sector average (USD)',
      ],
      [
        'Energy & Utilities',
        'Healthcare',
        '$7,420,000',
        'IBM 2025 global healthcare average (USD, historical)',
      ],
      [
        'Healthcare',
        'Technology',
        '$4,790,000',
        'IBM 2025 sector average (USD, historical assumption)',
      ],
      [
        'Technology',
        'Automotive',
        '$5,000,000',
        'IBM 2025 Industrial proxy (USD, historical assumption)',
      ],
      ['Automotive', 'Other', '$4,990,000', 'IBM 2026 global average (USD)'],
    ]) {
      if (previous) {
        await page.getByRole('button', { name: previous, exact: true }).click()
        await page.getByRole('option', { name: sector, exact: true }).click()
      }
      const benchmark = assumptions.locator('dd').filter({ hasText: provenance })
      await expect(benchmark).toContainText(amount)
      const receipt = await markdown(page)
      expect(receipt).toContain(`| Breach baseline | ${amount} — `)
      expect(receipt).toContain(provenance)
      if (provenance.includes('2026')) {
        await expect(benchmark.getByRole('link')).toHaveAttribute(
          'href',
          /newsroom\.ibm\.com\/2026-07-29/
        )
        expect(receipt).toContain('https://newsroom.ibm.com/2026-07-29')
      }
    }
  })

  test(`breach simulator scales the cited finance benchmark at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/business/tools/breach-simulator')
    await page.getByRole('button', { name: 'Industry sector', exact: true }).click()
    await page.getByRole('option', { name: 'Finance & Banking', exact: true }).click()
    const severity = page.getByRole('slider', { name: /Breach Severity/i })
    await expect(severity).toHaveValue('1')
    const initial = await markdown(page)
    expect(initial).toContain('Classical breach (per event) | $6.3M')
    await severity.press('ArrowRight')
    await expect(severity).toHaveValue('1.25')
    const changed = await markdown(page)
    // 6,300,000 USD × 1.25 = 7,875,000 USD, shown to one decimal million.
    expect(changed).toContain('Classical breach (per event) | $7.9M')
    expect(changed).toContain('Starting breach benchmark: $6,300,000')
    expect(changed).toContain('https://newsroom.ibm.com/2026-07-29')
  })

  test(`ROI displays and exports the exact global fallback at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/business/tools/roi-calculator')
    const benchmark = page.getByRole('link', { name: 'IBM 2026 global average (USD)' })
    await expect(benchmark).toHaveAttribute('href', /newsroom\.ibm\.com\/2026-07-29/)
    await expect(benchmark.locator('..')).toContainText('$4,990,000')
    const receipt = await markdown(page)
    expect(receipt).toContain('Industry baseline (Other): $4,990,000')
    expect(receipt).toContain('https://newsroom.ibm.com/2026-07-29')
  })
}
