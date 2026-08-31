// SPDX-License-Identifier: GPL-3.0-only
//
// vpn-kem-size-selector.spec.ts — E2E coverage for the real, user-facing
// ML-KEM Size control added to VpnSimulationPanel.tsx (2026-08-31). Unlike
// e2e/_kem-size-verify.local.spec.ts (which drives the ?vpnKemProposal= raw
// test hook to prove the underlying WASM_IKE_PROPOSAL mechanism works at
// all, and never runs in CI), this spec clicks the actual
// [data-testid="vpn-kem-size-512"] / "-1024" UI buttons — proving the
// selector itself threads through to a real negotiated IKE_SA and real
// PKCS#11 KEM operations at the selected FIPS 203 parameter set, not just
// that the raw override plumbing works.
//
// Trace-evidence pattern mirrors _kem-size-verify.local.spec.ts: a real
// state change to ESTABLISHED plus a C_EncapsulateKey ct_len that matches
// the requested size exactly (768B=ML-KEM-512, 1568B=ML-KEM-1024 per
// FIPS 203), proving the negotiated size reached real PKCS#11 keygen rather
// than a silent 768 fallback.

import { test, expect, type Page } from '@playwright/test'

const BASE = '/playground/vpn-sim'
const HANDSHAKE_TIMEOUT = 120_000

async function suppressWhatsNew(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
  })
}

const SIZES = [
  { size: 512, ctLen: 768, nistLevel: 'Level 1', pubBytes: '800' },
  { size: 1024, ctLen: 1568, nistLevel: 'Level 5', pubBytes: '1,568' },
] as const

test.describe('VPN ML-KEM Size selector (real UI control)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Requires Chromium')

  test('classical mode disables the ML-KEM Size selector (no KEM at all)', async ({ page }) => {
    await suppressWhatsNew(page)
    await page.goto(`${BASE}?vpnMode=classical`, { waitUntil: 'networkidle', timeout: 30_000 })

    const size768 = page.locator('[data-testid="vpn-kem-size-768"]')
    await expect(size768).toBeVisible({ timeout: 15_000 })
    await expect(size768).toBeDisabled()
  })

  test('default (no size clicked) reaches ESTABLISHED at ML-KEM-768', async ({ page }) => {
    test.setTimeout(180_000)
    await suppressWhatsNew(page)
    await page.goto(`${BASE}?vpnMode=pure-pqc&vpnAuth=psk&vpnRpc=1`, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    })

    const size768 = page.locator('[data-testid="vpn-kem-size-768"]')
    await expect(size768).toBeVisible({ timeout: 15_000 })
    await expect(size768).toHaveAttribute('aria-pressed', 'true')

    const startBtn = page.locator('[data-testid="vpn-start-daemon"]')
    await expect(startBtn).toBeEnabled({ timeout: 30_000 })
    await startBtn.click()

    const statusBtn = page.locator('[data-testid="vpn-status-button"]')
    await expect(statusBtn).toHaveText(/Tunnel Established/i, { timeout: HANDSHAKE_TIMEOUT })

    const body = await page.evaluate(() => document.body.innerText)
    const ctLenMatch = body.match(/C_EncapsulateKey[^\n]*ct_len=(\d+)/)
    expect(ctLenMatch, 'Expected a C_EncapsulateKey trace line with ct_len=').not.toBeNull()
    expect(Number(ctLenMatch?.[1])).toBe(1088)
  })

  for (const { size, ctLen, nistLevel, pubBytes } of SIZES) {
    test(`clicking ML-KEM-${size} drives a real ML-KEM-${size} negotiated session`, async ({
      page,
    }) => {
      test.setTimeout(180_000)
      await suppressWhatsNew(page)

      await page.goto(`${BASE}?vpnMode=pure-pqc&vpnAuth=psk&vpnRpc=1`, {
        waitUntil: 'networkidle',
        timeout: 30_000,
      })

      // Drive the REAL UI control — no ?vpnKemProposal= override in this URL.
      const sizeBtn = page.locator(`[data-testid="vpn-kem-size-${size}"]`)
      await expect(sizeBtn).toBeVisible({ timeout: 15_000 })
      await expect(sizeBtn).toBeEnabled()
      await sizeBtn.click()
      await expect(sizeBtn).toHaveAttribute('aria-pressed', 'true')

      // The selector's own note updates immediately (no daemon needed) —
      // confirms the control's live display, not just its click handler.
      await expect(page.getByText(`NIST ${nistLevel}`, { exact: false })).toBeVisible()
      await expect(
        page.getByText(`encapsulation key ${pubBytes} B`, { exact: false })
      ).toBeVisible()

      const startBtn = page.locator('[data-testid="vpn-start-daemon"]')
      await expect(startBtn).toBeVisible({ timeout: 15_000 })
      await expect(startBtn).toBeEnabled({ timeout: 30_000 })
      await startBtn.click()

      const handshakeMarker = page
        .locator('text=/IKE_SA wasm\\[\\d+\\] state change.*ESTABLISHED/')
        .first()
      const failureMarker = page.locator('text=/ABORTED|key derivation failed/').first()

      const result = await Promise.race([
        handshakeMarker.waitFor({ timeout: HANDSHAKE_TIMEOUT }).then(() => 'established' as const),
        failureMarker.waitFor({ timeout: HANDSHAKE_TIMEOUT }).then(() => 'failure' as const),
      ]).catch(() => 'timeout' as const)

      const body = await page.evaluate(() => document.body.innerText)

      if (result !== 'established') {
        console.log(
          `\n=== ML-KEM-${size} (UI selector) FAILED (result=${result}) — last 40 log lines ===`
        )
        body
          .split('\n')
          .filter((l) => l.trim())
          .slice(-40)
          .forEach((l) => console.log('  ' + l))
      }

      expect(result, `Expected real ML-KEM-${size} handshake to reach ESTABLISHED`).toBe(
        'established'
      )

      // Real C_EncapsulateKey ciphertext length proves the negotiated size
      // actually reached PKCS#11 keygen — not a silent 768 fallback.
      const ctLenMatch = body.match(/C_EncapsulateKey[^\n]*ct_len=(\d+)/)
      console.log(
        `\n=== ML-KEM-${size} (UI selector): C_EncapsulateKey trace: ${ctLenMatch?.[0] ?? 'NOT FOUND'}`
      )
      expect(ctLenMatch, 'Expected a C_EncapsulateKey trace line with ct_len=').not.toBeNull()
      expect(Number(ctLenMatch?.[1])).toBe(ctLen)

      // Tunnel Statistics reflects the real negotiated size, not a stale
      // hardcoded "Level 3"/"ML-KEM-768" — the label-audit half of this fix.
      await expect(page.getByText(nistLevel).first()).toBeVisible()
      await expect(page.getByText(`ML-KEM-${size}`).first()).toBeVisible()

      // Scorecard's "PQC key exchange" indicator also reports the real size.
      const scorecard = page.locator('[data-testid="vpn-scorecard"]')
      await expect(scorecard).toBeVisible({ timeout: 15_000 })
      await expect(scorecard).toContainText(`ML-KEM-${size}`)
    })
  }
})
