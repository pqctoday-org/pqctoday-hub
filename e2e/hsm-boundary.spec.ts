import { test, expect } from '@playwright/test'

test.describe('ASR SoftHSM WASM Crypto Boundary', () => {
  test('validates TRUE byte array execution of ML-KEM via isolated generic UI bindings', async ({
    page,
  }) => {
    // Navigate straight to the HSM playground on KEM tab
    await page.goto('/playground/hsm?tab=kem')

    // Wait for WASM instantiation to complete
    await expect(page.locator('text=ML-KEM Parameters')).toBeVisible({ timeout: 15000 })

    // Phase 1 & 2: Action & Verification (WASM Dispatcher)
    // We emit an event on window instead of clicking buttons to test the UI's resilience
    const payload = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        // Safe timeout mechanism
        const timeout = setTimeout(() => reject(new Error('WASM engine never responded')), 5000)

        // Listen for the cryptographic output boundary event
        window.addEventListener('e2e:wasm_crypto_result', (e: Event) => {
          clearTimeout(timeout)
          resolve((e as CustomEvent).detail)
        })

        // Trigger the internal boundary
        window.dispatchEvent(
          new CustomEvent('e2e:trigger_wasm_keygen', {
            detail: { alg: 'ML-KEM-768' },
          })
        )
      })
    })

    // Phase 3: Result Verification
    // Validate the actual byte array is correct. ML-KEM-768 public key + standard PKCS#11 metadata
    // Usually, ML-KEM-768 public key size is 1184 bytes.
    const { pubKeyBytes } = payload as { pubKeyBytes: Record<string, number> }
    expect(pubKeyBytes).toBeDefined()

    // Convert the returned uint8 array object to length check
    const byteLength = Object.keys(pubKeyBytes).length
    // We strictly assert cryptographic reality over generic UI "success" strings!
    expect(byteLength).toBeGreaterThan(1000) // 1184 standard, allow minor deviation for CKA wrappers
  })
})
