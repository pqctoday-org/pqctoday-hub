// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`Risk treatment connects a sample decision to its plan at ${width}px`, async ({ page }) => {
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

    const sampleRisk = page.getByRole('button', {
      name: /Likelihood 4 \(Likely\), impact 5 \(Catastrophic\), score 20 \(Critical\); TLS Certificates \(Public Web\)/,
    })
    await sampleRisk.click()
    await expect(
      page.getByRole('heading', { name: /Cell Details.*Likelihood: 4, Impact: 5/ })
    ).toBeVisible()
    await page.getByRole('button', { name: 'Mitigate', exact: true }).click()
    await page
      .getByPlaceholder('Brief rationale for this treatment decision...')
      .fill('Public trust; start with the hybrid TLS pilot')

    const summary = page.getByRole('list', { name: 'Treatment decisions' })
    await expect(summary).toContainText(
      '#1 TLS Certificates (Public Web) (L4 × I5) — Mitigate: Public trust; start with the hybrid TLS pilot'
    )
    await expect(page.getByRole('heading', { name: 'Migration Priority Order' })).toBeVisible()
    await expect(
      page.getByText('Includes draft strategy choices, baseline and hypothetical sample scores')
    ).toBeVisible()
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: '.md' }).click()
    const file = await download
    expect(file.suggestedFilename()).toContain('quantum-risk-treatment-plan')
    const stream = await file.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(Buffer.from(chunk))
    const markdown = Buffer.concat(chunks).toString('utf8')
    expect(markdown).toContain('| 1 | TLS Certificates (Public Web) | 20 (Critical) | mitigate |')
    expect(markdown).toContain('Public trust; start with the hybrid TLS pilot')
    expect(markdown).toContain('Nothing here establishes implementation or measured risk reduction')
  })
}
