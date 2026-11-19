// SPDX-License-Identifier: AGPL-3.0-only
import { createHash } from 'node:crypto'
import { text } from 'node:stream/consumers'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`OpenSSL Workbench hashes and downloads a named file at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/playground/openssl-studio')
    await page.getByRole('tab', { name: 'Workbench', exact: true }).click()
    await page.getByRole('button', { name: 'Hashing', exact: true }).click()
    const run = page.getByRole('button', { name: 'Run Command', exact: true })
    await expect(run).toBeEnabled({ timeout: 25_000 })
    await run.click()
    await expect(page.getByText(/OpenSSL exited with status [1-9]/).first()).toBeVisible()
    const sample = 'Fictional release note for digest comparison\n'
    const inputName = 'release notes | draft.txt'
    const outputName = 'release digest.txt'
    await page.locator('#add-file-input').setInputFiles({
      name: inputName,
      mimeType: 'text/plain',
      buffer: Buffer.from(sample),
    })
    const input = page.getByRole('button', { name: /Input file|Select a file/i })
    await input.click()
    await page.getByRole('option', { name: inputName, exact: true }).click()
    await page.getByLabel('Output File (Optional)').fill(outputName)
    await run.click()
    const output = page.getByRole('row').filter({ hasText: outputName })
    await expect(output).toBeVisible()
    const download = async () => {
      const [file] = await Promise.all([
        page.waitForEvent('download'),
        output.getByRole('button', { name: 'Download', exact: true }).click(),
      ])
      expect(file.suggestedFilename()).toBe(outputName)
      return text(await file.createReadStream())
    }
    expect(await download()).toContain(createHash('sha256').update(sample).digest('hex'))
    await page.getByRole('button', { name: 'Hash Algorithm', exact: true }).click()
    await page.getByRole('option', { name: 'SHA-512', exact: true }).click()
    await run.click()
    await expect(page.getByText(`File created: ${outputName}`, { exact: true })).toBeVisible()
    expect(await download()).toContain(createHash('sha512').update(sample).digest('hex'))
  })
}
