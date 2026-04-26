// SPDX-License-Identifier: GPL-3.0-only
//
// ssh-pqc-simulator.spec.ts — E2E tests for the PQC SSH Simulator playground tool.
//
// Static UI tests are browser-agnostic.
// Live handshake tests require Chromium (SharedArrayBuffer + COOP/COEP).

import { test, expect } from '@playwright/test'

test.describe('PQC SSH Simulator', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
    })
    await page.goto('/playground/pqc-ssh-sim')
  })

  // ── Static UI tests (browser-agnostic) ────────────────────────────────────

  test('renders the tool title', async ({ page }) => {
    await expect(page.getByText('PQC SSH Simulator').first()).toBeVisible()
  })

  test('description advertises real softhsmv3 PKCS#11', async ({ page }) => {
    await expect(page.getByText(/softhsmv3 PKCS#11/i).first()).toBeVisible()
  })

  test('shows the run handshakes button', async ({ page }) => {
    const runBtn = page.getByRole('button', { name: /run.*handshake/i })
    await expect(runBtn).toBeVisible()
    await expect(runBtn).toBeEnabled()
  })

  test('shows the reset button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /reset/i })).toBeVisible()
  })

  test('renders comparison panel placeholders for both legs', async ({ page }) => {
    await expect(page.getByText('Classical (ed25519 + curve25519)')).toBeVisible()
    await expect(page.getByText(/ML-DSA-65.*ML-KEM-768/i)).toBeVisible()
  })

  test('comparison panel shows "Not executed" cards in idle state', async ({ page }) => {
    await expect(page.getByText(/Not executed/i).first()).toBeVisible()
  })

  test('shows the handshake log tab with idle message', async ({ page }) => {
    await expect(page.getByText(/Click.*Run both handshakes/i)).toBeVisible()
  })

  test('shows the PKCS#11 calls tab', async ({ page }) => {
    const pkcs11Tab = page.getByRole('button', { name: /pkcs#?11/i })
    await expect(pkcs11Tab).toBeVisible()
  })

  test('shows the wire packets tab unconditionally', async ({ page }) => {
    await expect(page.getByRole('button', { name: /wire packets/i })).toBeVisible()
  })

  test('links to the learn module', async ({ page }) => {
    const learnLink = page.getByRole('link', { name: 'Learn', exact: true })
    await expect(learnLink).toBeVisible()
    await expect(learnLink).toHaveAttribute('href', '/learn/network-security-pqc')
  })

  test('shows SSH Key Roles learn section', async ({ page }) => {
    await expect(page.getByText('SSH Key Roles — Classical vs PQC')).toBeVisible()
  })

  test('shows the SSH-2 handshake phases learn section', async ({ page }) => {
    await expect(page.getByText(/SSH-2 Transport/i)).toBeVisible()
  })

  test('shows OpenSSH PQC migration timeline learn section', async ({ page }) => {
    await expect(page.getByText(/Migration Timeline/i)).toBeVisible()
  })

  test('shows host trust learn section', async ({ page }) => {
    await expect(page.getByText(/Host Trust/i)).toBeVisible()
  })

  test('shows operator cheat sheet learn section', async ({ page }) => {
    await expect(page.getByText(/Operator Cheat Sheet/i)).toBeVisible()
  })

  test('shows updated comparison panel title', async ({ page }) => {
    await expect(page.getByText('SSH authentication — side-by-side telemetry')).toBeVisible()
  })

  test('shows expanded spec citations below comparison panel', async ({ page }) => {
    await expect(page.getByRole('link', { name: /RFC 4253/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /FIPS 204/i })).toBeVisible()
  })

  test('appears in the playground grid', async ({ page }) => {
    await page.goto('/playground')
    await expect(page.getByText('PQC SSH Simulator').first()).toBeVisible()
  })

  // ── Live handshake tests — real softhsmv3 crypto, Chromium only ───────────

  test.describe('Live handshake', () => {
    test.skip(({ browserName }) => browserName !== 'chromium', 'Requires Chromium')

    test('full run completes and produces wire packets', async ({ page }) => {
      await page.getByRole('button', { name: /run.*handshake/i }).click()
      await expect(page.getByText(/Both handshakes complete/i)).toBeVisible({ timeout: 60_000 })
      await page.getByRole('button', { name: /wire packets/i }).click()
      await expect(page.getByText('SSH_MSG_KEX_ECDH_INIT').first()).toBeVisible()
      await expect(page.getByText('SSH_MSG_USERAUTH_SUCCESS').first()).toBeVisible()
    })

    test('PKCS#11 log shows real ML-DSA + ML-KEM mechanisms after run', async ({ page }) => {
      await page.getByRole('button', { name: /run.*handshake/i }).click()
      await expect(page.getByText(/Both handshakes complete/i)).toBeVisible({ timeout: 60_000 })
      await page.getByRole('button', { name: /pkcs#?11/i }).click()
      await expect(
        page.getByText(/C_GenerateKeyPair|C_Sign|C_EncapsulateKey/i).first()
      ).toBeVisible()
    })

    test('PQC card shows quantum-safe pill', async ({ page }) => {
      await page.getByRole('button', { name: /run.*handshake/i }).click()
      await expect(page.getByText(/Both handshakes complete/i)).toBeVisible({ timeout: 60_000 })
      await expect(page.getByText('quantum-safe').first()).toBeVisible()
    })

    test('PQC leg shows ML-DSA-65 signature size 3,309 B', async ({ page }) => {
      await page.getByRole('button', { name: /run.*handshake/i }).click()
      await expect(page.getByText(/3,309 B/i).first()).toBeVisible({ timeout: 60_000 })
    })

    test('hybrid KEX share is 1,216 B', async ({ page }) => {
      await page.getByRole('button', { name: /run.*handshake/i }).click()
      await expect(page.getByText(/Both handshakes complete/i)).toBeVisible({ timeout: 60_000 })
      await expect(page.getByText(/1,216 B/i).first()).toBeVisible()
    })

    test('classical leg shows Ed25519 signature size 64 B', async ({ page }) => {
      await page.getByRole('button', { name: /run.*handshake/i }).click()
      await expect(page.getByText(/Both handshakes complete/i)).toBeVisible({ timeout: 60_000 })
      await expect(page.getByText(/\b64 B\b/i).first()).toBeVisible()
    })

    test('both legs show connected pill', async ({ page }) => {
      await page.getByRole('button', { name: /run.*handshake/i }).click()
      await expect(page.getByText(/Both handshakes complete/i)).toBeVisible({ timeout: 60_000 })
      const connectedPills = page.getByText('connected')
      await expect(connectedPills).toHaveCount(2)
    })

    test('comparison panel shows per-phase timing breakdown', async ({ page }) => {
      await page.getByRole('button', { name: /run.*handshake/i }).click()
      await expect(page.getByText(/Both handshakes complete/i)).toBeVisible({ timeout: 60_000 })
      await expect(page.getByText(/keygen/i).first()).toBeVisible()
    })
  })
})
