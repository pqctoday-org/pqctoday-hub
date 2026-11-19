// SPDX-License-Identifier: AGPL-3.0-only
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`archive renewal separates signer expiry, time-stamp renewal and hash replacement at ${width}px`, async ({
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
    await page.goto('/learn/trust-services-pqc?tab=workshop')
    const plan = page.getByRole('region', { name: 'Choose an archive renewal plan' })
    const result = plan.getByRole('status')
    const replaceHash = plan.getByRole('checkbox', { name: 'The archive hash must be replaced' })
    const renewIn2032 = plan.getByRole('button', { name: '2032' })
    await expect(plan).toContainText('certificate expires in 2029')
    await expect(result).toContainText('Deadline missed in this example')
    await expect(result).toContainText('cannot repair the gap')
    await renewIn2032.press('Enter')
    await expect(renewIn2032).toHaveAttribute('aria-pressed', 'true')
    await expect(result).toContainText('Before the example deadline')
    await expect(result).toContainText('timestamps the existing archive timestamp')
    await replaceHash.press('Space')
    await expect(replaceHash).toBeChecked()
    await expect(result).toContainText('Deadline missed in this example')
    await expect(result).toContainText(
      'covers the original records and the existing archive evidence'
    )
    await plan.getByRole('button', { name: '2031' }).press('Enter')
    await expect(result).toContainText('Before the example deadline')
    await expect(plan.getByRole('link', { name: 'RFC 4998 §5' })).toHaveAttribute(
      'href',
      'https://www.rfc-editor.org/rfc/rfc4998.html#section-5'
    )
    await expect(plan.getByRole('link', { name: 'RFC 3161 §4' })).toHaveAttribute(
      'href',
      'https://www.rfc-editor.org/rfc/rfc3161.html#section-4'
    )
  })
}
