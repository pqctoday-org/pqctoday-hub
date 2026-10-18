import { describe, it, expect } from 'vitest'
import {
  libraryData,
  computeCitationCounts,
  attachPriorRevisions,
  attachSuccessionLinks,
  transformLibraryRow,
  type RawLibraryRow,
  detectPurpose,
  resolvePurpose,
  findLibraryItemByRef,
  REFERENCE_ID_ALIASES,
  LIBRARY_PURPOSES,
  type LibraryItem,
  type PriorRevision,
} from './libraryData'
import { LIFECYCLE_LABELS, resolveLifecycleLabel } from '../utils/libraryLifecycle'
import { loadLatestCSV } from './csvUtils'
import { isResearchTopicId } from './researchTopics'
import { LIBRARY_EXECUTIVE_PICKS } from './libraryExecutivePicks'
import { LIBRARY_OPS_PICKS } from './libraryOpsPicks'
import { LIBRARY_CURIOUS_PICKS } from './libraryCuriousPicks'

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

  it('assigns every item one of the three canonical purposes', () => {
    for (const item of libraryData) {
      expect(LIBRARY_PURPOSES).toContain(item.purpose)
    }
  })

  it('carries the current CNSA 2.0 FAQ Version 2.2 milestones and qualified hybrid position', () => {
    const faq = libraryData.find((item) => item.referenceId === 'NSA CNSA 2.0 FAQ')
    expect(faq).toBeDefined()
    expect(faq?.documentStatus).toContain('Version 2.2')
    expect(faq?.shortDescription).toContain('1 January 2027')
    expect(faq?.shortDescription).toContain('31 December 2030')
    expect(faq?.shortDescription).toContain('31 December 2031')
    expect(faq?.shortDescription).toContain('Hybrids are not generally required')
    expect(faq?.shortDescription).not.toContain('2033')
  })

  it('describes RFC 9811 as HTTP transport for CMP, not as an HSM or PQC profile', () => {
    const rfc = libraryData.find((item) => item.referenceId === 'RFC 9811')
    expect(rfc).toBeDefined()
    expect(rfc?.documentTitle).toContain('HTTP Transfer for the Certificate Management Protocol')
    expect(rfc?.shortDescription).toContain('does not define an HSM')
    expect(rfc?.shortDescription).not.toContain('ML-DSA validation')
    expect(rfc?.documentTitle).not.toContain('Hardware Security Modules')
  })
})

describe('findLibraryItemByRef', () => {
  it('resolves a live item by its current reference_id', () => {
    const anyLive = libraryData[0]
    expect(findLibraryItemByRef(anyLive.referenceId)).toBe(anyLive)
  })

  it('resolves an unknown ref to undefined rather than throwing', () => {
    expect(findLibraryItemByRef('DOES-NOT-EXIST')).toBeUndefined()
  })

  it('tolerates separator and case variants of a reference_id (FIPS-203 → FIPS 203)', () => {
    // The Assistant's page guide and a JWT workshop linked ?ref=FIPS-203,
    // which opened a "not found" notice (deep-link refresh audit, 2026-10-02).
    expect(findLibraryItemByRef('FIPS-203')?.referenceId).toBe('FIPS 203')
    expect(findLibraryItemByRef('fips_204')?.referenceId).toBe('FIPS 204')
  })

  it('every alias target that is currently active resolves to a live item', () => {
    // Aliases whose target has itself been deprecated/orphaned in the current
    // CSV snapshot are a separate data-integrity issue (see revisions.jsonl /
    // library remediation), not a bug in the alias mechanism itself — so this
    // only asserts on aliases whose target actually appears in libraryData.
    for (const [oldRef, newRef] of Object.entries(REFERENCE_ID_ALIASES)) {
      const targetIsLive = libraryData.some((item) => item.referenceId === newRef)
      if (!targetIsLive) continue
      expect(findLibraryItemByRef(oldRef)?.referenceId).toBe(newRef)
    }
  })

  it('resolves the deprecated NIST-CSWP-39 id to the live "NIST CSWP 39" revision (Grade-A remediation)', () => {
    // NIST-CSWP-39 (hyphenated) was deprecated 2026-06-06 and superseded by
    // "NIST CSWP 39" (spaced, no hyphen) — a different referenceId string.
    // LIBRARY_EXECUTIVE_PICKS[0] still points at the old hyphenated id, so
    // without this alias the executive persona's #1 "Start here" pick was a
    // dead click (detail drawer never opened).
    const resolved = findLibraryItemByRef('NIST-CSWP-39')
    expect(resolved).toBeDefined()
    expect(resolved?.referenceId).toBe('NIST CSWP 39')
  })

  it('resolves the legacy NIST-IR-8547 id to the real IR 8547, never the fabricated IPD2 row', () => {
    // NIST-IR-8547-IPD2 claimed a second draft (2026-04-12) that CSRC does not
    // list. It is deprecated with no successor, so it must neither be an alias
    // target nor surface as a prior revision of the live IR 8547 tile.
    expect(findLibraryItemByRef('NIST-IR-8547')?.referenceId).toBe('NIST IR 8547')
    const ir8547 = libraryData.find((item) => item.referenceId === 'NIST IR 8547')
    expect(ir8547).toBeDefined()
    expect((ir8547?.priorRevisions ?? []).map((p) => p.referenceId)).not.toContain(
      'NIST-IR-8547-IPD2'
    )
  })

  it('resolves every persona "Start here" pick to a real, live library item', () => {
    const allPicks = [...LIBRARY_EXECUTIVE_PICKS, ...LIBRARY_OPS_PICKS, ...LIBRARY_CURIOUS_PICKS]
    for (const pick of allPicks) {
      const resolved = findLibraryItemByRef(pick.referenceId)
      expect(
        resolved,
        `persona pick "${pick.referenceId}" (${pick.label}) did not resolve to a live library item`
      ).toBeDefined()
    }
  })
})

describe('detectPurpose', () => {
  it('routes migration-planning categories to planning (checked first)', () => {
    expect(detectPurpose('Migration Guidance', '')).toBe('planning')
    expect(detectPurpose('Program Guidance', '')).toBe('planning')
    expect(detectPurpose('National Migration Strategy', 'Roadmap')).toBe('planning')
  })

  it('routes research/news/analysis categories to education', () => {
    expect(detectPurpose('Industry & Research', '')).toBe('education')
    expect(detectPurpose('Threat Analysis', '')).toBe('education')
    expect(detectPurpose('Industry News', '')).toBe('education')
  })

  it('falls back to reference for standards/specs/protocols/policy', () => {
    expect(detectPurpose('Protocols', '')).toBe('reference')
    expect(detectPurpose('NIST Standards', '')).toBe('reference')
    expect(detectPurpose('Government & Policy', '')).toBe('reference')
    expect(detectPurpose('Algorithm Specifications', '')).toBe('reference')
  })

  it('falls back to document_type when manual_category is blank', () => {
    expect(detectPurpose('', 'Migration Playbook')).toBe('planning')
    expect(detectPurpose(undefined, 'Research Paper')).toBe('education')
    expect(detectPurpose('   ', 'Technical Specification')).toBe('reference')
  })
})

describe('resolvePurpose', () => {
  it('prefers a recognized CSV purpose column over the heuristic', () => {
    // manual_category alone would heuristically land 'planning' (contains
    // "Migration"), but a dedicated override should win.
    expect(resolvePurpose('reference', 'Migration Guidance', 'Technical Standard')).toBe(
      'reference'
    )
  })

  it('is case/whitespace-tolerant on the CSV value', () => {
    expect(resolvePurpose(' Education ', 'Industry & Research', '')).toBe('education')
  })

  it('falls back to the heuristic when the CSV value is blank or unrecognized', () => {
    expect(resolvePurpose('', 'Migration Guidance', '')).toBe('planning')
    expect(resolvePurpose(undefined, 'Protocols', '')).toBe('reference')
    expect(resolvePurpose('not-a-real-purpose', 'Protocols', '')).toBe('reference')
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
      lifecycleLabel: 'Draft',
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
    lifecycleLabel: 'Draft',
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

  it("keeps the survivor's own label: an older revision never raises it", () => {
    const items = [item('SURV', { lifecycleLabel: 'Draft' })]
    const priors = [prior('OLD', 'SURV', { lifecycleLabel: 'Released' })]
    const out = attachPriorRevisions(items, priors)
    expect(out[0].lifecycleLabel).toBe('Draft')
    expect(out[0].priorRevisions?.[0].lifecycleLabel).toBe('Released')
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

describe('library lifecycle labels (loader)', () => {
  const rawRow = (extra: Partial<RawLibraryRow> = {}): RawLibraryRow =>
    ({
      reference_id: 'DOC-1',
      document_title: 'Doc 1',
      document_status: 'Published',
      document_type: 'Standard',
      applicable_industries: '',
      dependencies: '',
      status: 'active',
      ...extra,
    }) as RawLibraryRow

  it('shows the label written in lifecycle_state', () => {
    for (const label of LIFECYCLE_LABELS) {
      const item = transformLibraryRow(rawRow({ lifecycle_state: label }))
      expect(item?.lifecycleLabel).toBe(label)
      expect(item?.lifecycleState).toBe(label)
    }
  })

  it('falls back to the status text where lifecycle_state is blank or free text', () => {
    expect(transformLibraryRow(rawRow({ document_status: 'Final' }))?.lifecycleLabel).toBe(
      'Released'
    )
    expect(
      transformLibraryRow(
        rawRow({ document_status: 'Round 4 Submission', lifecycle_state: 'current' })
      )?.lifecycleLabel
    ).toBe('Draft')
    expect(transformLibraryRow(rawRow({ lifecycle_state: '' }))?.lifecycleState).toBeUndefined()
  })

  it('keeps an old spelling in the column working', () => {
    expect(transformLibraryRow(rawRow({ lifecycle_state: 'Superseded' }))?.lifecycleLabel).toBe(
      'Historical'
    )
  })

  it('reads the newer document(s) from superseded_by on an active row', () => {
    expect(transformLibraryRow(rawRow({ superseded_by: 'NEW-1' }))?.supersededByRefs).toEqual([
      'NEW-1',
    ])
    expect(
      transformLibraryRow(rawRow({ superseded_by: 'NEW-1; NEW-2 ' }))?.supersededByRefs
    ).toEqual(['NEW-1', 'NEW-2'])
    expect(transformLibraryRow(rawRow({ superseded_by: '' }))?.supersededByRefs).toBeUndefined()
  })

  it('still skips deprecated rows (they collapse into their survivor instead)', () => {
    expect(transformLibraryRow(rawRow({ status: 'deprecated', superseded_by: 'NEW-1' }))).toBeNull()
  })

  it('gives every document in the real data one of the six labels, read by the same rule', () => {
    for (const item of libraryData) {
      expect(LIFECYCLE_LABELS, item.referenceId).toContain(item.lifecycleLabel)
      expect(item.lifecycleLabel, item.referenceId).toBe(resolveLifecycleLabel(item))
    }
  })

  it('labels a revision group by its current record only (researcher audit, 15 Oct 2026)', () => {
    // Active Internet-Drafts were shown as "Released" because one older revision
    // carried an unrecognised status. The card must match the Lifecycle filter.
    for (const item of libraryData.filter((i) => i.priorRevisions?.length)) {
      expect(LIFECYCLE_LABELS, item.referenceId).toContain(item.lifecycleLabel)
      expect(item, item.referenceId).not.toHaveProperty('groupLifecycleLabel')
    }
    const pqcAuth = libraryData.find((i) =>
      i.referenceId.startsWith('draft-ietf-ipsecme-ikev2-pqc-auth')
    )
    if (pqcAuth) expect(pqcAuth.lifecycleLabel).not.toBe('Released')
  })
})

describe('attachSuccessionLinks', () => {
  const item = (referenceId: string, supersededByRefs?: string[]): LibraryItem =>
    ({ referenceId, supersededByRefs }) as LibraryItem

  it('links an older document to the newer one, and the newer one back', () => {
    const [older, newer] = attachSuccessionLinks([item('OLD', ['NEW']), item('NEW')])
    expect(older.supersededByRefs).toEqual(['NEW'])
    expect(older.replacesRefs).toBeUndefined()
    expect(newer.replacesRefs).toEqual(['OLD'])
    expect(newer.supersededByRefs).toBeUndefined()
  })

  it('lists every older document the newer one replaces, in library order', () => {
    const out = attachSuccessionLinks([item('A', ['NEW']), item('NEW'), item('B', ['NEW'])])
    expect(out.find((i) => i.referenceId === 'NEW')?.replacesRefs).toEqual(['A', 'B'])
  })

  it('keeps several newer documents and drops repeats', () => {
    const out = attachSuccessionLinks([item('OLD', ['N1', 'N2', 'N1']), item('N1'), item('N2')])
    expect(out[0].supersededByRefs).toEqual(['N1', 'N2'])
    expect(out[1].replacesRefs).toEqual(['OLD'])
    expect(out[2].replacesRefs).toEqual(['OLD'])
  })

  it('drops a newer document that is not in the library, so no link can dangle', () => {
    const out = attachSuccessionLinks([
      item('OLD', ['GONE']),
      item('B', ['B2', 'GONE']),
      item('B2'),
    ])
    expect(out[0].supersededByRefs).toBeUndefined()
    expect(out[1].supersededByRefs).toEqual(['B2'])
  })

  it('never links a document to itself', () => {
    const out = attachSuccessionLinks([item('SELF', ['SELF'])])
    expect(out[0].supersededByRefs).toBeUndefined()
    expect(out[0].replacesRefs).toBeUndefined()
  })

  it('leaves documents with no succession untouched', () => {
    const out = attachSuccessionLinks([item('A'), item('B')])
    expect(out.map((i) => [i.supersededByRefs, i.replacesRefs])).toEqual([
      [undefined, undefined],
      [undefined, undefined],
    ])
  })

  it('holds in the real data: every link resolves and every link has its way back', () => {
    const byId = new Map(libraryData.map((i) => [i.referenceId, i]))
    for (const doc of libraryData) {
      for (const ref of doc.supersededByRefs ?? []) {
        expect(byId.get(ref)?.replacesRefs, `${doc.referenceId} -> ${ref}`).toContain(
          doc.referenceId
        )
      }
      for (const ref of doc.replacesRefs ?? []) {
        expect(byId.get(ref)?.supersededByRefs, `${ref} <- ${doc.referenceId}`).toContain(
          doc.referenceId
        )
      }
    }
  })
})

describe('library research topics (loader)', () => {
  const header =
    'reference_id,document_title,document_status,document_type,applicable_industries,dependencies,status'
  const load = (csv: string) =>
    loadLatestCSV<RawLibraryRow, LibraryItem>(
      { './library_01012026.csv': csv },
      /library_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
      transformLibraryRow
    ).data

  it('gives every row no topics when the CSV has no research_topics column', () => {
    const items = load(`${header}\nDOC-1,Doc 1,Published,Standard,,,active\n`)
    expect(items).toHaveLength(1)
    expect(items[0].researchTopics).toEqual([])
  })

  it('parses the research_topics column when present, keeping only known ids', () => {
    const items = load(
      `${header},research_topics\n` +
        'DOC-1,Doc 1,Published,Standard,,,active,cryptanalysis; Formal-Analysis\n' +
        'DOC-2,Doc 2,Published,Standard,,,active,\n' +
        'DOC-3,Doc 3,Published,Standard,,,active,not-a-topic;quantum-threat\n'
    )
    expect(items.map((i) => i.researchTopics)).toEqual([
      ['cryptanalysis', 'formal-analysis'],
      [],
      ['quantum-threat'],
    ])
  })

  it('every shipped row carries a researchTopics array of known ids', () => {
    for (const item of libraryData) {
      expect(Array.isArray(item.researchTopics)).toBe(true)
      for (const id of item.researchTopics) expect(isResearchTopicId(id)).toBe(true)
    }
  })
})
