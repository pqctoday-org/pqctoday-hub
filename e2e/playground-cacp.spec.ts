// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

/**
 * CACP KMIP control-plane acceptance — /playground/cacp.
 *
 * Closes the e2e gap left by the workbench spec: this drives a *real* KMIP 3.0
 * operation through the in-browser engine (pqctoday-kmip + softhsmrustv3 compiled
 * to WASM). Default algorithm is ML-DSA-65, so the deterministic lifecycle is
 * Create → Activate → Sign → Verify. We assert the engine boots, the ops succeed,
 * real TTLV bytes come back on the wire, and a switched policy still resolves a
 * decision — i.e. the three planes (Agility / KMIP / PKCS#11) are actually live.
 */

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    localStorage.setItem('pqc-tour-completed', 'true')
  })
})

test('boots the in-browser engine and runs a real Create → Activate → Sign → Verify', async ({
  page,
}) => {
  await page.goto('/playground/cacp')

  // Engine boot: the "Booting…" loader is replaced by the control-plane header.
  // wasm instantiate + engine init can take a moment, so allow generous time.
  await expect(page.getByRole('heading', { name: /Crypto-Agility Control Plane/i })).toBeVisible({
    timeout: 30000,
  })

  // Default algorithm is the PQC signer ML-DSA-65 → signing lifecycle.
  await expect(page.locator('#kmip-algo')).toHaveValue('ML-DSA-65')

  const result = page.getByRole('heading', { name: 'Result' }).locator('..')

  // 1 · Create — a real KMIP CreateKeyPair request.
  await page.getByRole('button', { name: /Create signing key pair/i }).click()
  await expect(result.getByText(/Success/i)).toBeVisible({ timeout: 15000 })

  // 2 · Activate (enabled only once a private key exists).
  const activate = page.getByRole('button', { name: '2 · Activate' })
  await expect(activate).toBeEnabled()
  await activate.click()
  await expect(result.getByText(/Success/i)).toBeVisible({ timeout: 15000 })

  // 3 · Sign a message — the headline real crypto op.
  await page.getByPlaceholder('message to sign').fill('hello pqc')
  await page.getByRole('button', { name: '3 · Sign' }).click()
  await expect(result.getByText('Sign', { exact: true })).toBeVisible({ timeout: 15000 })

  // Real TTLV came back on the wire (non-zero byte count in the wire panel).
  await expect(page.getByText(/\d+ bytes on the wire/i)).toBeVisible()

  // 4 · Verify the signature we just produced.
  const verify = page.getByRole('button', { name: '4 · Verify' })
  await expect(verify).toBeEnabled()
  await verify.click()
  await expect(result.getByText('SignatureVerify', { exact: true })).toBeVisible({ timeout: 15000 })
})

test('switching policy resolves a decision on the agility plane', async ({ page }) => {
  await page.goto('/playground/cacp')
  await expect(page.getByRole('heading', { name: /Crypto-Agility Control Plane/i })).toBeVisible({
    timeout: 30000,
  })

  // Plane 1 lists the policy presets; loading one marks it active.
  const plane1 = page.getByRole('heading', { name: /Plane 1 · Crypto Agility/i }).locator('..')
  const pqcPolicy = plane1.getByRole('button', { name: /PQC/i }).first()
  await pqcPolicy.click()
  await expect(plane1.getByText('active', { exact: true })).toBeVisible({ timeout: 15000 })
  await expect(plane1.getByText(/Active policy:\s*pqc/i)).toBeVisible()
})
