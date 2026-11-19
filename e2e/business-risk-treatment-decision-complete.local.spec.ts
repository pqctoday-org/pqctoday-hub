// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`risk treatment models a hypothetical and explains priority at ${width}px`, async ({
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
        JSON.stringify({ state: { lastSeenVersion: '99.0.0' }, version: 0 })
      )
      localStorage.setItem('pqc-tour-completed', 'true')
    })
    await page.goto('/business/tools/risk-treatment-plan')
    await page.getByRole('button', { name: 'Load sample entries' }).click()

    await page
      .getByRole('button', {
        name: /Likelihood 4 \(Likely\), impact 5 \(Catastrophic\), score 20 \(Critical\); TLS Certificates \(Public Web\)/,
      })
      .click()
    await page.getByRole('button', { name: 'Mitigate', exact: true }).click()
    await expect(
      page.getByRole('button', {
        name: 'Hypothetical likelihood for TLS Certificates (Public Web)',
      })
    ).toBeVisible()
    await page
      .getByRole('button', { name: 'Hypothetical likelihood for TLS Certificates (Public Web)' })
      .click()
    await page.getByRole('option', { name: /^2 — Unlikely$/ }).click()
    await page
      .getByRole('button', { name: 'Hypothetical impact for TLS Certificates (Public Web)' })
      .click()
    await page.getByRole('option', { name: /^3 — Moderate$/ }).click()
    await page
      .getByRole('button', {
        name: /Likelihood 2 \(Unlikely\), impact 3 \(Moderate\), score 6 \(Medium\); TLS Certificates \(Public Web\)/,
      })
      .click()
    await expect(
      page.getByText(/Hypothetical draft estimate — not measured or implemented/)
    ).toBeVisible()
    await expect(page.getByText('Critical: 1 → 0')).toBeVisible()
    await expect(page.getByText('Medium: 1 → 2')).toBeVisible()

    const priorityHeading = page.getByRole('heading', { name: 'Migration Priority Order' })
    const priorityPanel = priorityHeading.locator('xpath=../..')
    const databaseRow = priorityPanel
      .getByText('Customer Database Encryption', { exact: true })
      .locator('xpath=../../..')
    await databaseRow.getByRole('button', { name: 'Move up' }).click()
    const priorityReason = databaseRow.getByPlaceholder(/Why is this prioritized differently/)
    await expect(priorityReason).toBeVisible()
    await priorityReason.fill('Align with the approved data-center maintenance window')

    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: '.md' }).click()
    const file = await download
    const stream = await file.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(Buffer.from(chunk))
    const markdown = Buffer.concat(chunks).toString('utf8')
    expect(markdown).toContain('6 (Medium) — hypothetical draft, not measured or implemented')
    expect(markdown).toContain('Align with the approved data-center maintenance window')
    expect(markdown).toContain('Nothing here establishes implementation or measured risk reduction')
  })
}
