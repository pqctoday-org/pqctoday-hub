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

  test.skip('HSM mode toggle is visible and changes label to HSM ON when clicked', async ({
    // The TLS simulator HSM ON/OFF toggle was removed — the wiring never produced a
    // successful handshake and was misleading. Skipped pending deliberate revival.
    // See TLSBasicsModule.tsx "⚠ HSM-backed signing — removed" callout.
    page: _page,
  }) => {
    void _page
  })

  test.skip('Playground TLS simulator HSM toggle is visible', async ({
    // Toggle removed — see above.
    page: _page,
  }) => {
    void _page
  })

  // ── Simulation runs ──────────────────────────────────────────────────────

  test('simulation run completes and returns a successful negotiation', async ({ page }) => {
    test.setTimeout(120_000)

    await page.goto('/learn/tls-basics?tab=workshop')
    await expect(page.getByRole('heading', { name: /tls 1\.3 basics/i })).toBeVisible({
      timeout: 15000,
    })

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

  test.skip('HSM ON run enters the HSM code path (trace proves WASM execution)', async ({
    // The TLS simulator HSM ON/OFF toggle was removed — JS plumbing to
    // tls_simulation_set_hsm_mode was never wired. Skipped pending deliberate revival.
    // See TLSBasicsModule.tsx "⚠ HSM-backed signing — removed" callout.
    page: _page,
  }) => {
    void _page
  })
})
