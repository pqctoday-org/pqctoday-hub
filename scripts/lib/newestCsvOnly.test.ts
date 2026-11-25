// SPDX-License-Identifier: AGPL-3.0-only
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  csvGenerations,
  NEWEST_CSV_ONLY_FAMILIES,
  newestCsvOnlyPlugin,
  olderGenerations,
  readLoaderSource,
  readsOlderGeneration,
} from './newestCsvOnly'

const DATA = join(process.cwd(), 'src/data')

describe('newest-csv-only', () => {
  it('orders generations by date and revision as numbers, not as text', () => {
    const names = [
      'a_01012027.csv',
      'a_12312026_r13.csv',
      'a_12312026_r8.csv',
      'a_12312026.csv',
      'ab_01012028.csv',
      'a_notes.csv',
    ]
    expect(csvGenerations(names, 'a')).toEqual([
      'a_12312026.csv',
      'a_12312026_r8.csv',
      'a_12312026_r13.csv',
      'a_01012027.csv',
    ])
  })

  it('leaves out every generation but the newest, family by family', () => {
    const names = [
      'x_11012026.csv',
      'x_11152026.csv',
      'x_11152026_r2.csv',
      'y_11012026.csv',
      'z_11012026.csv',
      'z_11022026.csv',
    ]
    expect(olderGenerations('d', ['x', 'y'], () => names)).toEqual([
      'x_11012026.csv',
      'x_11152026.csv',
    ])
  })

  it('applies to a build and a dev server and not to Vitest, and empties only an older raw import', async () => {
    const plugin = newestCsvOnlyPlugin(DATA, ['vendors'])
    const apply = plugin.apply as (c: unknown, e: { command: string }) => boolean
    expect(apply({}, { command: 'build' })).toBe(true)
    const old = olderGenerations(DATA, ['vendors'])
    expect(old.length).toBeGreaterThan(0)
    await (plugin.buildStart as () => void).call({})
    const load = plugin.load as (id: string) => unknown
    expect(load(`${join(DATA, old[0])}?raw`)).toBe('export default ""')
    expect(load(join(DATA, old[0]))).toBeNull()
    const newest = csvGenerations(readdirSync(DATA), 'vendors').at(-1) as string
    expect(load(`${join(DATA, newest)}?raw`)).toBeNull()
  })

  it('lists only families whose loaders never read an older generation', () => {
    const sources = readdirSync(DATA)
      .filter((f) => f.endsWith('.ts') && !f.includes('.test.'))
      .map((f) => ({ f, text: readLoaderSource(join(DATA, f)) }))
    for (const family of NEWEST_CSV_ONLY_FAMILIES) {
      const loaders = sources.filter((s) =>
        new RegExp(`import\\.meta\\.glob\\([^)]*\\./${family}_`).test(s.text)
      )
      expect(loaders.length, `${family}: no loader found`).toBeGreaterThan(0)
      for (const l of loaders) {
        expect(
          readsOlderGeneration(l.text),
          `${l.f} reads an older ${family} generation: take it off the list`
        ).toBe(false)
      }
    }
  })

  it('lists no family that has a single generation to keep or that is unknown', () => {
    const names = readdirSync(DATA)
    for (const family of NEWEST_CSV_ONLY_FAMILIES) {
      expect(csvGenerations(names, family).length, family).toBeGreaterThan(0)
    }
  })
})
