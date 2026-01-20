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

    // Verify a NEW leader from the 01/19/2026 update is present
    const newLeaderCard = page.locator('div').filter({ hasText: 'Dr. Jérôme Notin' }).first()
    await expect(newLeaderCard).toBeVisible()
  })

  test('filters by country', async ({ page }) => {
    // Open Country Filter
    // The button has default label "Region", so we target by that
    await page.getByRole('button').filter({ hasText: 'Region' }).click()

    // Select USA
    const dropdown = page.getByRole('listbox')
    await expect(dropdown).toBeVisible()
    await page.getByRole('option', { name: 'USA', exact: true }).click()

    // Verify USA leader is visible
    await expect(page.getByText('Dr. Dustin Moody')).toBeVisible()

    // Verify non-USA leader is NOT visible
    await expect(page.getByText('Ollie Whitehouse')).toHaveCount(0)
    await expect(page.getByText('NCSC').first()).toHaveCount(0)

    // Reset to All
    // The trigger button now shows "USA", so we click it again to open
    await page.getByRole('button').filter({ hasText: 'USA' }).first().click()

    // Select All (which is labeled "Region" by default in the dropdown)
    await page.getByRole('option', { name: 'Region' }).click()

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
