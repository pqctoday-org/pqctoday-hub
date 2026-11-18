// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

test('a missed HNDL question leads to a fresh example without changing the scored answer', async ({
  page,
  context,
}) => {
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
    // Keep the random category shuffle in authored order.
    Math.random = () => 0.9999
  })
  await page.goto('/learn/quiz?category=pqc-fundamentals')
  await page.getByRole('button', { name: 'Start Quiz', exact: true }).last().click()
  const stem = page.getByText('What does HNDL stand for in the context of quantum threats?', {
    exact: true,
  })
  for (let step = 0; step < 4; step++) {
    const options = page.getByLabel('Answer options')
    await expect(options).toBeVisible()
    if (await stem.isVisible()) break
    await options.getByRole('radio').first().click()
    await page.getByRole('button', { name: /^Check answer$/i }).click()
    await page.getByRole('button', { name: /^Next question$/i }).click()
  }

  await expect(stem).toBeVisible()
  await page.getByRole('radio', { name: /Hash-Normalized Decryption Layer/i }).click()
  await page.getByRole('button', { name: /^Check answer$/i }).click()
  await expect(page.getByText('Incorrect', { exact: true })).toBeVisible()
  const lesson = page.getByRole('link', { name: /Learn more \(opens/ })
  const popup = context.waitForEvent('page')
  await lesson.click()
  const tab = await popup
  await tab.waitForURL('**/learn/pqc-101')
  await tab.close()

  await expect(stem).toBeVisible()
  await page.getByText('Try the same concept in a new example', { exact: true }).click()
  const followUp = page.getByRole('group', { name: /A recording must stay confidential/ })
  await followUp.getByRole('button', { name: /only if it is captured after/ }).click()
  await expect(page.getByText(/^Try again\. A captured copy/)).toBeVisible()
  await followUp.getByRole('button', { name: /store the ciphertext now/ }).click()
  await expect(page.getByText(/^Correct\. A captured copy/)).toBeVisible()
  await expect(page.getByText('Incorrect', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /^Next question$/i }).click()
  await expect(stem).toHaveCount(0)
  await expect(followUp).toHaveCount(0)
})
