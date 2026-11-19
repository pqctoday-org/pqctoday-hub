// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

const steps = [
  'Step 1: Your Infrastructure',
  'Step 2: Vendor Scorecard',
  'Step 3: Contract Clauses',
  'Step 4: Supply Chain Matrix',
]

for (const width of [1280, 390]) {
  test(`Vendor & Supply Chain Risk workshop completes and persists at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0', isFirstVisit: false }, version: 3 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
    })
    await page.goto('/learn/vendor-risk?tab=workshop')
    await page.addLocatorHandler(
      page.getByRole('button', { name: 'Keep going', exact: true }),
      (button) => button.click()
    )
    const navigation = page.getByRole('navigation', { name: 'Workshop steps' })
    const finalStep = navigation.getByRole('button', { name: new RegExp(`^${steps[3]}`) })
    await expect(finalStep).toBeVisible()
    await finalStep.click()
    await expect(finalStep).toHaveAttribute('aria-current', 'step')
    let progress = await page.evaluate(() => {
      const stored = localStorage.getItem('pki-module-storage')
      return stored ? JSON.parse(stored).state.modules['vendor-risk'] : undefined
    })
    expect(progress?.completedSteps ?? []).toEqual([])

    await injectAxe(page)
    const initial = await getViolations(page, 'main', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })
    expect(initial.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
    await navigation.getByRole('button', { name: steps[0], exact: true }).click()
    for (let index = 0; index < steps.length; index++) {
      const current = navigation.getByRole('button', { name: new RegExp(`^${steps[index]}`) })
      await expect(current).toHaveAttribute('aria-current', 'step')
      await expect(
        page.getByText(/Infrastructure|Scorecard|Contract|Supply Chain/i).first()
      ).toBeVisible()
      if (index < steps.length - 1)
        await page
          .getByRole('button', { name: /Next Step/ })
          .last()
          .click()
    }
    const finish = page.getByRole('button', { name: 'Complete Module', exact: true })
    await expect(finish).toBeEnabled()
    await finish.click()
    progress = await page.evaluate(() => {
      const stored = localStorage.getItem('pki-module-storage')
      return stored ? JSON.parse(stored).state.modules['vendor-risk'] : undefined
    })
    expect(progress).toMatchObject({
      status: 'completed',
      completedSteps: expect.arrayContaining([
        'infrastructure-selector',
        'vendor-scorecard',
        'contract-clauses',
        'supply-chain-matrix',
      ]),
    })
    const final = await getViolations(page, 'main', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })
    expect(final.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    ).toBeLessThanOrEqual(1)
  })
}
