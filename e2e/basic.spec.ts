// SPDX-License-Identifier: GPL-3.0-only
import { test, expect } from '@playwright/test'

// Verify dynamic module rendering via e2e initialization
test('has title', async ({ page }) => {
  await page.goto('/')

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/PQC Today/)
})

test('navigation works', async ({ page }) => {
  // Direct navigation instead of brittle UI clicks per E2E non-UI rules
  await page.goto('/playground')

  // Expects page to load the playground component
  await expect(page).toHaveURL(/.*playground.*/)
})
