// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`a refresh beyond the planning window needs an interim action at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/business/tools/refresh-cycle-alignment')
    const year = await page.evaluate(() => new Date().getFullYear())
    const refresh = page.getByRole('textbox', { name: 'Next refresh year' }).first()
    const action = page.getByRole('textbox', { name: 'Interim action before the planned refresh' })
    const plan = 'Pilot the fictional replacement gateway before hardware refresh.'
    const download = async () => {
      const [file] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: '.md', exact: true }).click(),
      ])
      return text(await file.createReadStream())
    }

    await refresh.fill(String(year + 4))
    await expect(action).toBeVisible()
    await expect(page.getByText(/1 still needs an interim action/)).toBeVisible()
    expect(await download()).toContain('Data center hardware: Interim action needed.')

    await action.fill(plan)
    await expect(page.getByText(/1 still needs an interim action/)).toHaveCount(0)
    expect(await download()).toContain(`Data center hardware: ${plan}`)

    await refresh.fill(String(year + 3))
    await expect(action).toHaveCount(0)
    expect(await download()).not.toContain(plan)
    await refresh.fill(String(year + 4))
    await expect(action).toHaveValue(plan)
  })
}
