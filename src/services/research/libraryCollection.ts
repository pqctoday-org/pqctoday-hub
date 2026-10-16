// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Library collections (researcher evidence workspace, Layer 2): a named set of
 * Library record ids, each with the user's own annotation and the record's
 * state AS IT WAS WHEN SAVED (revision, lifecycle, superseded-by, last
 * verified). Kept in the artifact store as a `library-collection` document:
 * `inputs` holds the collection, `data` its Markdown table.
 *
 * The saved state is what "Changed since you saved" (`collectionChanges.ts`)
 * compares with the current Library on each visit.
 *
 * Kept free of heavy imports: the Library drawer saves through this module.
 */
import type { ExecutiveDocument } from '@/services/storage/types'

export const LIBRARY_COLLECTION_SCHEMA = 'pqctoday.library-collection/1'

/** moduleId prefix of saved collections: `library-collection:<created ms>`. */
export const LIBRARY_COLLECTION_PREFIX = 'library-collection:'

/** The Library fields a collection reads from a record. */
export interface RecordStateSource {
  referenceId: string
  documentTitle: string
  downloadUrl?: string
  lastUpdateDate?: string
  initialPublicationDate?: string
  lifecycleLabel?: string
  supersededByRefs?: string[]
  lastVerified?: string
}

/** A record's state at one moment, as a collection stores it. */
export interface SavedRecordState {
  title: string
  revision: string
  lifecycle: string
  supersededBy: string[]
  /** '' when the Library has not re-verified the record. */
  lastVerified: string
}

export interface CollectionEntry {
  referenceId: string
  /** The user's own note on why this record is in the collection. */
  annotation: string
  /** ISO time the record was added. */
  addedAt: string
  /** The record's state when it was added (or last marked as seen). */
  saved: SavedRecordState
  /** ISO time `saved` was last refreshed with "Mark as seen"; absent until then. */
  seenAt?: string
  /** ISO time the user marked the record as seen after it left the Library
   * (deprecated or removed); it is then no longer listed as changed. */
  goneSeenAt?: string
}

export interface LibraryCollection {
  schema: typeof LIBRARY_COLLECTION_SCHEMA
  name: string
  entries: CollectionEntry[]
}

/**
 * A record's revision: the draft number for an IETF draft (`draft -07`),
 * otherwise the date the Library last recorded an update to the document.
 */
export function recordRevision(
  r: Pick<
    RecordStateSource,
    'referenceId' | 'downloadUrl' | 'lastUpdateDate' | 'initialPublicationDate'
  >
): string {
  const m = /draft-[a-z0-9-]+?-(\d{2})(?:\b|\.)/i.exec(`${r.referenceId} ${r.downloadUrl ?? ''}`)
  if (m) return `draft -${m[1]}`
  return r.lastUpdateDate?.trim() || r.initialPublicationDate?.trim() || 'not stated'
}

/** The bookmarked records found anywhere in the Library tree (top-level rows
 * and their children), in bookmark order, and the ids no longer there. */
export function recordsForBookmarks<T extends { referenceId: string; children?: T[] }>(
  all: T[],
  ids: string[]
): { records: T[]; missingIds: string[] } {
  const index = new Map<string, T>()
  const walk = (items: T[]) => {
    for (const it of items) {
      if (!index.has(it.referenceId)) index.set(it.referenceId, it)
      if (it.children?.length) walk(it.children)
    }
  }
  walk(all)
  const records: T[] = []
  const missingIds: string[] = []
  for (const id of ids) {
    const r = index.get(id)
    if (r) records.push(r)
    else missingIds.push(id)
  }
  return { records, missingIds }
}

export function recordState(r: RecordStateSource): SavedRecordState {
  return {
    title: r.documentTitle,
    revision: recordRevision(r),
    lifecycle: r.lifecycleLabel ?? '',
    supersededBy: [...(r.supersededByRefs ?? [])],
    lastVerified: r.lastVerified?.trim() ?? '',
  }
}

export const emptyCollection = (name: string): LibraryCollection => ({
  schema: LIBRARY_COLLECTION_SCHEMA,
  name: name.trim() || 'Untitled collection',
  entries: [],
})

/** Add a record, or update its annotation when it is already there. A re-add
 * keeps the state saved the first time: only "Mark as seen" moves it on. */
export function addToCollection(
  c: LibraryCollection,
  record: RecordStateSource,
  annotation: string,
  now: Date = new Date()
): LibraryCollection {
  const existing = c.entries.find((e) => e.referenceId === record.referenceId)
  if (existing) {
    return {
      ...c,
      entries: c.entries.map((e) =>
        e.referenceId === record.referenceId ? { ...e, annotation: annotation.trim() } : e
      ),
    }
  }
  return {
    ...c,
    entries: [
      ...c.entries,
      {
        referenceId: record.referenceId,
        annotation: annotation.trim(),
        addedAt: now.toISOString(),
        saved: recordState(record),
      },
    ],
  }
}

export const removeFromCollection = (c: LibraryCollection, referenceId: string) => ({
  ...c,
  entries: c.entries.filter((e) => e.referenceId !== referenceId),
})

/**
 * "Mark as seen": replace the saved state of the given records with their
 * current state, so they leave the "changed since you saved" list. A renamed
 * record takes its new id. Records the lookup cannot find (deprecated or
 * removed) keep their saved state and are marked as seen-gone.
 */
export function markSeen(
  c: LibraryCollection,
  referenceIds: string[],
  lookup: (id: string) => RecordStateSource | undefined,
  now: Date = new Date()
): LibraryCollection {
  const ids = new Set(referenceIds)
  return {
    ...c,
    entries: c.entries.map((e) => {
      if (!ids.has(e.referenceId)) return e
      const current = lookup(e.referenceId)
      if (!current) return { ...e, goneSeenAt: now.toISOString() }
      // A renamed record is kept under its new id from now on.
      return {
        ...e,
        referenceId: current.referenceId,
        saved: recordState(current),
        seenAt: now.toISOString(),
      }
    }),
  }
}

/** A new collection holding the given (bookmarked) records, in order. */
export function collectionFromRecords(
  name: string,
  records: RecordStateSource[],
  now: Date = new Date()
): LibraryCollection {
  return records.reduce((c, r) => addToCollection(c, r, '', now), emptyCollection(name))
}

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ').trim()

/** The collection as Markdown: one row per record, with the state as saved. */
export function collectionMarkdown(c: LibraryCollection): string {
  const n = c.entries.length
  return [
    `# ${c.name}`,
    '',
    `${n} Library record${n === 1 ? '' : 's'}, each with your annotation and its state when you saved it.`,
    '',
    '| Id | Title | Your annotation | Revision (saved) | Lifecycle (saved) | Superseded by (saved) | Last verified (saved) | Added |',
    '|---|---|---|---|---|---|---|---|',
    ...c.entries.map(
      (e) =>
        `| ${cell(e.referenceId)} | ${cell(e.saved.title)} | ${cell(e.annotation) || '—'} | ${cell(e.saved.revision)} | ${cell(e.saved.lifecycle) || '—'} | ${cell(e.saved.supersededBy.join('; ')) || '—'} | ${cell(e.saved.lastVerified) || 'not re-verified'} | ${e.addedAt.slice(0, 10)} |`
    ),
  ].join('\n')
}

const isString = (v: unknown): v is string => typeof v === 'string'

/** The collection held by a saved document, or null when it is not one.
 * Missing fields in an entry get safe defaults. */
export function readCollection(
  doc: Pick<ExecutiveDocument, 'type' | 'inputs'>
): LibraryCollection | null {
  if (doc.type !== 'library-collection') return null
  const c = doc.inputs as Partial<LibraryCollection> | undefined
  if (!c || c.schema !== LIBRARY_COLLECTION_SCHEMA || !Array.isArray(c.entries)) return null
  return {
    schema: LIBRARY_COLLECTION_SCHEMA,
    name: isString(c.name) ? c.name : 'Untitled collection',
    entries: c.entries
      .filter((e): e is CollectionEntry => !!e && isString((e as CollectionEntry).referenceId))
      .map((e) => ({
        referenceId: e.referenceId,
        annotation: isString(e.annotation) ? e.annotation : '',
        addedAt: isString(e.addedAt) ? e.addedAt : '',
        saved: {
          title: isString(e.saved?.title) ? e.saved.title : e.referenceId,
          revision: isString(e.saved?.revision) ? e.saved.revision : 'not stated',
          lifecycle: isString(e.saved?.lifecycle) ? e.saved.lifecycle : '',
          supersededBy: Array.isArray(e.saved?.supersededBy)
            ? e.saved.supersededBy.filter(isString)
            : [],
          lastVerified: isString(e.saved?.lastVerified) ? e.saved.lastVerified : '',
        },
        ...(isString(e.seenAt) ? { seenAt: e.seenAt } : {}),
        ...(isString(e.goneSeenAt) ? { goneSeenAt: e.goneSeenAt } : {}),
      })),
  }
}

export const newCollectionModuleId = (now: Date = new Date()) =>
  `${LIBRARY_COLLECTION_PREFIX}${now.getTime()}`

/** What saving a collection stores (see `useSaveArtifact`). */
export function collectionSaveRequest(
  c: LibraryCollection,
  moduleId: string,
  revisionSummary?: string
) {
  return {
    type: 'library-collection' as const,
    moduleId,
    title: c.name,
    data: collectionMarkdown(c),
    inputs: c,
    ...(revisionSummary ? { revisionSummary } : {}),
  }
}

/** Saved collections in the artifact store, oldest first, each with its document. */
export function savedCollections(
  documents: ExecutiveDocument[]
): { doc: ExecutiveDocument; collection: LibraryCollection }[] {
  return documents
    .filter((d) => d.type === 'library-collection')
    .sort((a, b) => a.createdAt - b.createdAt)
    .flatMap((doc) => {
      const collection = readCollection(doc)
      return collection ? [{ doc, collection }] : []
    })
}
