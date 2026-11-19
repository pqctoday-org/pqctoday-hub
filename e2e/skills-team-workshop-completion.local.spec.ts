// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

const steps = ['Step 1: Team Sizing Calculator', 'Step 2: Crypto Champion Roster']
const stepName = (value: string) => new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)

for (const width of [1280, 390]) {
  test(`Skills & Team Structure workshop completion is sequential and accessible at ${width}px`, async ({
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
    })
    await page.goto('/learn/skills-team-structure?tab=workshop')
    await page.addLocatorHandler(
      page.getByRole('button', { name: 'Keep going', exact: true }),
      (button) => button.click()
    )
    const navigation = page.getByRole('navigation', { name: 'Workshop steps' })
    const finish = page.getByRole('button', { name: 'Complete Module', exact: true })
    const finalStep = navigation.getByRole('button', { name: stepName(steps[1]) })
    await finalStep.click()
    await expect(finalStep).toHaveAttribute('aria-current', 'step')
    const progressBefore = await page.evaluate(() => {
      const stored = localStorage.getItem('pki-module-storage')
      return stored ? JSON.parse(stored).state.modules['skills-team-structure'] : undefined
    })
    expect(progressBefore?.completedSteps ?? []).toEqual([])
    await injectAxe(page)
    const early = await getViolations(page, 'main', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })
    expect(early.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
    await navigation.getByRole('button', { name: stepName(steps[0]) }).click()
    await expect(navigation.getByRole('button', { name: stepName(steps[0]) })).toHaveAttribute(
      'aria-current',
      'step'
    )
    await page
      .getByRole('button', { name: /Next Step/ })
      .last()
      .click()
    await expect(finalStep).toHaveAttribute('aria-current', 'step')
    await expect(finish).toBeEnabled()
    await finish.click()
    const record = await page.evaluate(() => {
      const stored = localStorage.getItem('pki-module-storage')
      return stored ? JSON.parse(stored).state.modules['skills-team-structure'] : undefined
    })
    expect(record).toMatchObject({
      status: 'completed',
      completedSteps: ['team-sizing', 'crypto-champions'],
    })
    await injectAxe(page)
    const final = await getViolations(page, 'main', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })
    expect(final.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual([])
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    ).toBeLessThanOrEqual(1)
  })
}
