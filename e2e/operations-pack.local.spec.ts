// SPDX-License-Identifier: GPL-3.0-only
// E2E — IT operations pack: an ops user saves results from the capacity
// calculators and the SSH config generator, sees them counted in the Command
// Center's operations pack, and downloads the zip with one CSV per table. The
// VPN simulator's save button stays disabled until a tunnel is established.
import { test, expect, type Page } from '@playwright/test'
import JSZip from 'jszip'
import { readFile } from 'node:fs/promises'

async function seedOps(page: Page): Promise<void> {
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
  })
}

test('ops user builds an operations pack from saved tool results', async ({ page }) => {
  test.setTimeout(120_000)
  await seedOps(page)

  await page.goto('/business', { waitUntil: 'domcontentloaded' })
  const count = page.getByTestId('operations-pack-count')
  await expect(count).toContainText('0 of 12 sections saved', { timeout: 30_000 })

  await page.goto('/playground/hsm-capacity', { waitUntil: 'domcontentloaded' })
  await page.getByTestId('hsm-capacity-save-to-pack').click({ timeout: 30_000 })
  await expect(page.getByTestId('hsm-capacity-save-to-pack')).toHaveText('Saved to operations pack')

  await page.goto('/playground/cert-capacity', { waitUntil: 'domcontentloaded' })
  await page.getByTestId('cert-capacity-save-to-pack').click({ timeout: 30_000 })

  await page.goto('/playground/vpn-sim', { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('vpn-sim-save-to-pack')).toBeDisabled({ timeout: 30_000 })

  await page.goto('/business#operations-pack', { waitUntil: 'domcontentloaded' })
  await expect(count).toContainText('2 of 12 sections saved', { timeout: 30_000 })

  const download = page.waitForEvent('download')
  await page.getByTestId('operations-pack-zip').click()
  const file = await (await download).path()
  const zip = await JSZip.loadAsync(await readFile(file))
  const names = Object.keys(zip.files)
  expect(names).toContain('operations-pack/operations-pack.md')
  expect(names).toContain('operations-pack/README.md')
  expect(names.some((n) => /^operations-pack\/tables\/results.*\.csv$/.test(n))).toBe(true)
  const md = await zip.file('operations-pack/operations-pack.md')!.async('string')
  expect(md).toContain('## 4. HSM Capacity Plan')
  expect(md).toContain('Editorial estimate (not a measurement)')
  expect(md).toContain('## 5. Certificate Capacity Plan')
  expect(md).toContain('## What is missing')
})
