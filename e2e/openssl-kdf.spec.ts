import { test, expect } from '@playwright/test'

test.describe('OpenSSL Studio - KDF Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/openssl')
    await page.getByRole('link', { name: /OpenSSL/ }).click()
    // Wait for WASM to load
    await expect(page.getByRole('heading', { name: 'OpenSSL Studio' })).toBeVisible({
      timeout: 20000,
    })
  })

  test('shows KDF category button', async ({ page }) => {
    // Scroll category buttons into view if needed
    // The WorkbenchToolbar is inside an overflow container.
    // We try to find the KDF button.
    const kdfBtn = page.getByRole('button', { name: /Key Derivation/ })

    // Ensure the side panel is visible
    await expect(page.getByText('1. Select Operation')).toBeVisible()

    // Force scroll to bottom of the sidebar might be needed, or just standard .scrollIntoViewIfNeeded()
    // Playwright click auto-scrolls, but toBeVisible check might fail if clipped.
    // So we just click it directly.
    await kdfBtn.click()

    // Check config panel appears
    await expect(page.getByText('2. Configuration')).toBeVisible()
    await expect(page.getByText('Key Derivation (KDF)')).toBeVisible()
  })

  test('generates HKDF command', async ({ page }) => {
    await page.getByRole('button', { name: /Key Derivation/ }).click()

    // Select HKDF (default)
    // Enter common options
    await page.getByLabel('Output Length (bytes)').fill('64')
    await page.getByLabel('Salt (hex)').fill('aabbcc')

    // HKDF specific
    await page.getByLabel('Secret / Key (hex)').fill('112233')
    await page.getByLabel('Info (hex)').fill('deadbeef')

    const cmd = page.locator('code').filter({ hasText: 'openssl kdf' })
    await expect(cmd).toContainText('kdf -keylen 64')
    await expect(cmd).toContainText('-kdfopt digest:SHA256')
    await expect(cmd).toContainText('-kdfopt salt:aabbcc')
    await expect(cmd).toContainText('-kdfopt key:112233')
    await expect(cmd).toContainText('-kdfopt info:deadbeef')
    await expect(cmd).toContainText('HKDF')
  })

  test('generates PBKDF2 command', async ({ page }) => {
    await page.getByRole('button', { name: /Key Derivation/ }).click()

    // Select PBKDF2
    await page.getByLabel('KDF Algorithm').selectOption('PBKDF2')

    // Enter options
    await page.getByLabel('Password').fill('mypassword')
    await page.getByLabel('Salt (hex)').fill('123456')
    await page.getByLabel('Iterations').fill('4096')

    const cmd = page.locator('code').filter({ hasText: 'openssl kdf' })
    await expect(cmd).toContainText('kdf -keylen 32')
    await expect(cmd).toContainText('-kdfopt digest:SHA256')
    await expect(cmd).toContainText('-kdfopt pass:mypassword')
    await expect(cmd).toContainText('-kdfopt salt:123456')
    await expect(cmd).toContainText('-kdfopt iter:4096')
    await expect(cmd).toContainText('PBKDF2')
  })

  test('generates SCRYPT command', async ({ page }) => {
    await page.getByRole('button', { name: /Key Derivation/ }).click()

    // Select SCRYPT
    await page.getByLabel('KDF Algorithm').selectOption('SCRYPT')

    // Enter options
    await page.getByLabel('Password').fill('scryptpass')
    await page.getByLabel('N (Cost)').fill('2048')

    const cmd = page.locator('code').filter({ hasText: 'openssl kdf' })
    await expect(cmd).toContainText('kdf -keylen 32')
    await expect(cmd).toContainText('-kdfopt pass:scryptpass')
    await expect(cmd).toContainText('-kdfopt N:2048')
    await expect(cmd).toContainText('SCRYPT')
  })
})
