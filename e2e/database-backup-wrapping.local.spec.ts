// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`active key rotation leaves old backup dependency at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/learn/database-encryption-pqc?tab=workshop')
    await page.getByRole('button', { name: /Step 2: TDE Migration Planner/ }).click()
    const exercise = page.getByRole('region', {
      name: 'Rotate a wrapping key and restore a backup',
    })
    await expect(exercise).toBeVisible()
    const result = exercise.getByRole('status', { name: 'Database recovery result' })
    const active = exercise.getByRole('button', { name: 'Read active record' })
    const backup = exercise.getByRole('button', { name: 'Restore backup', exact: true })
    await exercise.getByRole('button', { name: 'Prepare encrypted sample' }).click()
    await backup.click()
    await expect(result).toHaveText(
      'Backup restored using v1. Sample inventory, archived count: 19.'
    )

    await exercise.getByRole('button', { name: 'Rewrap active data key with v2' }).click()
    await expect(result).toContainText('Active data key rewrapped with v2')
    await exercise.getByRole('button', { name: 'Simulate losing v1 access' }).click()
    await active.click()
    await expect(result).toHaveText(
      'Active record read using v2. Sample inventory, current count: 27.'
    )
    await backup.click()
    await expect(result).toHaveText(
      'Backup restore blocked. Its data key is wrapped with v1, which is unavailable.'
    )

    await exercise.getByRole('button', { name: 'Restore v1 access' }).click()
    await backup.click()
    await expect(result).toHaveText(
      'Backup restored using v1. Sample inventory, archived count: 19.'
    )
    await exercise.getByRole('button', { name: 'Rewrap backup data key with v2' }).click()
    await expect(result).toContainText('Backup data key rewrapped with v2')
    await exercise.getByRole('button', { name: 'Simulate losing v1 access' }).click()
    await backup.click()
    await expect(result).toHaveText(
      'Backup restored using v2. Sample inventory, archived count: 19.'
    )
  })
}
