// SPDX-License-Identifier: AGPL-3.0-only
import { text } from 'node:stream/consumers'
import Papa from 'papaparse'
import { expect, test } from './fixtures/blockAnalytics'

for (const width of [1280, 390]) {
  test(`formatted U.S. patent identifiers produce exact scoped exports at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => {
      localStorage.setItem(
        'pqc-disclaimer-storage',
        JSON.stringify({ state: { acknowledgedMajorVersion: 99 }, version: 0 })
      )
    })
    await page.goto('/patents?scope=all&tab=search')
    const search = page.getByRole('textbox', { name: /Patent (natural-language )?search/ })
    const exportMatches = page.getByRole('button', { name: 'Export matching patents' })
    const exportRows = async () => {
      const [csv] = await Promise.all([page.waitForEvent('download'), exportMatches.click()])
      const parsed = Papa.parse<Record<string, string>>(await text(await csv.createReadStream()), {
        header: true,
        skipEmptyLines: true,
      })
      expect(parsed.errors).toEqual([])
      return parsed.data
    }
    const records = [
      ['US 2026 0189535', 'US20260189535', 'Published application'],
      ['US 12,470,376', 'US12470376', 'Granted patent'],
    ] as const

    for (const [formatted, id, label] of records) {
      await search.fill('')
      await search.pressSequentially(formatted)
      await expect(search).toHaveValue(formatted)
      await expect(exportMatches).toBeEnabled()
      expect(await exportRows()).toEqual([
        expect.objectContaining({
          'Patent Number': id,
          'Publication Type': label,
          'USPTO Public Search': 'https://www.uspto.gov/patents/search/patent-public-search',
          'Current Status Lookup Guidance': expect.stringMatching(
            /application history|official record/
          ),
        }),
      ])
    }
    await search.fill('US 99,999,999')
    await expect(page.getByText(/No patents match/)).toBeVisible()
    await expect(exportMatches).toBeDisabled()
    await page.reload()
    await expect(search).toHaveValue('US 99,999,999')
    await expect(exportMatches).toBeDisabled()
    await search.fill(records[0][0])
    expect(await exportRows()).toEqual([
      expect.objectContaining({ 'Patent Number': records[0][1] }),
    ])
  })
}
