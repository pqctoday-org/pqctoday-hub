import { test, expect } from '@playwright/test'

test.describe('Playground', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Playground' }).click()
    await expect(
      page.getByRole('heading', { name: 'Interactive Playground', level: 2 })
    ).toBeVisible()
  })

  test('generates ML-KEM keys', async ({ page }) => {
    // Navigate to Key Store tab
    await page.getByRole('button', { name: /Key Store/ }).click()

    // Select ML-KEM-768
    await page.selectOption('#keystore-key-size', '768')

    // Click Generate Keys
    await page.getByRole('button', { name: 'Generate Keys' }).click()

    // Check if keys are displayed in the table
    await expect(page.getByRole('table')).toContainText('ML-KEM')
    await expect(page.getByRole('table')).toContainText('Public Key')
  })

  test('generates ML-DSA keys', async ({ page }) => {
    // Navigate to Key Store tab
    await page.getByRole('button', { name: /Key Store/ }).click()

    // Select ML-DSA-65
    await page.selectOption('#keystore-key-size', '65')

    // Click Generate Keys
    await page.getByRole('button', { name: 'Generate Keys' }).click()

    // Check if keys are displayed
    await expect(page.getByRole('table')).toContainText('ML-DSA')
  })
  test('performs ML-KEM encapsulation/decapsulation', async ({ page }) => {
    test.setTimeout(60000) // Increase timeout for WASM operations

    // 1. Generate Key
    await page.getByRole('button', { name: /Key Store/ }).click()
    await page.selectOption('#keystore-key-size', '768')
    await page.getByRole('button', { name: 'Generate Keys' }).click()
    await expect(page.getByRole('table')).toContainText('ML-KEM')

    // 2. Go to KEM Ops
    await page.getByRole('button', { name: /KEM & Encrypt/ }).click()

    // 3. Encapsulate
    // Find the select by its default option text
    const pubKeySelect = page.locator('select').filter({ hasText: 'Select Public Key...' })

    // Wait for options to be populated (more than 1 option)
    await expect(async () => {
      const count = await pubKeySelect.locator('option').count()
      expect(count).toBeGreaterThan(1)
    }).toPass()

    // Select the first available key (index 1)
    await pubKeySelect.selectOption({ index: 1 })

    // Verify button is enabled
    const runButton = page.getByRole('button', { name: 'Run Encapsulate' })
    await expect(runButton).toBeEnabled()

    // Click Encapsulate
    await runButton.click()

    // Check for Shared Secret (check that the output field is populated)
    // DataInput label is not associated with textarea, so we find the container having the label, then the textarea.
    const sharedSecretInput = page
      .locator('div')
      .filter({ hasText: 'Shared Secret (Output)' })
      .locator('textarea')
      .first()
    await expect(sharedSecretInput).not.toBeEmpty({ timeout: 10000 })

    // 4. Decapsulate
    // Select private key
    const privKeySelect = page.locator('select').filter({ hasText: 'Select Private Key...' })

    await privKeySelect.selectOption({ index: 1 })

    // Wait for button to be enabled
    const decapsulateButton = page.getByRole('button', { name: 'Run Decapsulate' })
    await expect(decapsulateButton).toBeEnabled({ timeout: 10000 })

    // Small stability delay
    await page.waitForTimeout(1000)

    await decapsulateButton.click()

    // Check for result (Success or Failure)
    const resultLocator = page.locator('.text-lg', { hasText: /SECRET RECOVERED|DECAPSULATION FAILED/ })
    await expect(resultLocator).toBeVisible({ timeout: 15000 })

    if (await page.getByText('DECAPSULATION FAILED').isVisible()) {
      throw new Error('Test failed: Decapsulation resulted in mismatch (DECAPSULATION FAILED)')
    }

    // Verify specific success message
    await expect(resultLocator).toContainText('SECRET RECOVERED')
  })

  test('performs ML-DSA signing/verification', async ({ page }) => {
    // 1. Generate Key
    await page.getByRole('button', { name: /Key Store/ }).click()
    await page.selectOption('#keystore-key-size', '65') // ML-DSA-65
    await page.getByRole('button', { name: 'Generate Keys' }).click()
    await expect(page.getByRole('table')).toContainText('ML-DSA')

    // 2. Go to Sign & Verify
    await page.getByRole('button', { name: /Sign & Verify/ }).click()

    // 3. Sign
    // Select private key
    // The first select is for Signing
    const privKeySelect = page.locator('select').first()
    await privKeySelect.selectOption({ index: 1 })

    await page.getByRole('button', { name: 'Sign Message' }).click()

    // Check if signature is generated (textarea should not be empty)
    // We can check if "Signature (Output)" textarea has value.
    // But checking for "VERIFICATION OK" after verify is better proof.

    // 4. Verify
    // Select public key
    // The second select is for Verifying
    const pubKeySelect = page.locator('select').nth(1)
    await pubKeySelect.selectOption({ index: 1 })

    await page.getByRole('button', { name: 'Verify Signature' }).click()

    // Check result
    await expect(page.getByText('VERIFICATION OK')).toBeVisible()
  })
})
