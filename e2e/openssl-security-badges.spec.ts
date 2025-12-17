import { test, expect } from '@playwright/test'

test.describe('OpenSSL Studio - Security Badges', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/openssl')
    await page.getByRole('link', { name: /OpenSSL/ }).click()
    // Wait for WASM to load
    await expect(page.getByRole('heading', { name: 'OpenSSL Studio' })).toBeVisible({
      timeout: 20000,
    })

    // Clear any previous files to avoid strict mode violations
    const clearBtn = page.getByRole('button', { name: 'Clear All' })
    if ((await clearBtn.isVisible()) && (await clearBtn.isEnabled())) {
      await clearBtn.click()
      // Confirm clear if needed (UI requires double click or confirm?)
      // WorkbenchFileManager.tsx logic: first click sets confirmClear=true, second executes.
      if (await page.getByRole('button', { name: 'Confirm Clear?' }).isVisible()) {
        await page.getByRole('button', { name: 'Confirm Clear?' }).click()
      }
    }
  })

  test('shows L3 badge for ML-KEM-768 key', async ({ page }) => {
    // Generate ML-KEM-768 Key
    await expect(page.getByText('2. Configuration')).toBeVisible()
    await page.locator('#algo-select').selectOption({ value: 'mlkem768' })
    const runBtn = page.getByRole('button', { name: 'Run Command' })
    await expect(runBtn).toBeEnabled()
    await runBtn.click()

    // Wait for file to appear
    const fileRow = page.getByRole('row').filter({ hasText: 'mlkem-768-' })
    await expect(fileRow).toBeVisible()

    // Check for L3 badge
    await expect(fileRow.getByText('L3')).toBeVisible()
  })

  test('shows L1 badge for ML-DSA-44 key', async ({ page }) => {
    // Generate ML-DSA-44 Key
    await expect(page.getByText('2. Configuration')).toBeVisible()
    await page.locator('#algo-select').selectOption({ value: 'mldsa44' })
    const runBtn = page.getByRole('button', { name: 'Run Command' })
    await expect(runBtn).toBeEnabled()
    await runBtn.click()

    // Wait for file to appear
    const fileRow = page.getByRole('row').filter({ hasText: 'mldsa-44-' })
    await expect(fileRow).toBeVisible()

    // Check for L1 badge
    await expect(fileRow.getByText('L1')).toBeVisible()
  })

  test('shows L5 badge for Falcon-1024', async ({ page }) => {
    // Simulate uploading a file
    const buffer = Buffer.from('test data')
    const fileInput = page.locator('#add-file-input')
    await fileInput.setInputFiles({
      name: 'falcon-1024_key.pem',
      mimeType: 'application/octet-stream',
      buffer: buffer,
    })

    const filesTable = page.locator('table').filter({ hasText: 'Filename' })
    const fileRow = filesTable.getByRole('row').filter({ hasText: 'falcon-1024_key.pem' })
    await expect(fileRow).toBeVisible()
    await expect(fileRow.getByText('L5')).toBeVisible()
  })
})
