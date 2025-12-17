import { test, expect } from '@playwright/test'

test.describe.skip('OpenSSL Studio - Deterministic ECDSA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/openssl')
    await page.getByRole('link', { name: /OpenSSL/ }).click()
    await expect(page.getByRole('heading', { name: 'OpenSSL Studio' })).toBeVisible({
      timeout: 20000,
    })

    // Clear any previous files to avoid strict mode violations
    const clearBtn = page.getByRole('button', { name: 'Clear All' })
    if ((await clearBtn.isVisible()) && (await clearBtn.isEnabled())) {
      await clearBtn.click()
      if (await page.getByRole('button', { name: 'Confirm Clear?' }).isVisible()) {
        await page.getByRole('button', { name: 'Confirm Clear?' }).click()
      }
    }
  })

  test('verifies deterministic ECDSA (RFC 6979)', async ({ page }) => {
    // Ensure sidebar is loaded
    await expect(page.getByText('1. Select Operation')).toBeVisible()

    // 1. Generate P-256 Key
    // Use precise locator and ensure it's visible/scrollable
    const genKeyBtn = page.getByRole('button', { name: /Key Generation/ })
    await genKeyBtn.click()

    await expect(page.locator('#algo-select')).toBeVisible()
    await page.locator('#algo-select').selectOption('ec')
    await page.locator('#curve-select').selectOption('P-256')

    // Generate Key
    const runBtn = page.getByRole('button', { name: 'Run Command' })
    await expect(runBtn).toBeVisible({ timeout: 30000 })
    await expect(runBtn).toBeEnabled()
    await runBtn.click()

    // Verify file exists in table and capture its name
    const filesTable = page.locator('table').filter({ hasText: 'Filename' })
    // Wait for row with P-256 key pattern
    await expect(filesTable.getByRole('row').filter({ hasText: 'ec-P-256-' })).toBeVisible({
      timeout: 30000,
    })

    // Get the filename text
    const keyRow = filesTable.getByRole('row').filter({ hasText: 'ec-P-256-' }).first()
    const keyFileName = await keyRow.locator('td').nth(2).innerText() // Filename is 3rd column (index 2)
    console.log(`Generated Key File: ${keyFileName}`)

    // 2. Create Data File
    // Click "Random" in sidebar
    await page.getByRole('button', { name: 'Random' }).click()

    // RandConfig usually produces `random-32bytes-...`
    await expect(page.getByLabel('Number of Bytes')).toBeVisible()
    await page.getByLabel('Number of Bytes').fill('32')

    await expect(runBtn).toBeEnabled()
    await runBtn.click()

    // Wait for random file pattern
    // Pattern logic from Workbench.tsx: random-{bytes}bytes-{timestamp}.{ext}
    await expect(filesTable.getByRole('row').filter({ hasText: 'random-32bytes-' })).toBeVisible()

    const dataRow = filesTable.getByRole('row').filter({ hasText: 'random-32bytes-' }).first()
    const dataFileName = await dataRow.locator('td').nth(2).innerText()
    console.log(`Generated Data File: ${dataFileName}`)

    // 3. Sign Twice
    // Click "Digest / Sign" in sidebar
    await page.getByRole('button', { name: 'Digest / Sign' }).click()

    // Select Sign mdoe
    await page.getByRole('button', { name: 'Sign' }).click()

    await page.getByLabel('Private Key').selectOption(keyFileName)
    await page.getByLabel('Data File').selectOption(dataFileName)

    // Sig 1
    await page.getByLabel('Signature Output').fill('sig1.bin')
    await expect(runBtn).toBeEnabled()
    await runBtn.click()
    await expect(filesTable.getByRole('row').filter({ hasText: 'sig1.bin' })).toBeVisible()

    // Sig 2
    await page.getByLabel('Signature Output').fill('sig2.bin')
    await expect(runBtn).toBeEnabled()
    await runBtn.click()
    await expect(filesTable.getByRole('row').filter({ hasText: 'sig2.bin' })).toBeVisible()

    // 4. Compare Sig 1 and Sig 2
    // Run hash on sig1.bin to compare (since diff is not available)
    await page.getByRole('button', { name: 'Digest' }).click() // Switch back to Digest mode

    await page.getByLabel('Input File').selectOption('sig1.bin')
    await page.getByLabel('Hash Algorithm').selectOption('SHA256')

    await expect(runBtn).toBeEnabled()
    await runBtn.click()

    // Capture output
    const log1 = page.locator('.terminal-line').last()
    const text1 = await log1.innerText()

    // Run hash on sig2.bin
    await page.getByLabel('Input File').selectOption('sig2.bin')
    // Wait for button to be ready again (it might be fast, but good practice)
    await expect(runBtn).toBeEnabled()
    await runBtn.click()

    const log2 = page.locator('.terminal-line').last()
    const text2 = await log2.innerText()

    // Extract the hex part.
    const hash1 = text1.split('= ')[1]
    const hash2 = text2.split('= ')[1]

    expect(hash1).toBe(hash2)
  })
})
