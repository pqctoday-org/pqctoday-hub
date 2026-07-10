import { test, expect } from '@playwright/test'

/**
 * When the locked-sim gate sends the player to /assess, completing the
 * assessment must RETURN them to /simulation (now unlocked) — not strand them on
 * the report. Repro: arm the sim-resume flag (as the gate's "Start the
 * assessment" link does), seed a fully-answered assessment so the wizard is at
 * its last step, then drive review → "Generate my report" and assert the app
 * lands back on /simulation.
 */
test('completing the assessment from the sim gate returns to /simulation', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    // Came FROM the sim (the gate link arms this before navigating to /assess).
    sessionStorage.setItem('sim:resume', '1')
    // Fully-answered Fast-track assessment, NOT yet marked complete, parked on the
    // final step so a single Continue reaches the review screen. `currentStep` is
    // TRACK-RELATIVE (see assessFlowModel.ts): quick mode is a 6-item order
    // (industry, country, crypto, sensitivity, compliance, migration), so index 5
    // ('migration') is the last step — NOT 7, which was the last index back when
    // the quick track still included infra + timeline (trimmed in 0e07d90b).
    localStorage.setItem(
      'pqc-assessment-form',
      JSON.stringify({
        state: {
          currentStep: 5,
          assessmentMode: 'quick',
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
          cryptoUseCases: ['tls'],
          useCasesUnknown: false,
          dataRetention: ['over-10y'],
          retentionUnknown: false,
          credentialLifetime: ['1-5y'],
          credentialLifetimeUnknown: false,
          systemCount: '51-200',
          teamSize: '11-50',
          scaleUnknown: false,
          cryptoAgility: 'hardcoded',
          agilityUnknown: false,
          infrastructure: ['cloud'],
          infrastructureUnknown: false,
          infrastructureSubCategories: {},
          vendorDependency: 'heavy-vendor',
          vendorUnknown: false,
          timelinePressure: 'within-2-3y',
          timelineUnknown: false,
          importComplianceSelection: true,
          importProductSelection: true,
          assessmentStatus: 'in-progress',
          lastWizardUpdate: '2026-01-01T00:00:00.000Z',
        },
        version: 0,
      })
    )
  })

  await page.goto('/assess', { waitUntil: 'networkidle', timeout: 45_000 })

  // Advance from the final wizard step to the review screen.
  await page
    .getByRole('button', { name: /Review|Continue|Next|See|Results|Finish/i })
    .last()
    .click()

  // Review → generate. This is the path the gate-flow takes; the fix redirects.
  const generate = page.getByRole('button', { name: /Generate my report/i })
  await expect(generate).toBeVisible({ timeout: 15_000 })
  await generate.click()

  // RETURNED to the sim (now unlocked) — not left on /report.
  await expect(page).toHaveURL(/\/simulation/, { timeout: 15_000 })
  await expect(page).not.toHaveURL(/\/report/)
  // …and the sim is UNLOCKED (self-unlock from the completed form) — the locked
  // gate must NOT reappear; the live board (End Quarter) is shown.
  await expect(page.getByRole('button', { name: /End Quarter/i })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Simulation locked')).toHaveCount(0)
})
