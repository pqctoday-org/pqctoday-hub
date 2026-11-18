// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`changing capture history changes the stored-data decision and artifact at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/business/tools/data-at-rest-strategy')
    const archive = page.getByRole('group', { name: 'Backups & archives', exact: true })
    const history = archive.getByRole('button', { name: /Old wrapped key exposure/ })
    const result = archive.getByRole('status')
    await expect(history).toContainText('History unknown')
    await expect(result).toContainText('Establish the old key history first')
    await history.click()
    await page.getByRole('option', { name: 'No known capture' }).click()
    await expect(result).toContainText('Re-wrap can improve future key protection')
    await history.click()
    await page.getByRole('option', { name: 'Old wrap captured' }).click()
    await expect(result).toContainText('Re-wrap leaves the same data key in use')
    await archive.getByRole('button', { name: /Re-encrypt with fresh AES-256 DEK/ }).click()
    await expect(result).toContainText('Re-encrypt the controlled copies with a fresh data key')
    await expect(result).toContainText('Captured copies still depend on the old key')

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: '.md', exact: true }).click(),
    ])
    const markdown = await text(await download.createReadStream())
    const archiveRow = markdown
      .split('\n')
      .find((line) => line.startsWith('| Backups & archives |'))
    expect(archiveRow).toContain('Old wrap captured')
    expect(archiveRow).toContain('Re-encrypt the controlled copies with a fresh data key')
    expect(archiveRow).toContain('Captured copies still depend on the old key')

    await page.reload()
    await expect(history).toContainText('Old wrap captured')
    await expect(result).toContainText('Re-encrypt the controlled copies with a fresh data key')
  })
}
