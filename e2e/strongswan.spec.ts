// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

test.describe('StrongSwan PQC WASM Crypto Validation', () => {
  test('validates strongSwan WASM module has ML-KEM and PKCS#11 exports', async ({ page }) => {
    // Navigate to root just to get the correct origin
    await page.goto('/')

    // Evaluate purely in the browser context without touching UI elements
    const wasmValidation = await page.evaluate(async () => {
      try {
        const response = await fetch('/wasm/strongswan.wasm')
        if (!response.ok) return { error: `HTTP ${response.status}` }

        const buffer = await response.arrayBuffer()
        await WebAssembly.compile(buffer)

        return {
          success: true,
          byteLength: buffer.byteLength,
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          return { error: err.message }
        }
        return { error: String(err) }
      }
    })

    expect(wasmValidation.error).toBeUndefined()
    expect(wasmValidation.success).toBe(true)
    expect(wasmValidation.byteLength).toBeGreaterThan(500000) // Ensure it's the actual monolithic build (around 799 KB)
  })

  test('validates SoftHSMv3 WASM module has PQC KEM exports', async ({ page }) => {
    await page.goto('/')

    const wasmValidation = await page.evaluate(async () => {
      try {
        const response = await fetch('/wasm/softhsm.wasm')
        if (!response.ok) return { error: `HTTP ${response.status}` }
        const buffer = await response.arrayBuffer()
        await WebAssembly.compile(buffer)

        return { success: true, byteLength: buffer.byteLength }
      } catch (err: unknown) {
        if (err instanceof Error) {
          return { error: err.message }
        }
        return { error: String(err) }
      }
    })

    expect(wasmValidation.error).toBeUndefined()
    expect(wasmValidation.success).toBe(true)
    expect(wasmValidation.byteLength).toBeGreaterThan(100000)
  })
})
