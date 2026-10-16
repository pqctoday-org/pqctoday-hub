// SPDX-License-Identifier: AGPL-3.0-only
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  latestDatedCsv,
  ROLE_BOARD_CONTENT_RE,
  ROLE_BOARD_CTAS_RE,
  ROLE_BOARD_VARIANTS_RE,
} from './latestDatedCsv'

function dir(names: string[]): string {
  const d = mkdtempSync(join(tmpdir(), 'latest-dated-csv-'))
  for (const n of names) writeFileSync(join(d, n), 'id\n')
  return d
}

describe('latestDatedCsv on the role-board tables', () => {
  for (const [stem, re] of [
    ['role_board_content', ROLE_BOARD_CONTENT_RE],
    ['role_board_ctas', ROLE_BOARD_CTAS_RE],
    ['role_board_variants', ROLE_BOARD_VARIANTS_RE],
  ] as const) {
    it(`${stem}: a same-day revision is found and wins over the plain file`, () => {
      const d = dir([`${stem}_10042026.csv`, `${stem}_10162026.csv`, `${stem}_10162026_r2.csv`])
      expect(basename(latestDatedCsv(d, re)!)).toBe(`${stem}_10162026_r2.csv`)
    })

    it(`${stem}: revisions alone (no plain file that day) are found`, () => {
      const d = dir([`${stem}_10042026.csv`, `${stem}_10162026_r1.csv`, `${stem}_10162026_r2.csv`])
      expect(basename(latestDatedCsv(d, re)!)).toBe(`${stem}_10162026_r2.csv`)
    })

    it(`${stem}: a later date beats a higher revision, and 2027 beats 2026`, () => {
      const d = dir([`${stem}_12312026_r9.csv`, `${stem}_01012027.csv`])
      expect(basename(latestDatedCsv(d, re)!)).toBe(`${stem}_01012027.csv`)
    })
  }

  it('other tables and non-revision suffixes do not match', () => {
    const d = dir(['role_board_ctas_10162026.csv', 'role_board_content_10162026_edit.csv'])
    expect(latestDatedCsv(d, ROLE_BOARD_CONTENT_RE)).toBeNull()
  })
})
