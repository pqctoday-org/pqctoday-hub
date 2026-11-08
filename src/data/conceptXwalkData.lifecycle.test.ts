// SPDX-License-Identifier: AGPL-3.0-only
//
// Data guard for the two life-cycle links, run on the cross-walk file the site
// ships. Today the file carries no such row, so each check holds trivially; the
// moment a data revision adds "published by" or "replaces an older edition"
// rows, every rule below applies to them. A row the loader refuses to draw
// fails here too, so a bad row cannot ship unnoticed by being silently hidden.
import { describe, expect, it } from 'vitest'
import {
  conceptXwalkData,
  conceptXwalkRejectedLifecycleLinks,
  LIFECYCLE_RELATIONSHIP_TYPES,
} from './conceptXwalkData'
import { conceptByCanonicalId } from './conceptRegistry'
import {
  isDraftConcept,
  publisherLinksOutsideScope,
  publisherOrganizationFor,
  supersedesCycles,
} from './conceptLifecycleLinks'
import { sourceOrganizationFor } from './sourceOrganizations'

const lifecycle = conceptXwalkData.filter((r) =>
  LIFECYCLE_RELATIONSHIP_TYPES.has(r.relationshipType)
)
const supersedes = lifecycle.filter((r) => r.relationshipType === 'supersedes')
const publishedBy = lifecycle.filter((r) => r.relationshipType === 'published_by')

describe('shipped "published by" and "replaces an older edition" rows', () => {
  it('the loader refused none of them', () => {
    expect(
      conceptXwalkRejectedLifecycleLinks.map((r) => `${r.record.xwalkId}: ${r.reason}`)
    ).toEqual([])
  })

  it('every row names two different, registered records and carries evidence', () => {
    for (const r of lifecycle) {
      expect(r.fromConceptId, `${r.xwalkId} from`).toBeTruthy()
      expect(r.toConceptId, `${r.xwalkId} to`).toBeTruthy()
      expect(r.fromConceptId, `${r.xwalkId} must join two different records`).not.toBe(
        r.toConceptId
      )
      expect(conceptByCanonicalId.has(r.fromConceptId), `${r.xwalkId} from in registry`).toBe(true)
      expect(conceptByCanonicalId.has(r.toConceptId), `${r.xwalkId} to in registry`).toBe(true)
      expect(r.evidence.trim().length, `${r.xwalkId} evidence`).toBeGreaterThan(0)
    }
  })

  it('no replacement link has a draft as its newer edition', () => {
    for (const r of supersedes) {
      expect(isDraftConcept(r.fromConceptId), `${r.xwalkId}: ${r.fromConcept} is a draft`).toBe(
        false
      )
    }
  })

  it('replacement links never run in a circle', () => {
    expect(supersedesCycles(supersedes)).toEqual([])
  })

  it('every publisher is a concept_only registry node built from the curated organisation list', () => {
    for (const r of publishedBy) {
      const node = conceptByCanonicalId.get(r.toConceptId)
      expect(node?.sourceType, `${r.xwalkId} publisher node type`).toBe('concept_only')
      const org = publisherOrganizationFor(r.toConceptId)
      expect(org, `${r.xwalkId}: ${r.toConceptId} is not a curated organisation`).not.toBeNull()
      // The node's own label names the same organisation as its id does.
      expect(sourceOrganizationFor(node?.displayLabel)?.id, `${r.xwalkId} label`).toBe(org?.id)
      // ...and so does its link: the graph shows the registry label and address.
      expect(node?.primaryUrl, `${r.xwalkId} address`).toBe(org?.sourceUrl)
    }
  })

  it('first pass: a publisher link is only for a document already in at least one other link', () => {
    expect(publisherLinksOutsideScope(conceptXwalkData).map((r) => r.xwalkId)).toEqual([])
  })
})
