// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  computeResearchFieldWatch,
  loadFieldWatchRows,
  type FieldWatchRow,
} from './researchFieldWatch'
import { parseDateMs } from './libraryData'

const T0 = parseDateMs('2026-06-01') as number // "last visited"
const BEFORE = parseDateMs('2026-05-01') as number
const AFTER = parseDateMs('2026-07-01') as number

/** Fabricated (not real-CSV) fixtures — realistic shapes, not synthetic edge-case soup. */
function row(overrides: Partial<FieldWatchRow>): FieldWatchRow {
  return {
    referenceId: 'FIXTURE-0',
    algorithmFamily: '',
    lastUpdateDateMs: null,
    isDeprecated: false,
    deprecatedAtMs: null,
    ...overrides,
  }
}

describe('computeResearchFieldWatch', () => {
  it('first visit (lastVisitedAt = null): everything counts as zero, nothing retracted', () => {
    const rows: FieldWatchRow[] = [
      row({ referenceId: 'A', algorithmFamily: 'Lattice-based', lastUpdateDateMs: AFTER }),
      row({
        referenceId: 'B',
        algorithmFamily: 'Lattice-based',
        isDeprecated: true,
        deprecatedAtMs: AFTER,
      }),
    ]
    const summary = computeResearchFieldWatch(['lattice-based'], null, rows)
    expect(summary.fields).toEqual([
      { fieldId: 'lattice-based', label: 'Lattice-based', revisionCount: 0, deprecatedCount: 0 },
    ])
    expect(summary.totalDeprecatedSinceVisit).toBe(0)
    expect(summary.nothingRetracted).toBe(true)
  })

  it('counts a row revised after lastVisitedAt toward its mapped field', () => {
    const rows: FieldWatchRow[] = [
      row({ referenceId: 'A', algorithmFamily: 'Lattice-based', lastUpdateDateMs: AFTER }),
      row({ referenceId: 'B', algorithmFamily: 'Lattice-based', lastUpdateDateMs: BEFORE }), // stale, shouldn't count
    ]
    const summary = computeResearchFieldWatch(['lattice-based'], T0, rows)
    expect(summary.fields[0].revisionCount).toBe(1)
  })

  it('counts a row deprecated after lastVisitedAt toward deprecatedCount and flips nothingRetracted', () => {
    const rows: FieldWatchRow[] = [
      row({
        referenceId: 'A',
        algorithmFamily: 'Hash-based (stateful)',
        isDeprecated: true,
        deprecatedAtMs: AFTER,
      }),
    ]
    const summary = computeResearchFieldWatch(['hash-based'], T0, rows)
    expect(summary.fields[0].deprecatedCount).toBe(1)
    expect(summary.totalDeprecatedSinceVisit).toBe(1)
    expect(summary.nothingRetracted).toBe(false)
  })

  it('a deprecation from BEFORE lastVisitedAt does not count (old news, already seen)', () => {
    const rows: FieldWatchRow[] = [
      row({
        referenceId: 'A',
        algorithmFamily: 'Code-based',
        isDeprecated: true,
        deprecatedAtMs: BEFORE,
      }),
    ]
    const summary = computeResearchFieldWatch(['code-based'], T0, rows)
    expect(summary.fields[0].deprecatedCount).toBe(0)
    expect(summary.nothingRetracted).toBe(true)
  })

  it('a row deprecated but with no deprecated_at (unparseable/missing) never counts, even if isDeprecated is true', () => {
    const rows: FieldWatchRow[] = [
      row({
        referenceId: 'A',
        algorithmFamily: 'Code-based',
        isDeprecated: true,
        deprecatedAtMs: null,
      }),
    ]
    const summary = computeResearchFieldWatch(['code-based'], T0, rows)
    expect(summary.fields[0].deprecatedCount).toBe(0)
  })

  it('unfollowed fields are excluded from the output even when matching rows exist', () => {
    const rows: FieldWatchRow[] = [
      row({ referenceId: 'A', algorithmFamily: 'QKD', lastUpdateDateMs: AFTER }),
    ]
    const summary = computeResearchFieldWatch(['lattice-based'], T0, rows) // NOT following qkd-quantum
    expect(summary.fields).toEqual([
      { fieldId: 'lattice-based', label: 'Lattice-based', revisionCount: 0, deprecatedCount: 0 },
    ])
  })

  it('a multi-family row (e.g. "ML-KEM; ML-DSA; SLH-DSA") counts toward EVERY followed field it maps to', () => {
    const rows: FieldWatchRow[] = [
      row({
        referenceId: 'A',
        algorithmFamily: 'ML-KEM; ML-DSA; SLH-DSA',
        lastUpdateDateMs: AFTER,
      }),
    ]
    const summary = computeResearchFieldWatch(['lattice-based', 'hash-based'], T0, rows)
    const byId = Object.fromEntries(summary.fields.map((f) => [f.fieldId, f.revisionCount]))
    expect(byId['lattice-based']).toBe(1)
    expect(byId['hash-based']).toBe(1)
  })

  it('a stale/unknown followed field id is silently dropped, not surfaced as a 0-count row', () => {
    const summary = computeResearchFieldWatch(['not-a-real-bucket-id'], T0, [])
    expect(summary.fields).toEqual([])
  })

  it('preserves the caller-supplied followed-field order in the output', () => {
    const summary = computeResearchFieldWatch(['qkd-quantum', 'lattice-based'], T0, [])
    expect(summary.fields.map((f) => f.fieldId)).toEqual(['qkd-quantum', 'lattice-based'])
  })

  it('rows with a blank AlgorithmFamily only count toward the Other/Uncategorized bucket, never toward a real family the researcher follows', () => {
    const rows: FieldWatchRow[] = [
      row({ referenceId: 'A', algorithmFamily: '', lastUpdateDateMs: AFTER }),
    ]
    const summary = computeResearchFieldWatch(['lattice-based'], T0, rows)
    expect(summary.fields[0].revisionCount).toBe(0)
    const otherSummary = computeResearchFieldWatch(['other-uncategorized'], T0, rows)
    expect(otherSummary.fields[0].revisionCount).toBe(1)
  })
})

describe('loadFieldWatchRows — real CSV sanity (not the fixture-driven tests above)', () => {
  it('loads a substantial number of real rows, both active and deprecated', () => {
    const rows = loadFieldWatchRows(true)
    expect(rows.length).toBeGreaterThan(900) // library CSV had 1011 rows as of 2026-07-31
    expect(rows.some((r) => r.isDeprecated)).toBe(true)
    expect(rows.some((r) => !r.isDeprecated)).toBe(true)
  })

  it('every loaded row has a non-empty referenceId', () => {
    const rows = loadFieldWatchRows()
    expect(rows.every((r) => r.referenceId.trim().length > 0)).toBe(true)
  })

  it('at least one deprecated row has a parsed deprecatedAtMs (proves the raw column round-trips)', () => {
    const rows = loadFieldWatchRows()
    expect(rows.some((r) => r.isDeprecated && r.deprecatedAtMs !== null)).toBe(true)
  })

  it('is memoized across calls (same array reference) unless forceReload is passed', () => {
    const a = loadFieldWatchRows()
    const b = loadFieldWatchRows()
    expect(a).toBe(b)
    const c = loadFieldWatchRows(true)
    expect(c).not.toBe(a)
    expect(c).toEqual(a) // same content, fresh array
  })
})
