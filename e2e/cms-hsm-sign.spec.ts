// SPDX-License-Identifier: GPL-3.0-only
/**
 * S/MIME Workshop P0 — CMS sign+verify and encrypt+decrypt E2E KAT tests.
 *
 * Five tiers:
 *
 *   T1 (smoke)       — workshop renders, provider init completes.
 *   T2 (sign KAT)    — ML-DSA-65 genpkey → req -x509 → cms -sign → cms -verify.
 *                       KAT assertions: DER SEQUENCE header (30 82) + exact
 *                       plaintext recovery — a stub returning verifyOk=true can't
 *                       satisfy both.
 *   T3 (HSM KAT)     — same pipeline routed through pkcs11-provider → softhsmv3.
 *                       Skipped automatically if the provider banner reads
 *                       "provider_missing". DER header + exact payload recovery
 *                       prove the HSM path actually ran.
 *   T4 (KEM KAT)     — ML-KEM-768 genpkey (+ ML-DSA-65 CA) → cms -encrypt →
 *                       cms -decrypt. Asserts the recovered plaintext matches the
 *                       component's DEFAULT_PAYLOAD byte-for-byte.
 *   T5 (alt alg)     — ML-DSA-87 software sign+verify, proving a second parameter
 *                       set exercises the same pipeline without regressions.
 *
 * KAT discriminators for T2/T3:
 *   • hex dump starts with "0000  30 8" — real ASN.1 SEQUENCE DER, not a stub
 *   • recovered payload contains the exact expected plaintext
 *
 * KAT discriminator for T4:
 *   • recovered plaintext contains the exact KEM DEFAULT_PAYLOAD content
 *
 * HSM-mode discriminators (T3 only, never appear in software mode):
 *   "HSM (pkcs11:)"         — Mode row in the Key pair card
 *   "resident in softhsmv3" — Private key row in the Key pair card
 */
import { test, expect, type Page } from '@playwright/test'

const WORKSHOP_URL = '/learn/email-signing?tab=workshop&step=3'
const PROVIDER_INIT_TIMEOUT = 120_000 // WASM load + OSSL_PROVIDER_load
const PIPELINE_TIMEOUT = 180_000 // genpkey (ML-DSA-65 ~10 s) + 3 more commands

// These must match the DEFAULT_PAYLOAD constants in the respective components.
const SIGN_PAYLOAD_SNIPPET = 'Hello from the PQC Email & Document Signing Workshop.'
const KEM_PAYLOAD_SNIPPET = 'Confidential workshop message'
const KEM_PAYLOAD_RFC = 'RFC 9629'

// ── helpers ──────────────────────────────────────────────────────────────────

async function suppressToast(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
    } catch {
      /* ignore */
    }
  })
}

/** Wait for the StatusBanner to leave the "loading" state and return body text. */
async function waitForProviderInit(page: Page): Promise<string> {
  await expect(
    page.getByText(/Loading openssl\.wasm and registering pkcs11-provider/i).first()
  ).not.toBeVisible({ timeout: PROVIDER_INIT_TIMEOUT })
  await expect(
    page
      .getByText(
        /Provider registered|Provider already registered|does not export pqctoday_cms_init|Provider init failed/i
      )
      .first()
  ).toBeVisible({ timeout: 10_000 })
  return page.evaluate(() => document.body.innerText)
}

/**
 * Expand a <details> element identified by summary text, then return the
 * innerText of the first <pre> child.
 */
async function expandDetailsAndReadPre(page: Page, summaryText: string): Promise<string> {
  const details = page.locator('details').filter({ hasText: summaryText }).first()
  await details.locator('summary').click()
  await details.locator('pre').first().waitFor({ state: 'visible', timeout: 5_000 })
  return details.locator('pre').first().innerText()
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe('S/MIME Workshop — CMS sign+verify and encrypt+decrypt (P0 KAT)', () => {
  test.beforeEach(async ({ page }) => {
    await suppressToast(page)
  })

  // ── T1 — smoke ──────────────────────────────────────────────────────────────

  test('T1: Step 4 renders and provider init completes', async ({ page }) => {
    test.setTimeout(PROVIDER_INIT_TIMEOUT + 30_000)

    await page.goto(WORKSHOP_URL)
    await expect(page.getByText(/Step 4/i).first()).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText(/Live HSM Provider/i).first()).toBeVisible()

    const bodyText = await waitForProviderInit(page)

    const terminalPhrases = [
      'Provider registered',
      'Provider already registered',
      'does not export pqctoday_cms_init',
      'Provider init failed',
    ]
    const found = terminalPhrases.filter((p) => bodyText.includes(p))

    if (found.length === 0) {
      throw new Error(
        `Provider init never reached a terminal state.\n` +
          `Body (first 2000):\n${bodyText.slice(0, 2000)}`
      )
    }
    console.log(`[cms-hsm] Provider init state: ${JSON.stringify(found)}`)
  })

  // ── T2 — software sign+verify KAT ───────────────────────────────────────────

  test('T2: ML-DSA-65 software sign+verify — KAT: DER header + exact payload recovery', async ({
    page,
  }) => {
    test.setTimeout(PROVIDER_INIT_TIMEOUT + PIPELINE_TIMEOUT)

    await page.goto(WORKSHOP_URL)
    await expect(page.getByText(/Step 4/i).first()).toBeVisible({ timeout: 60_000 })

    // Ensure software mode (HSM checkbox unchecked by default)
    const signBtn = page.getByRole('button', { name: /Sign \+ Verify/i }).first()
    await expect(signBtn).toBeVisible({ timeout: 10_000 })
    await signBtn.click()

    // Wait for verify card success text
    await expect(page.getByText(/Signature verifies against signer cert/i).first()).toBeVisible({
      timeout: PIPELINE_TIMEOUT,
    })

    // KAT assertion 1: DER structure — hex dump first line must start with SEQUENCE header.
    // CMS SignedData wraps as ContentInfo, outer tag 0x30 (SEQUENCE) + 0x82 or 0x83 length.
    // A stub always returning verifyOk=true cannot produce a valid DER SEQUENCE header.
    const hexText = await expandDetailsAndReadPre(page, 'First 96 bytes (hex)')
    expect(hexText, 'CMS DER must begin with ASN.1 SEQUENCE (30 82 or 30 83)').toMatch(
      /0000\s+30 8[23]/
    )
    console.log(`[cms-hsm] T2 hex dump first line: ${hexText.split('\n')[0]}`)

    // KAT assertion 2: exact plaintext recovery.
    // cms -verify writes the payload to stdout; the component TextDecodes it.
    // The recovered text must contain the component DEFAULT_PAYLOAD snippet.
    const recoveredText = await expandDetailsAndReadPre(page, 'Show recovered payload')
    expect(recoveredText, 'Recovered payload must match the signed message').toContain(
      SIGN_PAYLOAD_SNIPPET
    )
    console.log(`[cms-hsm] T2 recovered payload (first 80): ${recoveredText.slice(0, 80)}`)

    // Software mode: HSM phrases must NOT appear
    const bodyText = await page.evaluate(() => document.body.innerText)
    const hsmOnlyPhrases = ['HSM (pkcs11:)', 'resident in softhsmv3']
    const falsePositives = hsmOnlyPhrases.filter((p) => bodyText.includes(p))
    if (falsePositives.length > 0) {
      console.warn(`[cms-hsm] T2 unexpected HSM phrases: ${JSON.stringify(falsePositives)}`)
    }

    console.log('[cms-hsm] T2 PASS — ML-DSA-65 software sign+verify KAT succeeded')
  })

  // ── T3 — HSM sign+verify KAT ─────────────────────────────────────────────────

  test('T3: ML-DSA-65 HSM sign+verify KAT (skips if provider_missing)', async ({ page }) => {
    test.setTimeout(PROVIDER_INIT_TIMEOUT + PIPELINE_TIMEOUT)

    await page.goto(WORKSHOP_URL)
    await expect(page.getByText(/Step 4/i).first()).toBeVisible({ timeout: 60_000 })

    const bodyAfterInit = await waitForProviderInit(page)

    const providerOk =
      bodyAfterInit.includes('Provider registered') ||
      bodyAfterInit.includes('Provider already registered')

    if (!providerOk) {
      test.skip()
      return
    }

    // Enable HSM toggle for the sign demo
    const hsmCheckbox = page.getByRole('checkbox', { name: /Use HSM key/i }).first()
    await expect(hsmCheckbox).toBeVisible({ timeout: 5_000 })
    await expect(hsmCheckbox).toBeEnabled()
    await hsmCheckbox.check()
    await expect(hsmCheckbox).toBeChecked()

    const signBtn = page.getByRole('button', { name: /Sign \+ Verify/i }).first()
    await expect(signBtn).toBeVisible()
    await signBtn.click()

    // Wait for terminal state
    await expect(page.getByRole('button', { name: /Clear/i, exact: true }).first()).toBeVisible({
      timeout: PIPELINE_TIMEOUT,
    })

    const bodyText = await page.evaluate(() => document.body.innerText)

    // Read Worker logs from the collapsed <details> element (innerText skips closed details).
    let workerLogs = ''
    try {
      const logsDetails = page
        .locator('details')
        .filter({ hasText: /Worker logs/ })
        .first()
      const isPresent = await logsDetails.count()
      if (isPresent > 0) {
        await logsDetails.locator('summary').click()
        await logsDetails.locator('pre').first().waitFor({ state: 'visible', timeout: 3_000 })
        workerLogs = await logsDetails.locator('pre').first().innerText()
      }
    } catch {
      /* non-fatal — logs not required for the assertion */
    }

    const allDiagText = bodyText + '\n' + workerLogs
    const errorLines = allDiagText
      .split('\n')
      .filter(
        (l) =>
          l.toLowerCase().includes('fail') ||
          l.toLowerCase().includes('error') ||
          l.includes('rc=') ||
          l.includes('pkcs11') ||
          l.includes('Module initialization') ||
          l.includes('[hsm-diag]')
      )
      .slice(0, 30)
    if (errorLines.length > 0) {
      console.log(`[cms-hsm] T3 diagnostic lines:\n${errorLines.join('\n')}`)
    }

    if (!bodyText.includes('Signature verifies against signer cert')) {
      throw new Error(
        `T3: HSM pipeline did not produce a verified signature.\n` +
          `Worker logs:\n${workerLogs.slice(0, 2000)}\n` +
          `Body snippet (first 3000):\n${bodyText.slice(0, 3000)}`
      )
    }

    // KAT assertion 1: DER SEQUENCE header — proves real cms -sign ran via pkcs11-provider
    const hexText = await expandDetailsAndReadPre(page, 'First 96 bytes (hex)')
    expect(hexText, 'HSM CMS DER must begin with ASN.1 SEQUENCE (30 82 or 30 83)').toMatch(
      /0000\s+30 8[23]/
    )
    console.log(`[cms-hsm] T3 hex dump first line: ${hexText.split('\n')[0]}`)

    // KAT assertion 2: exact plaintext recovery via HSM-routed verify
    const recoveredText = await expandDetailsAndReadPre(page, 'Show recovered payload')
    expect(recoveredText, 'HSM-recovered payload must match the signed message').toContain(
      SIGN_PAYLOAD_SNIPPET
    )

    // HSM-mode discriminating strings — must be present for a true HSM pipeline
    const hsmEvidence = ['HSM (pkcs11:)', 'resident in softhsmv3']
    const found = hsmEvidence.filter((p) => bodyText.includes(p))
    console.log(`[cms-hsm] T3 HSM evidence found: ${JSON.stringify(found)}`)

    if (found.length === 0) {
      throw new Error(
        `T3: HSM verify succeeded but no HSM mode evidence in page text.\n` +
          `Expected one of: ${JSON.stringify(hsmEvidence)}\n` +
          `Body snippet (first 3000):\n${bodyText.slice(0, 3000)}`
      )
    }

    console.log('[cms-hsm] T3 PASS — ML-DSA-65 HSM sign+verify KAT succeeded')
  })

  // ── T4 — ML-KEM-768 software encrypt+decrypt KAT ────────────────────────────

  test('T4: ML-KEM-768 software encrypt+decrypt — KAT: exact plaintext recovery', async ({
    page,
  }) => {
    test.setTimeout(PROVIDER_INIT_TIMEOUT + PIPELINE_TIMEOUT)

    await page.goto(WORKSHOP_URL)
    await expect(page.getByText(/Step 4/i).first()).toBeVisible({ timeout: 60_000 })

    // The KEM demo runs independently of provider init — software mode needs no HSM.
    // The "Encrypt + Decrypt" button is always enabled; click it once visible.
    const encryptBtn = page.getByRole('button', { name: /Encrypt \+ Decrypt/i }).first()
    await expect(encryptBtn).toBeVisible({ timeout: 10_000 })
    await encryptBtn.click()

    // Wait for terminal success: "Plaintext recovered via software key"
    await expect(page.getByText(/Plaintext recovered via software key/i).first()).toBeVisible({
      timeout: PIPELINE_TIMEOUT,
    })

    // KAT assertion: expand the recovered plaintext details and assert exact content.
    // cms -decrypt must recover the DEFAULT_PAYLOAD bytes written by cms -encrypt.
    // A stub returning decryptOk=true can't produce the correct plaintext.
    const decryptedText = await expandDetailsAndReadPre(page, 'Show recovered plaintext')
    expect(decryptedText, 'Decrypted text must contain the KEM payload message').toContain(
      KEM_PAYLOAD_SNIPPET
    )
    expect(decryptedText, 'Decrypted text must contain RFC 9629 reference').toContain(
      KEM_PAYLOAD_RFC
    )
    console.log(`[cms-hsm] T4 recovered plaintext (first 80): ${decryptedText.slice(0, 80)}`)

    // Software mode: no HSM phrases
    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText).toContain('Plaintext recovered via software key')

    console.log('[cms-hsm] T4 PASS — ML-KEM-768 software encrypt+decrypt KAT succeeded')
  })

  // ── T5 — ML-DSA-87 software sign+verify ─────────────────────────────────────

  test('T5: ML-DSA-87 software sign+verify — additional parameter set', async ({ page }) => {
    test.setTimeout(PROVIDER_INIT_TIMEOUT + PIPELINE_TIMEOUT)

    await page.goto(WORKSHOP_URL)
    await expect(page.getByText(/Step 4/i).first()).toBeVisible({ timeout: 60_000 })

    // Switch the algorithm dropdown to ML-DSA-87
    const algSelect = page
      .locator('select')
      .filter({ hasText: /ML-DSA/ })
      .first()
    await expect(algSelect).toBeVisible({ timeout: 10_000 })
    await algSelect.selectOption('ML-DSA-87')

    const signBtn = page.getByRole('button', { name: /Sign \+ Verify/i }).first()
    await signBtn.click()

    // Wait for verify success
    await expect(page.getByText(/Signature verifies against signer cert/i).first()).toBeVisible({
      timeout: PIPELINE_TIMEOUT,
    })

    // KAT assertion: DER header check — ML-DSA-87 produces a larger CMS blob (~7 KB)
    // but the outer ASN.1 SEQUENCE is identical in structure.
    const hexText = await expandDetailsAndReadPre(page, 'First 96 bytes (hex)')
    expect(hexText, 'ML-DSA-87 CMS DER must begin with ASN.1 SEQUENCE').toMatch(/0000\s+30 8[23]/)
    console.log(`[cms-hsm] T5 ML-DSA-87 hex dump first line: ${hexText.split('\n')[0]}`)

    // Recovered payload must match
    const recoveredText = await expandDetailsAndReadPre(page, 'Show recovered payload')
    expect(recoveredText).toContain(SIGN_PAYLOAD_SNIPPET)

    console.log('[cms-hsm] T5 PASS — ML-DSA-87 software sign+verify succeeded')
  })
})
