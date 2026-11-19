// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`the playbook holds the rollout and verifies recovery at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/business/tools/deployment-playbook')
    const exercise = page.getByRole('region', { name: 'Decide whether to roll back the canary' })
    await expect(exercise).toBeVisible()
    const probes = exercise.getByLabel('Canary probe results')
    const status = exercise.getByRole('status', { name: 'Canary decision' })
    const evaluateCanary = exercise.getByRole('button', { name: 'Evaluate canary results' })
    const rollback = exercise.getByRole('button', { name: 'Restore approved baseline' })
    const checkHealth = exercise.getByRole('button', { name: 'Check baseline health' })
    await expect(rollback).toBeDisabled()
    await evaluateCanary.click()
    await expect(status).toContainText('3 of 20 probes failed (15%)')
    await expect(status).toContainText('Rollout held.')
    await expect(checkHealth).toBeDisabled()
    await expect(probes).toBeDisabled()
    await rollback.click()
    await expect(status).toContainText('Health checks are still pending.')
    await expect(evaluateCanary).toBeDisabled()
    await checkHealth.click()
    await expect(status).toContainText('All 20 sample probes succeeded.')
    await expect(status).toContainText('Run a new canary before expanding rollout.')
    await probes.selectOption('1')
    await evaluateCanary.click()
    await expect(status).toContainText('1 of 20 probes failed (5%)')
    await expect(status).toContainText('meets the sample acceptance threshold')
    await expect(rollback).toBeDisabled()
  })
}
