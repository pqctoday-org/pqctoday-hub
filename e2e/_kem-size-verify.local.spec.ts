// TEMPORARY, UNCOMMITTED verification spec — NOT part of the regular suite.
// Exercises ML-KEM-512 and ML-KEM-1024 (previously only 768 worked in the
// strongswan-pkcs11 plugin) through the real WASM_IKE_PROPOSAL test hook
// added to wasm_backend.c + threaded here via bridge.ts/strongswan_worker.js/
// VpnSimulationPanel.tsx's vpnKemProposal URL param (all uncommitted, for
// this verification only). Confirms a REAL negotiated IKE_SA (state change
// to ESTABLISHED) plus a C_EncapsulateKey ciphertext length that matches the
// requested ML-KEM size (768B=512, 1088B=768, 1568B=1024 per FIPS 203),
// proving the actual PKCS#11 keygen/encapsulate ran at that parameter set
// rather than silently falling back to 768.

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
  { size: 512, proposal: 'aes256-sha256-mlkem512', ctLen: 768 },
  { size: 1024, proposal: 'aes256-sha256-mlkem1024', ctLen: 1568 },
] as const

for (const { size, proposal, ctLen } of SIZES) {
  test(`VPN pure-pqc PSK — real ML-KEM-${size} negotiated session (WASM_IKE_PROPOSAL override)`, async ({
    page,
  }) => {
    test.setTimeout(180_000)
    await suppressWhatsNew(page)

    await page.goto(
      `${BASE}?vpnMode=pure-pqc&vpnAuth=psk&vpnRpc=1&vpnKemProposal=${encodeURIComponent(proposal)}`,
      { waitUntil: 'networkidle', timeout: 30_000 }
    )

    const startBtn = page.locator('[data-testid="vpn-start-daemon"]')
    await expect(startBtn).toBeVisible({ timeout: 60_000 })
    await expect(startBtn).toBeEnabled({ timeout: 60_000 })
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
      console.log(`\n=== ML-KEM-${size} FAILED (result=${result}) — last 40 log lines ===`)
      body
        .split('\n')
        .filter((l) => l.trim())
        .slice(-40)
        .forEach((l) => console.log('  ' + l))
    }

    expect(result, `Expected real ML-KEM-${size} handshake to reach ESTABLISHED`).toBe(
      'established'
    )

    // Real C_EncapsulateKey ciphertext length proves the negotiated size,
    // not just that the daemon came up (which could silently be 768).
    const ctLenMatch = body.match(/C_EncapsulateKey[^\n]*ct_len=(\d+)/)
    console.log(`\n=== ML-KEM-${size}: C_EncapsulateKey trace: ${ctLenMatch?.[0] ?? 'NOT FOUND'}`)
    expect(ctLenMatch, 'Expected a C_EncapsulateKey trace line with ct_len=').not.toBeNull()
    expect(Number(ctLenMatch?.[1])).toBe(ctLen)
  })
}
