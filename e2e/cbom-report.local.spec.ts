// SPDX-License-Identifier: GPL-3.0-only
/**
 * CBOM Report section — real-browser verification of the golden path added
 * in cbom-cyclonedx17-registry-report-section-plan-07092026.md Part 2.
 *
 * Local-only (directive 2026-07-01: new suites are local-only) — run via
 * `playwright test --project=local e2e/cbom-report.local.spec.ts`.
 *
 * Drives the actual UI (deep link → Save button → /report) rather than
 * seeding the executive-document store directly, so this is a true check
 * that the feature works end to end in a browser, not just at the
 * component/unit level (already covered by CbomSection.test.tsx and
 * reportSummary.test.ts).
 */
import { test, expect, type Page } from '@playwright/test'

async function suppressOverlaysAndSeedAssessment(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    window.localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    window.localStorage.setItem('pqc-tour-completed', 'true')
    // A minimal complete assessment so /report renders its scored sections
    // (the CBOM section itself doesn't need this, but /report as a whole does).
    window.localStorage.setItem(
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
          lastWizardUpdate: new Date().toISOString(),
        },
        version: 0,
      })
    )
  })
}

test.describe('CBOM Report section', () => {
  test('empty state: /report shows a CTA when no CBOM has been saved', async ({ page }) => {
    await suppressOverlaysAndSeedAssessment(page)
    await page.goto('/report')

    // Scoped to the report body, not the TOC sidebar — both render a button
    // accessibly named after the section title (found via a real strict-mode
    // violation the first time this spec ran unscoped).
    const content = page.getByTestId('report-content-ready')
    const heading = content.getByRole('button', { name: 'Cryptographic Bill of Materials (CBOM)' })
    await expect(heading).toBeVisible({ timeout: 15_000 })
    await heading.click()

    await expect(content.getByText(/haven.t saved one to your Command Center yet/i)).toBeVisible()
    await expect(
      content.getByRole('link', { name: /Build your CBOM in the CBOM Builder/i })
    ).toHaveAttribute('href', '/learn/crypto-mgmt-modernization?tab=workshop&step=2')
  })

  test('golden path: save a CBOM in the builder, see real numbers on /report', async ({ page }) => {
    await suppressOverlaysAndSeedAssessment(page)

    // 1. Deep-link straight to the Library CBOM Builder workshop step.
    await page.goto('/learn/crypto-mgmt-modernization?tab=workshop&step=2')
    await expect(
      page.getByRole('heading', { name: 'Step 3: Library & Hardware CBOM Builder' })
    ).toBeVisible({ timeout: 15_000 })

    // 2. Save — the default ('libs') mode has real data with no interaction needed.
    const saveButton = page.locator('[data-workshop-target="executive-artifact-save"]')
    await expect(saveButton).toBeVisible({ timeout: 15_000 })
    await saveButton.click()
    await expect(saveButton).toHaveText(/Saved/i)

    // 3. /report should now render the populated CBOM section.
    await page.goto('/report')
    const content = page.getByTestId('report-content-ready')
    const heading = content.getByRole('button', { name: 'Cryptographic Bill of Materials (CBOM)' })
    await expect(heading).toBeVisible({ timeout: 15_000 })
    await heading.click()

    // Populated-state markers — not the empty-state CTA text.
    await expect(content.getByText('Quantum-safety split')).toBeVisible()
    await expect(content.getByText('Component coverage')).toBeVisible()
    await expect(content.getByText('Algorithms in this CBOM')).toBeVisible()
    await expect(
      content.getByText(/haven.t saved one to your Command Center yet/i)
    ).not.toBeVisible()

    // At least one real algorithm citation from the Cryptography Registry —
    // proves the numbers trace to real detection + real registry data, not
    // placeholder text.
    await expect(
      content.getByRole('cell', { name: /RSA|ML-KEM|ML-DSA|SLH-DSA/i }).first()
    ).toBeVisible()
  })
})
