// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

test.describe('Quantum Threat Mechanics Module', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    // Navigate directly to the module
    await page.goto('/learn/quantum-threats')
    await expect(
      page.getByRole('heading', { name: 'Quantum Threat Mechanics', level: 1 })
    ).toBeVisible()
    // Module defaults to "Learn" tab; navigate to Workshop where the simulation UI lives
    await page.getByRole('button', { name: 'Workshop', exact: true }).first().click()
  })

  test('Verify HNDL Timeline Calculator with Migration Time slider', async ({ page }) => {
    // Navigate to Step 4: HNDL Timeline by clicking "Next Step →" 3 times (step 1→2→3→4).
    // The step titles are only shown as the h2 heading when on that step, not as nav buttons.
    await page.getByRole('button', { name: 'Next Step →' }).click()
    await page.getByRole('button', { name: 'Next Step →' }).click()
    await page.getByRole('button', { name: 'Next Step →' }).click()
    await expect(page.getByRole('heading', { name: 'HNDL Timeline Calculator' })).toBeVisible()

    // Verify sliders exist
    const dataLifetimeSlider = page.locator('input#data-lifetime-slider')
    const crqcYearSlider = page.locator('input#crqc-year-slider')
    const migrationTimeSlider = page.locator('input#migration-time-slider')

    await expect(dataLifetimeSlider).toBeVisible()
    await expect(crqcYearSlider).toBeVisible()
    await expect(migrationTimeSlider).toBeVisible()

    // Verify default calculations
    // default data lifetime: 25, migration: 5, crqc: 2035 -> 2005
    await expect(page.getByText('2035 − 25 − 5 = 2005', { exact: false })).toBeVisible()

    // Adjust migration time slider to 10
    await migrationTimeSlider.fill('10')

    // Formula check: 2035 - 25 - 10 = 2000
    await expect(page.getByText('2035 − 25 − 10 = 2000')).toBeVisible()

    // Adjust data lifetime slider to 50
    await dataLifetimeSlider.fill('50')

    // Formula check: 2035 - 50 - 10 = 1975
    await expect(page.getByText('2035 − 50 − 10 = 1975')).toBeVisible()
  })
})
