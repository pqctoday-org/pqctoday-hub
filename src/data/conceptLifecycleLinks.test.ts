// SPDX-License-Identifier: AGPL-3.0-only
//
// The rules that decide whether a "published by" or "replaces an older edition"
// row may be drawn: a draft never replaces anything, a publisher is only ever a
// curated source organisation, and an edition is a document record.
import { describe, expect, it } from 'vitest'
import type { ConceptXwalkRecord } from './conceptXwalkData'
import { conceptByCanonicalId, type ConceptRegistryRow } from './conceptRegistry'
import {
  PUBLISHER_CONCEPT_PREFIX,
  dropUndrawableLifecycleLinks,
  isDraftConcept,
  isEarlierDate,
  isPublisherConceptId,
  isSourceRecordMissing,
  lifecycleLinkProblem,
  publisherLinksOutsideScope,
  publisherOrganizationFor,
  supersedesCycles,
  type LifecycleLookups,
} from './conceptLifecycleLinks'

function row(
  id: string,
  type: ConceptXwalkRecord['relationshipType'],
  from: string,
  to: string
): ConceptXwalkRecord {
  return {
    xwalkId: id,
    fromConcept: from,
    toConcept: to,
    fromConceptId: from,
    toConceptId: to,
    relationshipType: type,
    rationaleType: 'policy_reference',
    evidence: 'The newer edition states that it replaces the older one.',
    verifiedDate: '2026-11-08',
    verifiedBy: 'test',
    confidence: 'high',
    confidenceScore: 85,
  }
}

function registryRow(conceptId: string, sourceType: ConceptRegistryRow['sourceType']) {
  return {
    conceptId,
    displayLabel: conceptId,
    sourceType,
    sourceTable: '',
    sourceRowId: '',
    primaryUrl: '',
    aliases: [],
    status: 'active',
    deprecatedAt: '',
    deprecatedReason: '',
  } satisfies ConceptRegistryRow
}

/** A small registry and a draft list, so the rules are tested without depending on shipped rows. */
function lookups(
  drafts: string[] = [],
  extra: { missing?: string[]; dates?: Record<string, string> } = {}
): LifecycleLookups {
  const known = new Map<string, ConceptRegistryRow>([
    ['standard:doc-v2', registryRow('standard:doc-v2', 'standard')],
    ['standard:doc-v1', registryRow('standard:doc-v1', 'standard')],
    ['standard:doc-v3-draft', registryRow('standard:doc-v3-draft', 'standard')],
    ['guidance:rule-v2', registryRow('guidance:rule-v2', 'guidance')],
    ['framework:fw-v1', registryRow('framework:fw-v1', 'framework')],
    ['timeline:milestone', registryRow('timeline:milestone', 'timeline')],
    ['algorithm:alg', registryRow('algorithm:alg', 'algorithm')],
    ['concept_only:org-us-nist', registryRow('concept_only:org-us-nist', 'concept_only')],
    ['concept_only:org-made-up', registryRow('concept_only:org-made-up', 'concept_only')],
    ['concept_only:other', registryRow('concept_only:other', 'concept_only')],
  ])
  return {
    registryRow: (id) => known.get(id),
    isDraft: (id) => drafts.includes(id),
    sourceRecordMissing: (id) => (extra.missing ?? []).includes(id),
    publicationDate: (id) => extra.dates?.[id],
  }
}

describe('supersedes: "replaces an older edition"', () => {
  it('draws a released edition replacing an older registered edition', () => {
    const r = row('xw-1', 'supersedes', 'standard:doc-v2', 'standard:doc-v1')
    expect(lifecycleLinkProblem(r, lookups())).toBeNull()
  })

  it('never draws "replaces" for a draft: the newer edition must be released', () => {
    const r = row('xw-2', 'supersedes', 'standard:doc-v3-draft', 'standard:doc-v2')
    expect(lifecycleLinkProblem(r, lookups(['standard:doc-v3-draft']))).toMatch(/still a draft/)
  })

  it('a draft can still be replaced: only the newer end is tested', () => {
    const r = row('xw-3', 'supersedes', 'standard:doc-v2', 'standard:doc-v3-draft')
    expect(lifecycleLinkProblem(r, lookups(['standard:doc-v3-draft']))).toBeNull()
  })

  it('rejects a link that is missing an end, names one record twice, or names an unregistered edition', () => {
    expect(lifecycleLinkProblem(row('a', 'supersedes', '', 'standard:doc-v1'), lookups())).toMatch(
      /both editions/
    )
    expect(
      lifecycleLinkProblem(row('b', 'supersedes', 'standard:doc-v2', 'standard:doc-v2'), lookups())
    ).toMatch(/itself/)
    expect(
      lifecycleLinkProblem(row('c', 'supersedes', 'standard:unknown', 'standard:doc-v1'), lookups())
    ).toMatch(/newer edition is not a registered/)
    expect(
      lifecycleLinkProblem(row('d', 'supersedes', 'standard:doc-v2', 'standard:unknown'), lookups())
    ).toMatch(/older edition is not a registered/)
  })

  it('an organisation is not an edition', () => {
    const r = row('xw-4', 'supersedes', 'standard:doc-v2', 'concept_only:org-us-nist')
    expect(lifecycleLinkProblem(r, lookups())).toMatch(/organisation is not an edition/)
  })
})

describe('supersedes: organisation nodes, record types, dates and unknown status', () => {
  it('an organisation node is never an edition, curated or not', () => {
    for (const org of ['concept_only:org-us-nist', 'concept_only:org-made-up']) {
      expect(
        lifecycleLinkProblem(row('a', 'supersedes', 'standard:doc-v2', org), lookups()),
        `${org} as the older edition`
      ).toMatch(/organisation is not an edition/)
      expect(
        lifecycleLinkProblem(row('b', 'supersedes', org, 'standard:doc-v1'), lookups()),
        `${org} as the newer edition`
      ).toMatch(/organisation is not an edition/)
    }
  })

  it('only document records can be editions: not a milestone, an algorithm or a plain concept', () => {
    for (const other of ['timeline:milestone', 'algorithm:alg', 'concept_only:other']) {
      const asOlder = lifecycleLinkProblem(
        row('a', 'supersedes', 'standard:doc-v2', other),
        lookups()
      )
      const asNewer = lifecycleLinkProblem(
        row('b', 'supersedes', other, 'standard:doc-v1'),
        lookups()
      )
      expect(asOlder, `${other} as the older edition`).toMatch(/must be a document record/)
      expect(asNewer, `${other} as the newer edition`).toMatch(/must be a document record/)
    }
    for (const doc of ['standard:doc-v2', 'guidance:rule-v2', 'framework:fw-v1']) {
      expect(
        lifecycleLinkProblem(row('c', 'supersedes', doc, 'standard:doc-v1'), lookups()),
        doc
      ).toBeNull()
    }
  })

  it('rejects a row written the wrong way round when both Library dates are known', () => {
    const dates = { 'standard:doc-v2': '2019-05-01', 'standard:doc-v1': '2023-01-10' }
    expect(
      lifecycleLinkProblem(
        row('a', 'supersedes', 'standard:doc-v2', 'standard:doc-v1'),
        lookups([], { dates })
      )
    ).toMatch(/dated before the older edition/)
    // Right way round, equal dates and a missing date all pass.
    expect(
      lifecycleLinkProblem(
        row('b', 'supersedes', 'standard:doc-v1', 'standard:doc-v2'),
        lookups([], { dates })
      )
    ).toBeNull()
    expect(
      lifecycleLinkProblem(
        row('c', 'supersedes', 'standard:doc-v2', 'standard:doc-v1'),
        lookups([], { dates: { 'standard:doc-v2': '2020-01-01', 'standard:doc-v1': '2020-01-01' } })
      )
    ).toBeNull()
    expect(
      lifecycleLinkProblem(
        row('d', 'supersedes', 'standard:doc-v2', 'standard:doc-v1'),
        lookups([], { dates: { 'standard:doc-v1': '2023-01-10' } })
      )
    ).toBeNull()
  })

  it('compares dates only to the precision both have', () => {
    expect(isEarlierDate('2019', '2023-01-10')).toBe(true)
    expect(isEarlierDate('2023', '2023-01-10')).toBe(false)
    expect(isEarlierDate('2023-02', '2023-01-10')).toBe(false)
    expect(isEarlierDate('2023-01-09', '2023-01-10')).toBe(true)
    expect(isEarlierDate('', '2023-01-10')).toBe(false)
    expect(isEarlierDate('March 2023', '2023-01-10')).toBe(false)
  })

  it('fails closed: a newer edition whose Library or Compliance record cannot be found is not drawn', () => {
    const r = row('a', 'supersedes', 'standard:doc-v2', 'standard:doc-v1')
    expect(lifecycleLinkProblem(r, lookups([], { missing: ['standard:doc-v2'] }))).toMatch(
      /no Library or Compliance record to check/
    )
    // Only the newer end matters for the draft rule.
    expect(lifecycleLinkProblem(r, lookups([], { missing: ['standard:doc-v1'] }))).toBeNull()
  })
})

describe('published_by: "published by"', () => {
  it('draws a registered document published by a curated source organisation', () => {
    const r = row('xw-5', 'published_by', 'standard:doc-v2', 'concept_only:org-us-nist')
    expect(lifecycleLinkProblem(r, lookups())).toBeNull()
  })

  it('does not draw a publisher that is not on the curated list, even if the registry has a node for it', () => {
    const r = row('xw-6', 'published_by', 'standard:doc-v2', 'concept_only:org-made-up')
    expect(lifecycleLinkProblem(r, lookups())).toMatch(/not a curated source organisation/)
  })

  it('does not draw a concept_only row that is not built from the curated list', () => {
    const r = row('xw-7', 'published_by', 'standard:doc-v2', 'concept_only:other')
    expect(lifecycleLinkProblem(r, lookups())).toMatch(/not a curated source organisation/)
  })

  it('does not draw a document as its own publisher, or an organisation as the document', () => {
    expect(
      lifecycleLinkProblem(
        row('a', 'published_by', 'standard:doc-v2', 'standard:doc-v1'),
        lookups()
      )
    ).toMatch(/not a curated source organisation/)
    expect(
      lifecycleLinkProblem(
        row('b', 'published_by', 'concept_only:org-us-nist', 'concept_only:org-us-nist'),
        lookups()
      )
    ).toMatch(/document end is an organisation/)
    expect(
      lifecycleLinkProblem(
        row('c', 'published_by', 'standard:unknown', 'concept_only:org-us-nist'),
        lookups()
      )
    ).toMatch(/document is not a registered/)
  })

  it('an organisation node is never the document end, curated or not', () => {
    for (const org of ['concept_only:org-us-nist', 'concept_only:org-made-up']) {
      expect(
        lifecycleLinkProblem(row('a', 'published_by', org, 'concept_only:org-us-nist'), lookups()),
        org
      ).toMatch(/document end is an organisation/)
    }
  })

  it('the document end must be a document record', () => {
    for (const other of ['timeline:milestone', 'algorithm:alg', 'concept_only:other']) {
      expect(
        lifecycleLinkProblem(
          row('a', 'published_by', other, 'concept_only:org-us-nist'),
          lookups()
        ),
        other
      ).toMatch(/must be a document record/)
    }
  })

  it('other relationship types are never held to these rules', () => {
    const r = row('xw-8', 'intersects_with', 'standard:unknown', 'standard:also-unknown')
    expect(lifecycleLinkProblem(r, lookups())).toBeNull()
  })
})

describe('dropUndrawableLifecycleLinks', () => {
  it('keeps passing rows in order and lists each rejected row with its reason', () => {
    const ok = row('xw-ok', 'supersedes', 'standard:doc-v2', 'standard:doc-v1')
    const draft = row('xw-draft', 'supersedes', 'standard:doc-v3-draft', 'standard:doc-v2')
    const other = row('xw-other', 'intersects_with', 'standard:doc-v2', 'standard:doc-v1')
    const { kept, rejected } = dropUndrawableLifecycleLinks(
      [draft, ok, other],
      lookups(['standard:doc-v3-draft'])
    )
    expect(kept.map((r) => r.xwalkId)).toEqual(['xw-ok', 'xw-other'])
    expect(rejected).toHaveLength(1)
    expect(rejected[0].record.xwalkId).toBe('xw-draft')
    expect(rejected[0].reason).toMatch(/still a draft/)
  })

  it('drops replacement links that run in a circle', () => {
    const a = row('xw-a', 'supersedes', 'standard:doc-v2', 'standard:doc-v1')
    const b = row('xw-b', 'supersedes', 'standard:doc-v1', 'standard:doc-v2')
    const { kept, rejected } = dropUndrawableLifecycleLinks([a, b], lookups())
    expect(kept).toEqual([])
    expect(rejected.map((r) => r.reason)).toEqual([
      'replacement links run in a circle',
      'replacement links run in a circle',
    ])
  })
})

describe('supersedesCycles and publisherLinksOutsideScope', () => {
  it('finds a circle and ignores a chain', () => {
    const chain = [row('1', 'supersedes', 'c', 'b'), row('2', 'supersedes', 'b', 'a')]
    expect(supersedesCycles(chain)).toEqual([])
    expect(supersedesCycles([...chain, row('3', 'supersedes', 'a', 'c')]).length).toBeGreaterThan(0)
  })

  it('first pass: a publisher link is only for a document that is already in another link', () => {
    const inLink = row('1', 'intersects_with', 'standard:doc-v2', 'standard:doc-v1')
    const publisherOk = row('2', 'published_by', 'standard:doc-v2', 'concept_only:org-us-nist')
    const publisherAlone = row('3', 'published_by', 'standard:doc-v3', 'concept_only:org-us-nist')
    expect(publisherLinksOutsideScope([inLink, publisherOk, publisherAlone])).toEqual([
      publisherAlone,
    ])
  })

  it('a second publisher link does not by itself put the document in scope', () => {
    const first = row('1', 'published_by', 'standard:doc-v3', 'concept_only:org-us-nist')
    const second = row('2', 'published_by', 'standard:doc-v3', 'concept_only:org-us-nsa')
    expect(publisherLinksOutsideScope([first, second])).toEqual([first, second])
  })
})

describe('publisher nodes', () => {
  it('a publisher node id carries the curated organisation id, and only a curated one resolves', () => {
    expect(PUBLISHER_CONCEPT_PREFIX).toBe('concept_only:org-')
    const reg = lookups().registryRow
    expect(publisherOrganizationFor('concept_only:org-us-nist', reg)?.id).toBe('us-nist')
    expect(publisherOrganizationFor('concept_only:org-made-up', reg)).toBeNull()
    expect(publisherOrganizationFor('standard:doc-v2', reg)).toBeNull()
    // A node id with no registry row is not a publisher node.
    expect(publisherOrganizationFor('concept_only:org-us-nsa', reg)).toBeNull()
  })

  it('no shipped registry row is mistaken for a publisher node today', () => {
    for (const id of conceptByCanonicalId.keys()) {
      if (!id.startsWith(PUBLISHER_CONCEPT_PREFIX)) expect(isPublisherConceptId(id)).toBe(false)
    }
  })
})

describe('isDraftConcept on the shipped Library and Compliance rows', () => {
  it('SP 800-131A Rev 3 and SP 800-57 Part 1 Rev 6 are drafts, whichever record names them', () => {
    expect(isDraftConcept('standard:nist-sp-800-131a-rev3')).toBe(true)
    expect(isDraftConcept('standard:nist-sp-800-57-pt1-r6')).toBe(true)
    // The Compliance row for SP 800-131A is Rev 3 as well: its own binding status is "draft".
    expect(isDraftConcept('guidance:nist-sp800-131a')).toBe(true)
  })

  it('a Compliance row that names a Library draft by alias is a draft; a citation alone is not', () => {
    // ACVP's Compliance row carries the alias library:NIST-ACVP, a Library record labelled Draft:
    // an alias says it is the same document, so the Library's status applies.
    expect(isDraftConcept('guidance:acvp')).toBe(true)
  })

  it('fails closed on the shipped rows whose Library record cannot be found', () => {
    for (const id of [
      'standard:draft-connolly-cfrg-xwing-kem-10',
      'standard:draft-ietf-tls-hybrid-design-16',
    ]) {
      expect(conceptByCanonicalId.has(id), `${id} is in the registry`).toBe(true)
      expect(isSourceRecordMissing(id), `${id} has no Library record`).toBe(true)
      const r = row('xw-x', 'supersedes', id, 'standard:nist-sp-800-57-pt1-r5')
      expect(lifecycleLinkProblem(r), id).toMatch(/no Library or Compliance record to check/)
    }
    expect(isSourceRecordMissing('standard:nist-sp-800-57-pt1-r5')).toBe(false)
    expect(isSourceRecordMissing('guidance:fips-140-3')).toBe(false)
  })

  it('a Compliance row that only cites a draft is not a draft itself', () => {
    // Several national laws list the Rev 3 draft among their supporting reading.
    expect(isDraftConcept('guidance:at-nis2')).toBe(false)
    expect(isDraftConcept('guidance:cnsa-2')).toBe(false)
  })

  it('a released edition and an unknown id are not drafts', () => {
    expect(isDraftConcept('standard:nist-sp-800-57-pt1-r5')).toBe(false)
    expect(isDraftConcept('standard:fips-203')).toBe(false)
    expect(isDraftConcept('standard:does-not-exist')).toBe(false)
  })

  it('the shipped rules refuse the two named drafts as the newer edition', () => {
    // SP 800-131A Rev 3 -> Rev 2 (Rev 2 has no registry row yet, so the draft rule has to be the reason).
    const rev3 = row(
      'xw-131a',
      'supersedes',
      'standard:nist-sp-800-131a-rev3',
      'standard:nist-sp-800-131a-rev2'
    )
    expect(lifecycleLinkProblem(rev3)).toMatch(/still a draft/)
    // SP 800-57 Part 1 Rev 6 -> Rev 5 (both registered).
    const rev6 = row(
      'xw-57',
      'supersedes',
      'standard:nist-sp-800-57-pt1-r6',
      'standard:nist-sp-800-57-pt1-r5'
    )
    expect(lifecycleLinkProblem(rev6)).toMatch(/still a draft/)
    // The released Rev 5 is not blocked by the draft rule when it replaces an older edition.
    const rev5 = row(
      'xw-57b',
      'supersedes',
      'standard:nist-sp-800-57-pt1-r5',
      'standard:nist-sp-800-57-pt1-r4'
    )
    expect(lifecycleLinkProblem(rev5)).not.toMatch(/draft/)
  })
})
