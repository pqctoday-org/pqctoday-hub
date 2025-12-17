import { test, expect } from '@playwright/test'

test.describe('OpenSSL Studio - LMS (HSS) Operations', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()))
    await page.goto('/')
    // Navigate to OpenSSL Studio
    await page.getByRole('button', { name: /OpenSSL/ }).click()
    // Wait for WASM to load
    await expect(page.getByText(/OpenSSL/)).toBeVisible({ timeout: 20000 })
  })

  test('shows LMS category button with mode tabs', async ({ page }) => {
    // Click consolidated LMS (HSS) button
    const lmsBtn = page.getByRole('button', { name: /LMS \(HSS\)/ })
    await expect(lmsBtn).toBeVisible()
    await lmsBtn.click()

    // Check mode tabs are visible using data-testid
    await expect(page.getByTestId('lms-mode-generate')).toBeVisible()
    await expect(page.getByTestId('lms-mode-sign')).toBeVisible()
    await expect(page.getByTestId('lms-mode-verify')).toBeVisible()

    // Default should be Generate mode - Generator section visible
    await expect(page.getByRole('button', { name: 'Generate New LMS Keypair' })).toBeVisible()

    // Switch to Verify mode via tab
    await page.getByTestId('lms-mode-verify').click()
    await expect(page.getByRole('button', { name: 'Verify (WASM)' })).toBeVisible()

    // Signer should NOT be visible in Verify mode
    await expect(page.getByRole('button', { name: 'Sign Selected Data File' })).toBeHidden()

    // Switch to Sign mode via tab
    await page.getByTestId('lms-mode-sign').click()
    await expect(page.getByText('Signer')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign Selected Data File' })).toBeVisible()

    // Verifier UI should be hidden in Sign mode
    await expect(page.getByRole('button', { name: 'Verify (WASM)' })).toBeHidden()

    // Private Key selector should be visible
    await expect(page.getByLabel('Signing Key (Private Key)')).toBeVisible()
  })

  test('generates keypair and signs message', async ({ page }) => {
    // Click LMS (HSS) button
    await page.getByRole('button', { name: /LMS \(HSS\)/ }).click()

    // Generate a keypair (default is Generate mode)
    await page.getByRole('button', { name: 'Generate New LMS Keypair' }).click()

    // Wait for file to appear in table (more specific than toast)
    const filesTable = page.locator('table').filter({ hasText: 'Filename' })
    const keyFileRow = filesTable
      .getByRole('row')
      .filter({ hasText: 'lms_h10_w8_' })
      .filter({ hasText: '.key' })
    await expect(keyFileRow).toBeVisible({ timeout: 40000 })

    // Capture filename
    const keyFileName = await keyFileRow.locator('td').nth(2).innerText()

    // Load sample data for signing
    await page.getByRole('button', { name: 'Load Sample Data' }).click()

    // Wait for sample file to appear
    await expect(filesTable.getByRole('row').filter({ hasText: 'lms-message.txt' })).toBeVisible()

    // Switch to Sign mode via data-testid
    await page.getByTestId('lms-mode-sign').click()

    // Select the generated private key
    // Using dynamic filename captured from table
    const keySelect = page.getByLabel('Signing Key (Private Key)')
    await expect(keySelect).toBeVisible()
    await keySelect.selectOption(keyFileName)

    // Select data file
    const dataSelect = page.locator('#lms-data-select')
    await expect(dataSelect.locator('option').filter({ hasText: 'lms-message.txt' })).toHaveCount(
      1,
      { timeout: 10000 }
    )
    await dataSelect.selectOption('lms-message.txt')

    // Sign the message
    await page.getByRole('button', { name: 'Sign Selected Data File' }).click()
    await expect(page.getByText('Message signed!')).toBeVisible({ timeout: 30000 })
  })

  test('loads sample data and shows command preview in verify mode', async ({ page }) => {
    // Select LMS category
    await page.getByRole('button', { name: /LMS \(HSS\)/ }).click()

    // Switch to Verify mode via data-testid
    await page.getByTestId('lms-mode-verify').click()

    // Click Load Sample Data
    await page.getByRole('button', { name: 'Load Sample Data' }).click()

    // Wait for files to be selected
    await expect(page.locator('#lms-key-select')).toHaveValue('lms-public.pem')
    await expect(page.locator('#lms-sig-select')).toHaveValue('lms-signature.bin')
    await expect(page.locator('#lms-data-select')).toHaveValue('lms-message.txt')

    // Command preview should show pkeyutl verify command
    const commandCode = page.locator('code').filter({ hasText: 'openssl' }).last()
    await expect(commandCode).toContainText('openssl pkeyutl -verify')
    await expect(commandCode).toContainText('-pubin')
    await expect(commandCode).toContainText('-inkey lms-public.pem')
    await expect(commandCode).toContainText('-sigfile lms-signature.bin')
    await expect(commandCode).toContainText('-in lms-message.txt')

    // Run Command button should be hidden for LMS (shows WASM notice instead)
    await expect(page.getByRole('button', { name: 'Run Command' })).toBeHidden()
    await expect(page.getByText('Use WASM buttons')).toBeVisible()
  })
})
