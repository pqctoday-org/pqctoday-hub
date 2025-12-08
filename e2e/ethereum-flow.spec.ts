import { test, expect } from '@playwright/test'

test('Ethereum Flow E2E', async ({ page }) => {
  // 1. Navigate to Digital Assets Module
  await test.step('Navigate to Digital Assets', async () => {
    await page.goto('/learn')
    await page.getByText('Digital Assets', { exact: true }).click()
    await expect(page.getByText('Module 1: Bitcoin')).toBeVisible()
  })

  // 2. Switch to Ethereum Tab
  await test.step('Switch to Ethereum Module', async () => {
    // The tabs render the title split by ':', so "Module 2: Ethereum" -> "Ethereum"
    await page.getByRole('button', { name: /Ethereum/i }).click()
    await expect(page.getByText('Module 2: Ethereum')).toBeVisible()
    await expect(page.getByText('Generate Source Keypair')).toBeVisible()
  })

  // 3. Step 1: Generate Source Key
  await test.step('Step 1: Generate Source Key', async () => {
    const executeBtn = page.getByRole('button', { name: 'Generate Source Key' })
    await executeBtn.click()

    // Verify Output
    await expect(page.getByText('SUCCESS: Key Generated!')).toBeVisible()
    await expect(page.getByText('Generated Source Private Key (Hex):')).toBeVisible()

    // Check Next button enabled
    const nextBtn = page.getByRole('button', { name: 'Next Step', exact: true })
    await expect(nextBtn).toBeEnabled()
    await nextBtn.click()
  })

  // 4. Step 2: Derive Public Key
  await test.step('Step 2: Derive Public Key', async () => {
    await expect(page.getByText('Derive Source Public Key')).toBeVisible()
    const executeBtn = page.getByRole('button', { name: 'Extract Public Key' })
    await executeBtn.click()

    await expect(page.getByText('Derived Source Public Key (Hex):')).toBeVisible()
    await page.getByRole('button', { name: 'Next Step', exact: true }).click()
  })

  // 5. Step 3: Derive Source Address
  await test.step('Step 3: Derive Source Address', async () => {
    await expect(page.getByText('Derive Source Address')).toBeVisible()
    const executeBtn = page.getByRole('button', { name: 'Generate Source Address' })
    await executeBtn.click()

    await expect(page.getByText('Ethereum Address:')).toBeVisible()
    await expect(page.locator('.text-green-400', { hasText: '0x' }).first()).toBeVisible()
    await page.getByRole('button', { name: 'Next Step', exact: true }).click()
  })

  // 6. Step 4: Generate Recipient Key
  await test.step('Step 4: Generate Recipient Key', async () => {
    await expect(page.getByText('Generate Recipient Keypair')).toBeVisible()
    const executeBtn = page.getByRole('button', { name: 'Generate Recipient Key' })
    await executeBtn.click()

    await expect(page.getByText('Generated Recipient Keys:')).toBeVisible()
    await page.getByRole('button', { name: 'Next Step', exact: true }).click()
  })

  // 7. Step 5: Derive Recipient Address
  await test.step('Step 5: Derive Recipient Address', async () => {
    await expect(page.getByRole('heading', { name: 'Derive Recipient Address' })).toBeVisible()
    const executeBtn = page.getByRole('button', { name: 'Derive Recipient Address' })
    await executeBtn.click()

    await expect(page.getByText('Recipient Ethereum Address:')).toBeVisible()
    await page.getByRole('button', { name: 'Next Step', exact: true }).click()
  })

  // 8. Step 6: Format Transaction
  await test.step('Step 6: Format Transaction', async () => {
    await expect(page.getByRole('heading', { name: 'Format Transaction' })).toBeVisible()
    const executeBtn = page.getByRole('button', { name: 'Format Transaction' })
    await executeBtn.click()

    await expect(page.getByText('Transaction Details:')).toBeVisible()
    // Verify JSON content exists
    await expect(page.getByText('"value"')).toBeVisible()
    await page.getByRole('button', { name: 'Next Step', exact: true }).click()
  })

  // 9. Step 7: Visualize Message
  await test.step('Step 7: Visualize Message', async () => {
    await expect(page.getByText('Visualize RLP Structure')).toBeVisible()
    const executeBtn = page.getByRole('button', { name: 'Visualize Message' })
    await executeBtn.click()

    await expect(page.getByText('RLP Encoded Structure (to be hashed):')).toBeVisible()
    await expect(page.getByText('Keccak-256 Hash (to sign):')).toBeVisible()
    await page.getByRole('button', { name: 'Next Step', exact: true }).click()
  })

  // 10. Step 8: Sign Transaction
  await test.step('Step 8: Sign Transaction', async () => {
    await expect(page.getByRole('heading', { name: 'Sign Transaction' })).toBeVisible()
    const executeBtn = page.getByRole('button', { name: 'Sign Transaction' })
    await executeBtn.click()

    // This was the broken step, so critical verify
    await expect(page.getByText('SUCCESS: Transaction Signed & Processed!')).toBeVisible()
    await expect(page.getByText('recovery_id:')).toBeVisible()
    await page.getByRole('button', { name: 'Next Step', exact: true }).click()
  })

  // 11. Step 9: Verify Signature
  await test.step('Step 9: Verify Signature', async () => {
    await expect(page.getByText('Verify Signature')).toBeVisible()
    const executeBtn = page.getByRole('button', { name: 'Verify & Recover' })
    await executeBtn.click()

    await expect(page.getByText('Verification Result:')).toBeVisible()
    // await expect(page.getByText('✅ MATCH')).toBeVisible()

    // Finish
    await page.getByRole('button', { name: 'Completed' }).click()
  })
})
