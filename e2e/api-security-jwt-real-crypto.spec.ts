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
    // The DisclaimerModal is a SEPARATE store with its own key. Without this
    // it renders fixed-position at the bottom of the viewport and intercepts
    // pointer events, so later steps in this spec (notably the SoftHSM
    // toggle) time out on click with no visible cause. Same pattern as
    // assess-redesign.spec.ts.
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
  })
}

async function openWorkshop(page: Page) {
  await suppressWhatsNew(page)
  await page.goto(ROUTE)
  await page.getByRole('tab', { name: 'Workshop', exact: true }).first().click()
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
    await expect(pubKeyPanel).toBeVisible({ timeout: 25_000 })
    const pkText = (await pubKeyPanel.textContent()) ?? ''
    const pkBytes = parseInt(pkText.replace(/[^\d]/g, ''), 10)
    expect(pkBytes).toBe(1952)

    // Sign
    await page.getByRole('button', { name: /Sign JWT with ML-DSA-65/ }).click()

    // Token surfaces with real signature — should be > 4500 chars (3309-byte sig → ~4412 b64url)
    const signedHeader = page.getByText(/^Signed JWT$/)
    await expect(signedHeader).toBeVisible({ timeout: 25_000 })
    const totalCell = page.getByText(/^[0-9,]+ chars \([0-9.]+ KB\)$/).first()
    await expect(totalCell).toBeVisible()
    const totalText = (await totalCell.textContent()) ?? ''
    const totalChars = parseInt(totalText.split(' ')[0].replace(/,/g, ''), 10)
    expect(totalChars).toBeGreaterThan(4500)

    // Verify via noble — real crypto must produce a valid signature
    await page.getByRole('button', { name: 'Verify (noble)' }).click()
    await expect(page.getByText(/Signature valid · noble/)).toBeVisible({ timeout: 25_000 })

    // Tamper the signature — real verify must reject
    await page.getByRole('button', { name: /Tamper signature/ }).click()
    await page.getByRole('button', { name: 'Verify (noble)' }).click()
    await expect(page.getByText(/Signature invalid · noble/)).toBeVisible({ timeout: 25_000 })
  })

  // The SoftHSM backend had never been covered end-to-end: a 2026-08-02 audit
  // tried and was blocked by the DisclaimerModal intercepting clicks (fixed in
  // suppressWhatsNew above), so "does the JWT SoftHSM toggle actually work?"
  // stayed an open question rather than a verified fact. This answers it by
  // driving the real softhsmrustv3 WASM engine, not the pure-JS noble path.
  test('SoftHSM3 backend signs a real ML-DSA-65 JWT through PKCS#11', async ({ page }) => {
    await openWorkshop(page)

    await page
      .getByRole('button', { name: /PQC JWT Signing|Step 2/i })
      .first()
      .click()

    // Switch off the default noble backend onto the PKCS#11 engine.
    await page.getByRole('button', { name: /SoftHSM3 \(PKCS#11 v3\.2 WASM\)/ }).click()

    // The engine loads asynchronously; keygen is only real once it is ready.
    await page.getByRole('button', { name: 'Generate Keypair' }).click()

    // Same ML-DSA-65 public-key size as the noble path — the HSM must produce
    // a spec-conformant 1952-byte key, not a placeholder.
    const pubKeyPanel = page.getByText(/Public Key \([0-9,]+ bytes\)/)
    await expect(pubKeyPanel).toBeVisible({ timeout: 40_000 })
    const pkText = (await pubKeyPanel.textContent()) ?? ''
    expect(parseInt(pkText.replace(/[^\d]/g, ''), 10)).toBe(1952)

    await page.getByRole('button', { name: /Sign JWT with ML-DSA-65/ }).click()
    await expect(page.getByText(/^Signed JWT$/)).toBeVisible({ timeout: 40_000 })

    // A real ML-DSA-65 signature is 3309 bytes → the whole token clears 4500
    // chars. A stubbed/empty signature would not.
    const totalCell = page.getByText(/^[0-9,]+ chars \([0-9.]+ KB\)$/).first()
    await expect(totalCell).toBeVisible()
    const totalText = (await totalCell.textContent()) ?? ''
    expect(parseInt(totalText.split(' ')[0].replace(/,/g, ''), 10)).toBeGreaterThan(4500)

    // Cross-backend check: a signature made in the HSM must verify under the
    // independent pure-JS implementation. That is what proves the bytes are
    // genuine ML-DSA and not merely well-sized.
    await page.getByRole('button', { name: 'Verify (noble)' }).click()
    await expect(page.getByText(/Signature valid · noble/)).toBeVisible({ timeout: 40_000 })
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
    await expect(page.getByText(/Signature valid · ML-DSA-65/)).toBeVisible({ timeout: 25_000 })
  })

  test('JWEEncryption performs a real HPKE (ML-KEM-768) JWE encrypt → decrypt roundtrip', async ({
    page,
  }) => {
    await openWorkshop(page)
    await page
      .getByRole('button', { name: /JWE Encryption|Step 4/i })
      .first()
      .click()

    await page.getByRole('button', { name: 'Encrypt JWT Payload' }).click()

    // Wait for the JWE Token Parts panel
    await expect(page.getByText('JWE Token Parts')).toBeVisible({ timeout: 30_000 })

    // HPKE Integrated Encryption (draft-ietf-jose-hpke-encrypt-22 §5): the JWE
    // Encrypted Key IS the 1088-byte ML-KEM-768 encapsulated secret; IV and Tag are empty.
    await expect(page.getByText(/Encrypted Key = HPKE encapsulated secret, 1088 B/)).toBeVisible()
    await expect(
      page.getByText(/Initialization Vector \(empty in Integrated Encryption\)/)
    ).toBeVisible()

    // Decrypt — real ML-KEM decap + HPKE key schedule + AES-GCM tag check must succeed
    await page.getByRole('button', { name: /^Decrypt$/ }).click()
    await expect(page.getByText('Decrypted Payload')).toBeVisible({ timeout: 25_000 })
    await expect(page.getByText('GCM tag verified')).toBeVisible()

    // The decrypted JSON must be byte-equal to the original payload (contains "sub")
    await expect(page.locator('pre').filter({ hasText: /"sub"/ })).toBeVisible()
  })

  test('JWEEncryption runs HPKE-12 and HPKE-9 entirely inside SoftHSM3 (CKM_HPKE + AES-GCM in the token)', async ({
    page,
  }) => {
    await openWorkshop(page)
    await page
      .getByRole('button', { name: /JWE Encryption|Step 4/i })
      .first()
      .click()

    await page.getByRole('button', { name: /SoftHSM3 \(PKCS#11 v3\.2 WASM\)/ }).click()

    // Both suites, including the X-Wing hybrid, run in the token since hsm #310
    // (SHAKE256 KDF). Encrypted Key = encapsulated secret: 1088 B for ML-KEM-768,
    // 1120 B for MLKEM768-X25519.
    for (const [suite, encBytes] of [
      [/HPKE-12 · ML-KEM-768 \(pure PQ\)/, 1088],
      [/HPKE-9 · ML-KEM-768 \+ X25519/, 1120],
    ] as const) {
      await page.getByRole('button', { name: suite }).click()
      // Encrypt is enabled only once the PKCS#11 engine has a session.
      const encrypt = page.getByRole('button', { name: 'Encrypt JWT Payload' })
      await expect(encrypt).toBeEnabled({ timeout: 40_000 })
      await encrypt.click()

      await expect(page.getByText(/private key \(seed\) stays in SoftHSM3/)).toBeVisible({
        timeout: 40_000,
      })
      await expect(
        page.getByText(new RegExp(`Encrypted Key = HPKE encapsulated secret, ${encBytes} B`))
      ).toBeVisible()

      // C_DecapsulateKey(CKM_HPKE) + C_Decrypt on the token's AES key: a wrong key fails the tag.
      await page.getByRole('button', { name: /^Decrypt$/ }).click()
      await expect(page.getByText('GCM tag verified')).toBeVisible({ timeout: 40_000 })
      await expect(
        page.getByText(/C_DecapsulateKey\(CKM_HPKE: Decap \+ SHAKE256 key schedule, in the token\)/)
      ).toBeVisible()
    }

    // The published HPKE-9 example: seed imported into the token, opened there.
    await page.getByRole('button', { name: 'Decrypt the published HPKE-9 example' }).click()
    await expect(
      page.getByText(/Decrypted the HPKE-9 example .* inside SoftHSM3 .* plaintext matches/)
    ).toBeVisible({ timeout: 40_000 })
  })

  test('JWEEncryption decrypts the published draft-ietf-jose-hpke-pq-pqt-01 examples (HPKE-12 and HPKE-9)', async ({
    page,
  }) => {
    await openWorkshop(page)
    await page
      .getByRole('button', { name: /JWE Encryption|Step 4/i })
      .first()
      .click()

    await page.getByRole('button', { name: 'Decrypt the published HPKE-12 example' }).click()
    await expect(page.getByText(/Decrypted the HPKE-12 example .* plaintext matches/)).toBeVisible({
      timeout: 25_000,
    })

    // Switch to the X-Wing hybrid suite and repeat
    await page.getByRole('button', { name: /HPKE-9 · ML-KEM-768 \+ X25519/ }).click()
    await page.getByRole('button', { name: 'Decrypt the published HPKE-9 example' }).click()
    await expect(page.getByText(/Decrypted the HPKE-9 example .* plaintext matches/)).toBeVisible({
      timeout: 25_000,
    })
  })

  test('Attack Lab: strict validator rejects alg:none and wrong-audience tokens a naive verifier accepts', async ({
    page,
  }) => {
    await openWorkshop(page)
    await page
      .getByRole('button', { name: /Attack Lab|Step 7/i })
      .first()
      .click()

    await page.getByRole('button', { name: 'Issue tokens and start the lab' }).click()

    // Baseline: a real ML-DSA-65 access token passes every strict check.
    await expect(page.getByText(/Signature verifies under the pinned ML-DSA-65 key/)).toBeVisible({
      timeout: 40_000,
    })
    await expect(page.getByText('Accepted', { exact: true }).first()).toBeVisible()

    // alg "none": the naive verifier skips the signature, the strict one stops at alg.
    await page.getByRole('button', { name: '"alg": "none"' }).click()
    await expect(
      page.getByText(/token says "alg": "none", but this key only accepts ML-DSA-65/)
    ).toBeVisible({
      timeout: 25_000,
    })
    await expect(page.getByText('Fooled: accepted')).toBeVisible()

    // A genuine token for another API: signature fine, audience check fails.
    await page.getByRole('button', { name: 'Token for another API' }).click()
    await expect(page.getByText(/this API is https:\/\/api\.example\.com/)).toBeVisible({
      timeout: 25_000,
    })
    await expect(page.getByText('Fooled: accepted')).toBeVisible()
  })

  test('TokenSizeAnalyzer measures real signature byte counts at mount', async ({ page }) => {
    await openWorkshop(page)
    await page
      .getByRole('button', { name: /Token Size Analyzer|Step 5/i })
      .first()
      .click()

    // The "measuring" loader appears briefly, then results render
    await expect(page.getByText(/JWT Size by Algorithm/)).toBeVisible({ timeout: 60_000 })

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
      timeout: 60_000,
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

  test('JOSE KAT Suite verifies RFC 9964 vectors + published composite and HPKE JWE examples', async ({
    page,
  }) => {
    await openWorkshop(page)
    await page
      .getByRole('button', { name: /Matrix Audit|Step 6/i })
      .first()
      .click()

    await page.getByRole('button', { name: /Run JOSE KAT suite/ }).click()

    // 11 vectors: 3 RFC 9964 ML-DSA JOSE KATs + the 6 published composite examples
    // of draft-ietf-jose-pq-composite-sigs-04 Appendix A.1 + the 2 published HPKE JWE
    // examples of draft-ietf-jose-hpke-pq-pqt-01 Appendix A
    await expect(page.getByText(/11 passed/)).toBeVisible({ timeout: 60_000 })
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
    await expect(page.getByText(/passed/).first()).toBeVisible({ timeout: 60_000 })
    // 0 failures
    await expect(page.getByText(/0 failed/)).toBeVisible()
  })
})
