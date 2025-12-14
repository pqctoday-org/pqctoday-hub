import { test, expect } from '@playwright/test'

test.describe('Playground KEM Operations - Additional PQC Algorithms', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/playground')
    // Navigate to Key Store to generate keys
    await page.getByRole('button', { name: /Key Store/i }).click()
  })

  test('should perform FrodoKEM-640-AES encapsulation and decapsulation', async ({ page }) => {
    // Generate FrodoKEM-640-AES key pair
    await page.selectOption('select#keystore-key-size', 'FrodoKEM-640-AES')
    await page.click('button:has-text("Generate Keys")')

    // Wait for key generation to complete
    await expect(page.getByRole('table').getByText('FrodoKEM-640-AES').first()).toBeVisible({
      timeout: 10000,
    })

    // Navigate to KEM tab
    await page.getByRole('button', { name: 'KEM & Encrypt' }).click()

    // Ensure hybrid mode is OFF
    await page.uncheck('input#hybrid-mode-check-enc')

    // Select FrodoKEM key for encapsulation
    await page.selectOption('select#enc-primary-key-select', { index: 1 })

    // Run Encapsulate
    await page.click('button:has-text("Run Encapsulate")')

    // Verify ciphertext appears
    const ciphertextOutput = page
      .locator('textarea[placeholder*="Generated Ciphertext"]')
      .or(page.locator('textarea[placeholder*="Run Encapsulate"]'))
      .first()
    await expect(ciphertextOutput).not.toHaveValue('', { timeout: 10000 })

    // Verify shared secret appears
    const sharedSecretOutput = page.locator('textarea[placeholder*="Key Material"]').first()
    await expect(sharedSecretOutput).not.toHaveValue('')

    // Select FrodoKEM private key for decapsulation
    await page.selectOption('select#dec-primary-key-select', { index: 1 })

    // Run Decapsulate
    await page.click('button:has-text("Run Decapsulate")')

    // Verify decapsulated secret appears
    await expect(page.locator('text=✓ MATCH')).toBeVisible({ timeout: 10000 })
  })

  test('should perform HQC-128 encapsulation and decapsulation', async ({ page }) => {
    // Generate HQC-128 key pair
    await page.selectOption('select#keystore-key-size', 'HQC-128')
    await page.click('button:has-text("Generate Keys")')

    // Wait for key generation to complete
    await expect(page.getByRole('table').getByText('HQC-128').first()).toBeVisible({
      timeout: 10000,
    })

    // Navigate to KEM tab
    await page.getByRole('button', { name: 'KEM & Encrypt' }).click()

    // Ensure hybrid mode is OFF
    await page.uncheck('input#hybrid-mode-check-enc')

    // Select HQC key for encapsulation
    await page.selectOption('select#enc-primary-key-select', { index: 1 })

    // Run Encapsulate
    await page.click('button:has-text("Run Encapsulate")')

    // Verify ciphertext appears
    const ciphertextOutput = page
      .locator('textarea[placeholder*="Generated Ciphertext"]')
      .or(page.locator('textarea[placeholder*="Run Encapsulate"]'))
      .first()
    await expect(ciphertextOutput).not.toHaveValue('', { timeout: 10000 })

    // Verify shared secret appears
    const sharedSecretOutput = page.locator('textarea[placeholder*="Key Material"]').first()
    await expect(sharedSecretOutput).not.toHaveValue('')

    // Select HQC private key for decapsulation
    await page.selectOption('select#dec-primary-key-select', { index: 1 })

    // Run Decapsulate
    await page.click('button:has-text("Run Decapsulate")')

    // Verify match
    await expect(page.locator('text=✓ MATCH')).toBeVisible({ timeout: 10000 })
  })

  test('should perform Classic McEliece-348864 encapsulation and decapsulation', async ({
    page,
  }) => {
    // Generate Classic McEliece key pair
    await page.selectOption('select#keystore-key-size', 'Classic-McEliece-348864')
    await page.click('button:has-text("Generate Keys")')

    // Wait for key generation to complete (McEliece can be slow)
    await expect(page.getByRole('table').getByText('Classic-McEliece-348864').first()).toBeVisible({
      timeout: 30000,
    })

    // Navigate to KEM tab
    await page.getByRole('button', { name: 'KEM & Encrypt' }).click()

    // Ensure hybrid mode is OFF
    await page.uncheck('input#hybrid-mode-check-enc')

    // Select McEliece key for encapsulation
    await page.selectOption('select#enc-primary-key-select', { index: 1 })

    // Run Encapsulate
    await page.click('button:has-text("Run Encapsulate")')

    // Verify ciphertext appears
    const ciphertextOutput = page
      .locator('textarea[placeholder*="Generated Ciphertext"]')
      .or(page.locator('textarea[placeholder*="Run Encapsulate"]'))
      .first()
    await expect(ciphertextOutput).not.toHaveValue('', { timeout: 15000 })

    // Verify shared secret appears
    const sharedSecretOutput = page.locator('textarea[placeholder*="Key Material"]').first()
    await expect(sharedSecretOutput).not.toHaveValue('')

    // Select McEliece private key for decapsulation
    await page.selectOption('select#dec-primary-key-select', { index: 1 })

    // Run Decapsulate
    await page.click('button:has-text("Run Decapsulate")')

    // Verify match
    await expect(page.locator('text=✓ MATCH')).toBeVisible({ timeout: 15000 })
  })

  test('should perform hybrid KEM with FrodoKEM + X25519', async ({ page }) => {
    // Generate FrodoKEM key pair
    await page.selectOption('select#keystore-key-size', 'FrodoKEM-640-AES')
    await page.click('button:has-text("Generate Keys")')
    await expect(page.getByRole('table').getByText('FrodoKEM-640-AES').first()).toBeVisible({
      timeout: 10000,
    })

    // Generate Classical Key (X25519)
    await page.selectOption('select#classical-algo-select', 'X25519')
    await page.click('button:has-text("Generate Classical Keys")')
    await expect(page.getByRole('table').getByText('X25519').first()).toBeVisible({
      timeout: 10000,
    })

    // Navigate to KEM tab
    await page.getByRole('button', { name: 'KEM & Encrypt' }).click()

    // Enable Hybrid Mode
    await page.check('input#hybrid-mode-check-enc')

    // Select FrodoKEM (PQC) and X25519 (Classical) for encapsulation
    await page.selectOption('select#enc-primary-key-select', { index: 1 })
    await page.selectOption('select#enc-secondary-key-select', { index: 1 })

    // Run Encapsulate
    await page.click('button:has-text("Run Encapsulate")')

    // Verify separate ciphertexts appear
    await expect(page.locator('text=PQC Ciphertext (ML-KEM)')).toBeVisible()
    await expect(page.locator('text=Classical Ciphertext (Ephemeral PK)')).toBeVisible()

    // Verify raw secrets appear
    await expect(page.locator('text=PQC Shared Secret (Raw)').first()).toBeVisible()
    await expect(page.locator('text=Classical Shared Secret (Raw)').first()).toBeVisible()

    // Verify combination visualization
    await expect(page.locator('text=Combination Process')).toBeVisible()
    await expect(page.locator('text=HKDF-Extract (SHA-256)')).toBeVisible()

    // Select keys for decapsulation
    await page.selectOption('select#dec-primary-key-select', { index: 1 })
    await page.selectOption('select#dec-secondary-key-select', { index: 1 })

    // Run Decapsulate
    await page.click('button:has-text("Run Decapsulate")')

    // Verify recovered secrets appear
    await expect(page.locator('text=PQC Shared Secret (Recovered)')).toBeVisible()
    await expect(page.locator('text=Classical Shared Secret (Recovered)')).toBeVisible()

    // Verify match
    await expect(page.locator('text=✓ MATCH')).toBeVisible({ timeout: 10000 })
  })

  test('should perform hybrid KEM with HQC-192 + P-256', async ({ page }) => {
    // Generate HQC-192 key pair
    await page.selectOption('select#keystore-key-size', 'HQC-192')
    await page.click('button:has-text("Generate Keys")')
    await expect(page.getByRole('table').getByText('HQC-192').first()).toBeVisible({
      timeout: 10000,
    })

    // Generate Classical Key (P-256)
    await page.selectOption('select#classical-algo-select', 'P-256')
    await page.click('button:has-text("Generate Classical Keys")')
    await expect(page.getByRole('table').getByText('P-256').first()).toBeVisible({ timeout: 10000 })

    // Navigate to KEM tab
    await page.getByRole('button', { name: 'KEM & Encrypt' }).click()

    // Enable Hybrid Mode
    await page.check('input#hybrid-mode-check-enc')

    // Select HQC (PQC) and P-256 (Classical) for encapsulation
    await page.selectOption('select#enc-primary-key-select', { index: 1 })
    await page.selectOption('select#enc-secondary-key-select', { index: 1 })

    // Run Encapsulate
    await page.click('button:has-text("Run Encapsulate")')

    // Verify hybrid outputs
    await expect(page.locator('text=PQC Ciphertext (ML-KEM)')).toBeVisible()
    await expect(page.locator('text=Classical Ciphertext (Ephemeral PK)')).toBeVisible()
    await expect(page.locator('text=Combination Process')).toBeVisible()

    // Select keys for decapsulation
    await page.selectOption('select#dec-primary-key-select', { index: 1 })
    await page.selectOption('select#dec-secondary-key-select', { index: 1 })

    // Run Decapsulate
    await page.click('button:has-text("Run Decapsulate")')

    // Verify match
    await expect(page.locator('text=✓ MATCH')).toBeVisible({ timeout: 10000 })
  })

  test('should test HKDF normalization with different secret sizes', async ({ page }) => {
    // Test with FrodoKEM-640 (16-byte secret) vs FrodoKEM-1344 (32-byte secret)

    // Generate FrodoKEM-640-AES
    await page.selectOption('select#keystore-key-size', 'FrodoKEM-640-AES')
    await page.click('button:has-text("Generate Keys")')
    await expect(page.getByRole('table').getByText('FrodoKEM-640-AES').first()).toBeVisible({
      timeout: 10000,
    })

    // Navigate to KEM tab
    await page.getByRole('button', { name: 'KEM & Encrypt' }).click()

    // Test with HKDF enabled
    await page.selectOption('select#hybrid-kombiner-select', 'concat-hkdf')

    // Select key and run
    await page.selectOption('select#enc-primary-key-select', { index: 1 })
    await page.click('button:has-text("Run Encapsulate")')

    // Get the secret length (should be normalized to 32 bytes = 64 hex chars)
    const secret640 = await page
      .locator('textarea[placeholder*="Key Material"]')
      .first()
      .inputValue()

    // Go back to Key Store
    await page.getByRole('button', { name: /Key Store/i }).click()

    // Generate FrodoKEM-1344-AES
    await page.selectOption('select#keystore-key-size', 'FrodoKEM-1344-AES')
    await page.click('button:has-text("Generate Keys")')
    await expect(page.getByRole('table').getByText('FrodoKEM-1344-AES').first()).toBeVisible({
      timeout: 10000,
    })

    // Back to KEM tab
    await page.getByRole('button', { name: 'KEM & Encrypt' }).click()

    // Select new key and run
    await page.selectOption('select#enc-primary-key-select', { index: 1 })
    await page.click('button:has-text("Run Encapsulate")')

    // Get the secret length
    const secret1344 = await page
      .locator('textarea[placeholder*="Key Material"]')
      .first()
      .inputValue()

    // Both should be same length (64 hex chars = 32 bytes) due to HKDF normalization
    expect(secret640.length).toBe(secret1344.length)
    expect(secret640.length).toBe(64) // 32 bytes in hex
  })
})
