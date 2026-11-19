// SPDX-License-Identifier: AGPL-3.0-only
import { test, expect } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`gateway renewal requires evidence for the exact selected profile at ${width}px`, async ({
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
    await page.goto('/learn/web-gateway-pqc?tab=workshop&step=3')
    const exercise = page.getByRole('region', { name: 'Check the renewal evidence' })
    const result = exercise.getByRole('status', { name: 'Renewal evidence decision' })
    const record = exercise.getByRole('checkbox', { name: /Northstar staging/ })
    const requiresLog = exercise.getByRole('checkbox', { name: /public CT log/ })
    const profile = page.getByRole('button', { name: 'Target certificate profile' })
    const method = page.getByRole('button', { name: 'Renewal method' })

    await expect(result).toContainText('does not establish renewal')
    await record.check()
    await expect(result).toHaveText('The record supports this internal staging renewal.')
    await requiresLog.check()
    await expect(result).toContainText('Public CT log acceptance still needs evidence.')

    await profile.click()
    await page.getByRole('option', { name: 'RFC 10073 ML-DSA-44 + ECDSA P-256' }).click()
    await expect(result).toContainText('does not establish renewal')
    await expect(exercise.getByText(/1,377-byte/)).toContainText('up to 2,492 bytes')
    await expect(exercise.getByRole('link', { name: 'Composite encoding sizes' })).toHaveAttribute(
      'href',
      'https://www.rfc-editor.org/rfc/rfc10073.html#appendix-A'
    )

    await profile.click()
    await page.getByRole('option', { name: 'ML-DSA-65', exact: true }).click()
    await method.click()
    await page.getByRole('option', { name: 'Manual', exact: true }).click()
    await expect(result).toContainText('does not establish renewal')

    await method.click()
    await page.getByRole('option', { name: /ACME/ }).click()
    await requiresLog.uncheck()
    await expect(result).toHaveText('The record supports this internal staging renewal.')
  })
}
