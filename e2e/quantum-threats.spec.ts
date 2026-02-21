import { test, expect } from '@playwright/test'

test.describe('Quantum Threat Mechanics Module', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    // Navigate to Learn module
    await page.goto('/learn')

    // Select Quantum Threats from dashboard
    const card = page.getByRole('heading', { name: 'Quantum Threats', exact: true })
    await expect(card).toBeVisible({ timeout: 30000 })
    await card.click()

    // Verify we are in the module
    await expect(
      page.getByRole('heading', { name: 'Quantum Threat Mechanics', level: 1 })
    ).toBeVisible()
  })

  test('Verify HNDL Timeline Calculator with Migration Time slider', async ({ page }) => {
    // Navigate to Workshop tab
    await page.getByRole('tab', { name: 'Workshop' }).click()

    // Navigate to Step 4: HNDL Timeline
    await page.getByText('Step 4: HNDL Timeline').click()
    await expect(page.getByRole('heading', { name: '4. HNDL Timeline', level: 2 })).toBeVisible()

    // Verify sliders exist
    const dataLifetimeSlider = page.locator('input#data-lifetime-slider')
    const crqcYearSlider = page.locator('input#crqc-year-slider')
    const migrationTimeSlider = page.locator('input#migration-time-slider')

    await expect(dataLifetimeSlider).toBeVisible()
    await expect(crqcYearSlider).toBeVisible()
    await expect(migrationTimeSlider).toBeVisible()

    // Verify default calculations
    // default data lifetime: 25, migration: 5, crqc: 2035 -> 2005
    await expect(page.getByText('2035 − 2025 − 5 = 2005', { exact: false })).toBeVisible()

    // Adjust migration time slider to 10
    await migrationTimeSlider.fill('10')
    // Wait a brief moment for React state update
    await page.waitForTimeout(500)

    // Formula check: 2035 - 25 - 10 = 2000
    await expect(page.getByText('2035 − 25 − 10 = 2000')).toBeVisible()

    // Adjust data lifetime slider to 50
    await dataLifetimeSlider.fill('50')
    await page.waitForTimeout(500)

    // Formula check: 2035 - 50 - 10 = 1975
    await expect(page.getByText('2035 − 50 − 10 = 1975')).toBeVisible()
  })
})
