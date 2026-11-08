// SPDX-License-Identifier: AGPL-3.0-only
//
// Rules for the two life-cycle links in the concept cross-walk:
//
//   published_by  from = a document, to = the organisation that published it
//   supersedes    from = the newer edition, to = the older edition it replaces
//
// Both read as facts about documents, so a row is drawn only when the facts it
// rests on can be checked here:
//
// - A publisher is a curated organisation. The organisation node is a
//   `concept_only` registry row whose id is `concept_only:org-<id>`, where
//   `<id>` is an entry in the curated source-organisations list. A publisher is
//   never inferred from a catalogue text column, and an organisation that is not
//   on the list is not drawn.
// - A document that is still a draft does not replace anything. SP 800-131A
//   Rev 3 and SP 800-57 Part 1 Rev 6 are initial public drafts: they do not yet
//   replace Rev 2 and Rev 5, so no "replaces an older edition" link is drawn
//   from them until the Library records them as released.
//
// `dropUndrawableLifecycleLinks` runs when the cross-walk file is loaded, so
// every view (side panel, phone sheet, concept graph, Explore graph) sees only
// rows that pass. The rejected rows are returned too, so the shipped-data test
// can fail when a data file carries one.
import type { ConceptXwalkRecord } from './conceptXwalkData'
import { conceptByCanonicalId, type ConceptRegistryRow } from './conceptRegistry'
import { findLibraryItemByRef } from './libraryData'
import { getFrameworkById } from './complianceData'
import { sourceOrganizationById, type SourceOrganization } from './sourceOrganizations'

/** Registry id prefix of a publisher node: `concept_only:org-<curated organisation id>`. */
export const PUBLISHER_CONCEPT_PREFIX = 'concept_only:org-'

export interface RejectedLifecycleLink {
  record: ConceptXwalkRecord
  /** Plain-words reason, safe to show in a test failure. */
  reason: string
}

/** What the rules need to know about the data; the defaults read the shipped registry, Library and Compliance rows. */
export interface LifecycleLookups {
  registryRow: (conceptId: string) => ConceptRegistryRow | undefined
  /** True when the record is a draft (not yet released), by the Library or Compliance record behind it. */
  isDraft: (conceptId: string) => boolean
}

/** The curated organisation behind a publisher node id, or null when the id is not a publisher node. */
export function publisherOrganizationFor(
  conceptId: string,
  registryRow: LifecycleLookups['registryRow'] = (id) => conceptByCanonicalId.get(id)
): SourceOrganization | null {
  if (!conceptId.startsWith(PUBLISHER_CONCEPT_PREFIX)) return null
  const row = registryRow(conceptId)
  if (!row || row.sourceType !== 'concept_only') return null
  return sourceOrganizationById(conceptId.slice(PUBLISHER_CONCEPT_PREFIX.length))
}

/** True for a registry node that stands for a curated publishing organisation, not for a document. */
export function isPublisherConceptId(conceptId: string): boolean {
  return publisherOrganizationFor(conceptId) !== null
}

function libraryRefsBehind(row: ConceptRegistryRow): string[] {
  const refs: string[] = []
  if (row.sourceTable === 'library' && row.sourceRowId) refs.push(row.sourceRowId)
  for (const alias of row.aliases) {
    if (alias.startsWith('library:')) refs.push(alias.slice('library:'.length))
  }
  return refs
}

/**
 * Whether the record behind a registry id is still a draft.
 * - A Library-backed record is a draft when its lifecycle label is "Draft"
 *   (this also covers proposals and Internet-Drafts).
 * - A Compliance-backed record is a draft when its binding status is "draft"
 *   or any Library document it cites is one: the row for SP 800-131A Rev 3
 *   cites the Rev 3 draft.
 * An id that is not in the registry is not known to be a draft; the rules
 * reject such an id for other reasons.
 */
export function isDraftConcept(conceptId: string): boolean {
  const row = conceptByCanonicalId.get(conceptId)
  if (!row) return false
  const isDraftRef = (ref: string) => findLibraryItemByRef(ref)?.lifecycleLabel === 'Draft'
  if (libraryRefsBehind(row).some(isDraftRef)) return true
  if (row.sourceTable === 'compliance' && row.sourceRowId) {
    const framework = getFrameworkById(row.sourceRowId)
    if (framework?.bindingStatus === 'draft') return true
    if ((framework?.libraryRefs ?? []).some(isDraftRef)) return true
  }
  return false
}

const DEFAULT_LOOKUPS: LifecycleLookups = {
  registryRow: (id) => conceptByCanonicalId.get(id),
  isDraft: isDraftConcept,
}

/**
 * Why this row must not be drawn, or null when it may be. Rows of any other
 * relationship type always pass.
 */
export function lifecycleLinkProblem(
  record: ConceptXwalkRecord,
  lookups: LifecycleLookups = DEFAULT_LOOKUPS
): string | null {
  const { fromConceptId: from, toConceptId: to } = record

  if (record.relationshipType === 'supersedes') {
    if (!from || !to) return 'a replacement link needs both editions to be registered records'
    if (from === to) return 'a document cannot replace itself'
    if (!lookups.registryRow(from)) return 'the newer edition is not a registered record'
    // The draft rule comes before the other checks on purpose: it is the one the
    // reader would notice (a draft shown as already replacing a released edition).
    if (lookups.isDraft(from))
      return 'the newer edition is still a draft, so it replaces nothing yet'
    if (!lookups.registryRow(to)) return 'the older edition is not a registered record'
    if (
      publisherOrganizationFor(from, lookups.registryRow) ||
      publisherOrganizationFor(to, lookups.registryRow)
    ) {
      return 'an organisation is not an edition'
    }
    return null
  }

  if (record.relationshipType === 'published_by') {
    if (!from || !to)
      return 'a publisher link needs the document and the publisher to be registered'
    if (!lookups.registryRow(from)) return 'the document is not a registered record'
    if (publisherOrganizationFor(from, lookups.registryRow)) {
      return 'the document end is an organisation'
    }
    if (!publisherOrganizationFor(to, lookups.registryRow)) {
      return 'the publisher is not a curated source organisation'
    }
    return null
  }

  return null
}

/** Replacement links that run in a circle (A replaces B replaces A), as the ids on each circle. */
export function supersedesCycles(records: readonly ConceptXwalkRecord[]): string[][] {
  const olderOf = new Map<string, string[]>()
  for (const r of records) {
    if (r.relationshipType !== 'supersedes' || !r.fromConceptId || !r.toConceptId) continue
    const list = olderOf.get(r.fromConceptId) ?? []
    list.push(r.toConceptId)
    olderOf.set(r.fromConceptId, list)
  }
  const cycles: string[][] = []
  const done = new Set<string>()
  const walk = (id: string, path: string[]) => {
    const at = path.indexOf(id)
    if (at >= 0) {
      cycles.push(path.slice(at))
      return
    }
    if (done.has(id)) return
    for (const next of olderOf.get(id) ?? []) walk(next, [...path, id])
    done.add(id)
  }
  for (const id of olderOf.keys()) walk(id, [])
  return cycles
}

/**
 * First-pass scope for publisher links: a document gets one only when it is
 * already in at least one other (non-publisher) link. Returns the publisher
 * rows that break this, so a data check can list them.
 */
export function publisherLinksOutsideScope(
  records: readonly ConceptXwalkRecord[]
): ConceptXwalkRecord[] {
  const inOtherLink = new Set<string>()
  for (const r of records) {
    if (r.relationshipType === 'published_by') continue
    if (r.fromConceptId) inOtherLink.add(r.fromConceptId)
    if (r.toConceptId) inOtherLink.add(r.toConceptId)
  }
  return records.filter(
    (r) => r.relationshipType === 'published_by' && !inOtherLink.has(r.fromConceptId)
  )
}

/**
 * Splits the loaded rows into those that may be drawn and those that may not.
 * Order is kept. A replacement row that sits on a circle is rejected with the
 * rest of the circle.
 */
export function dropUndrawableLifecycleLinks(
  records: readonly ConceptXwalkRecord[],
  lookups: LifecycleLookups = DEFAULT_LOOKUPS
): { kept: ConceptXwalkRecord[]; rejected: RejectedLifecycleLink[] } {
  const kept: ConceptXwalkRecord[] = []
  const rejected: RejectedLifecycleLink[] = []
  for (const record of records) {
    const reason = lifecycleLinkProblem(record, lookups)
    if (reason) rejected.push({ record, reason })
    else kept.push(record)
  }

  const onCircle = new Set(supersedesCycles(kept).flat())
  if (onCircle.size === 0) return { kept, rejected }

  const afterCircles: ConceptXwalkRecord[] = []
  for (const record of kept) {
    const inCircle =
      record.relationshipType === 'supersedes' &&
      onCircle.has(record.fromConceptId) &&
      onCircle.has(record.toConceptId)
    if (inCircle) {
      rejected.push({ record, reason: 'replacement links run in a circle' })
    } else {
      afterCircles.push(record)
    }
  }
  return { kept: afterCircles, rejected }
}
