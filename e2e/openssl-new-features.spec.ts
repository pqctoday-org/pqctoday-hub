import { test, expect } from '@playwright/test'

test.describe('OpenSSL Studio - New Features (Enc, KEM, PKCS12)', () => {
  test.beforeEach(async ({ page }) => {
    // Capture browser logs
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

  test('Encryption and Decryption (AES-256-CBC)', async ({ page }) => {
    // 1. Create Data File
    await page.getByRole('button', { name: 'Sign / Verify' }).click() // Go to a tab that has "Create Test Data File"
    await page.getByRole('button', { name: 'Create Test Data File' }).click()
    await expect(page.getByText(/File created: data.txt/)).toBeVisible()

    // 2. Encrypt
    await page.getByRole('button', { name: 'Encryption' }).click()
    // Select AES-256-CBC (default)
    // Input File: data.txt (default if selected)
    // Passphrase: test
    await page.fill('#enc-pass-input', 'test')
    await page.getByRole('button', { name: 'Run Command' }).click()
    await expect(page.getByText(/File created: data.enc/)).toBeVisible()

    // 3. Decrypt
    await page.getByRole('button', { name: 'Decrypt' }).click()
    // Input File: data.enc (might need to select it)
    await page.waitForTimeout(500)
    await page.selectOption('#enc-infile-select', 'data.enc')
    await page.fill('#enc-pass-input', 'test')
    await page.getByRole('button', { name: 'Run Command' }).click()
    await expect(page.getByText(/File created: data.dec.txt/)).toBeVisible()
  })

  test('Key Encapsulation (ML-KEM)', async ({ page }) => {
    // 1. Generate ML-KEM Key
    await page.getByRole('button', { name: 'Key Generation' }).click()
    await page.selectOption('#key-algo-select', 'mlkem768')
    await page.getByRole('button', { name: 'Run Command' }).click()
    await expect(page.getByText(/File created: mlkem-768-/)).toBeVisible()

    // 2. Encapsulate (using public key)
    await page.getByRole('button', { name: 'KEM' }).click()
    await page.getByRole('button', { name: 'Encapsulate' }).click()
    // Action: Encapsulate (default)
    // KEM Algorithm: ML-KEM-768 (default)
    // Public Key: mlkem-768-....pub (should be auto-selected or available)
    // We need to make sure the key is selected.
    // For simplicity, we assume the first available key is selected or we just run it.
    await page.getByRole('button', { name: 'Run Command' }).click()
    await expect(page.getByText(/File created: mlkem-768-.*\.ss/)).toBeVisible()
    await expect(page.getByText(/File created: mlkem-768-.*\.ct/)).toBeVisible()

    // 3. Decapsulate (using private key)
    await page.getByRole('button', { name: 'Decapsulate' }).click()
    const privKeyOption = page.locator('#kem-key-select option').filter({ hasText: '.key' }).first()
    const privKeyVal = await privKeyOption.getAttribute('value')
    if (privKeyVal) await page.selectOption('#kem-key-select', privKeyVal)

    // Select Ciphertext
    await page.waitForTimeout(500)
    const ctOption = page.locator('#kem-infile-select option').filter({ hasText: '.ct' }).first()
    const ctVal = await ctOption.getAttribute('value')
    if (ctVal) await page.selectOption('#kem-infile-select', ctVal)

    await page.getByRole('button', { name: 'Run Command' }).click()
    await expect(page.getByText(/File created: mlkem-768-.*\.ss/)).toBeVisible()
  })

  test('PKCS#12 Export and Import', async ({ page }) => {
    // 1. Generate Key
    await page.getByRole('button', { name: 'Key Generation' }).click()
    await page.getByRole('button', { name: 'Run Command' }).click()
    await expect(page.getByText(/File created: rsa-2048-/)).toBeVisible()

    // 2. Generate Cert
    await page.getByRole('button', { name: 'Certificate' }).click()
    await page.waitForTimeout(500)
    const keyOption = page
      .locator('#csr-key-select option')
      .filter({ hasText: 'rsa-2048-' })
      .first()
    const keyVal = await keyOption.getAttribute('value')
    if (keyVal) await page.selectOption('#csr-key-select', keyVal)
    await page.getByRole('button', { name: 'Run Command' }).click()
    await expect(page.getByText(/File created: rsa-cert-/)).toBeVisible()

    // 3. Export PKCS#12
    await page.getByRole('button', { name: 'PKCS#12' }).click()
    await page.getByRole('button', { name: 'Export' }).click()

    // Select Cert
    await page.waitForTimeout(500)
    const certOption = page
      .locator('#p12-cert-select option')
      .filter({ hasText: 'rsa-cert-' })
      .first()
    const certVal = await certOption.getAttribute('value')
    if (certVal) await page.selectOption('#p12-cert-select', certVal)

    // Select Key
    const p12KeyOption = page
      .locator('#p12-key-select option')
      .filter({ hasText: 'rsa-2048-' })
      .first()
    const p12KeyVal = await p12KeyOption.getAttribute('value')
    if (p12KeyVal) await page.selectOption('#p12-key-select', p12KeyVal)

    await page.fill('#p12-pass-input', 'exportpass')
    await page.getByRole('button', { name: 'Run Command' }).click()
    await expect(page.getByText(/File created: bundle.p12/)).toBeVisible()

    // 4. Import PKCS#12
    await page.getByRole('button', { name: 'Import' }).click()
    await page.selectOption('#p12-file-select', 'bundle.p12')
    await page.fill('#p12-pass-input', 'exportpass')
    await page.getByRole('button', { name: 'Run Command' }).click()
    await expect(page.getByText(/File created: restored.pem/)).toBeVisible()
  })
})
