// SPDX-License-Identifier: AGPL-3.0-only
//
// Scheme-under-umbrella and part-of-series links, checked against the shipped
// registry. They are relationships between two different things: they draw an
// edge, they never merge the two concepts, and a scheme or a volume does not
// inherit the cross-walk edges of the umbrella or main document it belongs to
// (nor the other way round).
import { describe, expect, it, vi } from 'vitest'
import type { ConceptXwalkRecord } from '@/data/conceptXwalkData'

const UMBRELLA = 'guidance:common-criteria'
const ANSSI = 'guidance:anssi-common-criteria-certific'
const BSI = 'guidance:bsi-common-criteria-certificat'
const IEEE_1363 = 'standard:ieee-1363'
const IEEE_1363A = 'standard:ieee-1363a'
const FIPS_203 = 'standard:fips-203'

const injected: ConceptXwalkRecord[] = vi.hoisted(() => {
  const base = {
    rationaleType: 'policy_reference' as const,
    evidence: 'test',
    verifiedDate: '2026-11-05',
    verifiedBy: 'test',
    confidence: 'high' as const,
    confidenceScore: 85,
  }
  const row = (
    id: string,
    from: string,
    to: string,
    relationshipType: ConceptXwalkRecord['relationshipType']
  ): ConceptXwalkRecord => ({
    ...base,
    xwalkId: id,
    fromConcept: from,
    toConcept: to,
    fromConceptId: from,
    toConceptId: to,
    relationshipType,
  })
  return [
    row(
      'xw-test-anssi',
      'guidance:anssi-common-criteria-certific',
      'guidance:common-criteria',
      'scheme_under'
    ),
    row(
      'xw-test-bsi',
      'guidance:bsi-common-criteria-certificat',
      'guidance:common-criteria',
      'scheme_under'
    ),
    row('xw-test-1363a', 'standard:ieee-1363a', 'standard:ieee-1363', 'part_of_series'),
    // An ordinary edge that belongs to the ANSSI scheme alone.
    row(
      'xw-test-anssi-203',
      'guidance:anssi-common-criteria-certific',
      'standard:fips-203',
      'intersects_with'
    ),
  ]
})

vi.mock('@/data/conceptXwalkData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/conceptXwalkData')>()
  return { ...actual, conceptXwalkData: [...actual.conceptXwalkData, ...injected] }
})

import { conceptByCanonicalId } from '@/data/conceptRegistry'
import { buildConceptGraph, equivalentCanonicals, hasGraphEdges } from './conceptXwalkGraph'

function ids(conceptId: string) {
  const g = buildConceptGraph(conceptId, { includeAlgoLeaves: false })
  return { nodes: new Set(g.nodes.map((n) => n.id)), edges: g.edges }
}

describe('scheme_under and part_of_series on the shipped registry', () => {
  it('the example concepts exist, or these tests prove nothing', () => {
    for (const id of [UMBRELLA, ANSSI, BSI, IEEE_1363, IEEE_1363A, FIPS_203]) {
      expect(conceptByCanonicalId.get(id), id).toBeDefined()
    }
  })

  it('the umbrella shows each national scheme as a neighbour joined by scheme_under, scheme to umbrella', () => {
    const { nodes, edges } = ids(UMBRELLA)
    expect(nodes.has(ANSSI)).toBe(true)
    expect(nodes.has(BSI)).toBe(true)
    const links = edges.filter((e) => e.relationshipType === 'scheme_under')
    expect(links.map((e) => e.source).sort()).toEqual([ANSSI, BSI].sort())
    for (const e of links) expect(e.target).toBe(UMBRELLA)
  })

  it('a volume and its main document are joined by part_of_series, volume to main document', () => {
    const { nodes, edges } = ids(IEEE_1363)
    expect(nodes.has(IEEE_1363A)).toBe(true)
    const link = edges.find((e) => e.relationshipType === 'part_of_series')
    expect(link?.source).toBe(IEEE_1363A)
    expect(link?.target).toBe(IEEE_1363)
  })

  it('no structural link makes two concepts equivalent', () => {
    for (const [a, b] of [
      [UMBRELLA, ANSSI],
      [UMBRELLA, BSI],
      [ANSSI, BSI],
      [IEEE_1363, IEEE_1363A],
    ]) {
      expect(equivalentCanonicals(conceptByCanonicalId.get(a)!), `${a} vs ${b}`).not.toContain(b)
      expect(equivalentCanonicals(conceptByCanonicalId.get(b)!), `${b} vs ${a}`).not.toContain(a)
    }
    for (const id of [UMBRELLA, ANSSI, IEEE_1363, IEEE_1363A]) {
      expect(
        ids(id).edges.some((e) => e.relationshipType === 'equivalent'),
        id
      ).toBe(false)
    }
  })

  it('a scheme keeps its own edges but the umbrella does not inherit them', () => {
    const scheme = ids(ANSSI)
    expect(scheme.nodes.has(FIPS_203)).toBe(true)
    expect(scheme.nodes.has(UMBRELLA)).toBe(true)
    const umbrella = ids(UMBRELLA)
    expect(umbrella.nodes.has(FIPS_203), 'ANSSI-only edge must not appear on the umbrella').toBe(
      false
    )
    expect(umbrella.edges.some((e) => e.id === 'xw-test-anssi-203')).toBe(false)
  })

  it('a scheme does not inherit a sibling scheme through the umbrella', () => {
    const scheme = ids(ANSSI)
    expect(scheme.nodes.has(BSI)).toBe(false)
    for (const e of scheme.edges) {
      expect(e.source === ANSSI || e.target === ANSSI, e.id).toBe(true)
    }
  })

  it('a volume does not inherit the main document edges, and the graph can be opened from either end', () => {
    for (const e of ids(IEEE_1363A).edges) {
      expect(e.source === IEEE_1363A || e.target === IEEE_1363A, e.id).toBe(true)
    }
    expect(hasGraphEdges(IEEE_1363A)).toBe(true)
    expect(hasGraphEdges(IEEE_1363)).toBe(true)
  })
})
