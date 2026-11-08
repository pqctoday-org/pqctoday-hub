// SPDX-License-Identifier: AGPL-3.0-only
//
// Concept graph with "published by" and "replaces an older edition" links:
// the publisher is a neighbour of the documents it published and is never opened as
// a centre (it would be joined to every document it published); a document with only
// a publisher link does not get a graph of its own.
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { ConceptXwalkRecord } from '@/data/conceptXwalkData'

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
    row('xw-t-pub-203', 'published_by', 'standard:fips-203', 'concept_only:org-us-nist'),
    row(
      'xw-t-pub-sibling',
      'published_by',
      'standard:lifecycle-test-sibling',
      'concept_only:org-us-nist'
    ),
    row(
      'xw-t-pub-only',
      'published_by',
      'standard:lifecycle-test-only',
      'concept_only:org-us-nist'
    ),
    row('xw-t-sup', 'supersedes', 'standard:lifecycle-test-new', 'standard:lifecycle-test-old'),
    row('xw-t-pub-new', 'published_by', 'standard:lifecycle-test-new', 'concept_only:org-us-nist'),
  ]
})

vi.mock('@/data/conceptXwalkData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/conceptXwalkData')>()
  return { ...actual, conceptXwalkData: [...actual.conceptXwalkData, ...injected] }
})

import { conceptByCanonicalId, type ConceptRegistryRow } from '@/data/conceptRegistry'
import { buildConceptGraph, hasGraphEdges } from './conceptXwalkGraph'

function node(id: string, sourceType: ConceptRegistryRow['sourceType'], label: string) {
  conceptByCanonicalId.set(id, {
    conceptId: id,
    displayLabel: label,
    sourceType,
    sourceTable: '',
    sourceRowId: '',
    primaryUrl: sourceType === 'concept_only' ? 'https://www.nist.gov/about-nist' : '',
    aliases: [],
    status: 'active',
    deprecatedAt: '',
    deprecatedReason: '',
  })
}

const PUBLISHER = 'concept_only:org-us-nist'

beforeAll(() => {
  node(PUBLISHER, 'concept_only', 'NIST')
  node('standard:lifecycle-test-only', 'standard', 'Test Only Doc')
  node('standard:lifecycle-test-new', 'standard', 'Test Edition 2')
  node('standard:lifecycle-test-old', 'standard', 'Test Edition 1')
  node('standard:lifecycle-test-sibling', 'standard', 'Test Sibling Doc')
})

describe('the concept graph with life-cycle links', () => {
  it('shows the publisher as a flagged neighbour of the document, arrow from document to publisher', () => {
    const g = buildConceptGraph('standard:fips-203', { includeAlgoLeaves: false })
    const publisher = g.nodes.find((n) => n.id === PUBLISHER)
    expect(publisher).toMatchObject({ isPublisher: true, isCenter: false, label: 'NIST' })
    const link = g.edges.find((e) => e.relationshipType === 'published_by')
    expect(link).toMatchObject({ source: 'standard:fips-203', target: PUBLISHER })
    expect(g.nodes.find((n) => n.id === 'standard:fips-203')?.isPublisher).toBeUndefined()
  })

  it("does not widen to the publisher's other documents: it stays one hop", () => {
    const g = buildConceptGraph('standard:lifecycle-test-new', { includeAlgoLeaves: false })
    expect(g.nodes.some((n) => n.id === 'standard:lifecycle-test-sibling')).toBe(false)
  })

  it('draws a replacement as an edge from the newer to the older edition', () => {
    const g = buildConceptGraph('standard:lifecycle-test-new', { includeAlgoLeaves: false })
    const link = g.edges.find((e) => e.relationshipType === 'supersedes')
    expect(link).toMatchObject({
      source: 'standard:lifecycle-test-new',
      target: 'standard:lifecycle-test-old',
    })
    expect(g.nodes.map((n) => n.id)).toEqual(
      expect.arrayContaining(['standard:lifecycle-test-old', PUBLISHER])
    )
  })

  it('never opens a publisher as the centre of a graph', () => {
    expect(buildConceptGraph(PUBLISHER)).toEqual({ nodes: [], edges: [] })
    expect(hasGraphEdges(PUBLISHER)).toBe(false)
  })

  it('a document with only a publisher link has no graph to open; a replacement link gives it one', () => {
    expect(hasGraphEdges('standard:lifecycle-test-only')).toBe(false)
    expect(hasGraphEdges('standard:lifecycle-test-new')).toBe(true)
    expect(hasGraphEdges('standard:lifecycle-test-old')).toBe(true)
  })
})
