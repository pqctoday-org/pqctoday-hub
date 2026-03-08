// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

test.describe('PKI Workshop Module', () => {
  test.setTimeout(240000)
  test.beforeEach(async ({ page }) => {
    // Suppress "What's New" toast (z-[100] overlay intercepts clicks):
    // main.tsx always sets pqc-tour-completed=true on load, which triggers the toast because
    // hasSeenCurrentVersion() uses strict equality and '99.0.0' !== app version.
    // Block the key from being written so tourCompleted stays false.
    await page.addInitScript(() => {
      const _orig = Storage.prototype.setItem
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === 'pqc-tour-completed') return
        _orig.call(this, key, value)
      }
    })
    await page.goto('/')
    // Navigate directly to module to avoid collapsed track group on learn dashboard (v2.29+)
    await page.goto('/learn/pki-workshop')

    // Verify we are in the workshop
    await expect(page.getByRole('heading', { name: 'PKI Workshop', level: 1 })).toBeVisible()
    // Module defaults to "Learn" tab; navigate to Workshop where the step UI lives
    await page.getByRole('button', { name: 'Workshop', exact: true }).first().click()
    await expect(page.getByText('Step 1: Generate CSR')).toBeVisible()
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

    // Select CSR, Profile, CA Key via FilterDropdown (CertSigner uses custom dropdowns).
    // FilterDropdowns have data-testid="filter-dropdown"; CertSigner has 3 in order: CSR, Profile, CA Key.
    // IMPORTANT: FilterDropdown closes on window.scroll (passive listener).
    // Playwright's click() does "scroll into view" which fires the scroll event, detaching the portal.
    // Fix: scrollIntoViewIfNeeded() on the trigger BEFORE opening (dropdown closed = handler not registered),
    // then use evaluate(el => el.click()) to fire a JS click directly — no Playwright scroll.
    await page.locator('[data-testid="filter-dropdown"]').nth(0).scrollIntoViewIfNeeded()
    await page.locator('[data-testid="filter-dropdown"]').nth(0).click()
    await expect(page.locator('[role="listbox"]')).toBeVisible()
    await page
      .locator('[role="option"]')
      .nth(1)
      .evaluate((el: HTMLElement) => el.click())

    await page.locator('[data-testid="filter-dropdown"]').nth(1).scrollIntoViewIfNeeded()
    await page.locator('[data-testid="filter-dropdown"]').nth(1).click()
    await expect(page.locator('[role="listbox"]')).toBeVisible()
    await page
      .locator('[role="option"]')
      .nth(1)
      .evaluate((el: HTMLElement) => el.click())

    await page.locator('[data-testid="filter-dropdown"]').nth(2).scrollIntoViewIfNeeded()
    await page.locator('[data-testid="filter-dropdown"]').nth(2).click()
    await expect(page.locator('[role="listbox"]')).toBeVisible()
    await page
      .locator('[role="option"]')
      .nth(1)
      .evaluate((el: HTMLElement) => el.click())

    // Click Sign
    await page.getByRole('button', { name: 'Sign Certificate' }).first().click()

    // Verify Success
    await expect(page.getByText(/Certificate signed successfully/i)).toBeVisible({ timeout: 60000 })
    await page.getByRole('button', { name: 'Next Step' }).click()

    // --- Step 4: Certificate Parser ---
    // Verify visibility of Cert Parser component
    await expect(page.getByText('Inspect Generated Artifacts').first()).toBeVisible()

    // Select the signed certificate via FilterDropdown (CertParser has 1 dropdown).
    // Use same scroll-first + evaluate pattern to avoid scroll-close handler detaching portal.
    await page.locator('[data-testid="filter-dropdown"]').first().scrollIntoViewIfNeeded()
    await page.locator('[data-testid="filter-dropdown"]').first().click()
    await expect(page.locator('[role="listbox"]')).toBeVisible()
    const optionCount = await page.locator('[role="option"]').count()
    await page
      .locator('[role="option"]')
      .nth(optionCount - 1)
      .evaluate((el: HTMLElement) => el.click())

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
