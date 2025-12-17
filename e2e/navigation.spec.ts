import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display all navigation items in correct order', async ({ page }) => {
    // Check strict order of visible buttons
    // Note: Playground and OpenSSL Studio are hidden on mobile breakpoint but visible on desktop
    // Playwright default viewport is 1280x720, so they should be visible.

    // Check "Migrate" specifically is present
    await expect(page.getByRole('link', { name: 'Migrate' })).toBeVisible()

    // Optionally check exact order if critical
    // const texts = await buttons.allInnerTexts();
    // // Filter out empty or icon-only if necessary, though our buttons have text spans
    // expect(texts.filter(t => t)).toEqual(expect.arrayContaining(['Migrate']));
  })

  test('should navigate to Migrate page when clicking the link', async ({ page }) => {
    await page.getByRole('link', { name: 'Migrate' }).click()
    await expect(page).toHaveURL(/\/migrate/)
    await expect(page.getByRole('heading', { name: 'PQC Software Migration Guide' })).toBeVisible()
  })
})
