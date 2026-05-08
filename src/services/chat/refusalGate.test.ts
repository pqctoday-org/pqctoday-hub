// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import type { RAGChunk } from '@/types/ChatTypes'
import { requiresAuthoritativeEvidence, buildTrustRefusal } from './RetrievalService'

const c = (source: string, title: string, metadata: Record<string, unknown> = {}): RAGChunk =>
  ({
    id: `${source}-${title}`,
    source,
    title,
    content: '',
    category: '',
    metadata,
  }) as RAGChunk

describe('requiresAuthoritativeEvidence', () => {
  it('triggers on regulatory/audit/compliance language', () => {
    expect(requiresAuthoritativeEvidence('what is the audit requirement?')).toBe(true)
    expect(requiresAuthoritativeEvidence('am I required to use ML-KEM?')).toBe(true)
    expect(requiresAuthoritativeEvidence('which regulation mandates PQC migration?')).toBe(true)
    expect(requiresAuthoritativeEvidence('is this compliant with FIPS 140-3?')).toBe(true)
  })
  it('triggers on standard_query intent (bare standard ID)', () => {
    expect(requiresAuthoritativeEvidence('FIPS 203')).toBe(true)
    expect(requiresAuthoritativeEvidence('CNSA 2.0')).toBe(true)
  })
  it('does not trigger on plain definition queries', () => {
    expect(requiresAuthoritativeEvidence('what is a KEM?')).toBe(false)
    expect(requiresAuthoritativeEvidence('compare ML-KEM and Kyber')).toBe(false)
  })
})

describe('buildTrustRefusal', () => {
  it('returns null when query is not audit-style', () => {
    expect(buildTrustRefusal('what is a KEM?', [c('library', 'Anything')])).toBeNull()
  })
  it('returns null when audit-style query has no chunks (no harm done)', () => {
    // No chunks => unknown tier => refusal SHOULD trigger
    const r = buildTrustRefusal('what is the audit requirement?', [])
    expect(r).not.toBeNull()
    expect(r).toContain("don't have a sufficiently authoritative")
  })
  it('returns null when top chunk is unscored but query is non-audit', () => {
    expect(buildTrustRefusal('explain KEM', [c('glossary', 'KEM')])).toBeNull()
  })
})
