import { test, expect } from '@playwright/test'

test.describe('Leaders View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Leaders' }).click({ force: true })
    await expect(page.getByRole('heading', { name: 'Transformation Leaders' })).toBeVisible()
  })

  test('displays leaders grid', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Transformation Leaders' })).toBeVisible()

    // Check for presence of leader cards (using a known leader from checking requirements/leaders.md)
    const dustinCard = page.locator('div').filter({ hasText: 'Dr. Dustin Moody' }).first()
    await expect(dustinCard).toBeVisible()
    await expect(dustinCard.getByText('NIST', { exact: true }).first()).toBeVisible()
  })

  test.skip('filters by country', async ({ page }) => {
    // Open Country Filter
    await page.getByRole('button', { name: 'All Countries' }).click()

    // Select USA
    const dropdown = page.getByRole('listbox')
    await expect(dropdown).toBeVisible()
    await page.getByRole('option', { name: 'USA', exact: true }).click()

    // Verify USA leader is visible
    await expect(page.getByText('Dr. Dustin Moody')).toBeVisible()

    // Verify non-USA leader is NOT visible (e.g., Ollie Whitehouse from UK)
    // Note: Depends on data, but assuming Ollie is in the data.
    // Let's verify text that would appear for a UK leader's card if visible
    // Verify non-USA leader is NOT visible
    await expect(page.getByText('Ollie Whitehouse')).toHaveCount(0)
    await expect(page.getByText('NCSC').first()).toHaveCount(0)

    // Reset to All
    await page.getByRole('button', { name: 'USA' }).click()
    await page.getByRole('option', { name: 'All Countries' }).click()

    // Verify UK leader is visible again
    await expect(page.getByText('NCSC').first()).toBeVisible()
  })

  test('displays social links', async ({ page }) => {
    // Check for website and linkedin icons/links
    // We can check for the presence of links with specific aria-labels or href patterns if known,
    // or just generic "link" roles within a card.

    // Find card for Dustin Moody
    const card = page.locator('div').filter({ hasText: 'Dr. Dustin Moody' }).first()

    // Check for website link (assuming lucide-globe icon or similar)
    await expect(card.locator('a[href^="http"]')).not.toHaveCount(0)
  })
})
