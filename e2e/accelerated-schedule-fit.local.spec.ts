// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`the accelerated profile recalculates a shortened deadline at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
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
    await page.goto('/business/tools/accelerated-execution-profile')
    const target = page.getByRole('spinbutton', { name: 'Target from activation (days)' })
    const prerequisite = page.getByRole('spinbutton', { name: 'Prerequisite and checks (days)' })
    const rollout = page.getByRole('spinbutton', { name: 'Rollout after prerequisite (days)' })
    const status = page.getByRole('status', { name: 'Accelerated schedule result' })

    await expect(status).toContainText('Enter the target and both sequence durations')
    await target.fill('90')
    await prerequisite.fill('40')
    await rollout.fill('30')
    await expect(status).toContainText('day 70, with 20 days of margin')
    await target.fill('60')
    await expect(status).toContainText('day 70, 10 days after the target')

    await page
      .getByRole('textbox', { name: 'Pre-drafted budget / headcount ask' })
      .fill('Fictional request: reserve a second validation team.')
    await page
      .getByRole('textbox', { name: 'Risk acceptances cleared in advance' })
      .fill('Fictional exception: legacy viewer update is deferred.')

    const download = async () => {
      const [file] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: '.md', exact: true }).click(),
      ])
      return text(await file.createReadStream())
    }
    const late = await download()
    expect(late).toContain('day 70, 10 days after the target')
    expect(late).toContain('reserve a second validation team.')
    expect(late).toContain('legacy viewer update is deferred.')

    await page.reload()
    await expect(status).toContainText('10 days after the target')
    await prerequisite.fill('')
    await expect(status).toContainText('Use whole numbers')
    await prerequisite.fill('30')
    await expect(status).toContainText('day 60, with 0 days of margin')
    expect(await download()).not.toContain('10 days after the target')
  })
}
