// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import type { RAGChunk } from '@/types/ChatTypes'
import { chunkToResource, trustTierMultiplier } from './chunkToResource'

function chunk(source: string, title: string, metadata: Record<string, unknown> = {}): RAGChunk {
  return {
    id: `${source}-${title}`,
    source,
    title,
    content: '',
    category: '',
    metadata,
  } as RAGChunk
}

describe('chunkToResource', () => {
  it('maps library chunks via metadata.referenceId', () => {
    expect(chunkToResource(chunk('library', 'FIPS 203', { referenceId: 'NIST-FIPS-203' }))).toEqual(
      {
        resourceType: 'library',
        resourceId: 'NIST-FIPS-203',
      }
    )
  })

  it('falls back to title for library when referenceId missing', () => {
    expect(chunkToResource(chunk('library', 'Some Standard'))).toEqual({
      resourceType: 'library',
      resourceId: 'Some Standard',
    })
  })

  it('maps timeline / migrate / leaders / algorithms by title', () => {
    expect(chunkToResource(chunk('timeline', 'NSA CNSA 2.0 Mandate'))).toEqual({
      resourceType: 'timeline',
      resourceId: 'NSA CNSA 2.0 Mandate',
    })
    expect(chunkToResource(chunk('migrate', 'BTQ Bitcoin Quantum'))).toEqual({
      resourceType: 'migrate',
      resourceId: 'BTQ Bitcoin Quantum',
    })
    expect(chunkToResource(chunk('leaders', 'Dr. Alice Smith'))).toEqual({
      resourceType: 'leaders',
      resourceId: 'Dr. Alice Smith',
    })
    expect(chunkToResource(chunk('algorithms', 'ML-KEM-768'))).toEqual({
      resourceType: 'algorithm',
      resourceId: 'ML-KEM-768',
    })
  })

  it('maps threats via metadata.threatId', () => {
    expect(chunkToResource(chunk('threats', 'AERO threat', { threatId: 'AERO-001' }))).toEqual({
      resourceType: 'threats',
      resourceId: 'AERO-001',
    })
  })

  it('maps document-enrichment / governance-maturity to library when refId present', () => {
    expect(chunkToResource(chunk('document-enrichment', 'X', { refId: 'NIST-FIPS-203' }))).toEqual({
      resourceType: 'library',
      resourceId: 'NIST-FIPS-203',
    })
    expect(chunkToResource(chunk('governance-maturity', 'Y', { refId: 'FIPS 203' }))).toEqual({
      resourceType: 'library',
      resourceId: 'FIPS 203',
    })
  })

  it('returns null for unscored sources', () => {
    expect(chunkToResource(chunk('glossary', 'KEM'))).toBeNull()
    expect(chunkToResource(chunk('module-content', 'X'))).toBeNull()
    expect(chunkToResource(chunk('quiz', 'X'))).toBeNull()
    expect(chunkToResource(chunk('vendors', 'AWS'))).toBeNull()
    expect(chunkToResource(chunk('document-enrichment', 'X', {}))).toBeNull()
  })
})

describe('trustTierMultiplier', () => {
  it('returns the §14.3 ladder', () => {
    expect(trustTierMultiplier('Authoritative')).toBe(1.2)
    expect(trustTierMultiplier('High')).toBe(1.1)
    expect(trustTierMultiplier('Moderate')).toBe(1.0)
    expect(trustTierMultiplier('Low')).toBe(0.8)
    expect(trustTierMultiplier(null)).toBe(0.95)
  })
})
