import { test, expect } from '@playwright/test'

test('Ethereum Flow E2E', async ({ page }) => {
  // Helper to wait for crypto operation to complete
  const waitForCryptoOperation = async () => {
    // Wait for the "Executing..." text to appear and disappear
    // This indicates the crypto operation is in progress
    await page.waitForTimeout(500) // Brief wait for click to register
    try {
      // If executing text appears, wait for it to disappear
      const executing = page.getByText('Executing...')
      if (await executing.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(executing).toBeHidden({ timeout: 45000 })
      }
    } catch {
      // If executing text never appeared, the operation may have been very quick
    }
    // Additional wait for output to render
    await page.waitForTimeout(500)
  }

  // 1. Navigate to Digital Assets Module
  await test.step('Navigate to Digital Assets', async () => {
    // Disable Guided Tour to prevent intercepting clicks
    await page.addInitScript(() => {
      window.localStorage.setItem('pqc-tour-completed', 'true')
    })

    await page.goto('/learn')
    // await page.waitForLoadState('networkidle') - Causes hacks
    await page.getByText('Digital Assets', { exact: true }).click()
    await expect(
      page.getByRole('heading', { name: 'Blockchain Cryptography', exact: true })
    ).toBeVisible({
      timeout: 15000,
    })
  })

  // 2. Switch to Ethereum Tab
  await test.step('Switch to Ethereum Module', async () => {
    await page.getByRole('button', { name: 'Workshop', exact: true }).click()
    await page.getByRole('heading', { name: 'Ethereum', exact: true }).click()
    await expect(page.getByText(/Generate Source Keypair/i)).toBeVisible({ timeout: 10000 })
  })

  // 3. Step 1: Generate Source Key
  await test.step('Step 1: Generate Source Key', async () => {
    const executeBtn = page.getByRole('button', { name: 'Generate Source Key' })
    await expect(executeBtn).toBeEnabled()
    await executeBtn.click()
    await waitForCryptoOperation()

    // Verify Output - Check for key indicators
    await expect(page.getByText(/SUCCESS.*Key Generated/i)).toBeVisible({ timeout: 45000 })
    await expect(page.getByText(/Private Key.*Hex/i)).toBeVisible()

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
    await waitForCryptoOperation()

    await expect(page.getByText(/Public Key.*Hex/i)).toBeVisible()
    await page.getByRole('button', { name: 'Next Step', exact: true }).click()
  })

  // 5. Step 3: Derive Source Address
  await test.step('Step 3: Derive Source Address', async () => {
    await expect(page.getByText('Derive Source Address')).toBeVisible()
    const executeBtn = page.getByRole('button', { name: 'Generate Source Address' })
    await executeBtn.click()
    await waitForCryptoOperation()

    await expect(page.getByText(/Ethereum Address/i)).toBeVisible()
    await expect(page.getByText(/0x[a-fA-F0-9]{40}/).first()).toBeVisible()
    await page.getByRole('button', { name: 'Next Step', exact: true }).click()
  })

  // 6. Step 4: Generate Recipient Key
  await test.step('Step 4: Generate Recipient Key', async () => {
    await expect(page.getByText('Generate Recipient Keypair')).toBeVisible()
    const executeBtn = page.getByRole('button', { name: 'Generate Recipient Key' })
    await executeBtn.click()
    await waitForCryptoOperation()

    await expect(page.getByText(/Recipient.*Key/i).first()).toBeVisible()
    await page.getByRole('button', { name: 'Next Step', exact: true }).click()
  })

  // 7. Step 5: Derive Recipient Address
  await test.step('Step 5: Derive Recipient Address', async () => {
    await expect(page.getByRole('heading', { name: 'Derive Recipient Address' })).toBeVisible()
    const executeBtn = page.getByRole('button', { name: 'Derive Recipient Address' })
    await executeBtn.click()
    await waitForCryptoOperation()

    await expect(page.getByText(/Recipient.*Address/i).first()).toBeVisible()
    await page.getByRole('button', { name: 'Next Step', exact: true }).click()
  })

  // 8. Step 6: Format Transaction
  await test.step('Step 6: Format Transaction', async () => {
    await expect(page.getByRole('heading', { name: 'Format Transaction' })).toBeVisible()
    const executeBtn = page.getByRole('button', { name: 'Format Transaction' })
    await executeBtn.click()
    await waitForCryptoOperation()

    await expect(page.getByText(/Transaction Details/i).first()).toBeVisible()
    await page.getByRole('button', { name: 'Next Step', exact: true }).click()
  })

  // 9. Step 7: Visualize Message
  await test.step('Step 7: Visualize Message', async () => {
    await expect(page.getByText('7. Visualize Transaction Fields')).toBeVisible()
    const executeBtn = page.getByRole('button', { name: 'Visualize Message' })
    await executeBtn.click()
    await waitForCryptoOperation()

    await expect(page.getByText(/RLP.*Encoded/i).first()).toBeVisible()
    await expect(page.getByText(/Keccak.*Hash/i).first()).toBeVisible()
    await page.getByRole('button', { name: 'Next Step', exact: true }).click()
  })

  // 10. Step 8: Sign Transaction
  await test.step('Step 8: Sign Transaction', async () => {
    await expect(page.getByRole('heading', { name: 'Sign Transaction' })).toBeVisible()
    const executeBtn = page.getByRole('button', { name: 'Sign Transaction' })
    await executeBtn.click()
    await waitForCryptoOperation()

    await expect(page.getByText(/SUCCESS.*Transaction Signed/i).first()).toBeVisible()
    await page.getByRole('button', { name: 'Next Step', exact: true }).click()
  })

  // 11. Step 9: Verify Signature
  await test.step('Step 9: Verify Signature', async () => {
    await expect(page.getByText('Verify Signature')).toBeVisible()
    const executeBtn = page.getByRole('button', { name: 'Verify & Recover' })
    await executeBtn.click()
    await waitForCryptoOperation()

    await expect(page.getByText(/Verification Result/i).first()).toBeVisible()

    // Finish
    await page.getByRole('button', { name: 'Completed' }).click()
  })
})
