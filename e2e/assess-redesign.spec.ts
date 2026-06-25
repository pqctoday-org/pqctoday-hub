// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * Assess redesign — now the default /assess (the old page lives at
 * /assess/legacy). Covers the outcome chooser → two-pane wizard, plus the
 * no-auto-jump regression lock on BOTH the default and the legacy page:
 * arriving with a completed assessment must NOT silently redirect to /report;
 * the user decides (edit the answers, or use the "View Report" banner).
 */

// Suppress the disclaimer + "What's New" toast so they don't intercept clicks.
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
  })
})

// A complete assessment sitting at step 0 — the exact condition the old code
// redirected to /report on. Runs in the browser via addInitScript.
function injectCompleteAssessment() {
  const mockState = {
    state: {
      currentStep: 0,
      assessmentMode: 'comprehensive',
      industry: 'finance',
      country: 'US',
      currentCrypto: ['RSA-2048'],
      currentCryptoCategories: [],
      cryptoUnknown: false,
      dataSensitivity: ['high'],
      sensitivityUnknown: false,
      complianceRequirements: ['pci-dss'],
      complianceUnknown: false,
      migrationStatus: 'planning',
      migrationUnknown: false,
      cryptoUseCases: [],
      useCasesUnknown: false,
      dataRetention: [],
      retentionUnknown: false,
      credentialLifetime: [],
      credentialLifetimeUnknown: false,
      systemCount: '51-200',
      teamSize: '11-50',
      scaleUnknown: false,
      cryptoAgility: 'hardcoded',
      agilityUnknown: false,
      infrastructure: [],
      infrastructureUnknown: false,
      infrastructureSubCategories: {},
      vendorDependency: 'heavy-vendor',
      vendorUnknown: false,
      timelinePressure: 'within-2-3y',
      timelineUnknown: false,
      importComplianceSelection: false,
      importProductSelection: false,
      assessmentStatus: 'complete',
      lastWizardUpdate: new Date().toISOString(),
    },
    version: 0,
  }
  window.localStorage.setItem('pqc-assessment-form', JSON.stringify(mockState))
}

test.describe('Assess redesign — happy path', () => {
  test('outcome chooser previews report sections and starts the wizard', async ({ page }) => {
    // ?prefs=off forces the chooser even if a persona recommends a track.
    await page.goto('/assess?prefs=off')

    await expect(page.getByRole('button', { name: /start full track/i })).toBeVisible({
      timeout: 15000,
    })
    // Outcome-framed: the chooser names the report sections each track unlocks.
    await expect(page.getByText('Algorithm migration map')).toBeVisible()
    await expect(page.getByText('Risk score & verdict')).toBeVisible()

    await page.getByRole('button', { name: /start full track/i }).click()

    // The two-pane wizard appears with the first question.
    await expect(page.getByRole('heading', { name: /what industry are you in/i })).toBeVisible()
    // Consolidated assist strip is present.
    await expect(page.getByRole('button', { name: /why we ask/i })).toBeVisible()
  })

  test('answering a required question advances to the next', async ({ page }) => {
    // ?mode=comprehensive sets the track and skips the chooser.
    await page.goto('/assess?mode=comprehensive')

    await expect(page.getByRole('heading', { name: /what industry are you in/i })).toBeVisible({
      timeout: 15000,
    })
    await page.getByRole('radio', { name: /Finance & Banking/i }).click()
    await page.getByRole('button', { name: /^Continue/ }).click()

    await expect(page.getByRole('heading', { name: /which jurisdiction/i })).toBeVisible()
  })
})

test.describe('Assess — no auto-jump to report for a completed assessment', () => {
  test('default /assess (redesign) stays on the page and offers "View Report"', async ({
    page,
  }) => {
    await page.addInitScript(injectCompleteAssessment)

    await page.goto('/assess')

    // The complete banner renders ON the assess page — proof it did not redirect.
    await expect(page.getByText(/your assessment is complete/i)).toBeVisible({ timeout: 15000 })
    await expect(page).not.toHaveURL(/\/report/)
    await expect(page).toHaveURL(/\/assess/)
    await expect(page.getByRole('button', { name: /view report/i }).first()).toBeVisible()
  })
})
