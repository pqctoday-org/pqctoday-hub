// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`migration evidence distinguishes hybrid key exchange and TLS authentication at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/business/tools/migration-verification')
    const record = page.getByRole('group', { name: 'Public web TLS (edge)', exact: true })
    const required = record.getByRole('button', { name: 'Required certificate authentication' })
    const observed = record.getByRole('button', { name: 'Observed certificate authentication' })
    await record.getByLabel('Observed negotiation', { exact: true }).fill('Capture: X25519MLKEM768')
    await record.getByLabel('Negative test', { exact: true }).fill('Legacy-only peer rejected')
    await record
      .getByLabel('Certificate and authentication evidence', { exact: true })
      .fill('CertificateVerify: RSA-PSS')
    await record.getByLabel('Downgrade documented', { exact: true }).fill('Fallback forbidden')
    await record
      .getByLabel('Evidence in dossier', { exact: true })
      .fill('Fictional evidence folder')
    await required.click()
    await page.getByRole('option', { name: 'Post-quantum certificate' }).click()
    await observed.click()
    await page.getByRole('option', { name: 'Classical certificate' }).click()
    await expect(record.getByRole('status')).toHaveText('Authentication differs from requirement')

    const downloadMarkdown = async () => {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: '.md', exact: true }).click(),
      ])
      return text(await download.createReadStream())
    }

    const mismatch = await downloadMarkdown()
    expect(mismatch).toContain('Capture: X25519MLKEM768')
    expect(mismatch).toContain('CertificateVerify: RSA-PSS')
    expect(mismatch).toContain(
      '| Post-quantum certificate | Classical certificate | Authentication differs from requirement |'
    )

    await required.click()
    await page.getByRole('option', { name: 'Classical certificate' }).click()
    await expect(record.getByRole('status')).toHaveText('Evidence recorded — review required')
    const accepted = await downloadMarkdown()
    expect(accepted).toContain(
      '| Classical certificate | Classical certificate | **Evidence recorded — review required** |'
    )
    await page.reload()
    await expect(required).toContainText('Classical certificate')
    await expect(observed).toContainText('Classical certificate')
    await expect(record.getByRole('status')).toHaveText('Evidence recorded — review required')
  })
}
