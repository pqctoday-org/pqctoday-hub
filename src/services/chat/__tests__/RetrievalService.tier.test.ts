// SPDX-License-Identifier: GPL-3.0-only
/**
 * RetrievalService trust-tier behavior tests (C6 ordering, C10 refusal).
 *
 * These tests pin the user-visible trust behavior of the chat assistant:
 * the refusal threshold for audit/compliance queries, and the tier-aware
 * computation of `topAvailableTier`. Singleton ranking is best validated
 * end-to-end (see e2e/cmdk-trust-order.spec.ts and rag-citation-tier.spec.ts);
 * here we lock in the deterministic helpers.
 */
import { describe, it, expect } from 'vitest'
import {
  requiresAuthoritativeEvidence,
  topAvailableTier,
  buildTrustRefusal,
} from '../RetrievalService'
import { makeChunk, makeLibraryChunk } from '@/test/fixtures/trustChunks'

describe('C10 — requiresAuthoritativeEvidence', () => {
  it('flags must/required/shall as audit-style', () => {
    expect(requiresAuthoritativeEvidence('must I migrate to ML-KEM by 2030?')).toBe(true)
    expect(requiresAuthoritativeEvidence('are we required to use FIPS 203?')).toBe(true)
    expect(requiresAuthoritativeEvidence('what shall we deploy for PQC?')).toBe(true)
  })

  it('flags standard_query and country_query intents', () => {
    expect(requiresAuthoritativeEvidence('FIPS 203 deadline', 'standard_query')).toBe(true)
    expect(requiresAuthoritativeEvidence('Germany PQC mandate', 'country_query')).toBe(true)
  })

  it('does not flag casual exploratory questions', () => {
    expect(requiresAuthoritativeEvidence('what is a hash function?', 'general')).toBe(false)
    expect(requiresAuthoritativeEvidence('tell me about lattices', 'general')).toBe(false)
  })
})

describe('C10 — buildTrustRefusal gating', () => {
  it('returns null when query is not audit-style (any chunks)', () => {
    const chunks = [makeChunk({ source: 'glossary', title: 'lattice' })]
    expect(buildTrustRefusal('what is a lattice?', chunks)).toBeNull()
  })

  it('returns a refusal string for audit-style query with only unscored chunks', () => {
    const chunks = [
      makeChunk({ source: 'glossary', title: 'PQC' }),
      makeChunk({ source: 'modules', title: 'PKI module' }),
    ]
    const refusal = buildTrustRefusal('are we required to migrate?', chunks)
    expect(refusal).toMatch(/Authoritative or High/i)
    expect(refusal).toMatch(/no scored source resolved|best available tier/i)
  })

  it('refusal string includes the closest match title for transparency', () => {
    const chunks = [
      makeChunk({ source: 'glossary', title: 'Crypto-agility' }),
      makeChunk({ source: 'modules', title: 'PKI' }),
    ]
    const refusal = buildTrustRefusal('shall we adopt CNSA 2.0?', chunks)
    expect(refusal).toContain('Crypto-agility')
  })
})

describe('C6 / C10 — topAvailableTier', () => {
  it('returns "unknown" when no chunks resolve to a scored resource', () => {
    const chunks = [
      makeChunk({ source: 'glossary' }),
      makeChunk({ source: 'modules' }),
      makeChunk({ source: 'quiz' }),
    ]
    expect(topAvailableTier(chunks)).toBe('unknown')
  })

  it('only considers the top N chunks (default 3)', () => {
    // 3 unscored chunks + 1 (would-be-Authoritative) chunk at position 4 →
    // since N=3, the 4th is ignored. Result: unknown.
    const chunks = [
      makeChunk({ source: 'glossary' }),
      makeChunk({ source: 'glossary' }),
      makeChunk({ source: 'glossary' }),
      makeLibraryChunk('FIPS_203'), // would resolve to a real tier
    ]
    expect(topAvailableTier(chunks, 3)).toBe('unknown')
  })

  it('returns "unknown" gracefully for chunks that resolve but lack a score', () => {
    // Library chunk with a non-existent referenceId — chunkToResource
    // succeeds but getTrustScore returns undefined → 'unknown'.
    const chunks = [makeLibraryChunk('does-not-exist-in-csv-zzz-1234')]
    expect(topAvailableTier(chunks)).toBe('unknown')
  })
})
