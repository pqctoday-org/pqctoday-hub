import { test, expect } from '@playwright/test'

test.describe('Hybrid KEM Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/playground')
  })

  test('should perform hybrid encapsulation and decapsulation', async ({ page }) => {
    // 1. Navigate to KEM Tab
    await page.getByRole('button', { name: 'KEM & Encrypt' }).click()

    // 2. Enable Hybrid Mode
    // The toggle is next to the text "Hybrid Mode".
    // We can find the text and click the sibling button, or use a layout selector.
    // The button contains a span with class 'translate-x...'.
    // Enable Hybrid Mode using the new checkbox (Encapsulate side)
    await page.check('input#hybrid-mode-check-enc')

    // Verify Hybrid UI elements appear
    await expect(page.locator('text=Primary Public Key (PQC)')).toBeVisible()
    await expect(page.locator('text=Secondary Public Key (Classical)')).toBeVisible()

    // 3. Generate Keys
    // Navigate to Key Store
    await page.getByRole('button', { name: /Key Store/ }).click()

    // Generate ML-KEM Key (if not exists)
    await page.selectOption('#keystore-key-size', '768')
    await page.getByRole('button', { name: 'Generate Keys' }).click()
    await expect(page.getByRole('table')).toContainText('ML-KEM')

    // Generate Classical Key (X25519)
    await page.selectOption('select#classical-algo-select', 'X25519')
    await page.click('button:has-text("Generate Classical Keys")')
    // Wait for key to appear in table (optional but good practice)
    await expect(page.getByRole('table').getByText('X25519').first()).toBeVisible({
      timeout: 10000,
    })

    // Let's first try to run the test and see if it fails to find keys.
    // But I will proceed with fixing the selector first.

    // 4. Return to KEM Operations
    await page.getByRole('button', { name: 'KEM & Encrypt' }).click()

    // 5. Select Keys for Encapsulation
    // Primary (PQC)
    // Use selectOption with label or index
    await page.locator('select#enc-primary-key-select').selectOption({ index: 1 }) // Select first available PQC key

    // Secondary (Classical)
    await page.locator('select#enc-secondary-key-select').selectOption({ index: 1 }) // Select first available Classical key

    // 6. Run Encapsulate
    await page.click('button:has-text("Run Encapsulate")')

    // 7. Verify Output
    await expect(page.locator('textarea[placeholder*="PQC Ciphertext"]').first()).not.toBeEmpty()
    const ciphertextPQC = await page
      .locator('textarea[placeholder*="PQC Ciphertext"]')
      .first()
      .inputValue()
    const ciphertextClassic = await page
      .locator('textarea[placeholder*="Classical Ciphertext"]')
      .first()
      .inputValue()
    // expect(ciphertext).toContain('|') // Check for hybrid separator - In new UI, they are separate inputs.
    // If we want to check internal state, we can checksomewhere else, but UI shows them separate.
    expect(ciphertextPQC).not.toBe('')
    expect(ciphertextClassic).not.toBe('')

    // 8. Select Keys for Decapsulation
    // Primary (PQC)
    await page.locator('select#dec-primary-key-select').selectOption({ index: 1 })
    // Secondary (Classical)
    await page.locator('select#dec-secondary-key-select').selectOption({ index: 1 })

    // 9. Run Decapsulate
    await page.click('button:has-text("Run Decapsulate")')

    // 10. Verify Result
    await expect(page.locator('text=SECRET RECOVERED')).toBeVisible()
  })
})
