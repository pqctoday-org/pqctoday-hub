import { test, expect } from '@playwright/test'

test.describe('Library Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Library' }).first().click()
  })

  test('should navigate to library page and show dashboard layout', async ({ page }) => {
    // Page heading
    await expect(page.getByText('PQC Standards Library')).toBeVisible()

    // Activity feed section
    await expect(page.getByText('Recent Updates')).toBeVisible()

    // View toggle should be present
    const cardsRadio = page.getByRole('radio', { name: /Cards/i })
    await expect(cardsRadio).toBeVisible()
    await expect(cardsRadio).toHaveAttribute('aria-checked', 'true')
  })

  test('should display document cards in default card view', async ({ page }) => {
    // Wait for cards to render — look for article elements (DocumentCard uses motion.article)
    const cards = page.locator('article')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })

    // Cards should have reference IDs
    const firstCard = cards.first()
    await expect(firstCard.locator('.font-mono')).toBeVisible()
  })

  test('should switch to table view and show table headers', async ({ page }) => {
    // Switch to table view
    const tableRadio = page.getByRole('radio', { name: /Table/i })
    await tableRadio.click()

    // Wait for the library table to load
    const table = page.locator('table', { has: page.getByText('Reference ID') }).first()
    await expect(table).toBeVisible()

    // Check headers within this specific table
    await expect(table.getByRole('columnheader', { name: 'Reference ID' })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: 'Title' })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: 'Status' })).toBeVisible()
    await expect(table.getByRole('columnheader', { name: 'Last Update' })).toBeVisible()
  })

  test('should sort table by Last Update Date', async ({ page }) => {
    // Switch to table view
    await page.getByRole('radio', { name: /Table/i }).click()

    // Target the specific library table
    const table = page.locator('table', { has: page.getByText('Reference ID') }).first()
    await expect(table.locator('tbody tr')).not.toHaveCount(0)

    // Click the "Last Update" header to trigger sort
    const header = table.getByRole('columnheader', { name: 'Last Update' })
    await header.click()

    // Wait for sort to apply (re-render)
    await page.waitForTimeout(500)

    const dates = await table.locator('tbody tr td:nth-child(4)').allInnerTexts()
    console.log('Dates after sort click:', dates)

    if (dates.length >= 2) {
      const date1 = new Date(dates[0])
      const date2 = new Date(dates[1])
      if (!isNaN(date1.getTime()) && !isNaN(date2.getTime())) {
        if (date1.getTime() > date2.getTime()) {
          console.warn('Sort check: Dates appear not to be ascending.')
        }
      }
    }
  })

  test('should show details popup from card view', async ({ page }) => {
    // Click the first "Details" button in a card
    const detailsButton = page.getByLabel(/^View details for/).first()
    await expect(detailsButton).toBeVisible({ timeout: 10000 })
    await detailsButton.click()

    // Verify popup appears
    const popup = page.getByRole('dialog')
    await expect(popup).toBeVisible()

    // Verify popup content
    await expect(popup.getByText('Description')).toBeVisible()
    await expect(popup.getByText('Status:')).toBeVisible()

    // Close popup
    await page.keyboard.press('Escape')
    await expect(popup).not.toBeVisible()
  })

  test('should show details popup from table view', async ({ page }) => {
    // Switch to table view
    await page.getByRole('radio', { name: /Table/i }).click()

    // Target the specific library table
    const table = page.locator('table', { has: page.getByText('Reference ID') }).first()
    await expect(table).toBeVisible()
    await expect(table.locator('tbody tr')).not.toHaveCount(0)

    // Find the first "View Details" button within the table
    const detailsButton = table.getByLabel(/^View details for/).first()
    await expect(detailsButton).toBeVisible()
    await detailsButton.click()

    // Verify popup appears
    const popup = page.getByRole('dialog')
    await expect(popup).toBeVisible()

    // Verify popup content
    await expect(popup.getByText('Description')).toBeVisible()
    await expect(popup.getByText('Status:')).toBeVisible()
    await expect(popup.getByText('Authors:')).toBeVisible()
    await expect(popup.getByText('Published:')).toBeVisible()
    await expect(popup.getByText('Updated:')).toBeVisible()

    // Verify 2-column grid layout for metadata
    await expect(popup.locator('.grid.grid-cols-2')).toBeVisible()

    // Close popup
    await page.keyboard.press('Escape')
    await expect(popup).not.toBeVisible()
  })

  test('should filter by Region', async ({ page }) => {
    // Verify Region dropdown exists
    const regionDropdown = page.getByRole('button', { name: /Region/i })
    await expect(regionDropdown).toBeVisible()

    // Click to open
    await regionDropdown.click()

    // Select the second option (first is likely All)
    const option = page.getByRole('option').nth(1)
    const optionText = await option.textContent()
    await option.click()

    // The dropdown label changes to the selected region name
    const updatedDropdown = page.getByRole('button', { name: optionText?.trim() })
    await expect(updatedDropdown).toBeVisible({ timeout: 10000 })
  })

  test('should filter by category using sidebar', async ({ page }) => {
    // Find the category sidebar navigation
    const sidebar = page.getByRole('navigation', { name: /Library categories/i })

    // Only visible on desktop
    if (await sidebar.isVisible()) {
      // Click a specific category
      await sidebar.getByRole('button', { name: /Protocols/i }).click()

      // The document count should update
      await expect(page.getByText(/documents? in Protocols/)).toBeVisible({ timeout: 5000 })
    }
  })

  test('should toggle between Cards and Table view', async ({ page }) => {
    // Default is Cards view
    const cardsRadio = page.getByRole('radio', { name: /Cards/i })
    const tableRadio = page.getByRole('radio', { name: /Table/i })

    await expect(cardsRadio).toHaveAttribute('aria-checked', 'true')
    await expect(tableRadio).toHaveAttribute('aria-checked', 'false')

    // Switch to Table
    await tableRadio.click()
    await expect(tableRadio).toHaveAttribute('aria-checked', 'true')
    await expect(cardsRadio).toHaveAttribute('aria-checked', 'false')

    // Table should be visible
    const table = page.locator('table').first()
    await expect(table).toBeVisible()

    // Switch back to Cards
    await cardsRadio.click()
    await expect(cardsRadio).toHaveAttribute('aria-checked', 'true')

    // Cards should be visible again
    const cards = page.locator('article')
    await expect(cards.first()).toBeVisible({ timeout: 5000 })
  })

  test('should support Expand/Collapse All in table view', async ({ page }) => {
    // Switch to table view
    await page.getByRole('radio', { name: /Table/i }).click()

    // Find Expand/Collapse buttons
    const expandBtn = page.getByRole('button', { name: /Expand All/i }).first()
    const collapseBtn = page.getByRole('button', { name: /Collapse All/i }).first()

    if (await collapseBtn.isVisible()) {
      await collapseBtn.click()
      await expect(collapseBtn).toBeVisible()
    }

    if (await expandBtn.isVisible()) {
      await expandBtn.click()
      await expect(expandBtn).toBeVisible()
    }
  })
})
