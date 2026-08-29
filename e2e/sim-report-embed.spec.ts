import { test, expect } from '@playwright/test'

/**
 * The Executive Report opens EMBEDDED inside the simulation instead of navigating
 * the player out to /report (the Tier-1 ReportEmbed fix). Proof:
 *  - selecting Verification & Closure surfaces the report reference step,
 *  - clicking it keeps the URL on /simulation,
 *  - the "● Simulation mode · Executive Report" bar renders on top,
 *  - the "✕ Back to board" control is present (the embed shell, not the page).
 *
 * Sim-unlock setup mirrors sim-verify-close.spec (a completed assessment).
 */
test.describe('Simulation — Executive Report embeds under the sim header', () => {
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

  test('the report step opens embedded, staying on /simulation', async ({ page }) => {
    // Select the terminal closure phase; its L1 active band carries the report ref.
    await page
      .getByRole('button', { name: /Verification & Closure/i })
      .first()
      .click()

    // The left-rail journey step (carries the "open here →" affordance). The
    // Executive-Report embed step was restored to VC.1 on 07032026 (refId
    // 'report' ∈ REFERENCE_EMBED_IDS → canEmbedStep renders it as a Button, not
    // a Link). "Executive Report" is its label; the "program closure record"
    // wording stays on the sibling migration-verification tool step. Filtering
    // by "open here →" scopes to the journey band, not the resource rail
    // ("opens in simulation") or a decision-panel "Option A: …" move button.
    // 2026-08-02 (PR #496) put the phase card's content behind tabs — Decide /
    // Progress / Resources / Signals — and "Decide" is the default. The journey
    // band (and its "open here →" affordances) lives under PROGRESS, so the tab
    // has to be opened before any journey step is reachable. Measured, not
    // guessed: on the Progress tab the page carries "Executive Report" and 4
    // "open here" affordances; on Decide and Resources it carries none.
    //
    // The tab strip (SimulationView.tsx) is the shared Tabs/TabsTrigger
    // component (Radix), which renders role="tab" inside a role="tablist" —
    // confirmed via a fresh error-context.md snapshot 2026-08-29. This spec
    // originally targeted role="button", which never matched.
    await page
      .getByRole('tab', { name: /^Progress$/i })
      .first()
      .click()

    const reportStep = page
      .getByRole('button', { name: /Executive Report/i })
      .filter({ hasText: /open here/i })
    await expect(reportStep).toBeVisible({ timeout: 15_000 })
    await reportStep.click()

    // EMBEDDED — not navigated to /report.
    await expect(page).toHaveURL(/\/simulation/)
    await expect(page.getByText(/Simulation mode/i)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/Executive Report/i).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Back to board/i })).toBeVisible()
  })
})
