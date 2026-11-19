// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

const stepName = (value: string) => new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)

const steps = [
  'Part 1: BB84 Protocol',
  'Part 2: Post-Processing',
  'Part 3: Global Deployments',
  'Part 4: QKD + Classical Protocols',
  'Part 5: HSM Key Derivation',
]

for (const width of [1280, 390]) {
  test(`QKD workshop completion is sequential, persisted and accessible at ${width}px`, async ({
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
    await page.goto('/learn/qkd?tab=workshop')
    await page.addLocatorHandler(
      page.getByRole('button', { name: 'Keep going', exact: true }),
      (button) => button.click()
    )
    const navigation = page.getByRole('navigation', { name: 'Workshop steps' })
    await expect(navigation.getByRole('button', { name: stepName(steps[0]) })).toBeVisible()
    const finish = page.getByRole('button', { name: 'Complete Module', exact: true })
    const finalStep = navigation.getByRole('button', { name: stepName(steps[4]) })
    await finalStep.click()
    await expect(finalStep).toHaveAttribute('aria-current', 'step')
    const skippedProgress = await page.evaluate(() => {
      const stored = localStorage.getItem('pki-module-storage')
      return stored ? JSON.parse(stored).state.modules.qkd : undefined
    })
    expect(skippedProgress?.completedSteps ?? []).toEqual([])
    await injectAxe(page)
    const earlyViolations = await getViolations(page, 'main', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })
    expect(
      earlyViolations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    ).toEqual([])
    await navigation.getByRole('button', { name: stepName(steps[0]) }).click()
    for (let index = 0; index < steps.length; index++) {
      const current = navigation.getByRole('button', { name: stepName(steps[index]) })
      await expect(current).toHaveAttribute('aria-current', 'step')
      if (index < steps.length - 1)
        await page
          .getByRole('button', { name: /Next Step/ })
          .last()
          .click()
    }
    await expect(finish).toBeEnabled()
    await finish.click()
    const record = await page.evaluate(() => {
      const stored = localStorage.getItem('pki-module-storage')
      return stored ? JSON.parse(stored).state.modules.qkd : undefined
    })
    expect(record).toMatchObject({
      status: 'completed',
      completedSteps: expect.arrayContaining([
        'bb84-simulator',
        'post-processing',
        'deployment-explorer',
        'protocol-integration',
        'hsm-derivation',
      ]),
    })
    await injectAxe(page)
    const finalViolations = await getViolations(page, 'main', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })
    expect(
      finalViolations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    ).toEqual([])
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    ).toBeLessThanOrEqual(1)
  })
}
