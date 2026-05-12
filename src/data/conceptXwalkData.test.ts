// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { conceptXwalkData } from './conceptXwalkData'

describe('conceptXwalkData', () => {
  it('loads without error and has at least 22 edges', () => {
    expect(conceptXwalkData.length).toBeGreaterThanOrEqual(22)
  })

  it('all records have required fields', () => {
    for (const edge of conceptXwalkData) {
      expect(edge.xwalkId).toBeTruthy()
      expect(edge.fromConcept).toBeTruthy()
      expect(edge.toConcept).toBeTruthy()
      expect(edge.relationshipType).toBeTruthy()
      expect(edge.evidence).toBeTruthy()
      expect(edge.confidenceScore).toBeGreaterThan(0)
    }
  })

  it('xwalk IDs are unique', () => {
    const ids = conceptXwalkData.map((e) => e.xwalkId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('NIST CSWP 39 → FIPS 203 intersects_with edge exists with high confidence', () => {
    const edge = conceptXwalkData.find(
      (e) => e.fromConcept === 'NIST CSWP 39' && e.toConcept === 'FIPS 203'
    )
    expect(edge).toBeDefined()
    expect(edge?.relationshipType).toBe('intersects_with')
    expect(edge?.confidenceScore).toBe(85) // high
  })

  it('NIST CSWP 39 → FIPS 204 and FIPS 205 edges exist', () => {
    const fips204 = conceptXwalkData.find(
      (e) => e.fromConcept === 'NIST CSWP 39' && e.toConcept === 'FIPS 204'
    )
    const fips205 = conceptXwalkData.find(
      (e) => e.fromConcept === 'NIST CSWP 39' && e.toConcept === 'FIPS 205'
    )
    expect(fips204).toBeDefined()
    expect(fips205).toBeDefined()
  })

  it('NIST CSWP 39 → SP 800-131A Rev3 subset_of edge exists (executive-visible)', () => {
    const edge = conceptXwalkData.find(
      (e) => e.fromConcept === 'NIST CSWP 39' && e.toConcept === 'NIST-SP-800-131A-Rev3'
    )
    expect(edge).toBeDefined()
    expect(edge?.relationshipType).toBe('subset_of')
  })

  it('NIST CSWP 39 → RFC 9629 and RFC 8446 high-confidence edges exist (architect-visible)', () => {
    const rfc9629 = conceptXwalkData.find(
      (e) => e.fromConcept === 'NIST CSWP 39' && e.toConcept === 'RFC 9629'
    )
    const rfc8446 = conceptXwalkData.find(
      (e) => e.fromConcept === 'NIST CSWP 39' && e.toConcept === 'RFC 8446'
    )
    expect(rfc9629).toBeDefined()
    expect(rfc9629?.confidenceScore).toBe(85) // must be high for derivedConf 65 (above architect threshold 50)
    expect(rfc8446).toBeDefined()
    expect(rfc8446?.confidenceScore).toBe(85)
  })

  it('NSA CNSA 2.0 → FIPS 203/204/205 subset_of edges exist (executive derived via Five Eyes)', () => {
    const targets = ['FIPS 203', 'FIPS 204', 'FIPS 205']
    for (const target of targets) {
      const edge = conceptXwalkData.find(
        (e) => e.fromConcept === 'NSA CNSA 2.0' && e.toConcept === target
      )
      expect(edge, `NSA CNSA 2.0 → ${target} missing`).toBeDefined()
      expect(edge?.relationshipType).toBe('subset_of')
    }
  })

  it('Five Eyes national authority edges exist for AU, UK, CA', () => {
    const fiveEyesEdges = [
      { from: 'AU-ASD-ISM-Crypto-2024', to: 'FIPS 203' },
      { from: 'UK NCSC PQC Guidance', to: 'FIPS 203' },
      { from: 'CA-TBS-SPIN-PQC-2025', to: 'FIPS 203' },
    ]
    for (const { from, to } of fiveEyesEdges) {
      const edge = conceptXwalkData.find((e) => e.fromConcept === from && e.toConcept === to)
      expect(edge, `${from} → ${to} missing`).toBeDefined()
      expect(edge?.confidenceScore).toBe(85) // high — ensures derivedConf 54 for recognized source
    }
  })

  it('no not_related edges in dataset', () => {
    const notRelated = conceptXwalkData.filter((e) => e.relationshipType === 'not_related')
    expect(notRelated).toHaveLength(0)
  })

  it('all confidence scores are in valid CONFIDENCE_SCALE values (30, 60, or 85)', () => {
    const valid = new Set([30, 60, 85])
    for (const edge of conceptXwalkData) {
      expect(
        valid.has(edge.confidenceScore),
        `invalid score ${edge.confidenceScore} on ${edge.xwalkId}`
      ).toBe(true)
    }
  })

  // IR 8477 §3.2 vocabulary alignment (2026-05-11).
  it('all rationale_type values are in the IR 8477 closed set', () => {
    const valid = new Set([
      'syntactic',
      'semantic',
      'functional',
      'technical_dependency',
      'policy_reference',
      'implementation_guidance',
      'timeline_anchor',
    ])
    for (const edge of conceptXwalkData) {
      expect(
        valid.has(edge.rationaleType),
        `xwalk ${edge.xwalkId} has out-of-vocab rationale_type "${edge.rationaleType}"`
      ).toBe(true)
    }
  })

  it('no rows use the deprecated equivalence / specialization rationale values', () => {
    const legacy = conceptXwalkData.filter(
      (e) =>
        (e.rationaleType as string) === 'equivalence' ||
        (e.rationaleType as string) === 'specialization'
    )
    expect(legacy).toHaveLength(0)
  })

  // PR 3b — canonical-id columns populated by migrate-xwalk-ids.ts.
  it('CSWP 39 → FIPS 203 edge carries canonical concept ids', () => {
    const edge = conceptXwalkData.find(
      (e) => e.fromConcept === 'NIST CSWP 39' && e.toConcept === 'FIPS 203'
    )
    expect(edge?.fromConceptId).toBe('framework:nist-cswp-39')
    expect(edge?.toConceptId).toBe('standard:fips-203')
  })

  it('at least 99% of edges have both from_concept_id and to_concept_id populated', () => {
    const resolved = conceptXwalkData.filter((e) => e.fromConceptId && e.toConceptId).length
    const rate = resolved / conceptXwalkData.length
    // Allow a few SME-review orphans (e.g. "NIST SP 800-90B" vs "NIST-SP-800-90B")
    expect(rate, `resolved=${resolved} / total=${conceptXwalkData.length}`).toBeGreaterThanOrEqual(
      0.99
    )
  })
})
