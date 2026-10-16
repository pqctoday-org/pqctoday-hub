// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The researcher workspace's part of the evidence bundle: research
 * questions, collections shown with their saved AND current state, claim
 * matrices and reproduction records, plus the two JSON files a reviewer's
 * read-only import reads back (`collections.json`, `research.json`).
 *
 * Every evidence link is a Library record id, so a collection record shows
 * the Library's current revision, lifecycle, successor and last-verified
 * date, and what changed since it was saved.
 */
import type { ExecutiveDocument } from '@/services/storage/types'
import { EDUCATION_NOTICE } from '@/data/educationNotice'
import { cell } from '@/services/runEvidence'
import {
  LIBRARY_COLLECTION_SCHEMA,
  readCollection,
  recordState,
  type LibraryCollection,
  type SavedRecordState,
} from './libraryCollection'
import {
  currentRecord,
  entryChanges,
  type LibraryIndex,
  type RecordChange,
} from './collectionChanges'
import { readQuestion, type ResearchQuestion } from './researchQuestion'
import { readClaimMatrix, type ClaimMatrix } from './claimMatrix'
import { readReproduction, type ReproductionRecord } from './reproductionRecord'

export const COLLECTIONS_JSON_SCHEMA = 'pqctoday.evidence-bundle-collections/1'
export const RESEARCH_JSON_SCHEMA = 'pqctoday.evidence-bundle-research/1'

const updatedAt = (d: ExecutiveDocument) => d.updatedAt ?? d.createdAt
const oldestFirst = (a: ExecutiveDocument, b: ExecutiveDocument) => updatedAt(a) - updatedAt(b)
const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10)

// ── Collections ────────────────────────────────────────────────────────────

export interface BundleCollectionEntry {
  referenceId: string
  annotation: string
  addedAt: string
  saved: SavedRecordState
  /** The Library's state on the bundle date; null when the record is gone or
   * the Library was not checked. */
  current: SavedRecordState | null
  /** The id the record has now (renamed or successor), null when gone. */
  currentId: string | null
  changes: RecordChange[]
}

export interface BundleCollection {
  moduleId: string
  name: string
  status: string
  updatedAt: string
  entries: BundleCollectionEntry[]
}

/** Saved collections, each record with its saved and current state. Without
 * an index the current state is not checked (`current` is null, no changes). */
export function bundleCollections(
  documents: ExecutiveDocument[],
  index?: LibraryIndex
): BundleCollection[] {
  return documents
    .filter((d) => d.type === 'library-collection')
    .sort(oldestFirst)
    .flatMap((doc) => {
      const c = readCollection(doc)
      if (!c) return []
      return [
        {
          moduleId: doc.moduleId,
          name: c.name,
          status: doc.approvalStatus ?? 'draft',
          updatedAt: isoDate(updatedAt(doc)),
          entries: c.entries.map((e) => {
            const found = index ? currentRecord(index, e.referenceId) : undefined
            const changes = index ? entryChanges(e, index) : []
            const deprecatedTo = changes.find((x) => x.kind === 'deprecated')?.to
            return {
              referenceId: e.referenceId,
              annotation: e.annotation,
              addedAt: e.addedAt,
              saved: e.saved,
              current: found ? recordState(found.record) : null,
              currentId: found ? found.record.referenceId : (deprecatedTo ?? null),
              changes,
            }
          }),
        },
      ]
    })
}

const stateText = (s: SavedRecordState) =>
  [
    s.revision,
    s.lifecycle || 'no lifecycle',
    s.supersededBy.length ? `superseded by ${s.supersededBy.join(', ')}` : '',
    s.lastVerified ? `verified ${s.lastVerified}` : 'not re-verified',
  ]
    .filter(Boolean)
    .join(' · ')

/**
 * One collection as a bundle section: every record with its current state
 * and, when it differs, the state saved with the collection and what changed.
 */
export function collectionSectionMarkdown(c: BundleCollection, checked: boolean): string {
  const n = c.entries.length
  const changed = c.entries.filter((e) => e.changes.length > 0).length
  const lines = [
    `${n} record${n === 1 ? '' : 's'} · status ${c.status} · last updated ${c.updatedAt}` +
      (checked ? ` · ${changed} changed since saved` : ' · current Library state not checked'),
    '',
    '| Id | Title | Your annotation | Current state | State when saved (if different) | What changed |',
    '|---|---|---|---|---|---|',
    ...c.entries.map((e) => {
      const current = e.current
        ? stateText(e.current)
        : checked
          ? e.currentId
            ? `deprecated; now ${e.currentId}`
            : 'no longer in the Library'
          : '—'
      const saved = stateText(e.saved)
      const differs = !e.current || stateText(e.current) !== saved
      return `| ${cell(e.referenceId)} | ${cell(e.saved.title)} | ${cell(e.annotation) || '—'} | ${cell(current)} | ${differs ? cell(saved) : 'same'} | ${cell(e.changes.map((x) => x.text).join('; ')) || '—'} |`
    }),
  ]
  return lines.join('\n')
}

// ── Questions, claims, reproductions ──────────────────────────────────────

export interface SavedOf<T> {
  doc: ExecutiveDocument
  value: T
}

function savedOf<T>(
  documents: ExecutiveDocument[],
  read: (d: ExecutiveDocument) => T | null
): SavedOf<T>[] {
  return [...documents].sort(oldestFirst).flatMap((doc) => {
    const value = read(doc)
    return value ? [{ doc, value }] : []
  })
}

export const savedQuestions = (docs: ExecutiveDocument[]) => savedOf(docs, readQuestion)
export const savedClaimMatrices = (docs: ExecutiveDocument[]) => savedOf(docs, readClaimMatrix)
export const savedReproductions = (docs: ExecutiveDocument[]) => savedOf(docs, readReproduction)

/** The research question section: each saved question's own text. */
export function questionsSectionMarkdown(questions: SavedOf<ResearchQuestion>[]): string {
  return questions
    .map(({ doc }) =>
      [
        `Saved as "${cell(doc.title)}" · status ${doc.approvalStatus ?? 'draft'} · last updated ${isoDate(updatedAt(doc))}`,
        '',
        // The question's own headings sit under this section.
        doc.data.trim().replace(/^(#{1,4})(\s)/gm, (_m, h: string, sp: string) => `##${h}${sp}`),
      ].join('\n')
    )
    .join('\n\n')
}

// ── JSON files for read-only re-import ────────────────────────────────────

export interface CollectionsFile {
  notice: string
  schema: typeof COLLECTIONS_JSON_SCHEMA
  generated: string
  /** False when the current Library state was not checked. */
  checkedAgainstLibrary: boolean
  collections: BundleCollection[]
}

export function collectionsJson(
  collections: BundleCollection[],
  generated: Date,
  checked: boolean
): string {
  const file: CollectionsFile = {
    notice: EDUCATION_NOTICE,
    schema: COLLECTIONS_JSON_SCHEMA,
    generated: generated.toISOString(),
    checkedAgainstLibrary: checked,
    collections,
  }
  return `${JSON.stringify(file, null, 2)}\n`
}

export interface ResearchFile {
  notice: string
  schema: typeof RESEARCH_JSON_SCHEMA
  generated: string
  questions: (ResearchQuestion & { title: string; status: string })[]
  claimMatrices: (ClaimMatrix & { status: string })[]
  reproductions: (ReproductionRecord & { title: string; status: string })[]
}

export function researchJson(
  parts: {
    questions: SavedOf<ResearchQuestion>[]
    claimMatrices: SavedOf<ClaimMatrix>[]
    reproductions: SavedOf<ReproductionRecord>[]
  },
  generated: Date
): string {
  const status = (d: ExecutiveDocument) => d.approvalStatus ?? 'draft'
  const file: ResearchFile = {
    notice: EDUCATION_NOTICE,
    schema: RESEARCH_JSON_SCHEMA,
    generated: generated.toISOString(),
    questions: parts.questions.map((q) => ({
      ...q.value,
      title: q.doc.title,
      status: status(q.doc),
    })),
    claimMatrices: parts.claimMatrices.map((m) => ({ ...m.value, status: status(m.doc) })),
    reproductions: parts.reproductions.map((r) => ({
      ...r.value,
      title: r.doc.title,
      status: status(r.doc),
    })),
  }
  return `${JSON.stringify(file, null, 2)}\n`
}

/** An imported collection in the shape the change check reads, so a
 * reviewer can see what moved in the Library since the bundle was made. */
export function asLibraryCollection(c: BundleCollection): LibraryCollection {
  return {
    schema: LIBRARY_COLLECTION_SCHEMA,
    name: c.name,
    entries: c.entries.map((e) => ({
      referenceId: e.referenceId,
      annotation: e.annotation,
      addedAt: e.addedAt,
      // The state at bundle time is the baseline the reviewer compares against.
      saved: e.current ?? e.saved,
    })),
  }
}
