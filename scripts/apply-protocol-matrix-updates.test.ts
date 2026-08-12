// SPDX-License-Identifier: GPL-3.0-only
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  patchMatrix,
  narrowToApprovedItems,
  isCuratedNote,
  dimensionSpan,
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
/**
 * Ambiguous-ref guard (2026-08-11).
 *
 * A cell may encode several refs, and they do not all DEFINE its mechanism.
 * kerberos.pureKem cites both the unadopted individual draft that adds the
 * mechanism AND RFC 9935, whose ML-KEM X.509 OIDs that draft borrows. The
 * datatracker answers for both; the applier took whichever the report listed
 * first, and on 2026-08-09 that wrote `rfc-published` onto Kerberos from an
 * OID registry. Three of nineteen cells in the live report are in this state,
 * each currently decided by list order.
 */
const refDelta = (dim: string, refId: string, encoded: string, current: string) =>
  ({
    row_id: 'tls-1-3',
    dimension: dim,
    ref_id: refId,
    encoded_stage: encoded,
    current_stage: current,
    last_updated: '2026-08-11',
  }) as never

describe('patchMatrix ambiguous-ref guard', () => {
  it('blocks a cell whose refs report different stages, and writes nothing', () => {
    const r = patchMatrix(matrix, [
      refDelta('hybridKem', 'draft-defines-the-mechanism', 'wg-document', 'iesg-submitted'),
      refDelta('hybridKem', 'RFC-9935-borrowed-oids', 'wg-document', 'rfc-published'),
    ])
    expect(r.applied).toBe(0)
    expect(r.next).toBe(matrix)
    expect(r.ambiguous).toHaveLength(1)
    // The report must name every ref and its stage — a reviewer's whole job
    // here is deciding which one defines the mechanism.
    expect(r.ambiguous[0]).toContain('draft-defines-the-mechanism -> iesg-submitted')
    expect(r.ambiguous[0]).toContain('RFC-9935-borrowed-oids -> rfc-published')
  })

  it('is not fooled by ref ORDER — the same disagreement blocks either way', () => {
    const forward = patchMatrix(matrix, [
      refDelta('hybridKem', 'a', 'wg-document', 'rfc-published'),
      refDelta('hybridKem', 'b', 'wg-document', 'experimental'),
    ])
    const reversed = patchMatrix(matrix, [
      refDelta('hybridKem', 'b', 'wg-document', 'experimental'),
      refDelta('hybridKem', 'a', 'wg-document', 'rfc-published'),
    ])
    expect(forward.applied).toBe(0)
    expect(reversed.applied).toBe(0)
    expect(forward.next).toBe(matrix)
    expect(reversed.next).toBe(matrix)
  })

  it('applies when several refs AGREE — agreement is not ambiguity', () => {
    const r = patchMatrix(matrix, [
      refDelta('hybridKem', 'a', 'wg-document', 'iesg-submitted'),
      refDelta('hybridKem', 'b', 'wg-document', 'iesg-submitted'),
    ])
    expect(r.applied).toBe(1)
    expect(r.ambiguous).toHaveLength(0)
    expect(r.next).toContain("stage: 'iesg-submitted'")
  })

  it('blocks BEFORE the downgrade guard — a contradiction is not a downgrade', () => {
    // One ref would be a downgrade, the other an advance. Neither verdict
    // means anything while they disagree, so it must report as ambiguous.
    const r = patchMatrix(matrix, [
      refDelta('pureKem', 'a', 'rfc-published', 'wg-document'),
      refDelta('pureKem', 'b', 'rfc-published', 'rfc-published'),
    ])
    expect(r.applied).toBe(0)
    expect(r.ambiguous).toHaveLength(1)
    expect(r.downgrades).toHaveLength(0)
  })
})

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

/**
 * Curated-note guard (2026-08-09, global maintenance audit).
 *
 * `/stageNote:\s*'[^']*'/` matches across newlines, so a multi-line
 * hand-written note was replaced wholesale by a generated one-liner. The run
 * that exposed this overwrote ike-ipsec:hybridKem — a note whose text is a
 * record of this same mistake being made and reverted on 2026-07-27 — and
 * re-introduced the wrong value it warned about. The script cannot judge
 * whether a ref evidences a cell; it can refuse to erase the human who did.
 */
const curatedMatrix = `
export const PQC_PROTOCOL_MATRIX = [
  {
    id: 'ike-ipsec',
    hybridKem: {
      value: 'draft',
      stage: 'rfc-editor-queue',
      stageNote:
        'REVERTED 2026-07-27: a hand-verified apply incorrectly set this to rfc-published on the strength of RFC 9370 alone — RFC 9370 is the shared multi-KE enabler, not the hybrid-KEM mechanism.',
    },
    pureKem: {
      value: 'draft',
      stage: 'wg-document',
      stageNote: 'wg document (datatracker 2026-01-01)',
    },
  },
]
`

const ikeDelta = (dim: string, encoded: string, current: string) =>
  ({
    row_id: 'ike-ipsec',
    dimension: dim,
    encoded_stage: encoded,
    current_stage: current,
    last_updated: '2026-05-20',
  }) as never

describe('isCuratedNote', () => {
  it("treats this generator's own output as not curated", () => {
    expect(isCuratedNote('rfc published (datatracker 2026-05-20)')).toBe(false)
    expect(isCuratedNote('iesg submitted (datatracker 2026-08-03)')).toBe(false)
    expect(isCuratedNote('wg document')).toBe(false)
  })

  it('treats human prose as curated', () => {
    expect(isCuratedNote('REVERTED 2026-07-27: a hand-verified apply incorrectly set this…')).toBe(
      true
    )
    expect(
      isCuratedNote('Individual submission (draft-bokovoy-kitten-pkinit-pqc-01) — not adopted')
    ).toBe(true)
    expect(
      isCuratedNote('IETF Last Call (datatracker 2026-07-22; was IESG-submitted Apr 2026)')
    ).toBe(true)
  })

  it('treats an absent or empty note as not curated, so new cells still fill in', () => {
    expect(isCuratedNote(undefined)).toBe(false)
    expect(isCuratedNote('   ')).toBe(false)
  })
})

describe('patchMatrix curated-note guard', () => {
  it('refuses to overwrite a multi-line human note, even on a genuine advance', () => {
    const r = patchMatrix(curatedMatrix, [
      ikeDelta('hybridKem', 'rfc-editor-queue', 'rfc-published'),
    ])
    expect(r.applied).toBe(0)
    expect(r.curatedNotes).toHaveLength(1)
    expect(r.curatedNotes[0]).toContain('ike-ipsec::hybridKem')
    expect(r.next).toBe(curatedMatrix)
    expect(r.next).toContain('REVERTED 2026-07-27')
  })

  it("still applies where the note is this script's own output", () => {
    const r = patchMatrix(curatedMatrix, [ikeDelta('pureKem', 'wg-document', 'rfc-published')])
    expect(r.applied).toBe(1)
    expect(r.curatedNotes).toHaveLength(0)
    expect(r.next).toContain("stage: 'rfc-published'")
    // the curated sibling is untouched
    expect(r.next).toContain('REVERTED 2026-07-27')
  })

  it('reports a downgrade as a downgrade even when the note is curated', () => {
    const r = patchMatrix(curatedMatrix, [
      ikeDelta('hybridKem', 'rfc-editor-queue', 'individual-draft'),
    ])
    expect(r.downgrades).toHaveLength(1)
    expect(r.curatedNotes).toHaveLength(0)
    expect(r.applied).toBe(0)
  })
})

/**
 * Sibling-note guard (2026-08-12).
 *
 * The curated-note read used a flat 4,000-character window instead of the
 * brace-matched block the write path used. A cell with no stageNote of its own
 * therefore inherited the first note found in whatever followed it. On the
 * 2026-08-11 run that blocked fido-2::hybridKem — a legitimate RFC 10024
 * upgrade — on fido-2::hybridSig's note about JOSE composite signatures.
 *
 * The fixture is that row's real shape: hybridKem and pureSig carry no
 * stageNote, hybridSig does.
 */
const siblingMatrix = `
export const PQC_PROTOCOL_MATRIX = [
  {
    id: 'fido-2',
    hybridKem: {
      value: 'draft',
      stage: 'rfc-editor-queue',
      note: 'Inherits TLS 1.3 — X25519MLKEM768 hybrid group.',
    },
    pureSig: {
      value: 'experimental',
      stage: 'experimental',
      note: 'Algorithm IDs sourced from the COSE row.',
    },
    hybridSig: {
      value: 'draft',
      stage: 'wg-document',
      stageNote: 'Inherited JOSE composite path is now a WG document (draft-ietf-jose-pq-composite-sigs, datatracker 2026-07-20)',
    },
  },
]
`

const fidoDelta = (dim: string, encoded: string, current: string) =>
  ({
    row_id: 'fido-2',
    dimension: dim,
    encoded_stage: encoded,
    current_stage: current,
    last_updated: '2026-08-10',
  }) as never

describe('patchMatrix sibling-note guard', () => {
  it('does not block a cell on a note that belongs to a later dimension', () => {
    // THE BUG: this returned applied=0 with a curatedNotes entry quoting
    // hybridSig's JOSE note, and RFC 10024 had to be applied by hand.
    const r = patchMatrix(siblingMatrix, [
      fidoDelta('hybridKem', 'rfc-editor-queue', 'rfc-published'),
    ])
    expect(r.curatedNotes).toHaveLength(0)
    expect(r.applied).toBe(1)
    expect(r.next).toContain("stage: 'rfc-published'")
  })

  it('leaves the sibling that owns the note completely untouched', () => {
    const r = patchMatrix(siblingMatrix, [
      fidoDelta('hybridKem', 'rfc-editor-queue', 'rfc-published'),
    ])
    expect(r.next).toContain('Inherited JOSE composite path is now a WG document')
    expect(r.next).toContain("stage: 'wg-document'")
  })

  it('still blocks the dimension that genuinely owns a curated note', () => {
    const r = patchMatrix(siblingMatrix, [fidoDelta('hybridSig', 'wg-document', 'ietf-last-call')])
    expect(r.applied).toBe(0)
    expect(r.curatedNotes).toHaveLength(1)
    expect(r.curatedNotes[0]).toContain('fido-2::hybridSig')
    expect(r.next).toBe(siblingMatrix)
  })

  it('writes the generated note into the cell that had none, and only there', () => {
    const r = patchMatrix(siblingMatrix, [
      fidoDelta('hybridKem', 'rfc-editor-queue', 'rfc-published'),
    ])
    expect(r.next.match(/stageNote:/g)).toHaveLength(2)
    const hybridKemBlock = r.next.slice(
      r.next.indexOf('hybridKem: {'),
      r.next.indexOf('pureSig: {')
    )
    expect(hybridKemBlock).toContain('rfc published (datatracker 2026-08-10)')
  })
})

describe('dimensionSpan', () => {
  it('ends at the cell own closing brace, not somewhere downstream', () => {
    const span = dimensionSpan(siblingMatrix, 'fido-2', 'hybridKem')!
    const block = siblingMatrix.slice(span.start, span.end + 1)
    expect(block).toContain('X25519MLKEM768')
    expect(block).not.toContain('pureSig')
    expect(block).not.toContain('stageNote')
  })

  it('is undefined for a row or dimension that is not there', () => {
    expect(dimensionSpan(siblingMatrix, 'no-such-row', 'hybridKem')).toBeUndefined()
    expect(dimensionSpan(siblingMatrix, 'fido-2', 'pureKem')).toBeUndefined()
  })
})

/**
 * Stageless-cell guard (2026-08-12).
 *
 * A cell with no `stage:` has not been placed on the IETF ladder, usually
 * because its PQC story is not one tracked document. rpki-bgpsec::pureSig
 * lists RFC 5280 and RFC 6488 — the classical certificate profile and the CMS
 * signed-object template — and neither says anything about when PQC signing
 * arrives in RPKI. Both are published, so the feed proposes 'rfc-published'
 * truthfully and wrongly.
 *
 * These two cells were previously blocked by the curated-note check reading a
 * SIBLING dimension's note. That was accidental protection; fixing the sibling
 * bug removed it and left the applier ready to write the exact claim
 * ike-ipsec::hybridKem's note was written to prevent.
 */
const statelessMatrix = `
export const PQC_PROTOCOL_MATRIX = [
  {
    id: 'rpki-bgpsec',
    pureSig: {
      value: 'none',
      note: 'No PQC profile for RPKI signed objects yet.',
    },
    hybridSig: {
      value: 'draft',
      stage: 'individual-draft',
    },
  },
]
`

const rpkiDelta = (dim: string, encoded: string | null, current: string) =>
  ({
    row_id: 'rpki-bgpsec',
    dimension: dim,
    encoded_stage: encoded,
    current_stage: current,
    last_updated: '2026-05-20',
  }) as never

describe('patchMatrix stageless-cell guard', () => {
  it('refuses to invent a stage for a cell that has none', () => {
    const r = patchMatrix(statelessMatrix, [rpkiDelta('pureSig', null, 'rfc-published')])
    expect(r.applied).toBe(0)
    expect(r.statelessCells).toHaveLength(1)
    expect(r.statelessCells[0]).toContain('rpki-bgpsec::pureSig')
    expect(r.next).toBe(statelessMatrix)
    // The specific claim that must not appear: RPKI PQC signing is published.
    expect(r.next).not.toContain('rfc-published')
  })

  it('still advances a cell that does carry a stage', () => {
    const r = patchMatrix(statelessMatrix, [
      rpkiDelta('hybridSig', 'individual-draft', 'wg-document'),
    ])
    expect(r.applied).toBe(1)
    expect(r.statelessCells).toHaveLength(0)
    expect(r.next).toContain("stage: 'wg-document'")
  })

  it('reports a stageless cell rather than silently dropping it', () => {
    // Silence would read as "nothing to do here", which is the opposite of
    // true: the feed found something and we declined to act on it.
    const r = patchMatrix(statelessMatrix, [rpkiDelta('pureSig', null, 'rfc-published')])
    expect(r.statelessCells[0]).toContain('rfc-published')
  })
})

/**
 * Quote-style guard (2026-08-12) — the worst of the set.
 *
 * The curated-note check read `/stageNote:\s*'([^']*)'/`, single quotes only. A
 * note containing an apostrophe cannot be written in single quotes, so prettier
 * writes it in double. TEN of the matrix's 76 stageNotes are double-quoted and
 * every one is a hand-written 2026-08-09 correction: the notes the guard exists
 * to protect were precisely the notes it could not see. The selection effect is
 * the point — prose careful enough to say "the datatracker's IESG state" earns
 * an apostrophe, so the more considered the note, the more certainly it was
 * invisible.
 *
 * The write path shared the blind spot with a worse consequence: on a
 * double-quoted cell it took the INSERT branch and added a second stageNote key
 * beside the first.
 */
const doubleQuotedMatrix = `
export const PQC_PROTOCOL_MATRIX = [
  {
    id: 'kerberos',
    hybridKem: {
      value: 'draft',
      stage: 'individual-draft',
      stageNote:
        "Re-derived 2026-08-09 from the datatracker's IESG state. The only hybrid-KEM mechanism for PKINIT is draft-bokovoy-kitten-pkinit-pqc-01 — never WG-adopted.",
    },
    pureKem: {
      value: 'draft',
      stage: 'wg-document',
      stageNote: 'wg document (datatracker 2026-01-01)',
    },
  },
]
`

const kerbDelta = (dim: string, encoded: string, current: string) =>
  ({
    row_id: 'kerberos',
    dimension: dim,
    encoded_stage: encoded,
    current_stage: current,
    last_updated: '2026-07-27',
  }) as never

describe('patchMatrix quote-style guard', () => {
  it('sees a DOUBLE-quoted curated note and blocks on it', () => {
    // THE BUG: this returned applied=1 and overwrote the note.
    const r = patchMatrix(doubleQuotedMatrix, [
      kerbDelta('hybridKem', 'individual-draft', 'ietf-last-call'),
    ])
    expect(r.applied).toBe(0)
    expect(r.curatedNotes).toHaveLength(1)
    expect(r.curatedNotes[0]).toContain('kerberos::hybridKem')
    expect(r.next).toBe(doubleQuotedMatrix)
    expect(r.next).toContain('never WG-adopted')
  })

  it('never grows a second stageNote key beside a double-quoted one', () => {
    // The write path's insert branch fired because the test regex missed the
    // double-quoted field, producing a duplicate key where the last wins.
    const r = patchMatrix(doubleQuotedMatrix, [
      kerbDelta('hybridKem', 'individual-draft', 'ietf-last-call'),
    ])
    expect(r.next.match(/stageNote:/g)).toHaveLength(2)
  })

  it('still applies where the single-quoted note is this generator own output', () => {
    const r = patchMatrix(doubleQuotedMatrix, [
      kerbDelta('pureKem', 'wg-document', 'rfc-published'),
    ])
    expect(r.applied).toBe(1)
    expect(r.curatedNotes).toHaveLength(0)
    // the double-quoted sibling is untouched
    expect(r.next).toContain('never WG-adopted')
  })

  it('every double-quoted stageNote in the real matrix is seen as curated', () => {
    // A census, not a sample: the defect was invisible because nothing counted.
    const real = readFileSync(
      join(import.meta.dirname ?? __dirname, '..', 'src', 'data', 'pqcProtocolMatrix.ts'),
      'utf-8'
    )
    const doubleQuoted = real.match(/stageNote:\s*\n?\s*"/g) ?? []
    expect(doubleQuoted.length).toBeGreaterThan(0)
    for (const m of real.matchAll(/stageNote:\s*\n?\s*"([^"]+)"/g)) {
      expect(isCuratedNote(m[1])).toBe(true)
    }
  })
})
