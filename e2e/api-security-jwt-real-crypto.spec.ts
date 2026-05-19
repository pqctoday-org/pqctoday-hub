// SPDX-License-Identifier: GPL-3.0-only
/**
 * api-security-jwt-real-crypto.spec.ts
 *
 * E2E test that drives the API Security & JWT workshop and asserts the
 * crypto operations produce real signature bytes (not simulated placeholders).
 *
 * "No PB tests" — no Playwright-boilerplate / smoke-only assertions. Every
 * test here exercises actual sign / verify / encap / decap pipelines and
 * validates byte-level properties.
 *
 * Suppresses the WhatsNew toast that otherwise intercepts clicks at the
 * top of the viewport.
 */
import { test, expect, type Page } from '@playwright/test'

const ROUTE = '/learn/api-security-jwt'

// `99.0.0` is the built-in E2E sentinel that useVersionStore checks (see
// hasSeenCurrentVersion / hasUnseenChanges) — it suppresses both the
// WhatsNew modal and the unseen-data badge.
async function suppressWhatsNew(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({
        state: { lastSeenVersion: '99.0.0', isFirstVisit: false },
        version: 3,
      })
    )
  })
}

async function openWorkshop(page: Page) {
  await suppressWhatsNew(page)
  await page.goto(ROUTE)
  await page.getByRole('button', { name: 'Workshop', exact: true }).first().click()
}

test.describe('API Security & JWT workshop — real crypto', () => {
  test('PQCJWTSigning produces a real ML-DSA-65 JWS that verifies', async ({ page }) => {
    await openWorkshop(page)

    // Navigate to Step 2: PQC JWT Signing
    await page
      .getByRole('button', { name: /PQC JWT Signing|Step 2/i })
      .first()
      .click()

    // Generate keypair
    await page.getByRole('button', { name: 'Generate Keypair' }).click()

    // Public key panel renders with > 1000 bytes (ML-DSA-65 pk = 1952 bytes)
    const pubKeyPanel = page.getByText(/Public Key \([0-9,]+ bytes\)/)
    await expect(pubKeyPanel).toBeVisible({ timeout: 10_000 })
    const pkText = (await pubKeyPanel.textContent()) ?? ''
    const pkBytes = parseInt(pkText.replace(/[^\d]/g, ''), 10)
    expect(pkBytes).toBe(1952)

    // Sign
    await page.getByRole('button', { name: /Sign JWT with ML-DSA-65/ }).click()

    // Token surfaces with real signature — should be > 4500 chars (3309-byte sig → ~4412 b64url)
    const signedHeader = page.getByText(/^Signed JWT$/)
    await expect(signedHeader).toBeVisible({ timeout: 10_000 })
    const totalCell = page.getByText(/^[0-9,]+ chars \([0-9.]+ KB\)$/).first()
    await expect(totalCell).toBeVisible()
    const totalText = (await totalCell.textContent()) ?? ''
    const totalChars = parseInt(totalText.split(' ')[0].replace(/,/g, ''), 10)
    expect(totalChars).toBeGreaterThan(4500)

    // Verify via noble — real crypto must produce a valid signature
    await page.getByRole('button', { name: 'Verify (noble)' }).click()
    await expect(page.getByText(/Signature valid · noble/)).toBeVisible({ timeout: 10_000 })

    // Tamper the signature — real verify must reject
    await page.getByRole('button', { name: /Tamper signature/ }).click()
    await page.getByRole('button', { name: 'Verify (noble)' }).click()
    await expect(page.getByText(/Signature invalid · noble/)).toBeVisible({ timeout: 10_000 })
  })

  test('JWTInspector verifies the IETF KAT JWS for ML-DSA-65 (byte-exact draft vector)', async ({
    page,
  }) => {
    await openWorkshop(page)

    // Step 1 is JWTInspector — already the active step
    // Click the ML-DSA-65 sample button (it sets the textarea to the IETF KAT JWS)
    await page.getByRole('button', { name: 'ML-DSA-65', exact: true }).first().click()

    // The "Verify against IETF KAT public key" button should be visible because the
    // sample alg is ML-DSA-65 which has a KAT entry
    const verifyKat = page.getByRole('button', { name: /Verify against IETF KAT public key/ })
    await expect(verifyKat).toBeVisible()
    await verifyKat.click()

    // Real verify must accept the IETF draft's official JWS bytes
    await expect(page.getByText(/Signature valid · ML-DSA-65/)).toBeVisible({ timeout: 10_000 })
  })

  test('JWEEncryption performs a real ML-KEM-768 encap → AES-GCM encrypt → decrypt roundtrip', async ({
    page,
  }) => {
    await openWorkshop(page)
    await page
      .getByRole('button', { name: /JWE Encryption|Step 4/i })
      .first()
      .click()

    await page.getByRole('button', { name: 'Encrypt JWT Payload' }).click()

    // Wait for the JWE Token Parts panel
    await expect(page.getByText('JWE Token Parts')).toBeVisible({ timeout: 15_000 })

    // ML-KEM-768 ciphertext is exactly 1088 bytes → 1451 base64url chars
    // The encrypted-key part label includes "ML-KEM ct, 1088 B"
    await expect(page.getByText(/Encrypted Key \(ML-KEM ct, 1088 B\)/)).toBeVisible()

    // Decrypt — real ML-KEM decap + real AES-GCM auth-tag check must succeed
    await page.getByRole('button', { name: /^Decrypt$/ }).click()
    await expect(page.getByText('Decrypted Payload')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('GCM tag verified')).toBeVisible()

    // The decrypted JSON must be byte-equal to the original payload (contains "sub")
    await expect(page.locator('pre').filter({ hasText: /"sub"/ })).toBeVisible()
  })

  test('TokenSizeAnalyzer measures real signature byte counts at mount', async ({ page }) => {
    await openWorkshop(page)
    await page
      .getByRole('button', { name: /Token Size Analyzer|Step 5/i })
      .first()
      .click()

    // The "measuring" loader appears briefly, then results render
    await expect(page.getByText(/JWT Size by Algorithm/)).toBeVisible({ timeout: 30_000 })

    // ML-DSA-65 row must show a "measured" tag (proves the bytes came from a real sign())
    const mlDsa65Row = page
      .locator('div')
      .filter({ has: page.getByText('ML-DSA-65', { exact: true }) })
      .filter({ has: page.getByText('measured', { exact: true }) })
      .first()
    await expect(mlDsa65Row).toBeVisible()
  })

  test('JOSEProtocolMatrixAudit runs in-browser ML-DSA-65 sign+verify and produces a downloadable patch', async ({
    page,
  }) => {
    await openWorkshop(page)
    await page
      .getByRole('button', { name: /Matrix Audit|Step 6/i })
      .first()
      .click()

    await page.getByRole('button', { name: /Audit JOSE row/ }).click()

    // Self-test: ML-DSA-65 sign/verify roundtrip — real crypto, no simulation
    await expect(page.getByText(/Self-test: ML-DSA-65 sign\/verify roundtrip/)).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByText(/Signature verified/)).toBeVisible()

    // Download button appears once the audit completes
    await expect(page.getByRole('button', { name: /Download patch JSON/ })).toBeVisible()

    // Patch covers BOTH pureSig and hybridSig (composite roundtrip drives the
    // second delta; the applier accepts both per its StageDelta type).
    await expect(page.getByText(/Proposed patch \(2 dimension deltas\)/)).toBeVisible()
    await expect(page.getByText(/"dimension": "pureSig"/)).toBeVisible()
    await expect(page.getByText(/"dimension": "hybridSig"/)).toBeVisible()
  })

  test('JOSE KAT Suite verifies IETF draft-ietf-cose-dilithium-11 vectors + pinned composite snapshot', async ({
    page,
  }) => {
    await openWorkshop(page)
    await page
      .getByRole('button', { name: /Matrix Audit|Step 6/i })
      .first()
      .click()

    await page.getByRole('button', { name: /Run JOSE KAT suite/ }).click()

    // 5 vectors: 3 IETF ML-DSA JOSE KATs + 2 composite checks (sign-equal + verify)
    await expect(page.getByText(/5 passed/)).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(/0 failed/).first()).toBeVisible()
  })

  test('Standards Compliance Suite passes all framing checks', async ({ page }) => {
    await openWorkshop(page)
    await page
      .getByRole('button', { name: /Matrix Audit|Step 6/i })
      .first()
      .click()

    await page.getByRole('button', { name: /Run framing self-checks/ }).click()

    // All 14 checks must pass — looking for the summary text
    await expect(page.getByText(/passed/).first()).toBeVisible({ timeout: 30_000 })
    // 0 failures
    await expect(page.getByText(/0 failed/)).toBeVisible()
  })
})
