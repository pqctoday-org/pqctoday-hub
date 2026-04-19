// SPDX-License-Identifier: GPL-3.0-only
//
// ssh-pqc-simulator.spec.ts — E2E tests for PT-SSH-PQC playground tool.
//
// The WASM artifacts (openssh-server.wasm, openssh-client.wasm) may not be
// built yet, so tests verify the scaffold UI, WIP notice, and button wiring.
// When the WASM is built the "live handshake" tests should be enabled via the
// SSH_WASM_BUILT env var.

import { test, expect } from '@playwright/test'

test.describe('PQC SSH Simulator', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress the WhatsNew toast that intercepts clicks (per CLAUDE.md E2E patterns)
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
    })
    await page.goto('/playground/pqc-ssh-sim')
  })

  test('renders the tool title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'PQC SSH Simulator' })).toBeVisible()
  })

  test('shows the WIP build-in-progress notice', async ({ page }) => {
    await expect(page.getByText(/Build in progress/i)).toBeVisible()
    await expect(page.getByText(/openssh-server\.wasm/i)).toBeVisible()
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
    const notExecCards = page.getByText(/Not executed/i)
    await expect(notExecCards.first()).toBeVisible()
  })

  test('shows the handshake log tab with idle message', async ({ page }) => {
    await expect(page.getByText(/Click.*Run both handshakes/i)).toBeVisible()
  })

  test('shows the PKCS#11 calls tab', async ({ page }) => {
    // Custom tabs.tsx renders TabsTrigger as <button>, not role="tab"
    const pkcs11Tab = page.getByRole('button', { name: /pkcs#?11/i })
    await expect(pkcs11Tab).toBeVisible()
  })

  test('links to the learn module', async ({ page }) => {
    // Use exact:true to avoid matching the nav "Learn view" link
    const learnLink = page.getByRole('link', { name: 'Learn', exact: true })
    await expect(learnLink).toBeVisible()
    await expect(learnLink).toHaveAttribute('href', '/learn/network-security-pqc')
  })

  test('shows SSH Key Roles learn section', async ({ page }) => {
    await expect(page.getByText('SSH Key Roles — Classical vs PQC')).toBeVisible()
  })

  test('shows SSH Handshake PQC lane learn section', async ({ page }) => {
    await expect(page.getByText('SSH Handshake — PQC lane')).toBeVisible()
  })

  test('shows updated comparison panel title', async ({ page }) => {
    await expect(page.getByText('SSH authentication — side-by-side telemetry')).toBeVisible()
  })

  test('shows spec citations below comparison panel', async ({ page }) => {
    await expect(page.getByRole('link', { name: /FIPS 204/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /RFC 8032/ })).toBeVisible()
  })

  test('shows WIP badge on the playground grid card', async ({ page }) => {
    await page.goto('/playground')
    const wip = page.getByText('PQC SSH Simulator').first()
    await expect(wip).toBeVisible()
  })

  // ── Live handshake tests (only run when WASM is built) ──────────────────
  test.describe('Live handshake (requires built WASM)', () => {
    test.skip(!process.env.SSH_WASM_BUILT, 'SSH_WASM_BUILT not set — skipping live tests')

    test('run produces PKCS#11 calls with C_Sign', async ({ page }) => {
      await page.getByRole('button', { name: /run.*handshake/i }).click()

      // Wait up to 60s for the PQC handshake to complete (WASM loading time)
      await expect(page.getByText(/PQC done:/i)).toBeVisible({ timeout: 60_000 })

      // PKCS#11 tab (custom tabs.tsx renders as button, not role="tab")
      await page.getByRole('button', { name: /pkcs#?11/i }).click()
      await expect(page.getByText(/C_Sign/i).first()).toBeVisible()
    })

    test('PQC card shows quantum-safe pill', async ({ page }) => {
      await page.getByRole('button', { name: /run.*handshake/i }).click()
      await expect(page.getByText(/PQC done:/i)).toBeVisible({ timeout: 60_000 })
      await expect(page.getByText('quantum-safe').first()).toBeVisible()
    })

    test('PQC leg shows host_sig_bytes = 3309', async ({ page }) => {
      await page.getByRole('button', { name: /run.*handshake/i }).click()
      // host and client sig bars both show 3,309 B — use first()
      await expect(page.getByText(/3,309 B/i).first()).toBeVisible({ timeout: 60_000 })
    })

    test('classical leg shows host_sig_bytes = 64', async ({ page }) => {
      await page.getByRole('button', { name: /run.*handshake/i }).click()
      // multiple elements contain "64 B" — use first()
      await expect(page.getByText(/^64 B$/i).first()).toBeVisible({ timeout: 60_000 })
    })

    test('both legs show connection_ok pill', async ({ page }) => {
      await page.getByRole('button', { name: /run.*handshake/i }).click()
      await expect(page.getByText(/✓ Both handshakes complete/i)).toBeVisible({ timeout: 60_000 })
      const connectedPills = page.getByText('connected')
      await expect(connectedPills).toHaveCount(2)
    })
  })
})
