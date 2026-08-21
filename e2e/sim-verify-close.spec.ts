import { test, expect } from '@playwright/test'

/**
 * PR-3 — Verification & Closure is a PLAYED 9th phase, not a rail decoration.
 *
 * Structural proof that verify-close is in play:
 *  - the board counts 9 played phases (P0–P7 + Verification & Closure),
 *  - the phase journey ends at the closure band,
 *  - the closure phase is selectable and renders its real activity tree
 *    (assemble the evidence dossier) + the migrated "declared done" trap,
 *  - the run-complete ceremony does NOT fire on a fresh run.
 *
 * The cleared-count gate itself (the ceremony withholds until verify-close
 * reaches its win level) is covered at the unit level — quarterEngine counts
 * `clearedFrom`/`totalPhases` over the 9-phase LIFECYCLE, and the run-complete
 * effect gates on `cleared < LIFECYCLE.length` (= 9). Driving 8 phases to clear
 * through the UI is not automated here (it would require seeding every tree
 * leaf's completion across P0–P7).
 */
test.describe('Simulation — Verification & Closure is played (PR-3)', () => {
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
      localStorage.setItem(
        'pqc-simulation',
        JSON.stringify({ state: { tourSeen: true }, version: 12 })
      )
      // Unlock the sim with a completed assessment (same shape onboarding uses).
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
    await page.goto('/report', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('pqc-assessment-result')), {
        timeout: 30_000,
      })
      .toBeTruthy()
    // NOT networkidle: on a first visit the PWA service worker precaches the
    // whole build in the background, so /simulation never goes network-idle
    // within 45s. domcontentloaded + the End Quarter assertion below is the
    // real readiness signal (TRIAGE.md 2026-07-03).
    await page.goto('/simulation', { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await expect(page.getByRole('button', { name: /End Quarter/i })).toBeVisible({
      timeout: 45_000,
    })
  })

  test('the board counts 9 played phases and ends at the closure band', async ({ page }) => {
    // "Phases cleared n/9" (was n/8 before verify-close became played).
    await expect(page.getByText(/^\d+\/9$/).first()).toBeVisible({ timeout: 15_000 })
    // The phase journey now runs 0 → 7 → ◆ (the terminal closure band).
    await expect(page.getByText('0 → 7 → ◆')).toBeVisible()
    // No premature run-complete ceremony on a fresh run (nothing cleared yet).
    await expect(page.getByRole('dialog', { name: /migration program complete/i })).toHaveCount(0)
  })

  test('the closure phase is selectable and renders its real activity tree', async ({ page }) => {
    await page
      .getByRole('button', { name: /Verification & Closure/i })
      .first()
      .click()
    // The active-phase header reflects the terminal closure band…
    await expect(page.getByText(/Verification & Closure/i).first()).toBeVisible()
    // 2026-08-02 (PR #496) put the phase card's content behind tabs — Decide /
    // Progress / Resources / Signals — and the two things this test proves now
    // live on DIFFERENT tabs. Measured per tab, not assumed:
    //
    //   Decide (default) : the L1 activity title      ✓   5-point summary  ✗
    //   Progress         : the L1 activity title      ✗   5-point summary  ✓
    //
    // So the L1 title is asserted first, on the default tab, and only then does
    // the test switch to Progress for the L2 goal band. Clicking Progress up
    // front hides the title and fails the first assertion instead.
    // …and its real activity tree renders (07292026: re-anchored to what a
    // FRESH run actually shows — the 07182026 tree revision renamed the dossier
    // step to "Assemble the migration evidence dossier" AND moved it into the
    // locked L2 band, whose leaf labels only render once unlocked, so the old
    // "Assemble the evidence dossier" assertion had been failing against main).
    // Visible on a fresh run: the L1 verification-standard activity and the L2
    // goal band's 5-point evidence-standard summary.
    await expect(
      page.getByText(/Set the Verification Standard & Closure Plan/i).first()
    ).toBeVisible({ timeout: 15_000 })
    await page
      .getByRole('tab', { name: /^Progress$/i })
      .first()
      .click()
    await expect(
      page.getByText(/verified against the 5-point evidence standard/i).first()
    ).toBeVisible({ timeout: 15_000 })
  })
})
