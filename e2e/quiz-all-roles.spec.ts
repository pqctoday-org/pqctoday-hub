// SPDX-License-Identifier: AGPL-3.0-only
import { expect, type Page } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'
import { test } from './fixtures/blockAnalytics'
import { OTHER_ROLES_SCORE_NOTE } from '../src/components/PKILearning/modules/Quiz/roleScope'

/**
 * Quiz: "Show questions for all roles" and the My role / All roles switch.
 *
 * A reader whose role has no question for a linked topic can widen THIS quiz to every role's
 * questions, without changing the role the rest of the site uses. The pair below (Executive,
 * PCI Certification) has no Executive question at all; index.allRoles.test.tsx proves the pair
 * from the data, this spec proves the page.
 */

const ROLE = 'executive'
const TOPIC = 'pci-certification'
const SHOW_ALL = 'Show questions for all roles'

async function seedRole(page: Page) {
  await page.addInitScript(
    ([persona]) => {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
      localStorage.setItem(
        'pqc-learning-persona',
        JSON.stringify({
          state: {
            selectedPersona: persona,
            hasAcknowledgedExecutiveGrcSplit: true,
            selectedRegion: 'global',
            experienceLevel: null,
            viewAccess: 'preview',
            hasSeenPersonaPicker: true,
            suppressSuggestion: true,
            niceTier: 'awareness',
            niceTierOverridden: false,
            curiousGuideDismissed: true,
          },
          version: 7,
        })
      )
    },
    [ROLE]
  )
}

const storedRole = (page: Page) =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem('pqc-learning-persona') ?? '{}').state?.selectedPersona
  )

const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seedRole(page)
})

test('desktop: the notice widens this quiz only, the role stays, and focus lands on the switch', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto(`/learn/quiz?category=${TOPIC}`)
  const notice = page.getByTestId('quiz-no-match')
  await expect(notice).toBeVisible({ timeout: 15_000 })
  await expect(notice).toContainText(OTHER_ROLES_SCORE_NOTE)

  await notice.getByRole('button', { name: SHOW_ALL }).click()
  await expect(notice).toBeHidden()
  await expect(page.getByRole('radio', { name: 'All roles' })).toBeFocused()
  await expect(page.getByTestId('quiz-role-scope-status')).toContainText(
    'Showing questions for all roles.'
  )
  expect(await storedRole(page)).toBe(ROLE)

  // The topic is now on the page and can be started.
  await page.getByRole('button', { name: 'Start Quiz' }).last().click()
  await expect(page.getByText(/^0 of \d+ answered$/)).toBeVisible()
  expect(await storedRole(page)).toBe(ROLE)
})

test('desktop: the My role / All roles switch is always on the intro and works with the keyboard', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/learn/quiz')
  const group = page.getByRole('radiogroup', { name: 'Questions for' })
  await expect(group).toBeVisible({ timeout: 15_000 })
  const mine = group.getByRole('radio', { name: /My role/ })
  await expect(mine).toBeChecked()
  // The consequence is readable before All roles is chosen, and described to a screen reader.
  await expect(page.getByTestId('quiz-role-scope-hint')).toContainText(OTHER_ROLES_SCORE_NOTE)
  await expect(group.getByRole('radio', { name: 'All roles' })).toHaveAccessibleDescription(
    new RegExp(OTHER_ROLES_SCORE_NOTE.slice(0, 40))
  )
  await expect(page.getByTestId('quiz-role-scope-status')).toBeEmpty()

  await mine.focus()
  await page.keyboard.press('ArrowRight')
  await expect(group.getByRole('radio', { name: 'All roles' })).toBeChecked()
  await expect(page.getByTestId('quiz-role-scope-status')).toContainText(
    'Showing questions for all roles.'
  )
  await page.keyboard.press('ArrowLeft')
  await expect(mine).toBeChecked()
  await expect(page.getByTestId('quiz-role-scope-status')).toBeEmpty()
  expect(await storedRole(page)).toBe(ROLE)

  await injectAxe(page)
  await checkA11y(page, 'main', {
    axeOptions: { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } },
    includedImpacts: ['critical', 'serious'],
  })
})

test('phone 375 px: the notice button wraps, starts the quiz and nothing overflows', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(`/learn/quiz?category=${TOPIC}`)
  const notice = page.getByTestId('quiz-no-match')
  await expect(notice).toBeVisible({ timeout: 15_000 })
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)

  const button = notice.getByRole('button', { name: SHOW_ALL })
  const box = await button.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(375)
  expect(box!.height).toBeGreaterThanOrEqual(44)

  await button.click()
  // A long topic first offers a Quick pick or the full run.
  const full = page.getByRole('button', { name: /^Full quiz/ })
  if (await full.isVisible().catch(() => false)) await full.click()
  await expect(page.getByText(/^Question 1 of \d+$/)).toBeVisible()
  await expect(page.getByText(/all roles/i).first()).toBeVisible()
  expect(await storedRole(page)).toBe(ROLE)
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
})

// The desktop intro (with the My role / All roles switch) is also what a reader sees below 1024 px
// when the phone layout is off, and the role name makes the first pill long.
for (const width of [375, 768]) {
  test(`intro below 1024 px (${width}): the switch wraps, stays inside the screen and works`, async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem('pqc-feature-mobile-shell', '0'))
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/learn/quiz')
    const group = page.getByRole('radiogroup', { name: 'Questions for' })
    await expect(group).toBeVisible({ timeout: 15_000 })
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)

    for (const radio of await group.getByRole('radio').all()) {
      const pill = await radio.locator('xpath=..').boundingBox()
      expect(pill).not.toBeNull()
      expect(pill!.x).toBeGreaterThanOrEqual(0)
      expect(pill!.x + pill!.width).toBeLessThanOrEqual(width)
      expect(pill!.height).toBeGreaterThanOrEqual(44)
    }

    await group.getByRole('radio', { name: 'All roles' }).check()
    await expect(page.getByTestId('quiz-role-scope-status')).toContainText(
      'Showing questions for all roles.'
    )
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1)
    expect(await storedRole(page)).toBe(ROLE)
  })
}
