// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

test.describe('Playground - PKCS#11 Rust HSM Mode Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress WhatsNew toast if present
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
    })

    // Navigate to playground
    await page.goto('/playground')
    await page.reload() // Force reload to ensure fresh WASM
  })

  test('should initialize HSM Token and perform AES key generation and encryption', async ({
    page,
  }) => {
    test.setTimeout(90000)

    // 1. Enable Rust HSM Mode
    await page.getByRole('switch', { name: 'Toggle HSM mode' }).click()
    await page.locator('input[value="rust"]').click()

    // 2. Token Setup (in HSM Keys tab)
    await page.getByRole('button', { name: /Initialize HSM/i }).click()
    await expect(page.getByText(/Initialized/i)).toBeVisible({ timeout: 15000 })

    await page.getByRole('button', { name: /Create Token/i }).click()
    // A badge with "Token created" should appear
    await expect(page.getByText('Token created', { exact: true }).first()).toBeVisible({
      timeout: 10000,
    })

    await page.getByRole('button', { name: /Open Session/i }).click()
    await expect(page.getByText('Session open', { exact: true }).first()).toBeVisible({
      timeout: 10000,
    })

    // 3. Symmetric Encryption (AES)
    await page.getByRole('tab', { name: 'Sym Encrypt' }).click()

    // Look for the Generate Key button inside the AES panel
    const genAesButton = page.getByRole('button', { name: 'Generate Key', exact: true }).first()
    await genAesButton.click()
    await expect(page.getByRole('button', { name: /^✓ h=/ }).first()).toBeVisible()

    const messageInput = page.getByPlaceholder('Enter plaintext…').first()
    await messageInput.fill('Secret Message')

    const encryptButton = page.getByRole('button', { name: 'Encrypt' }).first()
    await encryptButton.click()

    // Plaintext should match decrypted output
    const decryptButton = page.getByRole('button', { name: 'Decrypt' }).first()
    await decryptButton.click()

    const verifySuccess = page.getByText('Secret Message', { exact: true }).first()
    await expect(verifySuccess).toBeVisible()
  })

  test('should perform ML-KEM Key Encapsulation in HSM Mode', async ({ page }) => {
    test.setTimeout(90000)

    // 1. Enable Rust HSM Mode and Setup Token
    await page.getByRole('switch', { name: 'Toggle HSM mode' }).click()
    await page.locator('input[value="rust"]').click()
    await page.getByRole('button', { name: /Initialize HSM/i }).click()
    await expect(page.getByText(/Initialized/i)).toBeVisible()
    await page.getByRole('button', { name: /Create Token/i }).click()
    await expect(page.getByText('Token created', { exact: true }).first()).toBeVisible()
    await page.getByRole('button', { name: /Open Session/i }).click()
    await expect(page.getByText('Session open', { exact: true }).first()).toBeVisible()

    // 2. Switch to KEM & Encrypt
    await page.getByRole('tab', { name: 'KEM & Encrypt' }).click()

    // 3. Generate ML-KEM Key Pair
    const genKemButton = page
      .getByRole('button', { name: 'Generate Key Pair', exact: true })
      .first()
    await genKemButton.click()
    await expect(
      page.getByRole('button', { name: '✓ Key Pair', exact: true }).first()
    ).toBeVisible()

    // 4. Encapsulate
    const encapsulateButton = page.getByRole('button', { name: 'Encapsulate' }).first()
    await encapsulateButton.click()

    // Wait for Ciphertext to appear (using the badge snippet output)
    await expect(page.getByText(/Ciphertext/)).toBeVisible()

    // 5. Decapsulate
    const decapsulateButton = page.getByRole('button', { name: 'Decapsulate' }).first()
    await decapsulateButton.click()

    // 6. Check Match
    await expect(page.getByText('Shared secrets match — KEM successful')).toBeVisible()
  })

  test('should perform ML-DSA Signing and Verification in HSM Mode', async ({ page }) => {
    test.setTimeout(90000)

    // 1. Enable Rust HSM Mode and Setup Token
    await page.getByRole('switch', { name: 'Toggle HSM mode' }).click()
    await page.locator('input[value="rust"]').click()
    await page.getByRole('button', { name: /Initialize HSM/i }).click()
    await expect(page.getByText(/Initialized/i)).toBeVisible()
    await page.getByRole('button', { name: /Create Token/i }).click()
    await expect(page.getByText('Token created', { exact: true }).first()).toBeVisible()
    await page.getByRole('button', { name: /Open Session/i }).click()
    await expect(page.getByText('Session open', { exact: true }).first()).toBeVisible()

    // 2. Switch to Sign & Verify
    await page.getByRole('tab', { name: 'Sign & Verify' }).click()

    // 3. Generate ML-DSA Key Pair
    const genDsaButton = page.locator('button', { hasText: 'Generate Key Pair' }).first()
    await genDsaButton.click()
    await expect(page.locator('button', { hasText: '✓ Key Pair' }).first()).toBeVisible()

    // 4. Sign Message
    const signButton = page.getByRole('button', { name: 'Sign' }).first()
    await signButton.click()
    await expect(page.getByText('Signature', { exact: true }).first()).toBeVisible()

    // 5. Verify Message
    const verifyButton = page.getByRole('button', { name: 'Verify' }).first()
    await verifyButton.click()

    // 6. Check Validity
    await expect(page.getByText('Signature valid')).toBeVisible()
  })
})
