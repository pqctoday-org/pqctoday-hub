// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import Papa from 'papaparse'
import { latestDatedCsv, ROLE_BOARD_CTAS_RE } from './latestDatedCsv'

// Each row of the board link registry carries its own stable id. href + resolves_to
// is not unique in this file (/learn/pqc-testing-validation has two rows), so the id
// is what names a row when its sentence is edited.
describe('role_board_ctas — every link row has its own id', () => {
  const path = latestDatedCsv(join(process.cwd(), 'src/data'), ROLE_BOARD_CTAS_RE)
  const text = path ? readFileSync(path, 'utf8') : ''
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })
  const rows = parsed.data

  it('has a cta_id column', () => {
    expect(path).not.toBeNull()
    expect(parsed.meta.fields).toContain('cta_id')
  })

  it('gives every row an id of the form CTA-001', () => {
    const bad = rows.filter((r) => !/^CTA-\d{3,}$/.test((r.cta_id ?? '').trim()))
    expect(bad.map((r) => r.href)).toEqual([])
  })

  it('never gives two rows the same id', () => {
    const ids = rows.map((r) => r.cta_id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('tells the two /learn/pqc-testing-validation rows apart', () => {
    const ids = rows.filter((r) => r.href === '/learn/pqc-testing-validation').map((r) => r.cta_id)
    expect(ids.length).toBeGreaterThanOrEqual(2)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
