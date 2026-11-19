// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

const steps = [
  'Step 1: Acceleration Models, Explained',
  'Step 2: Building Blocks, Explained',
  'Step 3: Our Measurements',
  'Step 4: FPGA Limits Lab',
  'Step 5: Offload, Sharing and Batching',
]
const stepName = (value: string) => new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)

for (const width of [1280, 390]) {
  test(`PQC Hardware Acceleration workshop completion is sequential and accessible at ${width}px`, async ({
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
    await page.goto('/learn/pqc-hw-acceleration?tab=workshop')
    await page.addLocatorHandler(
      page.getByRole('button', { name: 'Keep going', exact: true }),
      (button) => button.click()
    )
    const navigation = page.getByRole('navigation', { name: 'Workshop steps' })
    const finish = page.getByRole('button', { name: 'Complete Module', exact: true })
    const finalStep = navigation.getByRole('button', { name: stepName(steps[4]) })
    await finalStep.click()
    await expect(finalStep).toHaveAttribute('aria-current', 'step')
    const skippedProgress = await page.evaluate(() => {
      const stored = localStorage.getItem('pki-module-storage')
      return stored ? JSON.parse(stored).state.modules['pqc-hw-acceleration'] : undefined
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
      return stored ? JSON.parse(stored).state.modules['pqc-hw-acceleration'] : undefined
    })
    expect(record).toMatchObject({
      status: 'completed',
      completedSteps: expect.arrayContaining([
        'acceleration-models',
        'building-blocks',
        'our-measurements',
        'fpga-limits',
        'offload-lab',
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
