// SPDX-License-Identifier: GPL-3.0-only
//
// vpn-psk-handshake.spec.ts — E2E happy path for the PQC VPN simulator.
//
// PSK mode, explicit Start Daemon click (the ?vpnAutostart=1 handler is
// unreliable under React StrictMode — see _vpn-diagnostic.spec.ts), then
// waits for the tunnel-established indicators:
//   - [data-testid="vpn-status-button"] shows 'Tunnel Established'
//   - [data-testid="vpn-scorecard"] appears
// and asserts the charon.log panel produced content.
//
// Requires Chromium (SharedArrayBuffer + COOP/COEP, provided by the Vite dev
// server the playwright webServer config starts).

import { test, expect, type Page } from '@playwright/test'

// The VPN simulator lives at the `vpn-sim` workshop route (see
// workshopRegistry.tsx). Older specs used /playground/hsm?tab=vpn_sim, but the
// HSM playground no longer hosts a VPN tab.
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

test.describe('VPN PSK handshake', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Requires Chromium')

  test('classical × PSK reaches Tunnel Established with scorecard and charon.log output', async ({
    page,
  }) => {
    test.setTimeout(180_000)
    await suppressWhatsNew(page)

    await page.goto(`${BASE}?vpnMode=classical&vpnAuth=psk&vpnRpc=1`, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    })

    // Start the daemon explicitly once the WASM workers are ready.
    const startBtn = page.locator('[data-testid="vpn-start-daemon"]')
    await expect(startBtn).toBeVisible({ timeout: 15_000 })
    await expect(startBtn).toBeEnabled({ timeout: 30_000 })
    await startBtn.click()

    // Tunnel-established indicator: the status button replaces Start Daemon
    // and flips to 'Tunnel Established' once the IKEv2 exchange completes.
    const statusBtn = page.locator('[data-testid="vpn-status-button"]')
    await expect(statusBtn).toHaveText(/Tunnel Established/i, { timeout: HANDSHAKE_TIMEOUT })

    // Scorecard renders only after the tunnel is up.
    const scorecard = page.locator('[data-testid="vpn-scorecard"]')
    await expect(scorecard).toBeVisible({ timeout: 15_000 })
    await expect(scorecard).toContainText(/Tunnel Established/i)
    // Classical baseline framing is always present in the scorecard.
    await expect(scorecard).toContainText(/classical/i)

    // charon.log panel has real daemon output (subsystem-tagged log lines).
    await expect(page.getByText('charon.log').first()).toBeVisible()
    const charonLine = page
      .locator('text=/\\d+\\[(ENG|CFG|IKE|NET|CHD|JOB|MGR|LIB|ENC|RPC)\\]/')
      .first()
    await expect(charonLine).toBeVisible({ timeout: 15_000 })

    // Sanity: the ESTABLISHED state change appears in the daemon log.
    await expect(page.locator('text=/state change.*ESTABLISHED/').first()).toBeVisible({
      timeout: 15_000,
    })
  })
})
