// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The Algorithms page discloses how many catalogue rows the loader withholds.
 * Those counts must come from the data, and together with the rows shown they
 * must account for every row in the latest catalogue file.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import Papa from 'papaparse'
import { getWithheldCatalogueRows, loadPQCAlgorithmsData } from './pqcAlgorithmsData'

function latestCatalogueFile(): string {
  const dir = join(process.cwd(), 'src/data')
  const files = readdirSync(dir).filter((f) =>
    /^pqc_complete_algorithm_reference_\d{8}(_r\d+)?\.csv$/.test(f)
  )
  const key = (f: string) => {
    const [, d, r] = f.match(/_(\d{8})(?:_r(\d+))?\.csv$/)!
    return `${d.slice(4)}${d.slice(0, 4)}-${String(Number(r ?? 0)).padStart(4, '0')}`
  }
  files.sort((a, b) => key(a).localeCompare(key(b)))
  return join(dir, files[files.length - 1])
}

describe('withheld catalogue rows', () => {
  it('shown + withheld accounts for every row in the latest catalogue file', async () => {
    const shown = await loadPQCAlgorithmsData()
    const withheld = getWithheldCatalogueRows()
    const raw = Papa.parse<Record<string, string>>(readFileSync(latestCatalogueFile(), 'utf8'), {
      header: true,
      skipEmptyLines: true,
    }).data
    expect(shown.length + withheld.unclassified + withheld.placeholder).toBe(raw.length)
    expect(withheld.unclassified).toBeGreaterThanOrEqual(0)
    expect(withheld.placeholder).toBeGreaterThanOrEqual(0)
  })
})
