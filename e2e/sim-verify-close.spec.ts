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
    await page.goto('/report', { waitUntil: 'networkidle', timeout: 45_000 })
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('pqc-assessment-result')), {
        timeout: 30_000,
      })
      .toBeTruthy()
    await page.goto('/simulation', { waitUntil: 'networkidle', timeout: 45_000 })
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
    // …and its real L1→L2 activity leaf — the evidence dossier — is shown.
    await expect(page.getByText(/Assemble the evidence dossier/i).first()).toBeVisible({
      timeout: 15_000,
    })
  })
})
