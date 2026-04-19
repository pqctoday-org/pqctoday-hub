// e2e/vpn-rust-module.spec.ts
// Comprehensive E2E test — all KEM × auth combinations with Rust WASM module
// Uses URL query params to avoid UI coupling:
//   ?vpnMode=classical|hybrid|pure-pqc
//   &vpnAuth=psk|dual
//   &vpnAutostart=1
//   &vpnRpc=1

import { test, expect } from '@playwright/test'

const BASE = '/playground/vpn-ssh'
const TIMEOUT = 90_000

/** Navigate with query params and wait for handshake result */
async function runVpnScenario(
  page: import('@playwright/test').Page,
  mode: string,
  auth: 'psk' | 'dual'
) {
  const url = `${BASE}?vpnMode=${mode}&vpnAuth=${auth}&vpnAutostart=1&vpnRpc=1`
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })

  // Wait for either shared secret or error
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

  // Capture key log lines
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

// ── Test Matrix ──────────────────────────────────────────────────────────────
// 6 scenarios: 3 modes × 2 auth types
// Note: dual (PSK+Cert) with autostart needs certs generated first — skipped for now

const PSK_SCENARIOS = [
  { mode: 'classical', expectEcdh: true, expectMlKem: false },
  { mode: 'hybrid', expectEcdh: true, expectMlKem: true },
  { mode: 'pure-pqc', expectEcdh: false, expectMlKem: true },
] as const

for (const { mode, expectEcdh, expectMlKem } of PSK_SCENARIOS) {
  test(`VPN ${mode} × PSK — Rust WASM`, async ({ page }) => {
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

// PSK+Cert tests require clicking Generate Certs first — use minimal UI interaction
for (const { mode, expectEcdh, expectMlKem } of PSK_SCENARIOS) {
  test(`VPN ${mode} × PSK+Cert — Rust WASM`, async ({ page }) => {
    // Navigate with mode + auth pre-configured but WITHOUT autostart
    const url = `${BASE}?vpnMode=${mode}&vpnAuth=dual&vpnRpc=1`
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })

    // Click Generate Certs
    const genBtn = page.locator('button', { hasText: /Generate Certs/i }).first()
    await expect(genBtn).toBeVisible({ timeout: 10_000 })
    await genBtn.click()

    // Wait for cert generation to complete
    await page.waitForFunction(
      () =>
        document.body.innerText.includes('Regenerate Certs') ||
        document.body.innerText.includes('Inspect'),
      { timeout: 30_000 }
    )

    // Now click Start Daemon
    const startBtn = page.locator('[data-testid="vpn-start-daemon"]')
    await expect(startBtn).toBeEnabled({ timeout: 10_000 })
    await startBtn.click()

    // Wait for handshake result
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
            return t.includes('key derivation failed') || t.includes('ABORTED')
          },
          { timeout: TIMEOUT }
        )
        .then(() => 'failure' as const),
    ])

    const body = await page.evaluate(() => document.body.innerText)
    const logs = body
      .split('\n')
      .filter((l) => l.includes('[RPC]') || l.includes('shared secret') || l.includes('[error]'))
    console.log(`\n=== ${mode} × dual ===`)
    logs.slice(-15).forEach((l) => console.log(`  ${l.trim()}`))

    expect(result, `Handshake failed for ${mode} × dual`).toBe('success')

    if (expectMlKem) {
      expect(body).toContain('ML-KEM shared secret')
    }
    if (expectEcdh) {
      expect(body).toContain('ECDH shared secret')
    }
  })
}
