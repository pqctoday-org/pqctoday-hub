import { test, expect } from '@playwright/test'

/**
 * The simulation offers TWO resets:
 *  - RESET RUN clears the game run but keeps the assessment (sim stays unlocked).
 *  - START OVER clears the run AND the assessment, so the sim re-LOCKS and
 *    re-prompts the assessment.
 * This locks the START OVER behaviour: from an unlocked sim, clicking it returns
 * to the "run your assessment" gate.
 */
test('START OVER clears the assessment and re-locks the sim', async ({ page }) => {
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

  // /report computes + persists the assessment result → sim unlocks.
  await page.goto('/report', { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('pqc-assessment-result')), {
      timeout: 30_000,
    })
    .toBeTruthy()
  // NOT networkidle: the PWA service worker precaches the whole build on first
  // visit, so /simulation never goes network-idle within 45s. domcontentloaded
  // + the End Quarter assertion is the real readiness signal (TRIAGE 2026-07-03).
  await page.goto('/simulation', { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await expect(page.getByRole('button', { name: /End Quarter/i })).toBeVisible({ timeout: 45_000 })

  // "Start over" lives in the overflow menu (RunActionsMenu, PR2 — collapsed the
  // secondary run actions out of the header; TRIAGE 2026-07-03: the old
  // always-visible "START OVER" button no longer exists, so the test must open
  // the menu first). The confirm is a styled in-app dialog (SimConfirmDialog),
  // not a native window.confirm — no page.on('dialog') needed; click its own
  // "Start over" confirm button instead.
  //
  // 2026-08-02 made that trigger ICON-ONLY (was the literal text "⋯ MORE"), so
  // it is addressed by its aria-label now. Locating it by the visible glyph
  // would re-break the moment the icon changes; the accessible name is the
  // stable contract, and asserting on it also keeps the control keyboard- and
  // screen-reader-reachable.
  await page.getByRole('button', { name: /More run actions/i }).click()
  await page.getByRole('menuitem', { name: /Start over/i }).click()
  await page
    .getByRole('alertdialog', { name: /Start over completely/i })
    .getByRole('button', { name: /^Start over$/ })
    .click()

  // Re-LOCKED: the entry screen returns in place of the console. W6.6
  // (2026-09-07) removed the "Simulation locked" copy on purpose — a sample
  // path is offered right there, so the old text described a gate that did
  // not exist (see SimulationView.test.tsx, "renders the require-assessment
  // gate"). The proof the sim re-locked is the entry <h1> plus its
  // "Start the assessment" link to /assess, and no End Quarter control.
  await expect(
    page.getByRole('heading', {
      name: /Practise on a sample organization, or run it on your own/i,
    })
  ).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('link', { name: /Start the assessment/i })).toHaveAttribute(
    'href',
    '/assess'
  )
  await expect(page.getByRole('button', { name: /End Quarter/i })).toHaveCount(0)
})
