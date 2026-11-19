// SPDX-License-Identifier: AGPL-3.0-only
import { expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'
import { test } from './fixtures/blockAnalytics'

const overflow = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
const activeQuestion = (page: import('@playwright/test').Page) =>
  page.getByRole('main').getByRole('heading', { level: 3 }).first()

for (const viewport of [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'phone', width: 390, height: 844 },
]) {
  test(`${viewport.name}: complete a quiz, inspect results and retake`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
      localStorage.setItem('pqc-feature-mobile-shell', '0')
    })
    await page.goto('/learn/quiz?category=pqc-fundamentals')
    await expect(page.getByRole('button', { name: 'Start Quiz', exact: true }).last()).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: 'Start Quiz', exact: true }).last().click()

    const fullQuiz = page.getByRole('button', { name: /^Full quiz/i })
    if (await fullQuiz.isVisible().catch(() => false)) await fullQuiz.click()
    const quickPick = page.getByRole('button', { name: /Quick pick/i })
    if (await quickPick.isVisible().catch(() => false)) await quickPick.click()

    await expect(activeQuestion(page)).toBeVisible()
    await injectAxe(page)
    await checkA11y(page, 'main', {
      axeOptions: { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } },
      includedImpacts: ['critical', 'serious'],
    })
    expect(await overflow(page)).toBeLessThanOrEqual(1)

    let answered = 0
    while (
      (await page
        .getByRole('button', { name: 'See Results' })
        .isVisible()
        .catch(() => false)) === false
    ) {
      const options = page.getByLabel('Answer options')
      await expect(options).toBeVisible()
      const radio = options.getByRole('radio')
      if (await radio.count()) await radio.first().click()
      else await options.getByRole('button').first().click()
      await page.getByRole('button', { name: 'Check Answer' }).click()
      answered += 1
      const next = page.getByRole('button', { name: 'Next Question' })
      if (await next.isVisible().catch(() => false)) await next.click()
      else break
    }
    expect(answered).toBeGreaterThan(0)
    await page.getByRole('button', { name: 'See Results' }).click()
    await expect(page.getByRole('heading', { name: 'Quiz Complete' })).toBeVisible()
    await expect(page.getByText(/\d+ of \d+ correct/)).toBeVisible()
    await page.getByRole('button', { name: 'Review All Answers' }).click()
    await expect(
      page
        .locator('main p')
        .filter({ hasText: /^Question 1 of \d+$/ })
        .first()
    ).toBeVisible()
    await checkA11y(page, 'main', {
      axeOptions: { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] } },
      includedImpacts: ['critical', 'serious'],
    })
    expect(await overflow(page)).toBeLessThanOrEqual(1)
    await page.getByRole('button', { name: 'Retake Quiz' }).click()
    await expect(activeQuestion(page)).toBeVisible()
  })
}
