// SPDX-License-Identifier: AGPL-3.0-only
import { createHash } from 'node:crypto'
import { buffer } from 'node:stream/consumers'
import { test, expect } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`ACVP checks the exact engine response bytes against the downloaded evidence at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(120_000)
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
    await page.goto('/learn/acvp-lab-workflow?tab=workshop&step=2&sv=2')
    const download = async (name: string) => {
      const [file] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name, exact: true }).click(),
      ])
      return buffer(await file.createReadStream())
    }
    const jsonFile = (name: string, bytes: Buffer) => ({
      name,
      mimeType: 'application/json',
      buffer: bytes,
    })

    await page.getByRole('button', { name: 'ML-DSA / sigVer / FIPS204' }).click()
    const prompt = await download('Save prompt.json')
    await page.getByLabel('ACVP prompt file').setInputFiles(jsonFile('prompt.json', prompt))
    const engine = width === 1280 ? 'C++' : 'Rust'
    await page.getByRole('button', { name: `${engine} engine`, exact: true }).click()
    await page.getByRole('button', { name: /Run locally/ }).click()
    await expect(page.getByTestId('acvp-io-summary')).toContainText(
      `180 test cases on the softhsmv3 ${engine} engine: 180 answered · 0 unsupported · 0 error`,
      { timeout: 90_000 }
    )
    const response = await download('Download response.json')
    const evidence = await download('Download evidence.json')
    const digest = createHash('sha256').update(response).digest('hex')
    const compare = page.getByLabel('Load response.json', { exact: true })
    const evidenceInput = page.getByLabel('Load evidence.json', { exact: true })
    await compare.setInputFiles(jsonFile('response.json', response))
    await expect(page.getByTestId('ral-comparison-verdict')).toContainText(
      'All 180 expected cases match'
    )
    await evidenceInput.setInputFiles(jsonFile('evidence.json', evidence))
    await expect(page.getByTestId('ral-evidence')).toContainText(digest)
    const byteCheck = page.getByLabel('Check response.json bytes', { exact: true })
    const verdict = page.getByTestId('ral-response-binding')
    await byteCheck.setInputFiles(jsonFile('response.json', response))
    await expect(verdict).toContainText('match the SHA-256')

    const changed = Buffer.concat([response, Buffer.from('\n')])
    await compare.setInputFiles(jsonFile('response.json', changed))
    await expect(page.getByTestId('ral-comparison-verdict')).toContainText(
      'All 180 expected cases match'
    )
    await byteCheck.setInputFiles(jsonFile('response.json', changed))
    await expect(verdict).toContainText('differ from the SHA-256')
    await byteCheck.setInputFiles(jsonFile('response.json', response))
    await expect(verdict).toContainText('match the SHA-256')

    const withoutDigest = { ...JSON.parse(evidence.toString()), response: {} }
    await evidenceInput.setInputFiles(
      jsonFile('evidence.json', Buffer.from(JSON.stringify(withoutDigest)))
    )
    await expect(page.getByTestId('ral-evidence')).toContainText('No valid response SHA-256')
    await expect(verdict).toHaveCount(0)
  })
}
