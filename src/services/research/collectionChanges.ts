// SPDX-License-Identifier: GPL-3.0-only
/**
 * "Changed since you saved": compare each collection record's saved state
 * with the current Library row. Pure: the caller passes the Library index, so
 * the comparison is tested over fixture rows and needs no account or server.
 *
 * A record is listed when, since it was saved (or last marked as seen):
 * - its revision changed (a new draft number, or a newer update date);
 * - its lifecycle label changed (e.g. Draft → Released);
 * - it is newly superseded by another Library record;
 * - the Library re-verified it on a newer date;
 * - it was deprecated (its row retired in favour of a successor);
 * - it was renamed to a new id;
 * - it is no longer in the Library at all.
 */
import {
  recordState,
  type CollectionEntry,
  type LibraryCollection,
  type RecordStateSource,
  type SavedRecordState,
} from './libraryCollection'

export type ChangeKind =
  'revision' | 'lifecycle' | 'superseded' | 'verified' | 'deprecated' | 'renamed' | 'removed'

export interface RecordChange {
  kind: ChangeKind
  from: string
  to: string
  /** One plain sentence for the list. */
  text: string
}

/** A retired (deprecated or obsolete) Library row, kept on its survivor. */
export interface RetiredRecord {
  supersededBy: string
  deprecatedAt?: string
  reason?: string
}

export interface LibraryIndex {
  active: Map<string, RecordStateSource>
  retired: Map<string, RetiredRecord>
  /** Renamed ids: old id → current id. */
  aliases: Record<string, string>
}

/** The Library tree shape this module reads: rows, their children, and the
 * deprecated revisions collapsed into each survivor. */
export interface IndexableRecord extends RecordStateSource {
  children?: IndexableRecord[]
  priorRevisions?: {
    referenceId: string
    supersededBy: string
    deprecatedAt?: string
    deprecatedReason?: string
  }[]
}

export function buildLibraryIndex(
  items: IndexableRecord[],
  aliases: Record<string, string> = {}
): LibraryIndex {
  const active = new Map<string, RecordStateSource>()
  const retired = new Map<string, RetiredRecord>()
  const walk = (rows: IndexableRecord[]) => {
    for (const r of rows) {
      if (!active.has(r.referenceId)) active.set(r.referenceId, r)
      for (const p of r.priorRevisions ?? []) {
        if (!retired.has(p.referenceId)) {
          retired.set(p.referenceId, {
            supersededBy: p.supersededBy || r.referenceId,
            ...(p.deprecatedAt ? { deprecatedAt: p.deprecatedAt } : {}),
            ...(p.deprecatedReason ? { reason: p.deprecatedReason } : {}),
          })
        }
      }
      if (r.children?.length) walk(r.children)
    }
  }
  walk(items)
  return { active, retired, aliases }
}

/** The current row for a saved id: the same id, or the id it was renamed to. */
export function currentRecord(
  index: LibraryIndex,
  referenceId: string
): { record: RecordStateSource; renamedTo?: string } | undefined {
  const same = index.active.get(referenceId)
  if (same) return { record: same }
  // eslint-disable-next-line security/detect-object-injection
  const alias = index.aliases[referenceId]
  const renamed = alias ? index.active.get(alias) : undefined
  return renamed ? { record: renamed, renamedTo: alias } : undefined
}

const list = (ids: string[]) => ids.join(', ') || 'none'

/** What changed between a saved state and the current one (none when equal). */
export function stateChanges(saved: SavedRecordState, current: SavedRecordState): RecordChange[] {
  const out: RecordChange[] = []
  if (saved.revision !== current.revision) {
    out.push({
      kind: 'revision',
      from: saved.revision,
      to: current.revision,
      text: `New revision: ${saved.revision} → ${current.revision}`,
    })
  }
  if (saved.lifecycle !== current.lifecycle) {
    out.push({
      kind: 'lifecycle',
      from: saved.lifecycle,
      to: current.lifecycle,
      text: `Lifecycle changed: ${saved.lifecycle || 'none'} → ${current.lifecycle || 'none'}`,
    })
  }
  const added = current.supersededBy.filter((id) => !saved.supersededBy.includes(id))
  if (added.length) {
    out.push({
      kind: 'superseded',
      from: list(saved.supersededBy),
      to: list(current.supersededBy),
      text: `Newly superseded by ${added.join(', ')}`,
    })
  }
  if (current.lastVerified && current.lastVerified > saved.lastVerified) {
    out.push({
      kind: 'verified',
      from: saved.lastVerified,
      to: current.lastVerified,
      text: saved.lastVerified
        ? `Re-verified: ${saved.lastVerified} → ${current.lastVerified}`
        : `Verified for the first time on ${current.lastVerified}`,
    })
  }
  return out
}

/** What changed for one collection entry, against the current Library. */
export function entryChanges(entry: CollectionEntry, index: LibraryIndex): RecordChange[] {
  const found = currentRecord(index, entry.referenceId)
  if (found) {
    const changes = stateChanges(entry.saved, recordState(found.record))
    if (found.renamedTo) {
      changes.unshift({
        kind: 'renamed',
        from: entry.referenceId,
        to: found.renamedTo,
        text: `Renamed to ${found.renamedTo}`,
      })
    }
    return changes
  }
  // Gone from the Library: listed until the user marks it as seen.
  if (entry.goneSeenAt) return []
  const retired = index.retired.get(entry.referenceId)
  if (retired) {
    return [
      {
        kind: 'deprecated',
        from: entry.saved.lifecycle,
        to: retired.supersededBy,
        text:
          `Deprecated${retired.deprecatedAt ? ` on ${retired.deprecatedAt}` : ''}; replaced by ${retired.supersededBy}` +
          (retired.reason ? ` (${retired.reason})` : ''),
      },
    ]
  }
  return [
    {
      kind: 'removed',
      from: entry.referenceId,
      to: '',
      text: 'No longer in the Library',
    },
  ]
}

export interface ChangedRecord {
  collectionModuleId: string
  collectionName: string
  referenceId: string
  /** The id to open now: the successor or new id when there is one. */
  currentId: string | null
  title: string
  changes: RecordChange[]
}

/** Every collection record that changed since it was saved, collection by
 * collection, in the collection's order. */
export function collectionChanges(
  collections: { moduleId: string; collection: LibraryCollection }[],
  index: LibraryIndex
): ChangedRecord[] {
  const out: ChangedRecord[] = []
  for (const { moduleId, collection } of collections) {
    for (const entry of collection.entries) {
      const changes = entryChanges(entry, index)
      if (changes.length === 0) continue
      const renamed = changes.find((c) => c.kind === 'renamed')?.to
      const deprecated = changes.find((c) => c.kind === 'deprecated')?.to
      const removed = changes.some((c) => c.kind === 'removed')
      out.push({
        collectionModuleId: moduleId,
        collectionName: collection.name,
        referenceId: entry.referenceId,
        currentId: removed ? null : (renamed ?? deprecated ?? entry.referenceId),
        title: entry.saved.title,
        changes,
      })
    }
  }
  return out
}

/** The lookup "Mark as seen" uses: the current row, following renames. */
export const indexLookup =
  (index: LibraryIndex) =>
  (id: string): RecordStateSource | undefined =>
    currentRecord(index, id)?.record
