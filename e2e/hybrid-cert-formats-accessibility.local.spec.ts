// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'
import { injectAxe, getViolations } from 'axe-playwright'

test('hybrid certificate playground is accessible at desktop and phone widths', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    localStorage.setItem(
      'pqc-version-storage',
      JSON.stringify({ state: { lastSeenVersion: '99.0.0', isFirstVisit: false }, version: 3 })
    )
    localStorage.setItem(
      'pqc-disclaimer-storage',
      JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
    )
  })

  for (const viewport of [
    { name: 'desktop', width: 1280, height: 900 },
    { name: 'phone', width: 390, height: 844 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/playground/hybrid-certs')
    await expect(page.getByRole('heading', { name: 'Hybrid Certificate Formats' })).toBeVisible({
      timeout: 60_000,
    })
    const exercise = page.getByRole('region', { name: 'Certificate-to-TLS exercise' })
    await expect(exercise).toBeVisible()
    await expect(page.getByRole('region', { name: 'Pure PQC (ML-DSA-65)' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Advanced examples' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Historical designs' })).toBeVisible()

    // Prove the prediction controls are keyboard operable without starting crypto work.
    const classicalAnswer = exercise.getByRole('radio', {
      name: 'Yes, the same RSA certificate can be used',
    })
    await classicalAnswer.focus()
    await page.keyboard.press('Space')
    await expect(classicalAnswer).toBeChecked()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(overflow, `${viewport.name} viewport should not scroll horizontally`).toBe(false)

    await injectAxe(page)
    const violations = await getViolations(page, 'html', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })
    expect(
      violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? '')),
      `${viewport.name} WCAG 2 A/AA serious or critical violations`
    ).toEqual([])
  }
})
