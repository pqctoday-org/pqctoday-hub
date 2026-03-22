// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * NIST KAT Validation — Learn Module Integration Tests
 *
 * Navigates to each of the 7 learn modules containing a KatValidationPanel,
 * clicks "Run NIST KAT", and asserts all specs pass against NIST ACVP vectors.
 *
 * Coverage: 5G Security, Code Signing, Email Signing, IoT/OT,
 *           Digital ID, QKD, Digital Assets (20 KAT specs total)
 */

// ── localStorage suppression ──────────────────────────────────────────────────

const SUPPRESS_TOASTS = () => {
  // 1. Bypass "What's New" toast
  window.localStorage.setItem(
    'pqc-version-storage',
    JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 1 })
  )
  // 2. Suppress assessment disclaimer
  window.localStorage.setItem('pqc-disclaimer-seen', 'true')
  window.localStorage.setItem(
    'pqc-assessment-storage',
    JSON.stringify({ state: { assessmentStatus: 'complete' }, version: 7 })
  )
  // 3. Developer persona — unlocks all technical workshops
  window.localStorage.setItem(
    'pqc-learning-persona',
    JSON.stringify({ state: { selectedPersona: 'developer' }, version: 1 })
  )
}

// ── Navigation helpers ────────────────────────────────────────────────────────

/**
 * Click the Workshop tab in a learn module.
 * The custom tabs.tsx renders TabsTrigger as <button> (no role="tab").
 */
async function clickWorkshopTab(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Workshop', exact: true }).first().click()
}

/**
 * Click the module-level "Next Step →" button n times.
 * Used by modules with a linear stepper (Email, IoT, Digital ID, QKD).
 */
async function clickNextStep(page: import('@playwright/test').Page, times: number) {
  for (let i = 0; i < times; i++) {
    await page
      .getByRole('button', { name: /Next Step/ })
      .first()
      .click()
  }
}

/**
 * Navigate to a learn module, click the Workshop tab, advance to the step
 * containing KatValidationPanel, run the KAT, and assert all specs pass.
 *
 * @param workshopNextClicks - Number of "Next Step →" clicks to reach the target step
 * @param passCount          - Expected number of passing KAT specs
 */
async function runModuleKAT(
  page: import('@playwright/test').Page,
  route: string,
  workshopNextClicks: number,
  passCount: number
) {
  await page.goto(route)
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  await clickWorkshopTab(page)
  await clickNextStep(page, workshopNextClicks)

  // Trigger KAT run
  await page.getByRole('button', { name: 'Run NIST KAT' }).click()

  // Wait for all specs to complete — generous timeout for WASM init + KAT execution.
  // "{n} passed" only appears when done===true and passCount===n, proving all
  // specs ran with zero failures or errors (when n === specs.length).
  await expect(page.getByText(`${passCount} passed`)).toBeVisible({ timeout: 90000 })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Learn Modules — NIST KAT Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(SUPPRESS_TOASTS)
  })

  // ── Step 0: no navigation needed ────────────────────────────────────────────

  test('5G Security — 3 KATs pass (SUCI, gNB, NAS)', async ({ page }) => {
    test.setTimeout(120000)
    // Workshop opens on step 0 (SuciFlow) which contains the KatValidationPanel
    await runModuleKAT(page, '/learn/5g-security', 0, 3)
  })

  test('Code Signing — 3 KATs pass (binary, package, sigstore)', async ({ page }) => {
    test.setTimeout(120000)
    // Workshop opens on step 0 (BinarySigning) which contains the KatValidationPanel
    await runModuleKAT(page, '/learn/code-signing', 0, 3)
  })

  // ── Step 1: one "Next Step →" click ─────────────────────────────────────────

  test('Email Signing — 3 KATs pass (CMS sigver, dual-sig, decap)', async ({ page }) => {
    test.setTimeout(120000)
    // Workshop step 1 (cms-signing = CMSSigningDemo) contains the KatValidationPanel
    await runModuleKAT(page, '/learn/email-signing', 1, 3)
  })

  test('IoT/OT — 3 KATs pass (constrained decap, firmware, DTLS)', async ({ page }) => {
    test.setTimeout(120000)
    // Workshop step 1 (firmware-signing = FirmwareSigningSimulator) contains the KatValidationPanel
    await runModuleKAT(page, '/learn/iot-ot-pqc', 1, 3)
  })

  // ── Step 2: two "Next Step →" clicks ────────────────────────────────────────

  test('Digital ID — 4 KATs pass (ePassport, PID, mDL, QES)', async ({ page }) => {
    test.setTimeout(120000)
    // Workshop step 2 (attestation = AttestationIssuerComponent) contains the KatValidationPanel
    await runModuleKAT(page, '/learn/digital-id', 2, 4)
  })

  // ── Step 4: four "Next Step →" clicks ───────────────────────────────────────

  test('QKD — 2 KATs pass (post-processing, HSM round-trip)', async ({ page }) => {
    test.setTimeout(120000)
    // Workshop step 4 (hsm-derivation = HSMKeyDerivationDemo) contains the KatValidationPanel
    await runModuleKAT(page, '/learn/qkd', 4, 2)
  })

  // ── Digital Assets: card-based navigation (unique flow) ─────────────────────

  test('Digital Assets — 2 KATs pass (transaction signing, multi-sig)', async ({ page }) => {
    test.setTimeout(120000)

    await page.goto('/learn/digital-assets')
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
    await clickWorkshopTab(page)

    // Click the "PQC Defense" card to open PQCMigrationFlow
    // The card is a button whose accessible name includes "PQC Defense"
    await page.getByRole('button', { name: /PQC Defense/i }).click()

    // PQCMigrationFlow starts at currentPart 0. Advance 4 parts (0→1→2→3→4).
    // Part 4 (currentPart === 4) renders the KatValidationPanel.
    // The internal Next button (text "Next") is different from the module's "Next Step →".
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'Next', exact: true }).click()
    }

    // Trigger KAT run
    await page.getByRole('button', { name: 'Run NIST KAT' }).click()

    // Wait for all 2 specs to complete — "2 passed" proves both specs ran with zero failures
    await expect(page.getByText('2 passed')).toBeVisible({ timeout: 90000 })
  })
})
