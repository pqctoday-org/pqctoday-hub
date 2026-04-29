// Diagnostic / explicit-click VPN E2E.
// Bypasses the broken `?vpnAutostart=1` URL handler (StrictMode timer-cleanup bug).
// Asserts against the charon.log container content, not document body
// innerText (which includes documentation/footer noise).

import { test, expect, type Page } from '@playwright/test'

const BASE = '/playground/hsm?tab=vpn_sim'
const HANDSHAKE_TIMEOUT = 90_000

async function suppressWhatsNew(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
  })
}

test('VPN pure-pqc PSK — explicit Start Daemon click reaches ESTABLISHED', async ({ page }) => {
  test.setTimeout(150_000)
  await suppressWhatsNew(page)

  await page.goto(`${BASE}&vpnMode=pure-pqc&vpnAuth=psk&vpnRpc=1`, {
    waitUntil: 'networkidle',
    timeout: 30_000,
  })

  const startBtn = page.locator('[data-testid="vpn-start-daemon"]')
  await expect(startBtn).toBeVisible({ timeout: 15_000 })
  await expect(startBtn).toBeEnabled({ timeout: 15_000 })
  await startBtn.click()

  // Charon log lines render into the daemon log scroll container in the
  // Diagnostic Boundary section. Watch for the ESTABLISHED state change
  // log specifically (not just the substring elsewhere on the page).
  const handshakeMarker = page
    .locator('text=/IKE_SA wasm\\[\\d+\\] state change.*ESTABLISHED/')
    .first()

  const failureMarker = page.locator('text=/ABORTED|key derivation failed/').first()

  // Race: which marker appears first
  const result = await Promise.race([
    handshakeMarker.waitFor({ timeout: HANDSHAKE_TIMEOUT }).then(() => 'established' as const),
    failureMarker.waitFor({ timeout: HANDSHAKE_TIMEOUT }).then(() => 'failure' as const),
  ]).catch(() => 'timeout' as const)

  if (result !== 'established') {
    // Dump charon log lines for diagnosis
    const charonLines = await page.evaluate(() => {
      const out: string[] = []
      document.querySelectorAll('div').forEach((el) => {
        const txt = (el.textContent || '').slice(0, 200)
        if (
          /\[(ENG|CFG|RPC|IKE|CHD|NET|CERT|BRIDGE|PKCS|ENC|JOB|MGR|LIB)\]/.test(txt) ||
          /CONNECTING|ESTABLISHED|shared secret|ABORTED/.test(txt)
        ) {
          if (!out.includes(txt)) out.push(txt)
        }
      })
      return out.slice(-30)
    })
    console.log('\n=== charon log (last 30 candidate lines) ===')
    charonLines.forEach((l) => console.log('  ' + l))
  }

  expect(result).toBe('established')

  // Diagnostic: do we see pkcs11_manager's "found token in slot" log?
  const body = await page.evaluate(() => document.body.innerText)
  const sawFoundToken = /found token in slot/.test(body)
  const sawLoadedPkcs11 = /loaded PKCS#11 v/.test(body)
  console.log(`pkcs11_manager "found token in slot": ${sawFoundToken}`)
  console.log(`pkcs11_library "loaded PKCS#11 v": ${sawLoadedPkcs11}`)
})
