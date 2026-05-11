// SPDX-License-Identifier: GPL-3.0-only
/**
 * chunkToResource contract tests (C1, C3 unit-level).
 *
 * Pins the chunk→(resourceType, resourceId) mapping for every scored source
 * type. Corpus-wide coverage is enforced by `scripts/corpus-trust-invariants.test.ts`.
 */
import { describe, it, expect } from 'vitest'
import { chunkToResource, trustTierMultiplier } from '../chunkToResource'
import {
  makeChunk,
  makeLibraryChunk,
  makeComplianceChunk,
  makeThreatChunk,
  makeTimelineChunk,
} from '@/test/fixtures/trustChunks'

describe('chunkToResource — scored source mappings', () => {
  it('library chunk uses metadata.referenceId when present', () => {
    const ref = chunkToResource(makeLibraryChunk('FIPS_203'))
    expect(ref).toEqual({ resourceType: 'library', resourceId: 'FIPS_203' })
  })

  it('library chunk falls back to title when referenceId missing', () => {
    const chunk = makeChunk({ source: 'library', title: 'NIST_SP_800_208', metadata: {} })
    expect(chunkToResource(chunk)).toEqual({
      resourceType: 'library',
      resourceId: 'NIST_SP_800_208',
    })
  })

  it('compliance chunk uses metadata.id when present', () => {
    const ref = chunkToResource(makeComplianceChunk('eIDAS-2'))
    expect(ref).toEqual({ resourceType: 'compliance', resourceId: 'eIDAS-2' })
  })

  it('threats chunk uses metadata.threatId when present', () => {
    const ref = chunkToResource(makeThreatChunk('T-FIN-001'))
    expect(ref).toEqual({ resourceType: 'threats', resourceId: 'T-FIN-001' })
  })

  it('timeline / migrate / leaders / algorithms use chunk.title as id', () => {
    expect(chunkToResource(makeTimelineChunk('NIST PQC Round 4'))).toEqual({
      resourceType: 'timeline',
      resourceId: 'NIST PQC Round 4',
    })
    expect(chunkToResource(makeChunk({ source: 'migrate', title: 'OpenSSH' }))).toEqual({
      resourceType: 'migrate',
      resourceId: 'OpenSSH',
    })
    expect(chunkToResource(makeChunk({ source: 'leaders', title: 'NIST' }))).toEqual({
      resourceType: 'leaders',
      resourceId: 'NIST',
    })
    expect(chunkToResource(makeChunk({ source: 'algorithms', title: 'ML-KEM-768' }))).toEqual({
      resourceType: 'algorithm',
      resourceId: 'ML-KEM-768',
    })
  })

  it('document-enrichment + governance-maturity rely on metadata.refId', () => {
    const enriched = makeChunk({
      source: 'document-enrichment',
      metadata: { refId: 'FIPS_204' },
    })
    expect(chunkToResource(enriched)).toEqual({
      resourceType: 'library',
      resourceId: 'FIPS_204',
    })
    const noRef = makeChunk({ source: 'document-enrichment', metadata: {} })
    expect(chunkToResource(noRef)).toBeNull()
  })

  it('returns null for sources that intentionally do not carry trust scores', () => {
    const unscoredSources = [
      'glossary',
      'modules',
      'module-content',
      'quiz',
      'patents',
      'vendors',
      'changelog',
      'user-manual',
      'priority-matrix',
      'achievements',
      'transitions',
    ]
    for (const src of unscoredSources) {
      expect(chunkToResource(makeChunk({ source: src }))).toBeNull()
    }
  })

  it('returns null when an unknown source is encountered', () => {
    expect(chunkToResource(makeChunk({ source: 'totally-new-future-source' }))).toBeNull()
  })
})

describe('trustTierMultiplier — boundary contract', () => {
  it('rejects no other inputs (TypeScript-narrowed) and falls through to 0.95 for null', () => {
    expect(trustTierMultiplier(null)).toBe(0.95)
  })

  it('values are exact (no float drift)', () => {
    // Plain equality, not toBeCloseTo — we want the literal numbers in code.
    expect(trustTierMultiplier('Authoritative') === 1.2).toBe(true)
    expect(trustTierMultiplier('High') === 1.1).toBe(true)
    expect(trustTierMultiplier('Moderate') === 1.0).toBe(true)
    expect(trustTierMultiplier('Low') === 0.8).toBe(true)
  })
})
