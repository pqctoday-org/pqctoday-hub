import { test, expect } from '@playwright/test'

test.describe('ML-DSA Playground (Refactor Verification)', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console logs
    page.on('console', (msg) => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`))

    // Navigate to the playground
    await page.goto('/playground')
    await page.reload() // Force reload to ensure fresh WASM
  })

  test('should generate keys, sign, and verify using ML-DSA (OpenSSL)', async ({ page }) => {
    // 1. Navigate to Key Store Tab
    await page.getByRole('button', { name: 'Key Store' }).click()

    // 2. Select ML-DSA-65 (NIST Level 3)
    // The select box handles both Algorithm and Key Size based on the value
    await page.selectOption('#keystore-key-size', '65')

    // 3. Generate Keys
    const generateButton = page.getByRole('button', { name: 'Generate Keys' })
    await generateButton.click()

    // Wait for key to appear in the table
    await expect(page.getByRole('table')).toContainText('ML-DSA', { timeout: 30000 })
    await expect(page.getByRole('table')).toContainText('65')

    // 4. Navigate to Sign & Verify Tab
    await page.getByRole('button', { name: 'Sign & Verify' }).click()

    // 5. Select the Private Key for Signing (Left side)
    const signKeySelect = page.locator('select').first()
    await signKeySelect.selectOption({ index: 1 })

    // 6. Enter a message (Optional, as default might be empty or existing)
    const messageInput = page.getByPlaceholder('Enter message to sign...')
    await messageInput.fill('Test Message for ML-DSA')

    // 7. Sign the message
    const signButton = page.getByRole('button', { name: 'Sign Message' })
    await signButton.click()

    // Verify signature output is populated
    const signatureOutput = page.getByPlaceholder('Run Sign to generate...')
    await expect(signatureOutput).not.toHaveValue('')
    const signatureHex = await signatureOutput.inputValue()

    // 8. Select the Public Key for Verification (Right side)
    const verifyKeySelect = page.locator('select').nth(1)
    await verifyKeySelect.selectOption({ index: 1 })

    // 9. Verify Signature Input (Right side) matches Output
    const verifySigInput = page.getByPlaceholder('No Signature (Run Sign first or paste one)')
    await expect(verifySigInput).toHaveValue(signatureHex)

    // 10. Verify the signature
    const verifyButton = page.getByRole('button', { name: 'Verify Signature' })
    await verifyButton.click()

    // 11. Verify Success
    await expect(page.locator('text=VERIFICATION OK')).toBeVisible()
    await expect(page.locator('text=The signature is valid')).toBeVisible()
  })
})
