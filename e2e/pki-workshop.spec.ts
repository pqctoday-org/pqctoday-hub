import { test, expect } from '@playwright/test'

test.describe('PKI Workshop Module', () => {
  test.setTimeout(120000)
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Navigate to Learn module
    await page.getByRole('button', { name: 'Learn' }).click()

    // Select PKI Workshop from Dashboard
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
    // Assuming Step 1 header is still consistent or we can find it by button
    await expect(page.getByText('Step 1: Generate CSR')).toBeVisible()

    // Fill Common Name (Global lookup as it is the active step)
    await page.getByPlaceholder('e.g., example.com').first().fill('mysite.com')

    // Click Generate
    await page.getByRole('button', { name: 'Generate CSR', exact: true }).click()

    // Verify Success
    await expect(page.getByText(/CSR generated and saved successfully/i)).toBeVisible({
      timeout: 60000,
    })
    await expect(page.getByText(/pkiworkshop_.*\.csr/)).toBeVisible()
    await page.getByRole('button', { name: 'Next Step' }).click()

    // --- Step 2: Root CA Generator ---
    // Verify visibility of Root CA Generator component
    await expect(page.getByText('ROOT CA KEY').first()).toBeVisible()

    // Fill Common Name (Mandatory)
    // Note: The UI separates keys, profiles, and attributes into panels.
    // Common Name is in "BUILD CERTIFICATE" panel, but accessible globally.
    await page.getByRole('textbox', { name: 'Common Name' }).fill('My Root CA')

    // Click Generate
    const genBtn = page.getByRole('button', { name: 'Generate Root CA' })
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
    // Verify visibility of Cert Signer component
    await expect(page.getByText('RECEIVE & VALIDATE').first()).toBeVisible()

    // Wait for dropdowns to populate
    await page.waitForTimeout(1000)

    // Select CSR (using ID from CertSigner.tsx)
    const csrSelect = page.locator('#csr-select').first()
    await csrSelect.selectOption({ index: 1 }) // Select the generated CSR

    // Select CA Key (using ID from CertSigner.tsx)
    const caKeySelect = page.locator('#ca-key-select').first()
    await caKeySelect.selectOption({ index: 1 }) // Select the generated CA Key

    // Click Sign
    await page.getByRole('button', { name: 'Sign Certificate' }).first().click()

    // Verify Success
    await expect(page.getByText(/Certificate signed successfully/i)).toBeVisible({ timeout: 60000 })
    await page.getByRole('button', { name: 'Next Step' }).click()

    // --- Step 4: Certificate Parser ---
    // Verify visibility of Cert Parser component
    await expect(page.getByText('Inspect Generated Artifacts').first()).toBeVisible()

    // Select Artifact
    const artifactSelect = page.locator('#artifact-select').first()

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
    await page.getByRole('button', { name: 'Parse Details' }).click()
    // The parser output shows "Certificate:" or "Parsed Output"
    await expect(page.getByText('Parsed Output').first()).toBeVisible()
    // It has tree view, so check for a node like "Subject" or "Issuer"
    await expect(page.getByText('Subject:').first()).toBeVisible()

    // Test Conversion to DER
    await page.getByRole('button', { name: 'To DER' }).click()
    await expect(page.getByText(/Converted to DER successfully/)).toBeVisible()

    // Test Conversion to P7B
    await page.getByRole('button', { name: 'To P7B' }).click()
    await expect(page.getByText(/Converted to P7B successfully/)).toBeVisible()
  })
})
