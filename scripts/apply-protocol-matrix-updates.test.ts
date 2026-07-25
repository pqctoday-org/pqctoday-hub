// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { patchMatrix } from './apply-protocol-matrix-updates'

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
})
