// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`the charter distinguishes a draft from a recorded approval at ${width}px`, async ({
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
    await page.goto('/business/tools/program-charter')
    const name = page.getByRole('textbox', { name: 'Sponsor name' })
    const scope = page.getByRole('textbox', { name: 'In scope', exact: true })
    const success = page.getByRole('textbox', { name: 'Success criteria' })
    const reference = page.getByRole('textbox', { name: 'Approval reference' })
    const date = page.getByLabel('Reported approval date')
    const status = page.getByRole('status', { name: 'Mandate review' })
    await expect(date).toHaveValue('')
    await expect(status).toContainText('Draft.')

    await name.fill('Fictional Northstar Security Sponsor')
    await scope.fill('Two customer-facing gateways handling the sample archive.')
    await success.fill('Both gateways negotiate X25519MLKEM768 in ten staging connections.')
    await date.fill('2026-07-01')
    await expect(status).toHaveText('Draft. Record an approval reference.')
    await reference.fill('Fictional decision NS-42, charter revision 3')
    await date.fill('2099-07-01')
    await expect(status).toContainText('Record the date of the completed approval')
    await date.fill('2026-07-01')
    await expect(status).toContainText('Approval reference recorded')
    await expect(status).toContainText('covers this charter revision')

    const download = async () => {
      const [file] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: '.md', exact: true }).click(),
      ])
      return text(await file.createReadStream())
    }
    const recorded = await download()
    expect(recorded).toContain('Fictional decision NS-42, charter revision 3')
    expect(recorded).toContain('Fictional Northstar Security Sponsor')
    expect(recorded).toContain('ten staging connections')
    expect(recorded).toContain('Approval reference recorded')

    await page.reload()
    await expect(status).toContainText('Approval reference recorded')
    await success.fill('')
    await expect(status).toHaveText('Draft. Record success criteria.')
    const draft = await download()
    expect(draft).toContain('Draft. Record success criteria.')
    expect(draft).not.toContain('Approval reference recorded.')
  })
}
