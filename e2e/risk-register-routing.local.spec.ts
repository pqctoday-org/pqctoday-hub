// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`review ownership changes the risk summary and CSV at ${width}px`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
      if (localStorage.getItem('pqc-risk-register')) return
      localStorage.setItem(
        'pqc-risk-register',
        JSON.stringify({
          state: {
            riskEntries: [
              {
                id: 'signing-sample',
                assetName: 'Fictional firmware signing',
                currentAlgorithm: 'RSA-2048',
                threatVector: 'forgery',
                likelihood: 4,
                impact: 5,
                mitigation: 'Confirm verifier rollout',
                ownerRole: '',
                nextReview: '',
              },
            ],
          },
          version: 2,
        })
      )
    })
    await page.setViewportSize({ width, height: 850 })
    await page.goto('/business/tools/risk-register')

    const summary = page.getByRole('heading', { name: 'Risk Summary' }).locator('..')
    const critical = summary.getByText('Critical', { exact: true }).locator('..')
    const owner = page.getByRole('textbox', { name: 'Owner role' })
    const review = page.getByLabel('Next review date', { exact: true })
    await expect(critical).toHaveText('0Critical')
    await expect(summary).toContainText('Notes, not yet risks: 1')
    await owner.fill('Release engineering lead')
    await expect(critical).toHaveText('0Critical')
    await review.fill('2027-03-31')
    await expect(critical).toHaveText('1Critical')
    await expect(summary).toContainText('Notes, not yet risks: 0')
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download CSV' }).click(),
    ])
    const stream = await download.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(chunk)
    const csv = Buffer.concat(chunks).toString('utf8')
    expect(csv).toContain('entries[0].score,20')
    expect(csv).toContain('entries[0].status,Tracked risk')
    expect(csv).toContain('entries[0].riskLevel,Critical')
    expect(csv).toContain('summary.Critical,1')
    expect(csv).toContain('summary.notes,0')

    await page.reload()
    await expect(critical).toHaveText('1Critical')
    await expect(review).toHaveValue('2027-03-31')
    await review.fill('')
    await expect(critical).toHaveText('0Critical')
    await expect(summary).toContainText('Notes, not yet risks: 1')
  })
}
