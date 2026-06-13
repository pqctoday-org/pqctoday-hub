import { describe, it, expect } from 'vitest'
import {
  libraryData,
  computeCitationCounts,
  attachPriorRevisions,
  type LibraryItem,
  type PriorRevision,
} from './libraryData'

describe('libraryData', () => {
  it('loads without error', () => {
    expect(libraryData.length).toBeGreaterThan(0)
  })

  it('produces expected typescript shape', () => {
    for (const item of libraryData) {
      expect(typeof item).toBe('object')
      expect(item).not.toBeNull()
    }
  })

  it('has required non-empty fields', () => {
    for (const item of libraryData) {
      expect(item.referenceId).toBeTruthy()
    }
  })

  it('has unique primary keys or combination keys', () => {
    const ids = libraryData.map((item) => item.referenceId)
    const validIds = ids.filter((id) => id)
    const uniqueIds = new Set(validIds)
    if (validIds.length > 0) {
      expect(uniqueIds.size).toBe(validIds.length)
    }
  })

  it('derives a citationCount field on every item', () => {
    for (const item of libraryData) {
      expect(typeof item.citationCount).toBe('number')
      expect(item.citationCount).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('attachPriorRevisions', () => {
  const item = (referenceId: string, extra: Partial<LibraryItem> = {}): LibraryItem =>
    ({
      referenceId,
      documentTitle: referenceId,
      downloadUrl: '',
      initialPublicationDate: '',
      lastUpdateDate: '',
      documentStatus: 'Draft',
      documentStatusBucket: 'Draft',
      shortDescription: '',
      documentType: '',
      applicableIndustries: [],
      authorsOrOrganization: '',
      dependencies: '',
      regionScope: '',
      algorithmFamily: '',
      securityLevels: '',
      protocolOrToolImpact: '',
      toolchainSupport: '',
      migrationUrgency: '',
      categories: [],
      ...extra,
    }) as LibraryItem
  const prior = (
    referenceId: string,
    supersededBy: string,
    extra: Partial<PriorRevision> = {}
  ): PriorRevision => ({
    referenceId,
    documentTitle: referenceId,
    documentStatus: 'Internet-Draft',
    documentStatusBucket: 'Draft',
    downloadUrl: `https://example.org/${referenceId}`,
    supersededBy,
    deprecatedAt: '2026-06-06',
    ...extra,
  })

  it('attaches deprecated revisions to their surviving record only', () => {
    const items = [item('SURV'), item('OTHER')]
    const priors = [prior('OLD-1', 'SURV'), prior('OLD-2', 'SURV')]
    const out = attachPriorRevisions(items, priors)
    const surv = out.find((i) => i.referenceId === 'SURV')!
    const other = out.find((i) => i.referenceId === 'OTHER')!
    expect(surv.priorRevisions?.length).toBe(2)
    expect(other.priorRevisions).toBeUndefined()
    // deprecated rows never become their own items
    expect(out.map((i) => i.referenceId)).toEqual(['SURV', 'OTHER'])
  })

  it('computes the most-advanced groupStatusBucket across the group', () => {
    const items = [item('SURV', { documentStatusBucket: 'Draft' })]
    const priors = [prior('OLD', 'SURV', { documentStatusBucket: 'Published' })]
    const out = attachPriorRevisions(items, priors)
    expect(out[0].groupStatusBucket).toBe('Published')
  })

  it('ignores priors with no supersededBy', () => {
    const out = attachPriorRevisions([item('SURV')], [prior('X', '')])
    expect(out[0].priorRevisions).toBeUndefined()
  })

  it('hides a same-RFC-number id-alias prior, but keeps genuine older revisions', () => {
    const surv = item('RFC 8391', { downloadUrl: 'https://www.rfc-editor.org/rfc/rfc8391.html' })
    const aliasOnly = attachPriorRevisions(
      [surv],
      [
        prior('IETF RFC 8391', 'RFC 8391', {
          downloadUrl: 'https://www.rfc-editor.org/rfc/rfc8391.html',
        }),
      ]
    )
    expect(aliasOnly[0].priorRevisions).toBeUndefined() // alias hidden -> no revisions shown

    const mixed = attachPriorRevisions(
      [surv],
      [
        prior('IETF RFC 8391', 'RFC 8391', {
          downloadUrl: 'https://www.rfc-editor.org/rfc/rfc8391.html',
        }),
        prior('draft-old-xmss-02', 'RFC 8391'), // genuine older draft -> kept
      ]
    )
    expect(mixed[0].priorRevisions?.map((r) => r.referenceId)).toEqual(['draft-old-xmss-02'])
  })
})

describe('libraryData revision collapse (real data)', () => {
  it('collapses the Merkle-Tree-Certs revisions into one surviving tile', () => {
    const ids = new Set(libraryData.map((i) => i.referenceId))
    // survivor present, deprecated members absent from the grid
    expect(ids.has('draft-ietf-plants-merkle-tree-certs')).toBe(true)
    expect(ids.has('draft-ietf-tls-merkle-tree-certs')).toBe(false)
    expect(ids.has('draft-ietf-plants-merkle-tree-certs-00')).toBe(false)
    const surv = libraryData.find((i) => i.referenceId === 'draft-ietf-plants-merkle-tree-certs')!
    expect(surv.priorRevisions?.length ?? 0).toBeGreaterThanOrEqual(2)
    expect(surv.groupStatusBucket).toBeDefined()
  })

  it('child instances in the dependency tree carry the same enrichment (priorRevisions)', () => {
    // Regression: buildTree must run AFTER attachPriorRevisions/status so a record
    // reached via parent.children is the SAME enriched object findByRef would return.
    const topLevel = new Map(libraryData.map((i) => [i.referenceId, i]))
    const walk = (items: typeof libraryData) => {
      for (const child of items) {
        const top = topLevel.get(child.referenceId)
        if (top?.priorRevisions?.length) {
          expect(child.priorRevisions?.length).toBe(top.priorRevisions.length)
        }
        if (child.children?.length) walk(child.children)
      }
    }
    walk(libraryData)
  })

  it('never exposes a deprecated row as its own tile', () => {
    // every priorRevision id must NOT appear as a top-level library item
    const ids = new Set(libraryData.map((i) => i.referenceId))
    for (const item of libraryData) {
      for (const rev of item.priorRevisions ?? []) {
        expect(ids.has(rev.referenceId)).toBe(false)
        expect(rev.supersededBy).toBe(item.referenceId)
      }
    }
  })
})

describe('computeCitationCounts', () => {
  it('counts inbound references from the dependencies field', () => {
    // Plan §Tests/Unit #7 — given A.deps=[B]; C.deps=[B], B.citationCount === 2
    const items = [
      { referenceId: 'A', dependencies: 'B' },
      { referenceId: 'B', dependencies: '' },
      { referenceId: 'C', dependencies: 'B' },
    ]
    const counts = computeCitationCounts(items)
    expect(counts.get('B')).toBe(2)
    expect(counts.get('A') ?? 0).toBe(0)
    expect(counts.get('C') ?? 0).toBe(0)
  })

  it('handles semicolon-delimited multi-dep entries', () => {
    const items = [
      { referenceId: 'A', dependencies: 'X; Y; Z' },
      { referenceId: 'B', dependencies: 'X;Y' },
    ]
    const counts = computeCitationCounts(items)
    expect(counts.get('X')).toBe(2)
    expect(counts.get('Y')).toBe(2)
    expect(counts.get('Z')).toBe(1)
  })

  it('ignores self-references and empty entries', () => {
    const items = [
      { referenceId: 'A', dependencies: 'A; ; B' },
      { referenceId: 'B', dependencies: '' },
    ]
    const counts = computeCitationCounts(items)
    expect(counts.get('A') ?? 0).toBe(0)
    expect(counts.get('B')).toBe(1)
  })

  it('returns an empty map when no items have dependencies', () => {
    const items = [
      { referenceId: 'A', dependencies: '' },
      { referenceId: 'B', dependencies: '' },
    ]
    expect(computeCitationCounts(items).size).toBe(0)
  })
})
