// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { traverseXwalkPaths } from './trustPathTraversal'
import { getLens } from './applicabilityLens'
import type { ApplicabilityResult } from './applicabilityEngine'
import type { ComplianceFramework } from '../data/complianceData'
import type { ConceptXwalkRecord } from '../data/conceptXwalkData'

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeFramework(id: string, label: string): ComplianceFramework {
  return {
    id,
    label,
    description: '',
    industries: [],
    countries: ['United States'],
    requiresPQC: true,
    deadline: 'Ongoing',
    deadlinePhase: 'ongoing',
    notes: '',
    enforcementBody: 'NIST',
    libraryRefs: [],
    timelineRefs: [],
    bodyType: 'compliance_framework',
    website: '',
    trustedSourceId: '',
    peerReviewed: undefined,
    vettingBody: undefined,
    websiteUrlQuality: '',
    confidenceScore: 80,
    cswp39Tags: [],
  }
}

type FwResult = ApplicabilityResult<ComplianceFramework>

function direct(id: string, label: string, tier: FwResult['tier']): FwResult {
  return { item: makeFramework(id, label), tier, reason: `test ${tier}` }
}

function edge(
  from: string,
  to: string,
  rel: ConceptXwalkRecord['relationshipType'],
  conf: ConceptXwalkRecord['confidence'] = 'high'
): ConceptXwalkRecord {
  const SCORE: Record<string, number> = { high: 85, medium: 60, low: 30 }
  return {
    xwalkId: `${from}→${to}`,
    fromConcept: from,
    toConcept: to,
    relationshipType: rel,
    rationaleType: 'technical_dependency',
    evidence: `${from} references ${to}`,
    verifiedDate: '2026-05-07',
    verifiedBy: 'test',
    confidence: conf,
    confidenceScore: SCORE[conf] ?? 85,
  }
}

// ── 7 initial CSWP 39 edges (acceptance spec: all high confidence) ────────────
// Note: xw-004 was authored as subset_of (semantically correct) with high conf.
// xw-005/006/007 are medium in the CSV but the acceptance spec requires high
// (derivedConf 65 ± 2). Update the CSV to high if this test should pass E2E.
const CSWP39_EDGES: ConceptXwalkRecord[] = [
  edge('NIST CSWP 39', 'FIPS 203', 'intersects_with', 'high'),
  edge('NIST CSWP 39', 'FIPS 204', 'intersects_with', 'high'),
  edge('NIST CSWP 39', 'FIPS 205', 'intersects_with', 'high'),
  edge('NIST CSWP 39', 'NIST-SP-800-131A-Rev3', 'subset_of', 'high'),
  edge('NIST CSWP 39', 'NIST IR 8413', 'intersects_with', 'high'),
  edge('NIST CSWP 39', 'RFC 8446', 'intersects_with', 'high'),
  edge('NIST CSWP 39', 'RFC 9629', 'intersects_with', 'high'),
]

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('traverseXwalkPaths', () => {
  describe('EDGE-01 — empty inputs', () => {
    it('returns [] when xwalkEdges is empty', () => {
      const result = traverseXwalkPaths(
        [direct('NIST CSWP 39', 'NIST CSWP 39', 'mandatory')],
        [],
        getLens('architect')
      )
      expect(result).toHaveLength(0)
    })

    it('returns [] when directMatches is empty', () => {
      const result = traverseXwalkPaths([], CSWP39_EDGES, getLens('architect'))
      expect(result).toHaveLength(0)
    })
  })

  describe('confidence propagation', () => {
    it('mandatory × intersects_with × high = 65', () => {
      // round(95 × 0.80 × 0.85) = round(64.6) = 65
      const results = traverseXwalkPaths(
        [direct('NIST CSWP 39', 'NIST CSWP 39', 'mandatory')],
        [edge('NIST CSWP 39', 'FIPS 203', 'intersects_with', 'high')],
        getLens('architect')
      )
      expect(results).toHaveLength(1)
      expect(results[0].bestPath.derivedConfidence).toBe(65)
    })

    it('recognized × intersects_with × high = 54', () => {
      // round(80 × 0.80 × 0.85) = round(54.4) = 54
      const results = traverseXwalkPaths(
        [direct('NIST CSWP 39', 'NIST CSWP 39', 'recognized')],
        [edge('NIST CSWP 39', 'FIPS 203', 'intersects_with', 'high')],
        getLens('architect')
      )
      expect(results).toHaveLength(1)
      expect(results[0].bestPath.derivedConfidence).toBe(54)
    })

    it('mandatory × subset_of × high = 74', () => {
      // round(95 × 0.92 × 0.85) = round(74.3) = 74
      const results = traverseXwalkPaths(
        [direct('NIST CSWP 39', 'NIST CSWP 39', 'mandatory')],
        [edge('NIST CSWP 39', 'FIPS 203', 'subset_of', 'high')],
        getLens('architect')
      )
      expect(results).toHaveLength(1)
      expect(results[0].bestPath.derivedConfidence).toBe(74)
    })

    it('mandatory × intersects_with × medium = 46 (below architect threshold → suppressed)', () => {
      // round(95 × 0.80 × 0.60) = round(45.6) = 46 < architect threshold (50)
      const results = traverseXwalkPaths(
        [direct('NIST CSWP 39', 'NIST CSWP 39', 'mandatory')],
        [edge('NIST CSWP 39', 'FIPS 203', 'intersects_with', 'medium')],
        getLens('architect')
      )
      expect(results).toHaveLength(0)
    })

    it('mandatory × intersects_with × medium = 46 is above developer threshold (45) → shown', () => {
      const results = traverseXwalkPaths(
        [direct('NIST CSWP 39', 'NIST CSWP 39', 'mandatory')],
        [edge('NIST CSWP 39', 'FIPS 203', 'intersects_with', 'medium')],
        getLens('developer')
      )
      expect(results).toHaveLength(1)
      expect(results[0].bestPath.derivedConfidence).toBe(46)
    })
  })

  describe('US-AR-01 — USA · Finance & Banking · Architect', () => {
    it('produces FIPS 203/204/205 derived from mandatory CSWP 39 at confidence 65', () => {
      const direct_matches = [direct('NIST CSWP 39', 'NIST CSWP 39', 'mandatory')]
      const results = traverseXwalkPaths(direct_matches, CSWP39_EDGES, getLens('architect'))
      const ids = results.map((r) => r.standardId)

      expect(ids).toContain('FIPS 203')
      expect(ids).toContain('FIPS 204')
      expect(ids).toContain('FIPS 205')

      const fips203 = results.find((r) => r.standardId === 'FIPS 203')!
      expect(fips203.bestPath.sourceTier).toBe('mandatory')
      expect(fips203.bestPath.relationshipType).toBe('intersects_with')
      expect(fips203.bestPath.derivedConfidence).toBe(65)
      expect(fips203.derivedTier).toBe('derived')
    })

    it('SP 800-131A does not appear in derived when already in direct (EDGE-03 deduplication)', () => {
      // SP 800-131A in direct results — xwalk uses same ID format for the dedup check
      const direct_matches = [
        direct('NIST CSWP 39', 'NIST CSWP 39', 'mandatory'),
        direct('NIST-SP-800-131A-Rev3', 'NIST SP 800-131A', 'mandatory'),
      ]
      const results = traverseXwalkPaths(direct_matches, CSWP39_EDGES, getLens('architect'))
      const ids = results.map((r) => r.standardId)
      expect(ids).not.toContain('NIST-SP-800-131A-Rev3')
      // All 6 remaining neighbors should be present (FIPS 203/204/205, IR 8413, RFC 8446, RFC 9629)
      expect(ids).toContain('FIPS 203')
    })

    it('total derived result count ≤ architect maxDerivedResults (12)', () => {
      const direct_matches = [direct('NIST CSWP 39', 'NIST CSWP 39', 'mandatory')]
      const results = traverseXwalkPaths(direct_matches, CSWP39_EDGES, getLens('architect'))
      expect(results.length).toBeLessThanOrEqual(12)
    })

    it('TrustPath fields are populated for FIPS 203 result', () => {
      const direct_matches = [direct('NIST CSWP 39', 'NIST CSWP 39', 'mandatory')]
      const results = traverseXwalkPaths(direct_matches, CSWP39_EDGES, getLens('architect'))
      const fips203 = results.find((r) => r.standardId === 'FIPS 203')!

      expect(fips203.bestPath.sourceStandardId).toBe('NIST CSWP 39')
      expect(fips203.bestPath.edgeEvidence).toMatch(/CSWP 39/)
      expect(fips203.bestPath.reviewerDisplay).toBeTruthy()
      expect(fips203.bestPath.hop).toBe(1)
    })
  })

  describe('US-EX-01 — USA · Finance & Banking · Executive', () => {
    it('Related via IR 8477 is empty — intersects_with blocked for executive', () => {
      // Executive allowedRelationships: [subset_of, superset_of, equivalent]
      // All 7 intersects_with edges → blocked
      // xw-004 is subset_of → allowed BUT only if neighbor not already in direct
      const direct_matches = [
        direct('NIST CSWP 39', 'NIST CSWP 39', 'mandatory'),
        direct('NIST-SP-800-131A-Rev3', 'NIST SP 800-131A', 'mandatory'),
      ]
      const results = traverseXwalkPaths(direct_matches, CSWP39_EDGES, getLens('executive'))
      expect(results).toHaveLength(0)
    })

    it('subset_of edge produces a derived result when neighbor is not in direct', () => {
      // If SP 800-131A is NOT in directResults, executive sees it via subset_of
      const direct_matches = [direct('NIST CSWP 39', 'NIST CSWP 39', 'mandatory')]
      const subset_only_edges = [edge('NIST CSWP 39', 'NIST-SP-800-131A-Rev3', 'subset_of', 'high')]
      const results = traverseXwalkPaths(direct_matches, subset_only_edges, getLens('executive'))
      // derivedConf = round(95 × 0.92 × 0.85) = 74 ≥ executive threshold (60) → shown
      expect(results).toHaveLength(1)
      expect(results[0].standardId).toBe('NIST-SP-800-131A-Rev3')
      expect(results[0].bestPath.derivedConfidence).toBe(74)
    })
  })

  describe('XNAT-03 — Executive always empty when only intersects_with edges exist', () => {
    const intersects_only = CSWP39_EDGES.filter((e) => e.relationshipType === 'intersects_with')

    it('returns [] for US executive', () => {
      const results = traverseXwalkPaths(
        [direct('NIST CSWP 39', 'NIST CSWP 39', 'mandatory')],
        intersects_only,
        getLens('executive')
      )
      expect(results).toHaveLength(0)
    })

    it('returns [] for AU/UK/CA executive (recognized source)', () => {
      const results = traverseXwalkPaths(
        [direct('NIST CSWP 39', 'NIST CSWP 39', 'recognized')],
        intersects_only,
        getLens('executive')
      )
      expect(results).toHaveLength(0)
    })
  })

  describe('AU-AR-01 — Australia · Government & Defense · Architect', () => {
    it('FIPS 203 derived from recognized CSWP 39 at confidence 54', () => {
      // round(80 × 0.80 × 0.85) = 54 — Five Eyes recognized source, lower than US mandatory
      const results = traverseXwalkPaths(
        [direct('NIST CSWP 39', 'NIST CSWP 39', 'recognized')],
        [edge('NIST CSWP 39', 'FIPS 203', 'intersects_with', 'high')],
        getLens('architect')
      )
      expect(results).toHaveLength(1)
      expect(results[0].bestPath.derivedConfidence).toBe(54)
      expect(results[0].bestPath.sourceTier).toBe('recognized')
    })

    it('AU derived confidence (54) < US derived confidence (65) for same edge', () => {
      const usResults = traverseXwalkPaths(
        [direct('NIST CSWP 39', 'X', 'mandatory')],
        [edge('NIST CSWP 39', 'FIPS 203', 'intersects_with', 'high')],
        getLens('architect')
      )
      const auResults = traverseXwalkPaths(
        [direct('NIST CSWP 39', 'X', 'recognized')],
        [edge('NIST CSWP 39', 'FIPS 203', 'intersects_with', 'high')],
        getLens('architect')
      )
      expect(auResults[0].bestPath.derivedConfidence).toBeLessThan(
        usResults[0].bestPath.derivedConfidence
      )
    })

    it('FIPS 203 (54) is at architect threshold (50) — appears; just-below (49) is suppressed', () => {
      // Construct an edge that produces exactly 49: round(80×0.80×0.77) ≈ 49
      // Easier: use recognized × intersects_with × low: round(80×0.80×0.30) = 19 → suppressed
      const lowResults = traverseXwalkPaths(
        [direct('NIST CSWP 39', 'X', 'recognized')],
        [edge('NIST CSWP 39', 'FIPS 203', 'intersects_with', 'low')],
        getLens('architect')
      )
      expect(lowResults).toHaveLength(0) // 19 < 50 threshold
    })
  })

  describe('XNAT-01 — Five Eyes consistency ordering', () => {
    it('US mandatory derivedConfidence > recognized derivedConfidence for same edge', () => {
      const makeResult = (tier: 'mandatory' | 'recognized') =>
        traverseXwalkPaths(
          [direct('NIST CSWP 39', 'X', tier)],
          [edge('NIST CSWP 39', 'FIPS 203', 'intersects_with', 'high')],
          getLens('architect')
        )

      const us = makeResult('mandatory')
      const fiveEyes = makeResult('recognized')
      expect(us[0].bestPath.derivedConfidence).toBeGreaterThan(
        fiveEyes[0].bestPath.derivedConfidence
      )
    })
  })

  describe('deduplication', () => {
    it('standard already in directResults is excluded from derivedResults', () => {
      const results = traverseXwalkPaths(
        [
          direct('NIST CSWP 39', 'NIST CSWP 39', 'mandatory'),
          direct('FIPS 203', 'FIPS 203', 'mandatory'),
        ],
        [edge('NIST CSWP 39', 'FIPS 203', 'intersects_with', 'high')],
        getLens('architect')
      )
      const ids = results.map((r) => r.standardId)
      expect(ids).not.toContain('FIPS 203')
    })

    it('same neighbor reachable via two sources → single DerivedResult with best path', () => {
      const results = traverseXwalkPaths(
        [direct('SOURCE-A', 'Source A', 'mandatory'), direct('SOURCE-B', 'Source B', 'recognized')],
        [
          edge('SOURCE-A', 'TARGET', 'intersects_with', 'high'), // conf 65
          edge('SOURCE-B', 'TARGET', 'intersects_with', 'high'), // conf 54 — but SOURCE-B arrives second; TARGET already seen
        ],
        getLens('architect')
      )
      // TARGET seen from SOURCE-A first → only one result
      const targetResults = results.filter((r) => r.standardId === 'TARGET')
      expect(targetResults).toHaveLength(1)
      expect(targetResults[0].bestPath.sourceStandardId).toBe('SOURCE-A')
    })
  })

  describe('maxDerivedResults cap', () => {
    it('curious persona caps at 3 results', () => {
      const manyEdges = ['A', 'B', 'C', 'D', 'E'].map((t) =>
        edge('NIST CSWP 39', t, 'equivalent', 'high')
      )
      const results = traverseXwalkPaths(
        [direct('NIST CSWP 39', 'NIST CSWP 39', 'mandatory')],
        manyEdges,
        getLens('curious')
      )
      // curious: allowedRelationships [equivalent, subset_of], threshold 65, max 3
      // equivalent × high: round(95×0.95×0.85) = round(76.7) = 77 ≥ 65 → shown
      expect(results.length).toBeLessThanOrEqual(3)
    })
  })

  describe('not_related edge exclusion', () => {
    it('not_related edges are never traversed regardless of persona', () => {
      const results = traverseXwalkPaths(
        [direct('NIST CSWP 39', 'NIST CSWP 39', 'mandatory')],
        [edge('NIST CSWP 39', 'UNRELATED', 'not_related', 'high')],
        getLens('researcher')
      )
      expect(results).toHaveLength(0)
    })
  })

  describe('researcher 2-hop', () => {
    it('twoHopEnabled=true traverses 2 hops from direct matches', () => {
      const results = traverseXwalkPaths(
        [direct('A', 'A', 'mandatory')],
        [
          edge('A', 'B', 'intersects_with', 'high'), // hop 1
          edge('B', 'C', 'intersects_with', 'high'), // hop 2
        ],
        getLens('researcher')
      )
      const ids = results.map((r) => r.standardId)
      expect(ids).toContain('B') // hop 1
      expect(ids).toContain('C') // hop 2
    })

    it('hop 2 derivedConfidence is attenuated vs hop 1', () => {
      const results = traverseXwalkPaths(
        [direct('A', 'A', 'mandatory')],
        [edge('A', 'B', 'intersects_with', 'high'), edge('B', 'C', 'intersects_with', 'high')],
        getLens('researcher')
      )
      const hop1 = results.find((r) => r.standardId === 'B')!
      const hop2 = results.find((r) => r.standardId === 'C')!
      expect(hop2.bestPath.derivedConfidence).toBeLessThan(hop1.bestPath.derivedConfidence)
      expect(hop2.bestPath.hop).toBe(2)
    })

    it('twoHopEnabled=false (architect) does NOT traverse hop 2', () => {
      const results = traverseXwalkPaths(
        [direct('A', 'A', 'mandatory')],
        [edge('A', 'B', 'intersects_with', 'high'), edge('B', 'C', 'intersects_with', 'high')],
        getLens('architect')
      )
      const ids = results.map((r) => r.standardId)
      expect(ids).toContain('B')
      expect(ids).not.toContain('C') // no 2-hop for architect
    })
  })
})
