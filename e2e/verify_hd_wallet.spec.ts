import { test, expect } from '@playwright/test'

test('verify hd wallet flow', async ({ page }) => {
  // 1. Navigate to Digital Assets
  await page.goto('http://localhost:5173/')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Learn', exact: true }).click()
  await page.getByText('Digital Assets Program').click()

  // 2. Navigate to HD Wallet Implementation
  await page.getByText('HD Wallet').click()

  // 3. Step 1: Generate Mnemonic
  await expect(page.getByText('Generate Mnemonic')).toBeVisible()
  await page.getByRole('button', { name: 'Generate Mnemonic' }).click()

  // Wait for output
  await expect(page.getByText('Entropy (OpenSSL):')).toBeVisible()
  await expect(page.getByText('BIP39 Mnemonic (24 words):')).toBeVisible()

  // Click Next
  await page.getByRole('button', { name: 'Next Step' }).click()

  // 4. Step 2: Derive Seed
  await expect(page.getByText('Derive Seed')).toBeVisible()
  await page.getByRole('button', { name: 'Derive Seed' }).click()

  // Wait for output
  await expect(page.getByText('Seed (512-bit hex):')).toBeVisible()

  // Click Next
  await page.getByRole('button', { name: 'Next Step' }).click()

  // 5. Step 3: Derive Addresses
  await expect(page.getByText('Derive Addresses')).toBeVisible()
  await page.getByRole('button', { name: 'Derive Accounts' }).click()

  // Wait for output
  await expect(page.getByText('Derived Accounts:')).toBeVisible()
  await expect(page.getByText('Bitcoin (Legacy P2PKH)')).toBeVisible()
  await expect(page.getByText('Ethereum')).toBeVisible()
  await expect(page.getByText('Solana')).toBeVisible()

  // Check for specific address formats (basic check)
  // Bitcoin address starts with 1
  // Ethereum starts with 0x
  // Solana is base58

  const terminalOutput = page.locator('.text-green-400')
  const outputText = await terminalOutput.textContent()
  console.log('Final Output:', outputText)

  expect(outputText).toContain('Bitcoin (Legacy P2PKH)')
  expect(outputText).toContain('Ethereum')
  expect(outputText).toContain('Solana')
})
