// SPDX-License-Identifier: GPL-3.0-only
/**
 * Phase 3 — TLS HSM integration e2e tests.
 *
 * The critical test (`HSM ON run enters the HSM code path`) is a *real* runtime
 * signal — it waits for the simulation to complete ("Run Again" button) then
 * asserts text that can ONLY appear as a PKCS#11 trace event emitted by
 * tls_simulation_hsm.c, not from any static UI label.
 *
 * Discriminating strings (present only in trace output, never in static UI):
 *   "Live HSM enabled —"   → log_event("server","hsm_mode","Live HSM enabled …")
 *   "C_Initialize"          → log_event("server","pkcs11_call","C_Initialize")
 *   "HSM setup failed"      → log_event("server","warning","HSM setup failed…")
 *
 * Static UI text that looks similar but must NOT be used as a discriminator:
 *   "PKCS#11"         → appears in the HSM toggle description before any run
 *   "CertificateVerify routes through PKCS#11" → ditto
 */
import { test, expect } from '@playwright/test'

const suppressToast = async ({ page }: { page: import('@playwright/test').Page }) => {
  await page.addInitScript(() => {
    try {
      // '99.0.0' is the built-in E2E sentinel — suppresses WhatsNew modal entirely
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
    } catch {
      // ignore
    }
  })
}

test.describe('TLS 1.3 Simulator — Phase 3 HSM Integration', () => {
  test.beforeEach(suppressToast)

  // ── Quick visibility checks (no WASM execution) ──────────────────────────

  test('HSM mode toggle is visible and changes label to HSM ON when clicked', async ({ page }) => {
    await page.goto('/learn/tls-basics?tab=workshop')
    await expect(page.getByRole('heading', { name: /tls 1\.3 basics/i })).toBeVisible({
      timeout: 15000,
    })
    const hsmToggle = page.getByRole('button', { name: /HSM OFF/i }).first()
    await expect(hsmToggle).toBeVisible()
    await hsmToggle.click()
    await expect(page.getByRole('button', { name: /HSM ON/i }).first()).toBeVisible({
      timeout: 5000,
    })
  })

  test('Playground TLS simulator HSM toggle is visible', async ({ page }) => {
    await page.goto('/playground/tls-simulator')
    await expect(page.getByRole('button', { name: /HSM OFF/i }).first()).toBeVisible({
      timeout: 15000,
    })
  })

  // ── Simulation runs ──────────────────────────────────────────────────────

  test('HSM OFF run completes and returns a successful negotiation', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/learn/tls-basics?tab=workshop')
    await expect(page.getByRole('heading', { name: /tls 1\.3 basics/i })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByRole('button', { name: /HSM OFF/i }).first()).toBeVisible()

    await page
      .getByRole('button', { name: /Start Full Interaction/i })
      .first()
      .click()

    // WASM must finish before "Run Again" button appears
    await expect(page.getByRole('button', { name: /Run Again/i }).first()).toBeVisible({
      timeout: 90_000,
    })
    await expect(page.getByText(/Negotiation Successful/i).first()).toBeVisible()
  })

  test('HSM ON run enters the HSM code path (trace proves WASM execution)', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/learn/tls-basics?tab=workshop')
    await expect(page.getByRole('heading', { name: /tls 1\.3 basics/i })).toBeVisible({
      timeout: 15000,
    })

    // Toggle HSM ON
    await page
      .getByRole('button', { name: /HSM OFF/i })
      .first()
      .click()
    await expect(page.getByRole('button', { name: /HSM ON/i }).first()).toBeVisible()

    // Run
    await page
      .getByRole('button', { name: /Start Full Interaction/i })
      .first()
      .click()

    // Wait for WASM to finish — "Run Again" replaces "Start Full Interaction"
    await expect(page.getByRole('button', { name: /Run Again/i }).first()).toBeVisible({
      timeout: 90_000,
    })

    // Capture the full rendered page text after simulation is complete
    const bodyText = await page.evaluate(() => document.body.innerText)

    // Strings that can ONLY appear as trace event details from tls_simulation_hsm.c.
    // Ordered by depth: "Live HSM enabled" fires first (entry), "C_GenerateKeyPair"
    // fires only on keygen success, "HSM setup failed" fires on any failure.
    const hsmTraceTexts = [
      'Live HSM enabled', // hsm_mode event — confirms HSM code entered
      'C_Initialize', // pkcs11_call event — confirms softhsmv3 init succeeded
      'C_GetSlotList', // pkcs11_call event
      'C_OpenSession', // pkcs11_call event
      'C_GenerateKeyPair', // pkcs11_call event — confirms ML-DSA-65 keygen in HSM
      'C_GetAttributeValue', // pkcs11_call event — confirms SPKI extracted
      'hsm_cert_minted', // cert created and loaded into SSL_CTX
      'HSM setup failed', // fallback warning — HSM path entered but failed
      'C_GetFunctionList unavailable', // shim failure
    ]

    const matched = hsmTraceTexts.filter((t) => bodyText.includes(t))

    if (matched.length === 0) {
      throw new Error(
        `HSM code path was NOT reached in the trace.\n` +
          `None of ${JSON.stringify(hsmTraceTexts)} found.\n` +
          `Body snippet (first 3000 chars):\n${bodyText.slice(0, 3000)}`
      )
    }

    console.log(`[tls-hsm] HSM trace evidence found: ${JSON.stringify(matched)}`)

    // The entry sentinel must always be present
    expect(matched).toContain('Live HSM enabled')

    // Ideal success path — keygen happened
    const keygenSucceeded = bodyText.includes('C_GenerateKeyPair(CKM_ML_DSA')
    const keygenFailed = bodyText.includes('C_GenerateKeyPair rv=')
    const initSucceeded = bodyText.includes('C_Initialize')
    const handshakeSucceeded = bodyText.includes('Negotiation Successful')

    // Extract the rv error code if keygen failed (for diagnostics)
    const keygenRvMatch = bodyText.match(/C_GenerateKeyPair rv=(0x[0-9a-fA-F]+)/)
    const keygenRv = keygenRvMatch?.[1] ?? 'none'

    console.log(
      `[tls-hsm] C_Initialize=${initSucceeded} ` +
        `C_GenerateKeyPair_success=${keygenSucceeded} ` +
        `C_GenerateKeyPair_failed_rv=${keygenFailed ? keygenRv : 'no'} ` +
        `Negotiation=${handshakeSucceeded}`
    )

    // Dump HSM-related lines for deeper diagnosis
    const hsmLines = bodyText
      .split('\n')
      .filter(
        (l) =>
          l.includes('hsm') ||
          l.includes('HSM') ||
          l.includes('C_') ||
          l.includes('pkcs11') ||
          l.includes('PKCS11') ||
          l.includes('softhsm') ||
          l.includes('provider')
      )
      .slice(0, 40)
    console.log(`[tls-hsm] Relevant trace lines:\n${hsmLines.join('\n')}`)

    // If the handshake succeeded, keygen must have succeeded too
    if (handshakeSucceeded) {
      expect(keygenSucceeded).toBe(true)
    }
  })
})
