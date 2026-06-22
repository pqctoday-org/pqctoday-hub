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
    // Drive the page in Expert mode so the KMIP Wire panel + raw-bytes view are
    // rendered (Guided mode hides them behind the progressive-disclosure toggle).
    localStorage.setItem('cacp-mode', 'expert')
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

  // Default algorithm is the PQC signer ML-DSA-65 → signing lifecycle. The
  // algorithm picker is now a FilterDropdown (button trigger), wrapped in a
  // testid hook; its trigger shows the selected label.
  await expect(page.getByTestId('kmip-algo')).toContainText('ML-DSA-65')

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

  // The KMIP Wire response lives in the Inspector's "KMIP Wire" tab (Expert).
  await page.getByRole('button', { name: 'KMIP Wire' }).click()
  // Real TTLV came back on the wire (non-zero byte count in the wire panel).
  await expect(page.getByText(/\d+ bytes on the wire/i)).toBeVisible()
  // The raw bytes are actually shown (not just claimed) — the literal hex view.
  await expect(page.getByText(/Raw bytes \(hex\)/i)).toBeVisible()

  // 4 · Verify the signature we just produced.
  const verify = page.getByRole('button', { name: '4 · Verify' })
  await expect(verify).toBeEnabled()
  await verify.click()
  await expect(result.getByText('SignatureVerify', { exact: true })).toBeVisible({ timeout: 15000 })
})

test('agility scenario migrates classical → PQC, and the "migrated" claim is backed by a real Rekey decision', async ({
  page,
}) => {
  await page.goto('/playground/cacp')
  await expect(page.getByRole('heading', { name: /Crypto-Agility Control Plane/i })).toBeVisible({
    timeout: 30000,
  })

  await page.getByRole('button', { name: /Run the agility scenario/i }).click()

  // The headline payoff: the same CreateKeyPair call resolves to two different
  // algorithms (classical under one policy, PQC under the other).
  await expect(page.getByText('Same call')).toBeVisible({ timeout: 20000 })

  // The final step claims the OLD classical key was auto-migrated — and that
  // claim must be accompanied by a real Rekey decision badge (the fix: never
  // show "migrated" on a plain Allow).
  const migratedStep = page.getByText(/transparently migrated →/i).locator('../..')
  await expect(migratedStep).toBeVisible({ timeout: 20000 })
  await expect(migratedStep.getByText('Rekey')).toBeVisible()
})

test('switching policy resolves a decision on the agility plane', async ({ page }) => {
  await page.goto('/playground/cacp')
  await expect(page.getByRole('heading', { name: /Crypto-Agility Control Plane/i })).toBeVisible({
    timeout: 30000,
  })

  // The Active-Policy strip lists the presets as chips; clicking one loads it and
  // marks the chip active.
  await expect(page.getByRole('heading', { name: /Plane 1 · Active Policy/i })).toBeVisible()
  const pqcChip = page.getByRole('button', { name: /PQC \(the "after"\)/i })
  await pqcChip.click()
  await expect(pqcChip.getByText('active', { exact: true })).toBeVisible({ timeout: 15000 })
})
