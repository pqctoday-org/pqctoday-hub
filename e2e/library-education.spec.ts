// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test, type Page } from '@playwright/test'

async function seedRole(page: Page, role: 'ops' | 'curious'): Promise<void> {
  await page.addInitScript((selectedPersona: string) => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
    )
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
    localStorage.setItem(
      'pqc-learning-persona',
      JSON.stringify({
        state: {
          selectedPersona,
          hasAcknowledgedExecutiveGrcSplit: true,
          selectedRegion: 'global',
          experienceLevel: 'expert',
          viewAccess: 'unlocked',
          hasSeenPersonaPicker: true,
          suppressSuggestion: true,
          niceTier: 'awareness',
          niceTierOverridden: false,
          curiousGuideDismissed: true,
        },
        version: 7,
      })
    )
  }, role)
}

test.describe.configure({ mode: 'serial' })

test.describe('Library educational navigation contracts', () => {
  test('role starter cards wrap without overlap or page spill at desktop/tablet widths', async ({
    page,
  }) => {
    await seedRole(page, 'ops')
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/library')
    await expect(page.getByRole('heading', { name: 'PQC Library' })).toBeVisible({
      timeout: 30_000,
    })

    for (const width of [1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 })

      const starter = page.getByTestId('library-start-here')
      await expect(starter).toBeVisible()
      await expect(starter.getByText('Why start here:', { exact: false }).first()).toBeVisible()

      const cards = starter.getByTestId('library-start-card')
      await expect(cards).toHaveCount(3)
      const boxes = await cards.evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect()
          return { left: box.left, right: box.right, top: box.top, bottom: box.bottom }
        })
      )
      for (let left = 0; left < boxes.length; left += 1) {
        for (let right = left + 1; right < boxes.length; right += 1) {
          const a = boxes[left]
          const b = boxes[right]
          const overlaps =
            a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
          expect(overlaps, `starter cards overlap at ${width}px`).toBe(false)
        }
      }

      const hasHorizontalSpill = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1
      )
      expect(hasHorizontalSpill, `page spills horizontally at ${width}px`).toBe(false)
    }
  })

  test('phone role scope is explicit and can be widened to the full catalog', async ({ page }) => {
    await seedRole(page, 'curious')
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/library')

    const roleScope = page.getByTestId('library-mobile-role-scope')
    await expect(roleScope.getByText('Narrowed for Curious', { exact: true })).toBeVisible({
      timeout: 30_000,
    })
    const showAll = page.getByRole('button', { name: 'Show full catalog' })
    await expect(showAll).toBeVisible()
    await showAll.click()

    await expect(page).toHaveURL(/prefs=off/)
    await expect(
      roleScope.getByText('Showing the full active catalog', { exact: true })
    ).toBeVisible()
  })
})
