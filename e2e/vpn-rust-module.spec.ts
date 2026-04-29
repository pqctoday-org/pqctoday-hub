// e2e/vpn-rust-module.spec.ts
// Comprehensive E2E test — all KEM × auth combinations with WASM module
// Uses URL query params for PSK scenarios; explicit UI clicks for dual-auth
// (vpnCertAutostart=1 was unreliable under React StrictMode timer cleanup).

import { test, expect } from '@playwright/test'

const BASE = '/playground/hsm'
const VPN_TAB = 'tab=vpn_sim'
const TIMEOUT = 90_000
const CERTGEN_TIMEOUT = 60_000

async function suppressWhatsNew(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    // Unregister SW + clear caches so tests never serve a stale WASM binary.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister())
      })
    }
    if ('caches' in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
    }
  })
}

/** Navigate with query params and wait for handshake result */
async function runVpnScenario(
  page: import('@playwright/test').Page,
  mode: string,
  auth: 'psk' | 'dual'
) {
  await suppressWhatsNew(page)
  const url = `${BASE}?${VPN_TAB}&vpnMode=${mode}&vpnAuth=${auth}&vpnAutostart=1&vpnRpc=1`
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })

  const result = await Promise.race([
    page
      .waitForFunction(
        () => {
          const t = document.body.innerText
          return (
            t.includes('ML-KEM shared secret') ||
            t.includes('ECDH shared secret') ||
            t.includes('ESTABLISHED')
          )
        },
        { timeout: TIMEOUT }
      )
      .then(() => 'success' as const),
    page
      .waitForFunction(
        () => {
          const t = document.body.innerText
          return (
            t.includes('key derivation failed') ||
            t.includes('ABORTED') ||
            t.includes('get_shared_secret called before')
          )
        },
        { timeout: TIMEOUT }
      )
      .then(() => 'failure' as const),
  ])

  const body = await page.evaluate(() => document.body.innerText)
  const logs = body
    .split('\n')
    .filter(
      (l) =>
        l.includes('[RPC]') ||
        l.includes('shared secret') ||
        l.includes('[error]') ||
        l.includes('ESTABLISHED')
    )
  console.log(`\n=== ${mode} × ${auth} ===`)
  logs.slice(-15).forEach((l) => console.log(`  ${l.trim()}`))

  return { result, body }
}

// ── PSK Test Matrix ───────────────────────────────────────────────────────────

const PSK_SCENARIOS = [
  { mode: 'classical', expectEcdh: true, expectMlKem: false },
  { mode: 'hybrid', expectEcdh: true, expectMlKem: true },
  { mode: 'pure-pqc', expectEcdh: false, expectMlKem: true },
] as const

for (const { mode, expectEcdh, expectMlKem } of PSK_SCENARIOS) {
  test(`VPN ${mode} × PSK — Rust WASM`, async ({ page }) => {
    test.setTimeout(60_000)
    const { result, body } = await runVpnScenario(page, mode, 'psk')

    expect(result, `Handshake failed for ${mode} × psk`).toBe('success')

    if (expectMlKem) {
      expect(body).toContain('ML-KEM shared secret')
    }
    if (expectEcdh) {
      expect(body).toContain('ECDH shared secret')
    }
  })
}

// ── ML-DSA Dual-Auth Test Matrix ──────────────────────────────────────────────
// Drives the UI explicitly (Generate Certs → Start Daemon) rather than using
// vpnCertAutostart=1, which was unreliable due to StrictMode timer cleanup.
//
// Architecture: each worker has its own in-process softhsmv3 (statically linked
// into strongswan.wasm). The panel provisions ML-DSA keys via PANEL_PKCS11
// postMessage RPC, writes cert PEMs via WRITE_FILES, then charon does all
// signing in-process. ML-KEM (pure-pqc/hybrid) also runs in-process.
// See vpnsimulationmldsa.md for the full working spec.

for (const { mode, expectEcdh, expectMlKem } of PSK_SCENARIOS) {
  test(`VPN ${mode} × ML-DSA dual auth — ESTABLISHED via cert (NOT PSK fallback)`, async ({
    page,
  }) => {
    test.setTimeout(240_000)
    await suppressWhatsNew(page)

    await page.goto(`${BASE}?${VPN_TAB}&vpnMode=${mode}&vpnAuth=dual&vpnRpc=1`, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    })

    // Set client alg to ML-DSA (default may be RSA)
    const clientAlgSelect = page.locator('select').filter({ hasText: 'ML-DSA (PQC)' }).first()
    await clientAlgSelect.selectOption('ML-DSA')

    // Switch to Server tab and set server alg to ML-DSA
    await page
      .getByRole('button', { name: /Server Token/i })
      .first()
      .click()
    const serverAlgSelect = page.locator('select').filter({ hasText: 'ML-DSA (PQC)' }).first()
    await serverAlgSelect.selectOption('ML-DSA')

    // Generate Certs
    const genBtn = page.locator('[data-testid="vpn-gen-certs"]')
    await expect(genBtn).toBeVisible({ timeout: 5_000 })
    await expect(genBtn).toBeEnabled({ timeout: 5_000 })
    await genBtn.click()

    // Wait for Start Daemon to be enabled (cert gen complete)
    const startBtn = page.locator('[data-testid="vpn-start-daemon"]')
    await expect(startBtn).toBeEnabled({ timeout: CERTGEN_TIMEOUT })
    await startBtn.click()

    // Race: ESTABLISHED (success) vs PSK fallback or error (failure)
    const established = page
      .locator('text=/IKE_SA wasm\\[\\d+\\] state change.*ESTABLISHED/')
      .first()
    const pskFallback = page.locator('text=/authentication of .* with pre-shared key/').first()
    const errorMarker = page
      .locator('text=/no private key found|key derivation failed|ABORTED/')
      .first()

    const result = await Promise.race([
      established.waitFor({ timeout: TIMEOUT }).then(() => 'established' as const),
      pskFallback.waitFor({ timeout: TIMEOUT }).then(() => 'psk_fallback' as const),
      errorMarker.waitFor({ timeout: TIMEOUT }).then(() => 'error' as const),
    ]).catch(() => 'timeout' as const)

    const body = await page.evaluate(() => document.body.innerText)
    const logs = body
      .split('\n')
      .filter(
        (l) =>
          l.includes('C_SignInit') ||
          l.includes('ESTABLISHED') ||
          l.includes('pre-shared') ||
          l.includes('[error]')
      )
    console.log(`\n=== ${mode} × dual (result: ${result}) ===`)
    logs.slice(-20).forEach((l) => console.log(`  ${l.trim()}`))

    expect(result, `Expected ESTABLISHED via ML-DSA cert auth, got: ${result}`).toBe('established')
    expect(body).not.toContain('with pre-shared key')
    expect(body).toContain('C_SignInit')

    if (expectMlKem) expect(body).toContain('ML-KEM')
    if (expectEcdh) expect(body).toContain('ECDH')
  })
}
