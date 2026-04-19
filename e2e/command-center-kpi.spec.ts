// SPDX-License-Identifier: GPL-3.0-only
// E2E — Command Center KPI surfaces (dashboard + tracker)
//   * persona selector toggles KPI set
//   * disabled / "unlock assessment" state renders
//   * export formats are offered
import { test, expect, type Page } from '@playwright/test'

const DASHBOARD_URL = '/business/tools/kpi-dashboard'
const TRACKER_URL = '/business/tools/kpi-tracker'

async function seedPersona(page: Page, persona: string): Promise<void> {
  await page.addInitScript(
    ({ persona }) => {
      // Seed persona store so the tool mounts with the expected lens
      localStorage.setItem(
        'pqc-learning-persona',
        JSON.stringify({
          state: {
            selectedPersona: persona,
            hasSeenPersonaPicker: true,
            selectedRegion: 'americas',
            selectedIndustry: 'Finance & Banking',
            selectedIndustries: ['Finance & Banking'],
            suppressSuggestion: true,
            experienceLevel: 'expert',
            advancedViewsUnlocked: true,
          },
          version: 3,
        })
      )
      // Suppress the first-visit disclaimer overlay
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      // Suppress the "What's New" dialog (magic value 99.0.0 forces "read")
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
    },
    { persona }
  )
}

test.describe('Command Center KPI Dashboard Builder', () => {
  test('renders default persona KPIs and switches lens via selector', async ({ page }) => {
    await seedPersona(page, 'executive')
    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle', timeout: 30_000 })

    // Executive lens: compliance + HNDL + threat KPIs are present
    await expect(page.getByTestId('kpi-dim-compliance-gaps')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('kpi-dim-hndl-horizon')).toBeVisible()
    await expect(page.getByTestId('kpi-dim-threat-exposure')).toBeVisible()

    // Switch to architect lens — HNDL should disappear, algorithms-migrated/cbom remain
    await page.getByTestId('persona-tab-architect').click()
    await expect(page.getByTestId('kpi-dim-algorithms-migrated')).toBeVisible()
    await expect(page.getByTestId('kpi-dim-cbom-completeness')).toBeVisible()
    await expect(page.getByTestId('kpi-dim-hndl-horizon')).toHaveCount(0)

    // Switch to ops — change-failure-rate appears (migration surface only, but the
    // dashboard is governance → change-failure won't show here; verify inventory).
    await page.getByTestId('persona-tab-ops').click()
    await expect(page.getByTestId('kpi-dim-systems-inventoried')).toBeVisible()
  })

  test('HNDL horizon is locked when no assessment is complete', async ({ page }) => {
    await seedPersona(page, 'executive')
    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle', timeout: 30_000 })

    const hndl = page.getByTestId('kpi-dim-hndl-horizon')
    await expect(hndl).toBeVisible()
    await expect(hndl).toHaveAttribute('data-disabled', 'true')
  })

  test('exposes markdown + CSV + PDF export buttons', async ({ page }) => {
    await seedPersona(page, 'executive')
    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle', timeout: 30_000 })
    // Export buttons live inside ExportableArtifact; label text is ".md" / ".csv" / ".pdf"
    const exportCard = page.getByText('Export', { exact: false }).first()
    await expect(exportCard).toBeVisible()
    await expect(page.getByRole('button', { name: /\.md/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /\.csv/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /\.pdf/ })).toBeVisible()
  })
})

test.describe('Command Center KPI Tracker Template', () => {
  test('ops lens shows change-failure-rate + canary coverage', async ({ page }) => {
    await seedPersona(page, 'ops')
    await page.goto(TRACKER_URL, { waitUntil: 'networkidle', timeout: 30_000 })

    await expect(page.getByTestId('kpi-dim-change-failure-rate')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('kpi-dim-canary-coverage')).toBeVisible()
  })

  test('researcher lens shows algorithm diversity + standards coverage', async ({ page }) => {
    await seedPersona(page, 'researcher')
    await page.goto(TRACKER_URL, { waitUntil: 'networkidle', timeout: 30_000 })

    await expect(page.getByTestId('kpi-dim-algorithm-diversity')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('kpi-dim-standards-coverage')).toBeVisible()
    // Ops-only KPI must not appear
    await expect(page.getByTestId('kpi-dim-change-failure-rate')).toHaveCount(0)
  })

  test('risk-posture is locked when no assessment is complete', async ({ page }) => {
    await seedPersona(page, 'ops')
    await page.goto(TRACKER_URL, { waitUntil: 'networkidle', timeout: 30_000 })

    const risk = page.getByTestId('kpi-dim-risk-posture')
    await expect(risk).toBeVisible()
    await expect(risk).toHaveAttribute('data-disabled', 'true')
  })
})
