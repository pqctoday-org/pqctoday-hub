// e2e/vpn-pqc-runtime.spec.ts
// Verifies the three runtime capabilities added to the strongSwan WASM build
// (branch feat/wasm-vpn-frag-multike-childsa in pqctoday-hsm):
//   1. RFC 9370 multi-KE — hybrid runs a REAL IKE_INTERMEDIATE round
//      (mlkem768-ke1_ecp256) instead of [SIM] narration.
//   2. RFC 7383 fragmentation — over-size ML-DSA IKE_AUTH splits into real
//      SKF fragments and reassembles on the peer.
//   3. CHILD_SA — negotiated for real via the stub kernel (SPIs allocated).

import { test, expect, type Page } from '@playwright/test'

const BASE = '/playground/vpn-sim'

async function suppressWhatsNew(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
  })
}

async function startDaemon(page: Page) {
  const startBtn = page.locator('[data-testid="vpn-start-daemon"]')
  await startBtn.waitFor({ state: 'attached', timeout: 15_000 })
  await page.waitForFunction(
    () => !document.querySelector<HTMLButtonElement>('[data-testid="vpn-start-daemon"]')?.disabled,
    undefined,
    { timeout: 30_000 }
  )
  await startBtn.click()
}

test.describe('VPN PQC runtime capabilities', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Requires Chromium')

  test('hybrid × PSK: real IKE_INTERMEDIATE (RFC 9370) + real CHILD_SA', async ({ page }) => {
    test.setTimeout(180_000)
    await suppressWhatsNew(page)
    await page.goto(`${BASE}?vpnMode=hybrid&vpnAuth=psk&vpnRpc=1`, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    })
    await startDaemon(page)

    await page.locator('text=/state change.*ESTABLISHED/').first().waitFor({ timeout: 120_000 })
    await page.waitForTimeout(1500)
    const body = await page.evaluate(() => document.body.innerText)

    // Multi-KE proposal negotiated and a real IKE_INTERMEDIATE round ran.
    expect(body).toContain('KE1_ECP_256')
    expect(body).toMatch(/generating IKE_INTERMEDIATE request/)
    expect(body).toMatch(/parsed IKE_INTERMEDIATE response/)
    // No synthetic narration remains.
    expect(body).not.toContain('[SIM] IKE_INTERMEDIATE')
    expect(body).not.toContain('[SIM] CREATE_CHILD_SA')
    // Real CHILD_SA with stub-kernel SPIs.
    expect(body).toMatch(/CHILD_SA wasm-child\{1\} established with SPIs/)
  })

  test('classical × ML-DSA dual: IKE_AUTH fragments via RFC 7383 and reassembles', async ({
    page,
  }) => {
    test.setTimeout(240_000)
    await suppressWhatsNew(page)
    await page.goto(`${BASE}?vpnMode=classical&vpnAuth=dual&vpnRpc=1`, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    })

    const clientAlgSelect = page.locator('select').filter({ hasText: 'ML-DSA (PQC)' }).first()
    await clientAlgSelect.selectOption('ML-DSA')
    await page
      .getByRole('button', { name: /Server Token/i })
      .first()
      .click()
    const serverAlgSelect = page.locator('select').filter({ hasText: 'ML-DSA (PQC)' }).first()
    await serverAlgSelect.selectOption('ML-DSA')

    await page.locator('[data-testid="vpn-gen-certs"]').click()
    await startDaemon(page)

    await page.locator('text=/state change.*ESTABLISHED/').first().waitFor({ timeout: 120_000 })
    await page.waitForTimeout(1500)
    const body = await page.evaluate(() => document.body.innerText)

    // The ~9 KB ML-DSA IKE_AUTH must cross as multiple real fragments —
    // every routed packet stays at/below the fragment size, and more than
    // the 6 whole-message packets of an unfragmented handshake appear.
    const routeLens = body
      .split('\n')
      .filter((l) => l.includes('[ROUTE]'))
      .map((l) => parseInt(l.match(/len=(\d+)/)?.[1] ?? '0', 10))
    expect(routeLens.length).toBeGreaterThan(8)
    expect(Math.max(...routeLens)).toBeLessThanOrEqual(1500)
    // Charon reassembled and authenticated via ML-DSA, not PSK.
    expect(body).toMatch(/CHILD_SA wasm-child\{1\} established with SPIs/)
    expect(body).toContain('C_SignInit')
    expect(body).not.toContain('with pre-shared key')
  })
})
