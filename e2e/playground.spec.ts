// SPDX-License-Identifier: GPL-3.0-only
import { test, expect, type Page } from '@playwright/test'

/**
 * Select an item from a FilterDropdown (portal-based, scroll-close aware).
 *
 * FilterDropdown closes on window.scroll, so we:
 * 1. scrollIntoViewIfNeeded on the trigger button (no scroll event)
 * 2. click() to open the portal menu
 * 3. evaluate(el => el.click()) on the target option to fire a JS click without
 *    triggering a scroll event that would close the portal
 */
async function selectFromFilterDropdown(
  page: Page,
  nthDropdown: number,
  labelText: string | RegExp
) {
  const dropdown = page.locator('[data-testid="filter-dropdown"]').nth(nthDropdown)
  await dropdown.scrollIntoViewIfNeeded()
  await dropdown.click()
  await page
    .locator('[role="option"]')
    .getByText(labelText, { exact: false })
    .first()
    .evaluate((el: HTMLElement) => el.click())
}

/**
 * Select the first real key from a FilterDropdown (skips the default "Select Key..." option).
 * The portal always shows the default option (index 0), then real keys (index 1+).
 */
async function selectFirstKeyFromFilterDropdown(page: Page, nthDropdown: number) {
  const dropdown = page.locator('[data-testid="filter-dropdown"]').nth(nthDropdown)
  await dropdown.scrollIntoViewIfNeeded()
  await dropdown.click()
  // role="option" nth(0) is the "Select Key..." default — use nth(1) for first real key
  await page
    .locator('[role="option"]')
    .nth(1)
    .evaluate((el: HTMLElement) => el.click())
}

test.describe('Playground', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Playground view' }).click()
    await expect(
      page.getByRole('heading', { name: 'Interactive Playground', level: 2 })
    ).toBeVisible()
  })

  test('generates ML-KEM keys', async ({ page }) => {
    // Key Store tab is selected by default — select ML-KEM-768 from algorithm FilterDropdown
    await selectFromFilterDropdown(page, 0, 'ML-KEM-768 (NIST Level 3)')

    await page.getByRole('button', { name: 'Generate Keys' }).click()

    // Check if keys are displayed in the table
    await expect(page.getByRole('table')).toContainText('ML-KEM')
    await expect(page.getByRole('table')).toContainText('Public Key')
  })

  test('generates ML-DSA keys', async ({ page }) => {
    // Key Store tab is selected by default — select ML-DSA-65 from algorithm FilterDropdown
    await selectFromFilterDropdown(page, 0, 'ML-DSA-65 (NIST Level 3)')

    await page.getByRole('button', { name: 'Generate Keys' }).click()

    // Check if keys are displayed
    await expect(page.getByRole('table')).toContainText('ML-DSA')
  })

  test('performs ML-KEM encapsulation/decapsulation', async ({ page }) => {
    test.setTimeout(90000)

    // 1. Generate ML-KEM-768 key pair from Key Store tab
    await selectFromFilterDropdown(page, 0, 'ML-KEM-768 (NIST Level 3)')
    await page.getByRole('button', { name: 'Generate Keys' }).click()
    await expect(page.getByRole('table')).toContainText('ML-KEM')

    // 2. Switch to KEM & Encrypt tab
    await page.getByRole('tab', { name: 'KEM & Encrypt' }).click()

    // 3. Encapsulate — select Public Key from FilterDropdown nth(1)
    //    nth(0) = Key Derivation method; nth(1) = Public Key for Encapsulate
    await selectFirstKeyFromFilterDropdown(page, 1)

    // Verify encapsulate button is enabled then click
    const encapsulateButton = page.getByRole('button', { name: 'Run Encapsulate' })
    await expect(encapsulateButton).toBeEnabled()
    await encapsulateButton.click()

    // Wait for shared secret to be populated
    const sharedSecretInput = page.getByPlaceholder(/Key Material/).first()
    await expect(sharedSecretInput).not.toBeEmpty({ timeout: 15000 })

    // 4. Decapsulate — select Private Key from FilterDropdown nth(2)
    await selectFirstKeyFromFilterDropdown(page, 2)

    const decapsulateButton = page.getByRole('button', { name: 'Run Decapsulate' })
    await expect(decapsulateButton).toBeEnabled({ timeout: 10000 })
    await decapsulateButton.click()

    // Check for result — role="status" live region shows ✓ MATCH or ✗ MISMATCH
    const resultLocator = page.locator('[role="status"]', {
      hasText: /✓ MATCH|✗ MISMATCH/,
    })
    await expect(resultLocator).toBeVisible({ timeout: 60000 })
    await expect(resultLocator).toContainText('✓ MATCH')
  })

  test('performs ML-DSA signing/verification', async ({ page }) => {
    test.setTimeout(60000)

    // 1. Generate ML-DSA-65 key pair from Key Store tab
    await selectFromFilterDropdown(page, 0, 'ML-DSA-65 (NIST Level 3)')
    await page.getByRole('button', { name: 'Generate Keys' }).click()
    await expect(page.getByRole('table')).toContainText('ML-DSA')

    // 2. Switch to Sign & Verify tab (software mode — no HSM required)
    await page.getByRole('tab', { name: 'Sign & Verify' }).click()

    // 3. Sign — select Private Key from FilterDropdown nth(0)
    await selectFirstKeyFromFilterDropdown(page, 0)

    await page.getByRole('button', { name: 'Sign Message' }).click()

    // 4. Verify — select Public Key from FilterDropdown nth(1)
    await selectFirstKeyFromFilterDropdown(page, 1)

    await page.getByRole('button', { name: 'Verify Signature' }).click()

    // Check result
    await expect(page.getByText('VERIFICATION OK')).toBeVisible({ timeout: 30000 })
  })

  const newAlgorithms = [
    { name: 'HQC-128', label: 'HQC-128 (NIST Level 1)' },
    { name: 'FrodoKEM-640-AES', label: 'FrodoKEM-640-AES (Level 1)' },
    // Classic McEliece key gen can be slow — test the smallest variant only
    { name: 'Classic-McEliece-348864', label: 'Classic McEliece 348864' },
  ]

  for (const algo of newAlgorithms) {
    test(`generates and uses ${algo.name} keys`, async ({ page }) => {
      test.setTimeout(120000) // 2 minutes, safe for McEliece

      // 1. Generate Key from Key Store tab
      await selectFromFilterDropdown(page, 0, algo.label)
      await page.getByRole('button', { name: 'Generate Keys' }).click()

      // Verify key appears in table
      await expect(page.getByRole('table')).toContainText(algo.name, { timeout: 30000 })

      // 2. Switch to KEM & Encrypt tab
      await page.getByRole('tab', { name: 'KEM & Encrypt' }).click()

      // 3. Encapsulate — select Public Key from FilterDropdown nth(1)
      await selectFirstKeyFromFilterDropdown(page, 1)

      const encapsulateButton = page.getByRole('button', { name: 'Run Encapsulate' })
      await expect(encapsulateButton).toBeEnabled()
      await encapsulateButton.click()

      // Wait for shared secret
      const sharedSecretInput = page.getByPlaceholder(/Key Material/).first()
      await expect(sharedSecretInput).not.toBeEmpty({ timeout: 30000 })

      // 4. Decapsulate — select Private Key from FilterDropdown nth(2)
      await selectFirstKeyFromFilterDropdown(page, 2)

      const decapsulateButton = page.getByRole('button', { name: 'Run Decapsulate' })
      await expect(decapsulateButton).toBeEnabled()
      await decapsulateButton.click()

      // Check result
      const resultLocator = page.locator('[role="status"]', {
        hasText: /✓ MATCH|✗ MISMATCH/,
      })
      await expect(resultLocator).toBeVisible({ timeout: 90000 })
      await expect(resultLocator).toContainText('✓ MATCH')
    })
  }
})
