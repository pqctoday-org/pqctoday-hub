// SPDX-License-Identifier: GPL-3.0-only
//
// OpenSSL Studio was the only PKCS#11-capable playground with no call log at
// all — a 2026-08-02 audit found it surfaced only friendly narration
// ("[HSM] Initialized token...") and command/duration rows, never the real
// C_* calls, while the HSM Workshop, VPN and SSH simulators all show a live
// trace. This spec pins the fix: generating a key in the HSM token must
// produce genuine PKCS#11 rows with real CK_RV outcomes.
//
// It deliberately asserts against the SHARED Pkcs11LogPanel's rendering, so
// it also catches a regression where the panel is wired but never populated.
import { test, expect, type Page } from '@playwright/test'

const ROUTE = '/playground/openssl-studio'

async function openStudio(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0', isFirstVisit: false }, version: 3 })
    )
    // Fixed-position and intercepts clicks at the bottom of the viewport if
    // left up — see api-security-jwt-real-crypto.spec.ts for the same trap.
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
  })
  await page.goto(ROUTE)
}

test.describe('OpenSSL Studio — PKCS#11 call log', () => {
  test('HSM keygen produces a real C_* call trace with CK_RV outcomes', async ({ page }) => {
    await openStudio(page)

    // The Studio opens on the Learn tab — the workbench is a sibling tab.
    await page.getByRole('tab', { name: 'Workbench', exact: true }).first().click()

    // openssl.wasm + pkcs11-provider registration is slow on a cold worker.
    await page.getByRole('button', { name: 'PKCS#11 (HSM)' }).click({ timeout: 60_000 })

    await page
      .getByRole('button', { name: /Generate Key in HSM Token/i })
      .click({ timeout: 60_000 })

    // Token provisioning + ML-DSA keygen inside the WASM engine.
    await expect(page.getByText(/pkcs11:object=/i).first()).toBeVisible({ timeout: 120_000 })

    // Output pane toggle: "Terminal" | "Log" — LogsTab (which hosts the
    // PKCS#11 panel) is the latter.
    await page.getByRole('button', { name: 'Log', exact: true }).click()

    const panel = page.getByText(/PKCS#11 Call Log/i).first()
    await expect(panel).toBeVisible()
    await panel.click() // starts collapsed

    // Real lifecycle calls, not narration. C_GenerateKeyPair is the one that
    // proves a crypto operation — not merely session bookkeeping — was traced.
    await expect(page.getByText('C_GenerateKeyPair').first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('C_OpenSession').first()).toBeVisible()
    await expect(page.getByText('C_Login').first()).toBeVisible()

    // Outcomes must come from the engine's actual return value. If keygen had
    // failed, CKR_OK would be absent here rather than the row being hidden —
    // which is the whole point of showing the trace.
    await expect(page.getByText('CKR_OK').first()).toBeVisible()
  })

  // The Studio's key list was previously just React state it populated when it
  // created a key — it could not show a key made elsewhere, and would still
  // list one the token had lost. This asks the token instead.
  test('Token Inventory reads real objects back out of the token', async ({ page }) => {
    await openStudio(page)
    await page.getByRole('tab', { name: 'Workbench', exact: true }).first().click()
    await page.getByRole('button', { name: 'PKCS#11 (HSM)' }).click({ timeout: 60_000 })

    await page
      .getByRole('button', { name: /Generate Key in HSM Token/i })
      .click({ timeout: 60_000 })
    await expect(page.getByText(/pkcs11:object=/i).first()).toBeVisible({ timeout: 120_000 })

    // Nothing is listed until the token is actually queried.
    await page.getByRole('button', { name: /Read from token/i }).click()

    // A keypair must come back as two distinct PKCS#11 object classes. That
    // pairing is what proves this is a genuine C_FindObjects sweep and not a
    // re-render of the UI's own key list, which tracks one entry per keypair.
    await expect(page.getByText('CKO_PRIVATE_KEY').first()).toBeVisible({ timeout: 120_000 })
    await expect(page.getByText('CKO_PUBLIC_KEY').first()).toBeVisible()
  })
})
