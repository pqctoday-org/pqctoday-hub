import { test, expect } from '@playwright/test'

/**
 * PR-1 — illustrative planning figures in the Simulation carry a "planning
 * estimate" badge so a learner never quotes a soft anchor as a published fact.
 *
 *  - The Mosca Q-Day / government-deadline horizon (Z) is badged.
 *  - The sector data shelf-life (X) is badged.
 *  - Published standards (FIPS/RFC/algorithm) stay UN-badged — verified here by
 *    the invariant that every planning badge's accessible name describes a soft
 *    figure (Q-Day/deadline or shelf-life), so none leaked onto a standard.
 *
 * Each badge is a real <button> carrying the full explanation in its accessible
 * name, so the tooltip is reachable by both keyboard and screen reader.
 */
test.describe('Simulation — planning-estimate badges (PR-1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      // Suppress the blocking overlays (disclaimer, WhatsNew, global tour, SimTour).
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
        'pqc-simulation',
        JSON.stringify({ state: { tourSeen: true }, version: 12 })
      )
      // The sim is gated behind a completed assessment. Inject a COMPLETE form so
      // the scorer runs on /report and unlocks the console (same shape onboarding
      // uses). Finance + US → sector 'Financial' (shelf-life X = 10y).
      localStorage.setItem(
        'pqc-assessment-form',
        JSON.stringify({
          state: {
            currentStep: 13,
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
            importComplianceSelection: true,
            importProductSelection: true,
            assessmentStatus: 'complete',
            lastWizardUpdate: '2026-01-01T00:00:00.000Z',
          },
          version: 0,
        })
      )
    })
    // Visiting /report runs the scorer for a "complete" form and persists the result.
    await page.goto('/report', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('pqc-assessment-result')), {
        timeout: 30_000,
      })
      .toBeTruthy()
    // The assessment now exists → the simulation console unlocks.
    // NOT networkidle: on a first visit the PWA service worker precaches the
    // whole build in the background, so /simulation never goes network-idle
    // within 45s. domcontentloaded + the End Quarter assertion below is the
    // real readiness signal (TRIAGE.md 2026-07-03).
    await page.goto('/simulation', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await expect(page.getByRole('button', { name: /End Quarter/i })).toBeVisible({
      timeout: 45_000,
    })
  })

  // Fixed 07032026: a "Years to Q-Day" KPI tile was added to the sim ribbon
  // (SimulationView.tsx) carrying a PlanningBadge whose aria-label names the
  // Q-Day horizon as an illustrative planning anchor — the persistent, badged
  // Q-Day figure the desktop console previously lacked (it only had a bare
  // "outlives Q-Day 2029" sentence in the HNDL tile). See e2e/TRIAGE.md.
  test('the Mosca Q-Day / deadline horizon carries a planning badge', async ({ page }) => {
    // "anchor", not "anchors": every PlanningBadge in the codebase phrases it in
    // the singular ("is an illustrative planning anchor"), including this test's
    // own comment three lines up. The plural was a typo in the regex.
    const badge = page.getByRole('button', { name: /Q-Day.*illustrative planning anchor/i })
    await expect(badge).toBeVisible({ timeout: 15_000 })
    await expect(badge).toHaveText(/planning/i)
    // Keyboard reachable (a real focusable <button>, not a bare title attribute).
    await badge.focus()
    await expect(badge).toBeFocused()
  })

  test('the sector data shelf-life carries a planning badge', async ({ page }) => {
    const badge = page.getByRole('button', { name: /Shelf-life X.*illustrative planning anchor/i })
    await expect(badge).toBeVisible({ timeout: 15_000 })
    await expect(badge).toHaveText(/est\./i)
  })

  test('planning badges mark only soft figures — never standards', async ({ page }) => {
    const badges = page.getByTestId('planning-badge')
    const count = await badges.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      const name = await badges.nth(i).getAttribute('aria-label')
      expect(name, `badge ${i} should describe a planning figure`).toMatch(
        /planning anchor|shelf-life/i
      )
    }
  })
})
