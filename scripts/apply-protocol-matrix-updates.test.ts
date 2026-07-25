// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  patchMatrix,
  narrowToApprovedItems,
  type ApprovedItem,
} from './apply-protocol-matrix-updates'

/**
 * Downgrade guard (finding F8, deferred from the 2026-07-23 E2E validation,
 * fixed 2026-07-25).
 *
 * The applier wrote the datatracker's reported stage unconditionally. A feed
 * answer LOWER than the encoded stage — a superseding draft, a query landing
 * on the wrong document, a transient API result — would have rewritten a
 * published RFC as un-published. That is the worst single claim this file can
 * make, so the guard gets tests before anything else here does.
 */

const matrix = `
export const PQC_PROTOCOL_MATRIX = [
  {
    id: 'tls-1-3',
    pureKem: {
      value: 'rfc',
      stage: 'rfc-published',
      stageNote: 'rfc published (datatracker 2026-01-01)',
    },
    hybridKem: {
      value: 'draft',
      stage: 'wg-document',
      stageNote: 'wg document (datatracker 2026-01-01)',
    },
  },
]
`

const delta = (dim: string, encoded: string, current: string) =>
  ({
    row_id: 'tls-1-3',
    dimension: dim,
    encoded_stage: encoded,
    current_stage: current,
    last_updated: '2026-07-25',
  }) as never

describe('patchMatrix downgrade guard', () => {
  it('blocks a strict downgrade and leaves the matrix untouched', () => {
    const r = patchMatrix(matrix, [delta('pureKem', 'rfc-published', 'wg-document')])
    expect(r.applied).toBe(0)
    expect(r.downgrades).toHaveLength(1)
    expect(r.downgrades[0]).toContain('rfc-published')
    expect(r.next).toBe(matrix)
    // The specific disaster: an RFC must not read as un-published.
    expect(r.next).toContain("stage: 'rfc-published'")
  })

  it('applies a genuine advance', () => {
    const r = patchMatrix(matrix, [delta('hybridKem', 'wg-document', 'rfc-published')])
    expect(r.applied).toBe(1)
    expect(r.downgrades).toHaveLength(0)
    expect(r.next).toContain("stage: 'rfc-published'")
  })

  it('allows a same-rank move, because the level map is not injective', () => {
    // wg-document and wg-last-call are both level 4. Blocking equal ranks
    // would freeze every lateral IETF transition.
    const r = patchMatrix(matrix, [delta('hybridKem', 'wg-document', 'wg-last-call')])
    expect(r.applied).toBe(1)
    expect(r.downgrades).toHaveLength(0)
  })

  it('reports every blocked downgrade rather than the first', () => {
    const r = patchMatrix(matrix, [
      delta('pureKem', 'rfc-published', 'individual-draft'),
      delta('hybridKem', 'wg-document', 'identified'),
    ])
    expect(r.downgrades).toHaveLength(2)
    expect(r.applied).toBe(0)
  })

  it('applies normally when no stage is encoded yet', () => {
    // A row with nothing encoded has nothing to regress from — the guard
    // must not block the first write.
    const r = patchMatrix(matrix, [delta('hybridKem', '', 'wg-last-call')])
    expect(r.applied).toBe(1)
    expect(r.downgrades).toHaveLength(0)
  })

  it('reports which keys were actually patched', () => {
    const r = patchMatrix(matrix, [delta('hybridKem', 'wg-document', 'rfc-published')])
    expect(r.appliedKeys).toEqual(['tls-1-3::hybridKem'])
  })
})

/**
 * narrowToApprovedItems (WP-1.11, 2026-07-25) — the fix for the whole-file/
 * per-item mismatch: apply_protocol_matrix_stage_drift used to invoke this
 * script with no per-item selection at all, so ANY approved item caused
 * EVERY delta in the report to be patched, and a rejected item's delta got
 * written anyway. This narrows the report down to exactly the reviewer-
 * approved (rowId, dimension) pairs, with a stale-draft guard for each.
 */
describe('narrowToApprovedItems', () => {
  const reportDeltas = [
    delta('pureKem', 'wg-document', 'rfc-published'),
    delta('hybridKem', 'wg-document', 'wg-last-call'),
  ]

  const approve = (over: Partial<ApprovedItem>): ApprovedItem => ({
    rowId: 'tls-1-3',
    dimension: 'pureKem',
    approvedStage: 'rfc-published',
    expectedEncoded: 'wg-document',
    ...over,
  })

  it('keeps only the approved pair, dropping every other delta in the report', () => {
    const { narrowed, stale } = narrowToApprovedItems(reportDeltas, [approve({})])
    expect(narrowed).toHaveLength(1)
    expect(narrowed[0].dimension).toBe('pureKem')
    expect(stale).toHaveLength(0)
  })

  it('rejecting an item means it is simply never in the approved list — the other pair is untouched', () => {
    // The old bug: approving pureKem alone still wrote hybridKem too,
    // because the script re-read and patched the whole report. Passing
    // only the pureKem approval here must narrow to exactly that one.
    const { narrowed } = narrowToApprovedItems(reportDeltas, [approve({})])
    expect(narrowed.map((d) => d.dimension)).toEqual(['pureKem'])
    expect(narrowed.some((d) => d.dimension === 'hybridKem')).toBe(false)
  })

  it('flags a pair no longer in the report as stale, not silently dropped', () => {
    const { narrowed, stale } = narrowToApprovedItems(reportDeltas, [
      approve({ dimension: 'pureSig' }),
    ])
    expect(narrowed).toHaveLength(0)
    expect(stale[0].key).toContain('pureSig')
    expect(stale[0].reason).toContain('no longer in the report')
  })

  it('flags a stale-draft mismatch when the encoded stage moved since approval', () => {
    const { narrowed, stale } = narrowToApprovedItems(reportDeltas, [
      approve({ expectedEncoded: 'individual-draft' }),
    ])
    expect(narrowed).toHaveLength(0)
    expect(stale[0].reason).toContain('encoded stage is now wg-document')
    expect(stale[0].reason).toContain('individual-draft')
  })

  it('flags a stale-draft mismatch when the datatracker-reported stage moved since approval', () => {
    const { narrowed, stale } = narrowToApprovedItems(reportDeltas, [
      approve({ approvedStage: 'ietf-last-call' }),
    ])
    expect(narrowed).toHaveLength(0)
    expect(stale[0].reason).toContain('datatracker now reports rfc-published')
    expect(stale[0].reason).toContain('ietf-last-call')
  })

  it('handles multiple approved items independently', () => {
    const { narrowed, stale } = narrowToApprovedItems(reportDeltas, [
      approve({}),
      approve({
        dimension: 'hybridKem',
        approvedStage: 'wg-last-call',
        expectedEncoded: 'wg-document',
      }),
    ])
    expect(narrowed).toHaveLength(2)
    expect(stale).toHaveLength(0)
  })
})
