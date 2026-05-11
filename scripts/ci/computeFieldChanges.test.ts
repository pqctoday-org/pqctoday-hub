// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  computeFieldChanges,
  DOMAIN_TO_PK_COLUMN,
  DOMAIN_TO_CSV_PREFIX,
} from './computeFieldChanges'

const PK = 'id'

describe('computeFieldChanges', () => {
  it('returns empty when before === after', () => {
    const rows = [{ id: 'A', name: 'Alice' }]
    expect(computeFieldChanges(rows, rows, PK)).toEqual([])
  })

  it('emits a single FieldChange per modified cell', () => {
    const before = [{ id: 'A', name: 'Alice', email: 'a@x' }]
    const after = [{ id: 'A', name: 'Alice', email: 'a@y' }]
    const changes = computeFieldChanges(before, after, PK)
    expect(changes).toEqual([{ record_id: 'A', field: 'email', before: 'a@x', after: 'a@y' }])
  })

  it('treats whitespace-only diffs as no-change', () => {
    const before = [{ id: 'A', name: ' Alice ' }]
    const after = [{ id: 'A', name: 'Alice' }]
    expect(computeFieldChanges(before, after, PK)).toEqual([])
  })

  it('emits null in `before` for added rows', () => {
    const before: Array<Record<string, string>> = []
    const after = [{ id: 'A', name: 'Alice', email: 'a@x' }]
    const changes = computeFieldChanges(before, after, PK)
    expect(changes).toHaveLength(2)
    expect(changes.every((c) => c.before === null && c.record_id === 'A')).toBe(true)
    expect(changes.map((c) => c.field).sort()).toEqual(['email', 'name'])
  })

  it('emits null in `after` for removed rows', () => {
    const before = [{ id: 'A', name: 'Alice', email: 'a@x' }]
    const after: Array<Record<string, string>> = []
    const changes = computeFieldChanges(before, after, PK)
    expect(changes).toHaveLength(2)
    expect(changes.every((c) => c.after === null && c.record_id === 'A')).toBe(true)
  })

  it('skips empty cells on added rows (no false-positive "added blank")', () => {
    const before: Array<Record<string, string>> = []
    const after = [{ id: 'A', name: 'Alice', email: '   ', notes: '' }]
    const changes = computeFieldChanges(before, after, PK)
    // Only `name` gets emitted; email/notes are blank
    expect(changes.map((c) => c.field)).toEqual(['name'])
  })

  it('omits the primary-key column from field_changes', () => {
    const before = [{ id: 'A', name: 'Alice' }]
    const after = [{ id: 'A', name: 'Bob' }]
    const changes = computeFieldChanges(before, after, PK)
    expect(changes.find((c) => c.field === 'id')).toBeUndefined()
    expect(changes).toEqual([{ record_id: 'A', field: 'name', before: 'Alice', after: 'Bob' }])
  })

  it('handles cell value that goes from non-empty to empty (empty becomes null)', () => {
    const before = [{ id: 'A', notes: 'something' }]
    const after = [{ id: 'A', notes: '' }]
    const changes = computeFieldChanges(before, after, PK)
    expect(changes).toEqual([{ record_id: 'A', field: 'notes', before: 'something', after: null }])
  })

  it('handles cell value that goes from empty to non-empty', () => {
    const before = [{ id: 'A', notes: '' }]
    const after = [{ id: 'A', notes: 'something' }]
    const changes = computeFieldChanges(before, after, PK)
    expect(changes).toEqual([{ record_id: 'A', field: 'notes', before: null, after: 'something' }])
  })

  it('honours maxChanges cap', () => {
    const before = Array.from({ length: 50 }, (_, i) => ({
      id: `r${i}`,
      a: 'old',
    }))
    const after = before.map((r) => ({ ...r, a: 'new' }))
    const changes = computeFieldChanges(before, after, PK, { maxChanges: 5 })
    expect(changes).toHaveLength(5)
  })

  it('honours skipFields option', () => {
    const before = [{ id: 'A', name: 'Alice', last_modified: '2026-01-01' }]
    const after = [{ id: 'A', name: 'Bob', last_modified: '2026-05-09' }]
    const changes = computeFieldChanges(before, after, PK, {
      skipFields: new Set(['last_modified']),
    })
    expect(changes).toEqual([{ record_id: 'A', field: 'name', before: 'Alice', after: 'Bob' }])
  })

  it('preserves semicolon-list strings raw (UI does the token diff)', () => {
    const before = [{ id: 'A', library_refs: 'FIPS-203;FIPS-204' }]
    const after = [{ id: 'A', library_refs: 'FIPS-203;FIPS-205;FIPS-204' }]
    const changes = computeFieldChanges(before, after, PK)
    expect(changes).toEqual([
      {
        record_id: 'A',
        field: 'library_refs',
        before: 'FIPS-203;FIPS-204',
        after: 'FIPS-203;FIPS-205;FIPS-204',
      },
    ])
  })

  it('skips rows whose pk-column is empty', () => {
    const before = [{ id: '', name: 'Anon' }]
    const after = [{ id: '', name: 'Different' }]
    expect(computeFieldChanges(before, after, PK)).toEqual([])
  })
})

describe('DOMAIN_TO_PK_COLUMN + DOMAIN_TO_CSV_PREFIX', () => {
  it('covers the same set of domains', () => {
    expect(Object.keys(DOMAIN_TO_PK_COLUMN).sort()).toEqual(
      Object.keys(DOMAIN_TO_CSV_PREFIX).sort()
    )
  })

  it('uses well-known PK column names', () => {
    expect(DOMAIN_TO_PK_COLUMN.library).toBe('referenceId')
    expect(DOMAIN_TO_PK_COLUMN.compliance).toBe('id')
    expect(DOMAIN_TO_PK_COLUMN.migrate).toBe('product_id')
  })
})
