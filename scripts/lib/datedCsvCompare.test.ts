// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { datedCsvCompare } from './latestDatedCsv'

/**
 * Tier 2.8 (2026-08-12). The bare `.sort()` + `.at(-1)` "latest file" idiom
 * appeared at 32 call sites across scripts/validators and scripts/ci. It is
 * lexical order over MMDDYYYY names — correct only by luck while every live
 * generation is from the same year: `x_01012027.csv` sorts BELOW
 * `x_08022026.csv`, so the first file of 2027 silently loses to August 2026
 * (validators keep validating the old file; backfills stamp the old file),
 * and `_r10` already loses to `_r9` today. datedCsvCompare fixes the order;
 * the tripwire below forbids reintroducing the bare idiom.
 */
describe('datedCsvCompare', () => {
  it('crosses the year boundary correctly', () => {
    const files = ['x_08022026.csv', 'x_01012027.csv']
    files.sort(datedCsvCompare)
    expect(files.at(-1)).toBe('x_01012027.csv')
  })

  it('orders double-digit revisions numerically', () => {
    const files = ['m_05092026_r9.csv', 'm_05092026_r14.csv', 'm_05092026.csv']
    files.sort(datedCsvCompare)
    expect(files.at(-1)).toBe('m_05092026_r14.csv')
  })

  it('never prefers an undated stray over a dated file', () => {
    const files = ['x_notes.csv', 'x_01012026.csv']
    files.sort(datedCsvCompare)
    expect(files.at(-1)).toBe('x_01012026.csv')
  })

  it('compares by basename even for full paths', () => {
    const files = ['src/data/x_08022026.csv', 'src/data/x_01012027.csv']
    files.sort(datedCsvCompare)
    expect(files.at(-1)).toBe('src/data/x_01012027.csv')
  })
})

describe('no bare lexical latest-file sort remains (tripwire)', () => {
  const ROOTS = ['scripts/validators', 'scripts/ci', 'scripts/lib']
  const REPO = path.resolve(__dirname, '../..')

  const offenders: string[] = []
  for (const root of ROOTS) {
    for (const f of fs.readdirSync(path.join(REPO, root))) {
      if (!f.endsWith('.ts') || f.endsWith('.test.ts')) continue
      const full = path.join(REPO, root, f)
      const lines = fs.readFileSync(full, 'utf8').split('\n')
      lines.forEach((line, i) => {
        if (!/\.sort\(\)/.test(line)) return
        // bare .sort() within 2 lines of a dated-CSV glob/name = the idiom
        const ctx = lines.slice(Math.max(0, i - 2), i + 3).join('\n')
        if (/_\*\.csv|\d{8}.*\.csv|\.csv'/.test(ctx)) {
          offenders.push(`${root}/${f}:${i + 1}`)
        }
      })
    }
  }

  it('flags nothing after the sweep', () => {
    expect(offenders).toEqual([])
  })
})
