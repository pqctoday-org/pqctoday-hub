import { test, expect } from '@playwright/test'

test('verify hd wallet flow', async ({ page }) => {
  // Helper to wait for crypto operation to complete
  const waitForCryptoOperation = async () => {
    await page.waitForTimeout(500)
    try {
      const executing = page.getByText('Executing...')
      if (await executing.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(executing).toBeHidden({ timeout: 45000 })
      }
    } catch {
      // Operation may have been very quick
    }
    await page.waitForTimeout(500)
  }

  // 1. Navigate to Digital Assets directly
  await page.goto('/learn/digital-assets')
  await expect(page.getByRole('button', { name: /HD Wallet/i })).toBeVisible({ timeout: 30000 })

  // 2. Select HD Wallet Module (Step 4)
  await page.getByRole('button', { name: /HD Wallet/i }).click()

  // 3. Step 1: Generate Mnemonic
  await expect(page.getByRole('heading', { name: 'Generate Mnemonic' })).toBeVisible({
    timeout: 10000,
  })
  await page.getByRole('button', { name: 'Generate Mnemonic' }).click()
  await waitForCryptoOperation()

  // Wait for output in terminal area - look for hex entropy format
  // The output should contain a 64-character hex string (256 bits = 32 bytes = 64 hex chars)
  await expect(page.getByText(/[a-f0-9]{64}/i).first()).toBeVisible({ timeout: 45000 })

  // Click Next
  await page.getByRole('button', { name: 'Next Step', exact: true }).click()

  // 4. Step 2: Derive Seed
  await expect(page.getByRole('heading', { name: 'Derive Seed' })).toBeVisible()
  await page.getByRole('button', { name: 'Derive Seed' }).click()
  await waitForCryptoOperation()

  // Wait for output - seed should be 128 hex chars (512 bits)
  await expect(page.getByText(/[a-f0-9]{128}/i).first()).toBeVisible({ timeout: 15000 })

  // Click Next
  await page.getByRole('button', { name: 'Next Step', exact: true }).click()

  // 5. Step 3: Derive Addresses
  await expect(page.getByRole('heading', { name: 'Derive Addresses' })).toBeVisible()
  await page.getByRole('button', { name: 'Derive Accounts' }).click()
  await waitForCryptoOperation()

  // Wait for output - check for Bitcoin address format (starts with 1 or 3 or bc1)
  await expect(
    page
      .getByText(/1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59}/)
      .first()
  ).toBeVisible({ timeout: 15000 })
})
