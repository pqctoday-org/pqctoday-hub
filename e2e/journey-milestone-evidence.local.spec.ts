// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures/blockAnalytics'

const milestones = [
  { label: 'Scope a Compliance Checklist', route: 'compliance-checklist' },
  { label: 'Record a Risk Treatment', route: 'risk-treatment-plan' },
  { label: 'Review Vendor Evidence', route: 'vendor-scorecard' },
  { label: 'Complete a Verification Artifact', route: 'migration-verification' },
]

async function downloadMarkdown(page: Page) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: '.md', exact: true }).last().click(),
  ])
  return text(await download.createReadStream())
}

for (const width of [1280, 390]) {
  test(`the GRC journey credits only the artifact completed at ${width}px`, async ({ page }) => {
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
      localStorage.setItem(
        'pqc-learning-persona',
        JSON.stringify({
          state: { selectedPersona: 'grc', hasAcknowledgedExecutiveGrcSplit: true },
          version: 11,
        })
      )
    })
    await page.goto('/business')
    const journey = page.getByRole('dialog', { name: 'Journey History' })
    const openJourney = async () => {
      if (width === 390) {
        await page.getByRole('button', { name: /^More(?: — unread updates)?$/ }).press('Enter')
        await page
          .getByTestId('mobile-page-actions-sheet')
          .getByRole('button', { name: /^Journey/ })
          .press('Enter')
      } else {
        await page.getByRole('button', { name: 'Open your Journey map' }).press('Enter')
      }
      await expect(journey).toBeVisible()
    }
    const milestone = (id: number) =>
      journey.getByRole('link', { name: new RegExp(`^${milestones[id].label}`) })
    const verifyProgress = async (completed: number) => {
      for (const [index, task] of milestones.entries()) {
        await expect(milestone(index)).toHaveAttribute('href', `/business/tools/${task.route}`)
        await expect(milestone(index)).toContainText(index < completed ? 'Completed' : 'Available')
      }
    }

    await openJourney()
    await verifyProgress(0)
    await milestone(0).press('Enter')
    await page.getByRole('button', { name: 'Load sample frameworks' }).click()
    await page
      .getByLabel('Compliance owner', { exact: true })
      .first()
      .fill('Sample compliance owner')
    await page.getByRole('button', { name: 'Preview', exact: true }).click()
    expect(await downloadMarkdown(page)).toContain('Sample compliance owner')

    await openJourney()
    await verifyProgress(1)
    await milestone(1).press('Enter')
    await page.getByRole('button', { name: 'Load sample entries' }).click()
    await page.getByRole('button', { name: /^Likelihood 4 .*impact 5/ }).click()
    await page.getByRole('button', { name: 'Mitigate', exact: true }).first().click()
    await page
      .getByPlaceholder('Brief rationale for this treatment decision...')
      .first()
      .fill('Sample treatment rationale')
    expect(await downloadMarkdown(page)).toContain('Sample treatment rationale')

    await openJourney()
    await verifyProgress(2)
    await milestone(2).press('Enter')
    const score = page.getByRole('slider', { name: 'PQC Algorithm Support' })
    if (!(await score.count())) {
      await page.getByRole('button', { name: /^PQC Algorithm Support Catalogue entry/ }).click()
    }
    await page.getByRole('button', { name: 'Record zero', exact: true }).click()
    expect(await downloadMarkdown(page)).toContain('Manual readiness score: 0/100')

    await openJourney()
    await verifyProgress(3)
    await milestone(3).press('Enter')
    await page
      .getByRole('group', { name: 'Public web TLS (edge)', exact: true })
      .getByLabel('Observed negotiation', { exact: true })
      .fill('Sample capture: X25519MLKEM768')
    expect(await downloadMarkdown(page)).toContain('Sample capture: X25519MLKEM768')

    await page.reload()
    await openJourney()
    await verifyProgress(4)
  })
}
