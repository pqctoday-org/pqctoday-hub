import { test, expect } from '@playwright/test'

test.describe('OpenSSL Studio - Encryption IV Support', () => {
  test.beforeEach(async ({ page, browserName }) => {
    // Skip WebKit due to persistent UI rendering timeouts in CI
    test.skip(browserName === 'webkit', 'WebKit has UI rendering instability in CI')

    page.on('console', (msg) => console.log(`BROWSER LOG: ${msg.text()}`))
    await page.goto('/')
    await page.getByRole('button', { name: /OpenSSL/ }).click()
    await expect(page.getByRole('heading', { name: 'OpenSSL Studio', level: 2 })).toBeVisible()
  })

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      const logs = await page
        .locator('table tbody tr td:nth-child(2)')
        .allInnerTexts()
        .catch(() => ['No terminal output found'])
      console.log(`TERMINAL OUTPUT for ${testInfo.title}:\n${logs.join('\n')}`)
    }
  })

  test('Encryption with Show Key & IV (-p)', async ({ page }) => {
    // 1. Create Data File
    await page.getByRole('button', { name: 'Sign / Verify' }).click()
    const createBtn = page.getByRole('button', { name: 'Create Test Data File' })
    await expect(createBtn).toBeVisible({ timeout: 15000 })
    await createBtn.click()
    // Verify file exists in dropdown instead of toast, as addFile might not trigger toast
    await page.getByRole('button', { name: 'Encryption' }).click()
    const inFileSelect = page.locator('#enc-infile-select')
    await expect(inFileSelect).toContainText('data.txt')

    // 2. Encrypt with -p
    await page.fill('#enc-pass-input', 'test')

    // Check "Show Derived Key & IV"
    await page.getByLabel('Show Derived Key & IV (-p)').check()

    await page.getByRole('button', { name: 'Run Command' }).click()

    // Verify output contains salt, key, and iv
    const terminal = page.getByTestId('terminal-logs')
    await expect(terminal).toBeVisible({ timeout: 15000 })
    await expect(terminal).toContainText('salt=')
    await expect(terminal).toContainText('key=')
    await expect(terminal).toContainText('iv =')
    await expect(page.getByText(/File created: data.txt.enc/)).toBeVisible()
  })

  test('Encryption with Custom IV', async ({ page }) => {
    // 1. Create Data File
    await page.getByRole('button', { name: 'Sign / Verify' }).click()
    const createBtn = page.getByRole('button', { name: 'Create Test Data File' })
    await expect(createBtn).toBeVisible({ timeout: 15000 })
    await createBtn.click()

    // 2. Encrypt with Custom IV
    await page.getByRole('button', { name: 'Encryption' }).click()
    await page.fill('#enc-pass-input', 'test')

    const customIV = '0102030405060708090a0b0c0d0e0f10' // 16 bytes for AES-128/256
    await page.fill('#enc-iv-input', customIV)

    // Also check -p to verify the IV was used
    await page.getByLabel('Show Derived Key & IV (-p)').check()

    await page.getByRole('button', { name: 'Run Command' }).click()

    // Verify output shows the custom IV
    const terminal = page.getByTestId('terminal-logs')
    await expect(terminal).toBeVisible({ timeout: 15000 })
    await expect(terminal).toContainText(`iv =${customIV.toUpperCase()}`, { ignoreCase: true })
    await expect(page.getByText(/File created: data.txt.enc/)).toBeVisible()
  })
})
