import { test, expect } from '@playwright/test'

test.describe('PKI Workshop Module', () => {
  test.setTimeout(120000)
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Navigate to Learn module
    await page.getByRole('button', { name: 'Learn' }).click()

    // Select PKI Workshop from Dashboard
    // The "PKI" card is the one we want.
    // Wait for dashboard to settle
    await page.waitForLoadState('networkidle')
    const card = page.getByRole('heading', { name: 'PKI', exact: true })
    await expect(card).toBeVisible({ timeout: 30000 })
    await card.click()

    // Verify we are in the workshop
    await expect(page.getByRole('heading', { name: 'PKI Workshop', level: 1 })).toBeVisible()
  })

  test('Complete PKI Lifecycle (CSR -> Root CA -> Sign -> Parse)', async ({
    page,
    browserName,
  }) => {
    // Skip Firefox due to persistent WASM/Rendering timeouts in CI environment
    test.skip(browserName === 'firefox', 'Firefox has WASM/Rendering instability in CI')
    // --- Step 1: CSR Generator ---
    await expect(page.getByText('Step 1: Generate CSR')).toBeVisible()

    // Select Profile (e.g., Web Server) - assuming the first select is for profile
    // Or we can try to find it by label if it exists, or just use the first select in the step
    const step1 = page.locator('.glass-panel').filter({ hasText: 'Step 1: Generate CSR' })
    // Fill Common Name
    await step1.getByPlaceholder('e.g., example.com').first().fill('mysite.com')
    // Select Profile (optional, default is fine)
    // await step1.locator('select').first().selectOption({ index: 1 })

    // Click Generate
    await step1.getByRole('button', { name: 'Generate CSR' }).click()

    // Verify Success
    await expect(page.getByText(/CSR generated and saved successfully/i)).toBeVisible({
      timeout: 60000,
    })
    await expect(page.getByText(/pkiworkshop_.*\.csr/)).toBeVisible()
    await page.getByRole('button', { name: 'Next Step' }).click()

    // --- Step 2: Root CA Generator ---
    // Scroll to Step 2 or just interact
    const step2 = page.locator('.glass-panel').filter({ hasText: 'Step 2: Create Root CA' })
    await expect(step2).toBeVisible()

    // Select Profile
    // Note: The first select is Key Type, second is Profile. We'll leave Key Type as default (RSA)
    // and select a profile if needed. But simpler to just fill mandatory CN.
    // await step2.locator('select').first().selectOption({ index: 1 })

    // Fill Common Name (Mandatory)
    await step2.getByRole('textbox', { name: 'Common Name' }).fill('My Root CA')

    // Click Generate
    const genBtn = step2.getByRole('button', { name: 'Generate Root CA' })
    await expect(genBtn).toBeVisible()
    await expect(genBtn).toBeEnabled()
    await genBtn.click()

    // Verify Success
    await expect(
      page.getByText(/Root CA certificate generated and saved successfully/i)
    ).toBeVisible({ timeout: 60000 })
    await expect(page.getByText(/pkiworkshop_ca_.*\.crt/)).toBeVisible()
    await page.getByRole('button', { name: 'Next Step' }).click()

    // --- Step 3: Certificate Issuance ---
    const step3 = page.locator('.glass-panel').filter({ hasText: 'Step 3: Certificate Issuance' })
    await expect(step3).toBeVisible()

    // Wait for dropdowns to populate (CSR and CA)
    await page.waitForTimeout(1000)

    // Select CSR (first select in step 3)
    const csrSelect = step3.locator('select').nth(0)
    await csrSelect.selectOption({ index: 1 }) // Select the generated CSR

    // Select CA (second select in step 3)
    const caSelect = step3.locator('select').nth(1)
    await caSelect.selectOption({ index: 1 }) // Select the generated CA

    // Click Sign
    await step3.getByRole('button', { name: 'Sign Certificate' }).click()

    // Verify Success
    await expect(page.getByText(/Certificate signed successfully/i)).toBeVisible({ timeout: 60000 })
    await expect(page.getByText(/pkiworkshop_cert_.*\.pem/)).toBeVisible()
    await page.getByRole('button', { name: 'Next Step' }).click()

    // --- Step 4: Certificate Parser ---
    const step4 = page.locator('.glass-panel').filter({ hasText: 'Step 4: Parse Certificate' })
    await expect(step4).toBeVisible()

    // Select Artifact (The signed cert should be available)
    const artifactSelect = step4.locator('select').first()

    // Wait for options to update
    await page.waitForTimeout(1000)

    // Select the last option (most recent cert)
    const options = await artifactSelect.locator('option').all()
    const lastOption = options[options.length - 1]
    const lastOptionValue = await lastOption.getAttribute('value')
    if (lastOptionValue) {
      await artifactSelect.selectOption(lastOptionValue)
    }

    // Click Parse
    await step4.getByRole('button', { name: 'Parse Details' }).click()
    await expect(step4.getByText('Certificate:')).toBeVisible() // OpenSSL text output

    // Test Conversion to DER
    await step4.getByRole('button', { name: 'To DER' }).click()
    await expect(page.getByText(/Converted to DER successfully/)).toBeVisible()

    // Test Conversion to P7B
    await step4.getByRole('button', { name: 'To P7B' }).click()
    await expect(page.getByText(/Converted to P7B successfully/)).toBeVisible()
  })
})
