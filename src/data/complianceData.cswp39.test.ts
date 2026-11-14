// SPDX-License-Identifier: AGPL-3.0-only
// CSWP.39 tags (owner decision D6): blank = not classified yet; "none" = classified, no stage applies.
import { describe, it, expect } from 'vitest'
import { cswp39Note, mapComplianceRow, parseCswp39Tags } from './complianceData'

describe('parseCswp39Tags', () => {
  it('a blank cell is not classified yet', () => {
    expect(parseCswp39Tags(undefined)).toBeUndefined()
    expect(parseCswp39Tags('')).toBeUndefined()
    expect(parseCswp39Tags('   ')).toBeUndefined()
  })

  it('the explicit value none is classified with no tags, in any case or spacing', () => {
    expect(parseCswp39Tags('none')).toEqual([])
    expect(parseCswp39Tags(' None ')).toEqual([])
    expect(parseCswp39Tags('NONE')).toEqual([])
  })

  it('splits tags on semicolons and drops empty pieces', () => {
    expect(parseCswp39Tags('cswp39:governance;cswp39:inventory')).toEqual([
      'cswp39:governance',
      'cswp39:inventory',
    ])
    expect(parseCswp39Tags('cswp39:governance;')).toEqual(['cswp39:governance'])
  })
})

describe('cswp39Note', () => {
  it('says not classified yet for a blank row, and that no stage applies for none', () => {
    expect(cswp39Note(undefined)).toBe('Not classified yet')
    expect(cswp39Note([])).toBe('No CSWP.39 stage applies')
  })

  it('shows no note when there are tags to show as chips', () => {
    expect(cswp39Note(['cswp39:governance'])).toBeNull()
  })
})

describe('a framework row keeps the three states', () => {
  const base = { id: 'TEST-ROW', label: 'Test row' }
  it('blank, none and tagged rows map to undefined, empty and the tags', () => {
    expect(mapComplianceRow({ ...base, cswp39_tags: '' } as never)?.cswp39Tags).toBeUndefined()
    expect(mapComplianceRow({ ...base, cswp39_tags: 'none' } as never)?.cswp39Tags).toEqual([])
    expect(
      mapComplianceRow({ ...base, cswp39_tags: 'cswp39:assurance' } as never)?.cswp39Tags
    ).toEqual(['cswp39:assurance'])
  })
})
