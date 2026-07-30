import { test, expect } from '@playwright/test'

/**
 * Narrated auto-run (exec tour) end-to-end — 07-29 review G-M4 closed: this
 * surface was unit-tested only; no spec ever drove the PLAY modal → scenario
 * intro → transport bar path a real viewer takes.
 *
 * Locks the critical path only (start, intro, transport controls, stop) — the
 * full narration queue is unit-tested in simAutoRun.test.ts and would be far
 * too slow for e2e. Nightly-suite only; not in SMOKE_SPECS.
 */
test('PLAY → Executive Overview starts the narrated run with working transport controls', async ({
  page,
}) => {
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
  await page.goto('/simulation', { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await expect(page.getByRole('button', { name: /End Quarter/i })).toBeVisible({ timeout: 45_000 })

  // PLAY opens the unified choice modal; it must name ALL FOUR modes —
  // the three narrated scopes AND interactive board play (07-29 U-H1).
  await page.getByRole('button', { name: '▶ PLAY' }).click()
  const modal = page.getByRole('dialog', { name: /Choose how to play/i })
  await expect(modal).toBeVisible()
  await expect(modal.getByText('Executive Overview')).toBeVisible()
  await expect(modal.getByText('Full Migration Journey')).toBeVisible()
  await expect(modal.getByText('Play This Phase')).toBeVisible()
  await expect(modal.getByText(/Play it yourself/i)).toBeVisible()

  // Start the Executive Overview (first card's Play button).
  await modal
    .getByRole('button', { name: /▶ Play$/ })
    .first()
    .click()

  // The scenario-framing / pass-intro cards auto-advance (voice-off hold is
  // short) — click through one if it's up, but don't require it: the stable
  // signal that the run is live is the transport bar's Stop control.
  const beginBtn = page.getByRole('button', { name: /Begin the run|Begin/i }).first()
  if (await beginBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await beginBtn.click()
  }

  // Transport bar: pause → resume → stop all work.
  const stopBtn = page.getByRole('button', { name: /■ Stop/ })
  await expect(stopBtn).toBeVisible({ timeout: 30_000 })
  const pauseBtn = page.getByRole('button', { name: /❚❚ Pause/ })
  if (await pauseBtn.isVisible().catch(() => false)) {
    await pauseBtn.click()
    await expect(page.getByRole('button', { name: /▶ Resume/ })).toBeVisible()
    await page.getByRole('button', { name: /▶ Resume/ }).click()
  }
  await stopBtn.click()

  // Stopped: the transport bar is gone, the board is back in manual control.
  await expect(page.getByRole('button', { name: /■ Stop/ })).toHaveCount(0, { timeout: 15_000 })
  await expect(page.getByRole('button', { name: /End Quarter/i })).toBeVisible()
})
