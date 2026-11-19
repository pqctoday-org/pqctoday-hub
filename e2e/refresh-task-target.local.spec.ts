// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`a refresh inside the horizon still flags a missed task target at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.clock.setFixedTime(new Date('2026-11-18T12:00:00Z'))
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      localStorage.setItem(
        'pqc-version-storage',
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
    })
    await page.goto('/business/tools/refresh-cycle-alignment')
    const row = page.getByRole('group', { name: 'HSM replacement', exact: true })
    const next = row.getByRole('textbox', { name: 'Next refresh year' })
    const target = row.getByRole('textbox', { name: 'Task target year (optional)' })
    const interim = row.getByRole('textbox', {
      name: 'Interim action before the planned refresh',
    })
    await next.fill('2028')
    await row.getByRole('textbox', { name: 'PQC task to embed' }).fill('Retest the issuing CA key.')
    await expect(row.getByText('Within planning window')).toBeVisible()
    await target.fill('2027')
    await expect(row.getByText('After task target')).toBeVisible()
    await expect(interim).toBeVisible()
    const action = 'Fictional plan: validate the standby HSM and move the issuing CA pilot.'
    await interim.fill(action)

    const download = async () => {
      const [file] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: '.md', exact: true }).click(),
      ])
      return text(await file.createReadStream())
    }
    const late = await download()
    expect(late).toContain('| HSM replacement | 2028 | After task target')
    expect(late).toContain('| 2027 |')
    expect(late).toContain(action)
    await page.reload()
    await expect(target).toHaveValue('2027')
    await expect(interim).toHaveValue(action)

    await target.fill('2027Q4')
    await expect(row.getByText('Timing unknown')).toBeVisible()
    await target.fill('2028')
    await expect(row.getByText('Within planning window')).toBeVisible()
    await expect(interim).toHaveCount(0)
    expect(await download()).not.toContain(action)
  })
}
