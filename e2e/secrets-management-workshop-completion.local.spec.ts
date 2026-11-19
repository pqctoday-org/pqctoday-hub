// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'
import { getViolations, injectAxe } from 'axe-playwright'

const steps = [
  'Step 1: Architecture Mapper',
  'Step 2: Vault Transit Simulator',
  'Step 3: Rotation Policy Designer',
  'Step 4: Cloud Provider Comparator',
  'Step 5: Pipeline Integration Lab',
]

for (const width of [1280, 390]) {
  test(`Secrets Management workshop completion is sequential, persisted and accessible at ${width}px`, async ({
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
    await page.goto('/learn/secrets-management-pqc?tab=workshop')
    await page.addLocatorHandler(
      page.getByRole('button', { name: 'Keep going', exact: true }),
      (button) => button.click()
    )
    const navigation = page.getByRole('navigation', { name: 'Workshop steps' })
    await expect(navigation.getByRole('button', { name: new RegExp(`^${steps[0]}`) })).toBeVisible()
    const finish = page.getByRole('button', { name: 'Complete Module', exact: true })
    const finalStep = navigation.getByRole('button', { name: new RegExp(`^${steps[4]}`) })
    await finalStep.click()
    await expect(finalStep).toHaveAttribute('aria-current', 'step')
    const skippedProgress = await page.evaluate(() => {
      const stored = localStorage.getItem('pki-module-storage')
      return stored ? JSON.parse(stored).state.modules['secrets-management-pqc'] : undefined
    })
    expect(skippedProgress?.completedSteps ?? []).toEqual([])
    await expect(
      page.getByRole('heading', { level: 1, name: 'Secrets Management & PQC' })
    ).toBeVisible()
    await injectAxe(page)
    const earlyViolations = await getViolations(page, 'main', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    })
    expect(
      earlyViolations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    ).toEqual([])
    await navigation.getByRole('button', { name: steps[0], exact: true }).click()
    for (let index = 0; index < steps.length; index++) {
      const current = navigation.getByRole('button', { name: new RegExp(`^${steps[index]}`) })
      await expect(current).toHaveAttribute('aria-current', 'step')
      if (index < steps.length - 1) {
        await page
          .getByRole('button', { name: /Next Step/ })
          .last()
          .click()
      }
    }
    await expect(finish).toBeEnabled()
    await finish.click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Secrets Management & PQC' })
    ).toBeVisible()
    const record = await page.evaluate(() => {
      const stored = localStorage.getItem('pki-module-storage')
      return stored ? JSON.parse(stored).state.modules['secrets-management-pqc'] : undefined
    })
    expect(record).toMatchObject({
      status: 'completed',
      completedSteps: expect.arrayContaining([
        'secrets-architecture-mapper',
        'vault-pqc-simulator',
        'rotation-policy-designer',
        'cloud-secrets-comparator',
        'pipeline-integration-lab',
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
