// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`CMVP sample coverage depends on the listed deployment at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/learn/fips-140-3-certification?tab=workshop')
    const exercise = page.getByRole('region', {
      name: 'Check whether the validation record covers a deployment',
    })
    await expect(exercise).toBeVisible()
    const compare = exercise.getByRole('button', { name: 'Compare with the record' })
    const status = exercise.getByRole('status', { name: 'Deployment scope result' })
    await compare.click()
    await expect(status).toContainText('matches the tested configuration')

    const environment = exercise.getByLabel('Operational environment')
    await environment.selectOption('Debian 12 on ARM64')
    await expect(status).toBeEmpty()
    await compare.click()
    await expect(status).toContainText('The record does not establish coverage')
    await expect(status).toContainText('Operational environment differs.')
    await expect(status).toContainText('check the security policy')
    await expect(exercise.getByRole('link', { name: 'CMVP management manual' })).toBeVisible()

    await environment.selectOption('Debian 12 on x86-64')
    await exercise.getByLabel('Mode of operation').selectOption('General-purpose mode')
    await compare.click()
    await expect(status).toContainText('Mode of operation differs.')
    await expect(status).not.toContainText('Operational environment differs.')
    await exercise.getByLabel('Mode of operation').selectOption('Approved mode')
    await exercise.getByLabel('Module version').selectOption('2.5.0')
    await compare.click()
    await expect(status).toContainText('Module version differs.')
    await exercise.getByLabel('Module version').selectOption('2.4.1')
    await compare.click()
    await expect(status).toContainText('matches the tested configuration')
  })
}
