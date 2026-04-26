// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

test.describe('TLS 1.3 Simulator — Phase 1', () => {
  // Suppress the WhatsNew toast that intercepts clicks (per CLAUDE.md E2E pitfalls)
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem(
          'pqc-version-storage',
          JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
        )
      } catch {
        // ignore
      }
    })
  })

  test('OpenSSL WASM artifact is the TLS-sim build (has execute_tls_simulation export)', async ({
    page,
  }) => {
    await page.goto('/')

    const wasmValidation = await page.evaluate(async () => {
      try {
        const response = await fetch('/wasm/openssl.wasm')
        if (!response.ok) return { error: `HTTP ${response.status}` }

        const buffer = await response.arrayBuffer()
        const module = await WebAssembly.compile(buffer)
        const exports = WebAssembly.Module.exports(module)
        const exportNames = exports.map((e) => e.name)

        return {
          success: true,
          byteLength: buffer.byteLength,
          hasTlsSimulation: exportNames.includes('execute_tls_simulation'),
          hasMain: exportNames.includes('main'),
        }
      } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : String(err) }
      }
    })

    expect(wasmValidation.error).toBeUndefined()
    expect(wasmValidation.success).toBe(true)
    expect(wasmValidation.byteLength).toBeGreaterThan(1_000_000)
    expect(wasmValidation.hasTlsSimulation).toBe(true)
  })

  test('learn/tls-basics renders Workshop tab and the hybrid-first default group is visible', async ({
    page,
  }) => {
    await page.goto('/learn/tls-basics?tab=workshop')

    // Wait for the page heading to render
    await expect(page.getByRole('heading', { name: /tls 1\.3 basics/i })).toBeVisible({
      timeout: 15000,
    })

    // The Workshop tab content should display the negotiated/preferred hybrid group somewhere.
    // The TLSServerPanel renders the group name in the Groups section.
    const hybridLabel = page.getByText('X25519MLKEM768').first()
    await expect(hybridLabel).toBeVisible({ timeout: 15000 })
  })

  test('workshop variant shows citation chips and the Open-in-Learn cross-link', async ({
    page,
  }) => {
    await page.goto('/playground/tls-simulator')

    await expect(page.getByText('RFC 8446').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('FIPS 203').first()).toBeVisible()
    await expect(page.getByText('FIPS 204').first()).toBeVisible()
    await expect(page.getByText('FIPS 205').first()).toBeVisible()
    await expect(page.getByText(/Open in Learn for HSM-backed keys/i).first()).toBeVisible()
  })
})
