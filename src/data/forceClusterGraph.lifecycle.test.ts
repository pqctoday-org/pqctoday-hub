// SPDX-License-Identifier: AGPL-3.0-only
//
// Explore graph and the two life-cycle links: "replaces" is drawn (and wins over a
// plain "intersects" row for the same pair); "published by" is not drawn at all,
// because every publisher would become a hub joined to hundreds of documents.
import { describe, expect, it, vi } from 'vitest'
import type { ConceptXwalkRecord } from './conceptXwalkData'

const injected: ConceptXwalkRecord[] = vi.hoisted(() => {
  const row = (
    id: string,
    type: ConceptXwalkRecord['relationshipType'],
    from: string,
    to: string
  ): ConceptXwalkRecord => ({
    xwalkId: id,
    relationshipType: type,
    fromConcept: from,
    toConcept: to,
    fromConceptId: from,
    toConceptId: to,
    rationaleType: 'policy_reference',
    evidence: 'test',
    verifiedDate: '2026-11-08',
    verifiedBy: 'test',
    confidence: 'high',
    confidenceScore: 85,
  })
  return [
    // The overlap row comes first in the file; the replacement row for the same pair must still win.
    row('xw-t-overlap', 'intersects_with', 'standard:fips-205', 'standard:fips-204'),
    row('xw-t-replaces', 'supersedes', 'standard:fips-205', 'standard:fips-204'),
    // Both ends are drawn as nodes, so only the explicit skip keeps this out.
    row('xw-t-published', 'published_by', 'standard:fips-203', 'standard:fips-204'),
  ]
})

vi.mock('./conceptXwalkData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./conceptXwalkData')>()
  return { ...actual, conceptXwalkData: [...actual.conceptXwalkData, ...injected] }
})

import { buildForceClusterGraph, isSymmetricRel, relHeading } from './forceClusterGraph'

describe('Explore graph with life-cycle links', () => {
  it('headings: Replaces / Replaced by, and not a symmetric relation', () => {
    expect(relHeading('supersedes', 'outgoing')).toBe('Replaces')
    expect(relHeading('supersedes', 'incoming')).toBe('Replaced by')
    expect(isSymmetricRel('supersedes')).toBe(false)
  })

  it('draws "replaces" for the pair, ahead of the overlap row, and never draws "published by"', async () => {
    const graph = await buildForceClusterGraph()
    const rels = new Set(graph.edges.map((e) => e.rel))
    expect(rels.has('supersedes')).toBe(true)
    expect(rels.has('published_by')).toBe(false)

    const replaces = graph.edges.filter((e) => e.rel === 'supersedes')
    expect(replaces.length).toBeGreaterThan(0)
    const ids = new Set(graph.nodes.map((n) => n.id))
    for (const e of replaces) {
      expect(ids.has(e.from)).toBe(true)
      expect(ids.has(e.to)).toBe(true)
    }
    // The pair is joined once, by the replacement link.
    const pair = graph.edges.filter((e) => e.from === replaces[0].from && e.to === replaces[0].to)
    expect(pair.map((e) => e.rel)).toEqual(['supersedes'])
  })
})
