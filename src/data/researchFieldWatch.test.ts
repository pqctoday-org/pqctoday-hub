// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  computeResearchFieldWatch,
  loadFieldWatchCorpus,
  FIELD_WATCH_WINDOW_DAYS,
  type FieldWatchRow,
} from './researchFieldWatch'
import { parseDateMs } from './libraryData'

const T0 = parseDateMs('2026-06-01') as number // start of the reporting window
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
  it('no window (windowStartMs = null): counting is disabled rather than reporting zeros as a finding', () => {
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
    expect(summary.totalDeprecatedInWindow).toBe(0)
    expect(summary.nothingRetracted).toBe(true)
  })

  it('counts a row revised inside the window toward its mapped field', () => {
    const rows: FieldWatchRow[] = [
      row({ referenceId: 'A', algorithmFamily: 'Lattice-based', lastUpdateDateMs: AFTER }),
      row({ referenceId: 'B', algorithmFamily: 'Lattice-based', lastUpdateDateMs: BEFORE }), // stale, shouldn't count
    ]
    const summary = computeResearchFieldWatch(['lattice-based'], T0, rows)
    expect(summary.fields[0].revisionCount).toBe(1)
  })

  it('counts a row deprecated inside the window toward deprecatedCount and flips nothingRetracted', () => {
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
    expect(summary.totalDeprecatedInWindow).toBe(1)
    expect(summary.nothingRetracted).toBe(false)
  })

  it('a deprecation from before the window does not count', () => {
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

describe('loadFieldWatchCorpus — real CSV sanity (not the fixture-driven tests above)', () => {
  it('loads a substantial number of real rows, both active and deprecated', () => {
    const { rows } = loadFieldWatchCorpus(true)
    expect(rows.length).toBeGreaterThan(900) // library CSV had 1011 rows as of 2026-07-31
    expect(rows.some((r) => r.isDeprecated)).toBe(true)
    expect(rows.some((r) => !r.isDeprecated)).toBe(true)
  })

  it('every loaded row has a non-empty referenceId', () => {
    const { rows } = loadFieldWatchCorpus()
    expect(rows.every((r) => r.referenceId.trim().length > 0)).toBe(true)
  })

  it('at least one deprecated row has a parsed deprecatedAtMs (proves the raw column round-trips)', () => {
    const { rows } = loadFieldWatchCorpus()
    expect(rows.some((r) => r.isDeprecated && r.deprecatedAtMs !== null)).toBe(true)
  })

  it('derives a release date and a window that starts exactly FIELD_WATCH_WINDOW_DAYS earlier', () => {
    const { releaseDateMs, windowStartMs } = loadFieldWatchCorpus()
    expect(releaseDateMs).not.toBeNull()
    expect(windowStartMs).not.toBeNull()
    expect((releaseDateMs as number) - (windowStartMs as number)).toBe(
      FIELD_WATCH_WINDOW_DAYS * 86_400_000
    )
  })

  /**
   * THE REGRESSION THIS CARD EXISTS TO PREVENT. Anchored to the corpus release
   * the counts must be real; anchored to a visitor's browsing time they were
   * structurally zero, because the newest last_update_date in the whole catalog
   * (2026-06-29) predates any live visit. If this ever returns 0 again, the
   * card is back to telling every researcher nothing changed, forever.
   */
  it('reports a non-zero count against the real corpus — the always-zero defect must not return', () => {
    const corpus = loadFieldWatchCorpus()
    const allFields = ['lattice-based', 'hash-based', 'code-based', 'other-uncategorized']
    const summary = computeResearchFieldWatch(allFields, corpus.windowStartMs, corpus.rows)
    const updated = summary.fields.reduce((n, f) => n + f.revisionCount, 0)
    expect(updated + summary.totalDeprecatedInWindow).toBeGreaterThan(0)
  })

  it('a browsing-time boundary would report zero — proving the reframe was the fix, not a tweak', () => {
    const corpus = loadFieldWatchCorpus()
    const nowish = parseDateMs('2026-08-02') as number
    const summary = computeResearchFieldWatch(['hash-based'], nowish, corpus.rows)
    expect(summary.fields[0].revisionCount).toBe(0)
  })

  it('is memoized across calls (same object reference) unless forceReload is passed', () => {
    const a = loadFieldWatchCorpus()
    const b = loadFieldWatchCorpus()
    expect(a).toBe(b)
    const c = loadFieldWatchCorpus(true)
    expect(c).not.toBe(a)
    expect(c.rows).toEqual(a.rows) // same content, fresh object
  })
})
