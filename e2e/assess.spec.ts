// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

// The pqc-assessment store uses version 10 (as of v2.30.0)
const ASSESSMENT_STORAGE_KEY = 'pqc-assessment'

test.describe('PQC Risk Assessment (/assess)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any saved assessment state so every test starts at the mode selector.
    // The global storageState fixture (playwright.config.ts) suppresses the WhatsNew toast.
    await page.addInitScript(() => {
      localStorage.removeItem('pqc-assessment')
    })
    await page.goto('/assess')
  })

  // ── Page-level ────────────────────────────────────────────────────────────────

  test('loads the assessment page with mode selector', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'PQC Risk Assessment', level: 2 })).toBeVisible()
    // Quick mode description
    await expect(page.getByText(/6 questions/)).toBeVisible()
    // Comprehensive mode description
    await expect(page.getByText(/13 questions/)).toBeVisible()
  })

  test('Quick and Comprehensive buttons are visible in mode selector', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Quick/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Comprehensive/ })).toBeVisible()
  })

  // ── Quick mode ────────────────────────────────────────────────────────────────

  test('Quick mode: starts at Industry step (Step 1 of 6)', async ({ page }) => {
    await page.getByRole('button', { name: /Quick/ }).click()
    await expect(page.getByText('What industry are you in?')).toBeVisible()
    await expect(page.getByText('Step 1 of 6').locator('visible=true').first()).toBeVisible()
  })

  test('Quick mode: step indicator shows all 6 step titles', async ({ page }) => {
    await page.getByRole('button', { name: /Quick/ }).click()
    const titles = ['Industry', 'Country', 'Crypto', 'Sensitivity', 'Compliance', 'Migration']
    for (const title of titles) {
      await expect(page.getByText(title).locator('visible=true').first()).toBeVisible()
    }
  })

  // ── Comprehensive mode ────────────────────────────────────────────────────────

  test('Comprehensive mode: starts at Industry step (Step 1 of 13)', async ({ page }) => {
    await page.getByRole('button', { name: /Comprehensive/ }).click()
    await expect(page.getByText('What industry are you in?')).toBeVisible()
    await expect(page.getByText('Step 1 of 13').locator('visible=true').first()).toBeVisible()
  })

  // ── Navigation guards ─────────────────────────────────────────────────────────

  test('Next button is disabled until an industry is selected', async ({ page }) => {
    await page.getByRole('button', { name: /Quick/ }).click()
    const nextBtn = page.getByRole('button', { name: 'Next' })
    await expect(nextBtn).toBeDisabled()

    // Select first available industry radio button
    await page
      .getByRole('radiogroup', { name: 'Industry selection' })
      .getByRole('radio')
      .first()
      .click()
    await expect(nextBtn).toBeEnabled()
  })

  test('Previous button is disabled on step 1', async ({ page }) => {
    await page.getByRole('button', { name: /Quick/ }).click()
    await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled()
  })

  // ── Forward/back navigation ───────────────────────────────────────────────────

  test('navigates to step 2 after selecting an industry', async ({ page }) => {
    await page.getByRole('button', { name: /Quick/ }).click()
    await page
      .getByRole('radiogroup', { name: 'Industry selection' })
      .getByRole('radio')
      .first()
      .click()
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByText('Step 2 of 6').locator('visible=true').first()).toBeVisible()
  })

  test('Previous navigates back from step 2 to step 1', async ({ page }) => {
    await page.getByRole('button', { name: /Quick/ }).click()
    await page
      .getByRole('radiogroup', { name: 'Industry selection' })
      .getByRole('radio')
      .first()
      .click()
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByText('Step 2 of 6').locator('visible=true').first()).toBeVisible()

    await page.getByRole('button', { name: 'Previous' }).click()
    await expect(page.getByText('Step 1 of 6').locator('visible=true').first()).toBeVisible()
    await expect(page.getByText('What industry are you in?')).toBeVisible()
  })

  // ── Reset ─────────────────────────────────────────────────────────────────────

  test('Reset button clears the wizard and returns to mode selector', async ({ page }) => {
    await page.getByRole('button', { name: /Quick/ }).click()
    await page.getByRole('button', { name: 'Reset' }).click()

    // Mode selector should be visible again
    await expect(page.getByText(/6 questions/)).toBeVisible()
    await expect(page.getByText(/13 questions/)).toBeVisible()
  })

  // ── Deep link ─────────────────────────────────────────────────────────────────

  test('?step=2 deep link jumps to step 3 when assessment mode is pre-seeded', async ({ page }) => {
    // Pre-seed a mode so the wizard renders immediately (skips mode selector)
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-assessment',
        JSON.stringify({
          state: { assessmentMode: 'comprehensive', currentStep: 0 },
          version: 10,
        })
      )
    })
    await page.goto('/assess?step=2')
    // Step 3 (0-indexed step=2)
    await expect(page.getByText('Step 3 of 13').locator('visible=true').first()).toBeVisible()
  })

  // ── Resume banner ─────────────────────────────────────────────────────────────

  test('shows resume banner for a saved in-progress assessment', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-assessment',
        JSON.stringify({
          state: {
            assessmentMode: null,
            currentStep: 3,
            industry: 'Finance',
            lastWizardUpdate: Date.now() - 3_600_000, // 1 hour ago
            assessmentStatus: 'in-progress',
          },
          version: 10,
        })
      )
    })
    await page.goto('/assess')
    await expect(page.getByText('Resume saved assessment?')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Start Over/ })).toBeVisible()
  })

  test('Start Over in resume banner resets the wizard', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-assessment',
        JSON.stringify({
          state: {
            assessmentMode: null,
            currentStep: 3,
            industry: 'Finance',
            lastWizardUpdate: Date.now() - 3_600_000,
            assessmentStatus: 'in-progress',
          },
          version: 10,
        })
      )
    })
    await page.goto('/assess')
    await page.getByRole('button', { name: /Start Over/ }).click()
    // Banner should dismiss and mode selector should be visible
    await expect(page.getByText('Resume saved assessment?')).not.toBeVisible()
    await expect(page.getByText(/6 questions/)).toBeVisible()
  })

  // ── Generate Report (last step visible with pre-seeded state) ─────────────────

  test('Generate Report button appears on the last Quick step', async ({ page }) => {
    // Pre-seed a Quick assessment at step 5 (last, 0-indexed) with all required fields filled
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-assessment',
        JSON.stringify({
          state: {
            assessmentMode: 'quick',
            currentStep: 5,
            industry: 'Finance',
            country: 'United States',
            currentCryptoCategories: ['Asymmetric Encryption'],
            cryptoUnknown: false,
            dataSensitivity: ['Highly Sensitive'],
            sensitivityUnknown: false,
            complianceRequirements: [],
            migrationStatus: 'planning',
            migrationUnknown: false,
            assessmentStatus: 'in-progress',
            currentStep_for_display: 5,
          },
          version: 10,
        })
      )
    })
    await page.goto('/assess')
    await expect(page.getByRole('button', { name: 'Generate Report' })).toBeVisible()
  })

  // ── localStorage key storage ──────────────────────────────────────────────────

  test('assessment state is saved to localStorage after selecting an industry', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /Quick/ }).click()
    await page
      .getByRole('radiogroup', { name: 'Industry selection' })
      .getByRole('radio')
      .first()
      .click()

    const stored = await page.evaluate((key) => localStorage.getItem(key), ASSESSMENT_STORAGE_KEY)
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!)
    expect(parsed.state.industry).toBeTruthy()
  })

  // ── Accessibility ─────────────────────────────────────────────────────────────

  test('mode selector passes accessibility audit', async ({ page }) => {
    await expect(page).toHaveTitle(/PQC Risk Assessment/i, { timeout: 10000 })
    await injectAxe(page)
    await checkA11y(page, undefined, {
      axeOptions: {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        rules: { 'color-contrast': { enabled: false } },
      },
    })
  })

  test('step 1 (Industry) passes accessibility audit', async ({ page }) => {
    await page.getByRole('button', { name: /Comprehensive/ }).click()
    await injectAxe(page)
    await checkA11y(page, undefined, {
      axeOptions: {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        rules: { 'color-contrast': { enabled: false } },
      },
    })
  })
})
