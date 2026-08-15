// SPDX-License-Identifier: GPL-3.0-only
//
// WS12 driftguards for the supersession edges (2026-08-15).
//
// The edges say "this protocol is a dead end; the migration goes there". That
// claim is only safe if it cannot be authored backwards, so the invariants
// below are deliberately self-enforcing rather than advisory:
//
//   - a row carrying supersededByProtocolId has NO PQC dimension of its own
//   - its target HAS at least one
//   - forward and reverse edges agree
//   - historical rows are never `recommended` and never carry live drafts
//
// A future edge that points the wrong way fails here rather than telling a
// reader to migrate from TLS 1.3 to TLS 1.2.

import { describe, expect, it } from 'vitest'
import { PROTOCOL_MATRIX, type ProtocolMatrixRow } from './pqcProtocolMatrix'

const byId = new Map(PROTOCOL_MATRIX.map((r) => [r.id, r]))

/** A row has no PQC path when every dimension is `na` or `none`. */
function hasNoPqcPath(r: ProtocolMatrixRow): boolean {
  return Object.values(r.dimensions).every((d) => d.value === 'na' || d.value === 'none')
}

describe('protocol matrix — supersession edges', () => {
  it('every supersededByProtocolId resolves to a real row', () => {
    for (const r of PROTOCOL_MATRIX) {
      if (!r.supersededByProtocolId) continue
      expect(
        byId.has(r.supersededByProtocolId),
        `${r.id}: supersededByProtocolId "${r.supersededByProtocolId}" is not a matrix row`
      ).toBe(true)
      expect(r.supersededByProtocolId, `${r.id}: supersedes itself`).not.toBe(r.id)
    }
  })

  it('every supersedes id resolves to a real row', () => {
    // Ids, not display names — unlike inheritedBy, which stores names and so
    // cannot be checked at all. That weakness is deliberately not copied.
    for (const r of PROTOCOL_MATRIX) {
      for (const id of r.supersedes ?? []) {
        expect(byId.has(id), `${r.id}: supersedes "${id}" which is not a matrix row`).toBe(true)
        expect(id, `${r.id}: supersedes itself`).not.toBe(r.id)
      }
    }
  })

  it('a superseded row has no PQC path of its own', () => {
    // THE invariant. If a row had a PQC dimension, calling it a dead end and
    // pointing readers elsewhere would be a lie.
    for (const r of PROTOCOL_MATRIX) {
      if (!r.supersededByProtocolId) continue
      expect(
        hasNoPqcPath(r),
        `${r.id}: carries supersededByProtocolId but has a real PQC dimension — it is not a dead end`
      ).toBe(true)
    }
  })

  it('the target of a supersession edge HAS a PQC path', () => {
    // The other half: migrating readers to another dead end would be worse
    // than saying nothing.
    for (const r of PROTOCOL_MATRIX) {
      if (!r.supersededByProtocolId) continue
      const target = byId.get(r.supersededByProtocolId)!
      expect(
        hasNoPqcPath(target),
        `${r.id} -> ${target.id}: the migration target has no PQC path either`
      ).toBe(false)
    }
  })

  it('forward and reverse edges agree', () => {
    for (const r of PROTOCOL_MATRIX) {
      if (!r.supersededByProtocolId) continue
      const target = byId.get(r.supersededByProtocolId)!
      expect(
        target.supersedes ?? [],
        `${target.id} does not list "${r.id}" in supersedes, but ${r.id} points at it`
      ).toContain(r.id)
    }
    for (const r of PROTOCOL_MATRIX) {
      for (const id of r.supersedes ?? []) {
        expect(byId.get(id)!.supersededByProtocolId, `${id} does not point back at "${r.id}"`).toBe(
          r.id
        )
      }
    }
  })

  it('historical rows are dead ends, never recommended, and carry no live drafts', () => {
    for (const r of PROTOCOL_MATRIX) {
      if (!r.historical) continue
      expect(hasNoPqcPath(r), `${r.id}: historical but has a PQC dimension`).toBe(true)
      expect(r.recommended ?? false, `${r.id}: historical rows cannot be recommended`).toBe(false)
      expect(
        r.latestDraft,
        `${r.id}: historical rows have frozen refs — a live draft means it is not historical`
      ).toEqual([])
      expect(
        r.supersededByProtocolId,
        `${r.id}: a historical row must say where the migration goes instead`
      ).toBeTruthy()
      // Every historical row must cite the document that deprecated it —
      // otherwise "deprecated" is our assertion rather than a standards body's.
      expect(
        r.latestRelease.length,
        `${r.id}: historical rows must cite their deprecating document`
      ).toBeGreaterThan(0)
    }
  })

  it('the three pre-existing dead ends are now linked', () => {
    // Regression pin for the specific gap WS12 closed: these rows existed with
    // every dimension `na` and no way for a reader to learn where to go.
    for (const [from, to] of [
      ['tls-1-2', 'tls-1-3'],
      ['dtls-1-2', 'dtls-1-3'],
      ['fido', 'fido-2'],
    ]) {
      expect(byId.get(from)?.supersededByProtocolId, `${from} must point at ${to}`).toBe(to)
    }
  })
})
