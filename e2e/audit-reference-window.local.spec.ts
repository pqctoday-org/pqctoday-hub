// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

const routes = ['/learn/compliance-strategy?tab=workshop', '/business/tools/audit-checklist']
for (const route of routes) {
  for (const width of [1280, 390]) {
    test(`audit scope checks the exact record on the chosen date at ${width}px on ${route}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.addInitScript(() => {
        localStorage.setItem(
          'pqc-disclaimer-storage',
          JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
        )
      })
      await page.goto(route)
      if (route.startsWith('/learn/')) {
        await page.getByRole('button', { name: /^Step 2: Audit Planning Topics/ }).click()
      }
      const exercise = page.getByRole('region', {
        name: 'Practice: does the record cover the sample system?',
      })
      const date = exercise.getByLabel('Sample review date')
      await expect(date).toBeVisible()
      const compare = exercise.getByRole('button', { name: 'Check sample scope' })
      const status = exercise.getByRole('status')
      await compare.click()
      await expect(status).toContainText('another module version')
      await exercise.getByRole('radio', { name: /^Record C/ }).check()
      await compare.click()
      await expect(status).toContainText('another platform')

      await exercise.getByRole('radio', { name: /^Record A/ }).check()
      await date.fill('2025-11-15')
      await compare.click()
      await expect(status).toContainText('starts after the review date')
      await date.fill('2025-11-16')
      await expect(status).toBeEmpty()
      await compare.click()
      await expect(status).toContainText('scope correspondence')
      await date.fill('2027-11-16')
      await compare.click()
      await expect(status).toContainText('scope correspondence')
      await date.fill('2027-11-17')
      await compare.click()
      await expect(status).toContainText('expired before the review date')
      await date.fill('')
      await expect(compare).toBeDisabled()
      await expect(status).toBeEmpty()
    })
  }
}
