// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`the refactor audit enforces the selected provider policy at ${width}px`, async ({
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
    await page.goto('/business/tools/crypto-api-refactor-audit')

    const choose = async (control: string, option: string | RegExp) => {
      await page.getByRole('button', { name: control, exact: true }).click()
      await page.getByRole('option', { name: option }).click()
    }
    const chooseEvidence = (option: string) => choose('Alternate provider evidence', option)
    const choosePolicy = (option: string | RegExp) => choose('Runtime fallback policy', option)
    const edit = page.getByRole('button', { name: 'Edit', exact: true })
    const preview = page.getByRole('button', { name: 'Preview', exact: true })
    const verifyPreview = async (text: string) => {
      await preview.click()
      await expect(page.getByText(text, { exact: false }).filter({ visible: true })).toBeVisible()
    }
    const success = 'Route the signing request to the approved ML-DSA-65 alternate'
    const denial = 'Reject the signing request under the selected fail-closed policy.'
    await chooseEvidence('ML-DSA-65 signing outside the approved boundary')
    await verifyPreview('The alternate is outside the approved key handling boundary.')
    await edit.click()
    await chooseEvidence('ML-DSA-44 signing in the approved boundary')
    await verifyPreview('The alternate offers ML-DSA-44, while the request requires ML-DSA-65.')
    await edit.click()
    await chooseEvidence('ML-DSA-65 signing in the approved boundary')
    await verifyPreview(success)
    await edit.click()
    await choosePolicy(/^Must fail closed/)
    await verifyPreview(denial)
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '.md', exact: true }).click(),
    ])
    const markdown = await text(await download.createReadStream())
    expect(markdown).toContain('ML-DSA-65 signing in the approved boundary')
    expect(markdown).toContain(denial)
    expect(markdown).not.toContain(success)

    await page.reload()
    await verifyPreview(denial)
    await edit.click()
    await choosePolicy('Use an approved alternate for the same operation and profile')
    await verifyPreview(success)
  })
}
