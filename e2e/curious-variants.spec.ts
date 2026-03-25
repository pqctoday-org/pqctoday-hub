import { test, expect } from '@playwright/test'

test.describe('Curious Persona Variants', () => {
  test('loads the curious variant infographic and summary when curious persona is selected', async ({
    page,
  }) => {
    // Navigate to homepage to select the persona
    await page.goto('/')

    // Find and click the Curious experience level button
    // It has text 'Curious' and 'No technical background needed'
    await page.getByRole('button', { name: /Curious.*No technical background needed/i }).click()

    // Now navigate to a learning module
    await page.goto('/learn/pqc-101')

    // Check that the CuriousSummaryBanner is present by looking for the image directly
    // since the headers are hidden/shown based on viewport size.

    const curiousImage = page.locator('img[src*="gcp_pqc-101-curious.png"]:visible')
    await expect(curiousImage).toBeVisible()

    // Test a second module just to be sure
    await page.goto('/learn/hybrid-crypto')
    const curiousImage2 = page.locator('img[src*="gcp_hybrid-crypto-curious.png"]:visible')
    await expect(curiousImage2).toBeVisible()
  })

  test('does not load curious variants for Expert persona', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /Expert.*Deep technical knowledge/i }).click()

    await page.goto('/learn/pqc-101')

    // In Simple Terms header should not exist (unless on full page, but default module view it shouldn't be expanded/visible)
    const inSimpleTermsHeader = page.getByText('In Simple Terms').first()
    await expect(inSimpleTermsHeader).toBeHidden()
  })
})
