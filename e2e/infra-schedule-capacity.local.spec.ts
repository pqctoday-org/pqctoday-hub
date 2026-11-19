// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`infrastructure cutover follows the HSM prerequisite at ${width}px`, async ({ page }) => {
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
    await page.goto('/business/tools/infra-modernization-planner')
    const ready = page.getByLabel('Planned HSM readiness date')
    const cutover = page.getByLabel('Planned PKI cutover date')
    const schedule = page.getByRole('status', { name: 'Infrastructure schedule result' })
    const cpu = page.getByRole('textbox', { name: 'Estimated CPU impact (%)' })
    const storage = page.getByRole('textbox', { name: 'Cert-storage multiplier (×)' })
    await expect(schedule).toContainText('Enter the HSM readiness and PKI cutover dates')
    await ready.fill('2027-11-01')
    await cutover.fill('2027-11-05')
    await expect(schedule).toContainText('readiness date precedes the PKI cutover')
    await ready.fill('2027-11-06')
    const conflict = 'Schedule conflict. The PKI cutover precedes its HSM readiness date.'
    await expect(schedule).toHaveText(conflict)

    await cpu.fill('5% at 100 requests/s')
    await expect(page.getByText(/CPU impact is unassessed/)).toBeVisible()
    await expect(page.getByText(/High CPU impact/)).toHaveCount(0)
    await cpu.fill('18–25%')
    await expect(page.getByText('High CPU impact', { exact: false })).toContainText('25%')
    await storage.fill('2×')
    await expect(page.getByText(/Certificate stores grow/)).toContainText('2x')

    const download = async (ext: string) => {
      const [file] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: ext, exact: true }).click(),
      ])
      return text(await file.createReadStream())
    }
    const csv = await download('.csv')
    expect(csv).toContain('result.dependency')
    expect(csv).toContain(conflict)
    expect(csv).toContain('up to 25%')

    await page.reload()
    await expect(schedule).toHaveText(conflict)
    await ready.fill('2027-11-05')
    await expect(schedule).toContainText('Same-day milestones')
    await ready.fill('2027-11-04')
    await expect(schedule).toContainText('readiness date precedes the PKI cutover')
    expect(await download('.md')).not.toContain(conflict)
  })
}
