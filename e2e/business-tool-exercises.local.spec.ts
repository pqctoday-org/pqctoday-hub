// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { BUSINESS_TOOL_EXERCISES } from '../src/data/businessToolExercises'

const scenarios = Object.entries(BUSINESS_TOOL_EXERCISES).flatMap(([toolId, exercises]) =>
  exercises.map((exercise, index) => ({ toolId, exercise, index }))
)

for (const { toolId, exercise, index } of scenarios) {
  for (const width of [1280, 390]) {
    test(`${toolId} scenario ${index + 1} teaches its decision at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.addInitScript(() => {
        localStorage.setItem(
          'pqc-disclaimer-storage',
          JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
        )
        localStorage.setItem(
          'pqc-version-storage',
          JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
        )
        localStorage.setItem('pqc-tour-completed', 'true')
      })
      await page.goto(`/business/tools/${toolId}`)

      const scenario = page
        .getByTestId('tool-exercise')
        .getByRole('group', { name: exercise.prompt })
      const answers = scenario.getByRole('group', { name: 'Answers' })
      const options = answers.getByRole('button')
      const correct = answers.getByRole('button', {
        name: exercise.options[exercise.answer],
        exact: true,
      })
      const incorrect = options.filter({ hasNotText: exercise.options[exercise.answer] }).first()
      const feedback = scenario.getByRole('status')

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(scenario).toBeVisible()
      await expect(options).toHaveCount(exercise.options.length)
      await expect(feedback).toHaveCount(0)
      await incorrect.press('Space')
      await expect(feedback).toContainText('Not quite')
      await correct.press('Space')
      await expect(feedback).toContainText('Right.')
      await expect(feedback).toContainText(exercise.why)
      await expect(correct).toHaveAttribute('aria-pressed', 'true')
      await expect(incorrect).toHaveAttribute('aria-pressed', 'false')
    })
  }
}

test('the browser task covers every registered Business Tool and its decisions', () => {
  expect(new Set(scenarios.map(({ toolId }) => toolId)).size).toBe(37)
  expect(scenarios.length).toBe(41)
})
