// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`the communication draft requests a decision the recipient can make at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/business/tools/stakeholder-comms')
    const initiative = 'the fictional gateway migration pilot'
    const subject = page.getByRole('textbox', { name: 'Initiative for the decision request' })
    const recipient = page.getByRole('button', { name: 'Recipient for the decision request' })
    const preview = page.getByRole('button', { name: 'Preview', exact: true })
    const edit = page.getByRole('button', { name: 'Edit', exact: true })
    const boardDecision = `Approve the funding and name the accountable sponsor for ${initiative}.`
    const partnerDecision = `Confirm supported profiles, the test endpoint and a joint interoperability test date for ${initiative}.`

    await expect(subject).toBeVisible()
    await subject.fill(initiative)
    await preview.click()
    await expect(page.getByText(boardDecision, { exact: true })).toBeVisible()
    await edit.click()
    await recipient.click()
    await page.getByRole('option', { name: 'External partners', exact: true }).click()
    await preview.click()
    await expect(page.getByText(partnerDecision, { exact: true })).toBeVisible()
    await expect(page.getByText(boardDecision, { exact: true })).toHaveCount(0)

    const [file] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '.md', exact: true }).click(),
    ])
    const markdown = await text(await file.createReadStream())
    expect(markdown).toContain('### Decision request for External partners')
    expect(markdown).toContain(partnerDecision)
    expect(markdown).not.toContain(boardDecision)

    await page.reload()
    await expect(recipient).toContainText('External partners')
    await expect(subject).toHaveValue(initiative)
    await subject.fill('')
    await preview.click()
    await expect(
      page.getByText('Decision request for External partners', { exact: true })
    ).toHaveCount(0)
  })
}
