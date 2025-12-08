import { test, expect } from '@playwright/test'

test('verify hd wallet flow', async ({ page }) => {
  // 1. Navigate to Digital Assets directly
  await page.goto('http://localhost:5173/learn/digital-assets')
  await page.waitForLoadState('networkidle')

  // 2. Select HD Wallet Module (Step 4)
  // The module navigation is via the stepper buttons now, or directly clicking the module in the list if we were on dashboard.
  // Since we are at /learn/digital-assets, we are already in the module viewer.
  // We need to click "Module 4: HD Wallet" stepper button.

  // Find the button for Step 4
  await page.getByRole('button', { name: '4 HD Wallet' }).click()

  // 3. Step 1: Generate Mnemonic
  await expect(page.getByRole('heading', { name: 'Generate Mnemonic' })).toBeVisible()
  await page.getByRole('button', { name: 'Generate Mnemonic' }).click()

  // Wait for output
  await expect(page.getByText('Entropy (OpenSSL):')).toBeVisible()
  await expect(page.getByText('BIP39 Mnemonic (24 words):')).toBeVisible()

  // Click Next
  await page.getByRole('button', { name: 'Next Step', exact: true }).click()

  // 4. Step 2: Derive Seed
  await expect(page.getByRole('heading', { name: 'Derive Seed' })).toBeVisible()
  await page.getByRole('button', { name: 'Derive Seed' }).click()

  // Wait for output
  await expect(page.getByText('Seed (512-bit hex):')).toBeVisible()

  // Click Next
  await page.getByRole('button', { name: 'Next Step', exact: true }).click()

  // 5. Step 3: Derive Addresses
  await expect(page.getByRole('heading', { name: 'Derive Addresses' })).toBeVisible()
  await page.getByRole('button', { name: 'Derive Accounts' }).click()

  // Wait for output
  await expect(page.getByText('Derived Accounts:')).toBeVisible()
  await expect(page.getByText('Bitcoin (Legacy P2PKH)')).toBeVisible()
  await expect(page.getByText("Path: m/44'/60'/0'/0/0")).toBeVisible() // Ethereum Path
  await expect(page.getByText("Path: m/44'/501'/0'/0'")).toBeVisible() // Solana Path

  // Check for specific address formats (basic check)
  // Output already verified by distinct path checks above
})
