// SPDX-License-Identifier: GPL-3.0-only
//
// Migration tab — milestone-1 acceptance against the REAL wasm engine:
//   • the tab boots its dedicated engine with migration-classical active,
//   • all SEVEN estate keys generate LABEL-ONLY with the policy-chosen
//     classical algorithms (the app never names an algorithm),
//   • quantum-risk badges are length-aware (AES-256 safe, AES-128 at risk),
//   • encrypt / sign / establish-shared-secret run for real, and
//   • tampering the editable signature field makes Verify fail (the
//     editable-everything contract).
//
// Venue: `*.local.spec.ts` — excluded from CI (project directive 2026-07-01).
import { test, expect } from '@playwright/test'

const ESTATE: Array<{ id: string; algo: string }> = [
  { id: 'vault', algo: 'AES-256' },
  { id: 'payments', algo: 'AES-128' },
  { id: 'partner', algo: 'X25519' },
  { id: 'interbank', algo: 'X448' },
  { id: 'firmware', algo: 'RSA-2048' },
  { id: 'api', algo: 'ECDSA-P256' },
  { id: 'code', algo: 'Ed25519' },
]

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
  })
})

test('classical estate: label-only generation, real crypto, tamper detection', async ({ page }) => {
  test.setTimeout(180_000)
  await page.goto('/playground/cacp')
  await expect(page.getByRole('heading', { name: /KMIP Control Plane/i })).toBeVisible({
    timeout: 30_000,
  })
  await page.getByRole('tab', { name: 'Migration Estate', exact: true }).click()

  // Engine boots with the classical estate policy active.
  const rail = page.getByTestId('migration-policy-migration-classical')
  await expect(rail).toBeVisible({ timeout: 30_000 })
  await expect(rail).toHaveAttribute('aria-checked', 'true')

  // Generate all seven keys label-only; assert the POLICY chose the algorithm.
  for (const k of ESTATE) {
    await page.getByTestId(`migration-generate-${k.id}`).click()
    await expect(page.getByTestId(`migration-algo-${k.id}`)).toHaveText(`policy chose ${k.algo}`, {
      timeout: 15_000,
    })
  }

  // Length-aware risk badges: 1 safe (AES-256), 6 at risk.
  await expect(page.getByTestId('migration-summary')).toContainText('1 safe')
  await expect(page.getByTestId('migration-summary')).toContainText('6 at risk')

  // AES-128 card: encrypt → ciphertext populates the editable field.
  const paymentsCard = page.getByTestId('migration-card-payments')
  await paymentsCard.getByRole('button', { name: 'Encrypt' }).click()
  await expect(page.getByTestId('migration-ciphertext-payments')).not.toHaveValue('', {
    timeout: 15_000,
  })

  // Ed25519 card: sign → verify valid → tamper the signature → verify fails.
  const codeCard = page.getByTestId('migration-card-code')
  await codeCard.getByRole('button', { name: 'Sign', exact: true }).click()
  const sigField = page.getByTestId('migration-signature-code')
  await expect(sigField).not.toHaveValue('', { timeout: 15_000 })
  await codeCard.getByRole('button', { name: 'Verify' }).click()
  await expect(page.getByTestId('migration-verdict-code')).toContainText('valid')

  const sig = await sigField.inputValue()
  const tampered = (sig[0] === '0' ? '1' : '0') + sig.slice(1)
  await sigField.fill(tampered)
  await codeCard.getByRole('button', { name: 'Verify' }).click()
  await expect(page.getByTestId('migration-verdict-code')).toContainText('INVALID')

  // X448 card: establish + decapsulate → both sides derive the same secret.
  const interbankCard = page.getByTestId('migration-card-interbank')
  await interbankCard.getByRole('button', { name: 'Establish shared secret' }).click()
  await expect(page.getByTestId('migration-kemct-interbank')).not.toHaveValue('', {
    timeout: 15_000,
  })
  await interbankCard.getByRole('button', { name: 'Decapsulate' }).click()
  await expect(page.getByTestId('migration-kem-match-interbank')).toContainText('secrets match')
})
