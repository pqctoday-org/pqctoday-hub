// SPDX-License-Identifier: AGPL-3.0-only
/**
 * My work: the learner's own comments, tracked outputs, saved answers and saved references.
 *
 * Rules this store enforces (handoff sections 5, 9.9, 11, 14, 15; requirements C01 to C08, O01 to O08):
 *  - Device-local. Key `pqc-my-work`. NOT in the Drive sync, the embed auto-save or the backup
 *    snapshot (`syncWatchedStores.test.ts` and `myWorkOutOfSync.test.ts` pin this).
 *  - Keyed by canonical tag, never by route.
 *  - Nothing here is progress. No action reads or writes the module store, an objective, a
 *    checkpoint or evidence (C04, O05).
 *  - Writes are idempotent (J08, O07): the same comment id, tool run id or tag is one record.
 *  - A write is made to the device first. If it fails, nothing changes in memory and the caller gets
 *    the reason, so the typed text can stay in its box and a retry commits once (A21).
 *
 * Versioned with a migration and a load guard, like every other persisted store (see
 * `myWorkStore.test.ts`, which pins these the way `persistence-conventions.test.ts` does for persist stores).
 */
import { create } from 'zustand'
import {
  newId,
  readEnvelope,
  stableId,
  writeEnvelope,
  writeFailed,
  writeOk,
  type LoadStatus,
  type WriteResult,
} from './deviceLocalJson'
import { currentContentVersion, parseTag, type AnchorKind } from '@/services/myWork/tags'

export const MY_WORK_KEY = 'pqc-my-work'
export const MY_WORK_VERSION = 1
export const MAX_COMMENT_LENGTH = 4000

// ── Records ──────────────────────────────────────────────────────────────────

export interface MyComment {
  id: string
  /** Canonical tag of what the comment is about: a lesson, section or step. */
  tag: string
  anchorKind: AnchorKind
  body: string
  createdAt: string
  updatedAt: string
  /** The lesson's content version when this was written, or last edited (C03, C06). */
  contentVersion: number
  /** True once the learner has saved an edit (C06). */
  edited: boolean
}

export type OutputKind = 'business' | 'technical' | 'draft' | 'answer'
export type OutputRefType = 'executive-document' | 'history-event' | 'local-draft'
export type OutputStorage = 'document' | 'link' | 'payload'
export type ApprovalStatus = 'draft' | 'in-review' | 'approved'

export interface TrackedOutput {
  id: string
  kind: OutputKind
  producer: { toolId: string; route: string }
  ref: { type: OutputRefType; id: string }
  title: string
  storage: OutputStorage
  approvalStatus?: ApprovalStatus
  createdAt: string
  updatedAt: string
  /** The objective the learner filed it under, if any (O03). Absent means not filed. */
  objectiveId?: string
  /** The step it was launched from, if any. */
  stepTag?: string
  /** One record per tool run (O07). */
  runId: string
  /** Unfilled fields in a draft, when the tool states them (A15). */
  unfilledFields?: number
}

export interface SavedAnswerRecord {
  id: string
  question: string
  savedAt: string
  /** The answer as the Assistant handed it over. Kept as given; the text is read again from the Hub's records when shown. */
  payload: unknown
  objectiveId?: string
}

export interface SavedReference {
  id: string
  tag: string
  title: string
  kind: string
  savedFrom: 'assistant' | 'page'
  question?: string
  createdAt: string
  objectiveId?: string
}

export interface MyWorkData {
  comments: MyComment[]
  outputs: TrackedOutput[]
  answers: SavedAnswerRecord[]
  references: SavedReference[]
}

export const EMPTY_MY_WORK: MyWorkData = { comments: [], outputs: [], answers: [], references: [] }

// ── Migration and load guard ─────────────────────────────────────────────────

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0
const num = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d)

function cleanComment(c: unknown): MyComment | null {
  if (!isRecord(c) || !str(c.id) || !str(c.tag) || typeof c.body !== 'string') return null
  const parsed = parseTag(c.tag)
  const now = new Date(0).toISOString()
  return {
    id: c.id,
    tag: c.tag,
    anchorKind: parsed?.anchorKind ?? 'module',
    body: c.body,
    createdAt: str(c.createdAt) ? c.createdAt : now,
    updatedAt: str(c.updatedAt) ? c.updatedAt : str(c.createdAt) ? c.createdAt : now,
    contentVersion: num(c.contentVersion, 1),
    edited: c.edited === true,
  }
}

function cleanOutput(o: unknown): TrackedOutput | null {
  if (!isRecord(o) || !str(o.id) || !str(o.title) || !str(o.runId)) return null
  if (!isRecord(o.producer) || !isRecord(o.ref)) return null
  const kinds: OutputKind[] = ['business', 'technical', 'draft', 'answer']
  const refs: OutputRefType[] = ['executive-document', 'history-event', 'local-draft']
  const stores: OutputStorage[] = ['document', 'link', 'payload']
  if (!kinds.includes(o.kind as OutputKind) || !refs.includes(o.ref.type as OutputRefType))
    return null
  const now = new Date(0).toISOString()
  return {
    id: o.id,
    kind: o.kind as OutputKind,
    producer: {
      toolId: str(o.producer.toolId) ? o.producer.toolId : '',
      route: str(o.producer.route) ? o.producer.route : '',
    },
    ref: { type: o.ref.type as OutputRefType, id: str(o.ref.id) ? o.ref.id : '' },
    title: o.title,
    storage: stores.includes(o.storage as OutputStorage) ? (o.storage as OutputStorage) : 'link',
    approvalStatus: ['draft', 'in-review', 'approved'].includes(o.approvalStatus as string)
      ? (o.approvalStatus as ApprovalStatus)
      : undefined,
    createdAt: str(o.createdAt) ? o.createdAt : now,
    updatedAt: str(o.updatedAt) ? o.updatedAt : now,
    objectiveId: str(o.objectiveId) ? o.objectiveId : undefined,
    stepTag: str(o.stepTag) ? o.stepTag : undefined,
    runId: o.runId,
    unfilledFields: typeof o.unfilledFields === 'number' ? o.unfilledFields : undefined,
  }
}

function cleanAnswer(a: unknown): SavedAnswerRecord | null {
  if (!isRecord(a) || !str(a.id) || typeof a.question !== 'string') return null
  return {
    id: a.id,
    question: a.question,
    savedAt: str(a.savedAt) ? a.savedAt : new Date(0).toISOString(),
    payload: a.payload ?? null,
    objectiveId: str(a.objectiveId) ? a.objectiveId : undefined,
  }
}

function cleanReference(r: unknown): SavedReference | null {
  if (!isRecord(r) || !str(r.id) || !str(r.tag)) return null
  return {
    id: r.id,
    tag: r.tag,
    title: str(r.title) ? r.title : r.tag,
    kind: str(r.kind) ? r.kind : 'record',
    savedFrom: r.savedFrom === 'assistant' ? 'assistant' : 'page',
    question: str(r.question) ? r.question : undefined,
    createdAt: str(r.createdAt) ? r.createdAt : new Date(0).toISOString(),
    objectiveId: str(r.objectiveId) ? r.objectiveId : undefined,
  }
}

const list = <T>(v: unknown, clean: (x: unknown) => T | null): T[] =>
  Array.isArray(v) ? v.flatMap((x) => clean(x) ?? []) : []

/**
 * Bring any stored shape to the current one. Each step is a separate block so a later version adds one
 * block and leaves the earlier ones alone. A record that cannot be read is dropped; the whole file never is.
 */
export function migrateMyWork(persisted: unknown, fromVersion: number): MyWorkData {
  const state = isRecord(persisted) ? persisted : {}
  // v0 (no envelope version) and v1 share the shape; the lists are re-checked so a damaged entry cannot crash a screen.
  void fromVersion
  return {
    comments: list(state.comments, cleanComment),
    outputs: list(state.outputs, cleanOutput),
    answers: list(state.answers, cleanAnswer),
    references: list(state.references, cleanReference),
  }
}

// ── Store ────────────────────────────────────────────────────────────────────

export interface AddCommentInput {
  /** Made when the box opens, so a retry after a failure is the same comment (J08). */
  id: string
  tag: string
  body: string
  now?: Date
}

export interface RegisterOutputInput {
  kind: OutputKind
  producer: { toolId: string; route: string }
  ref: { type: OutputRefType; id: string }
  title: string
  storage: OutputStorage
  approvalStatus?: ApprovalStatus
  /** One record per tool run (O07). */
  runId: string
  objectiveId?: string
  stepTag?: string
  unfilledFields?: number
  now?: Date
}

export interface SaveReferenceInput {
  tag: string
  title: string
  kind: string
  savedFrom: 'assistant' | 'page'
  question?: string
  objectiveId?: string
  now?: Date
}

interface MyWorkState extends MyWorkData {
  /** How the stored data was found when this page loaded. */
  loadStatus: LoadStatus
  addComment: (input: AddCommentInput) => WriteResult<MyComment>
  editComment: (id: string, body: string, now?: Date) => WriteResult<MyComment>
  deleteComment: (id: string) => WriteResult<string>
  registerOutput: (input: RegisterOutputInput) => WriteResult<TrackedOutput>
  /** Register many in one write. Used to bring in the outputs the Hub already holds (phase 1). */
  registerOutputs: (
    inputs: RegisterOutputInput[]
  ) => WriteResult<{ added: number; updated: number }>
  /** File an output under an objective (and step), or pass null to keep it not filed (O03). */
  fileOutput: (id: string, objectiveId: string | null, stepTag?: string) => WriteResult<string>
  removeOutput: (id: string) => WriteResult<string>
  saveAnswer: (
    record: SavedAnswerRecord
  ) => WriteResult<{ record: SavedAnswerRecord; duplicate: boolean }>
  removeAnswer: (id: string) => WriteResult<string>
  saveReference: (
    input: SaveReferenceInput
  ) => WriteResult<{ record: SavedReference; duplicate: boolean }>
  removeReference: (id: string) => WriteResult<string>
  /** Read the stored copy again (another tab wrote it, or a test changed storage). */
  rehydrate: () => LoadStatus
}

const pick = (s: MyWorkData): MyWorkData => ({
  comments: s.comments,
  outputs: s.outputs,
  answers: s.answers,
  references: s.references,
})

const initial = readEnvelope<MyWorkData>(MY_WORK_KEY, MY_WORK_VERSION, migrateMyWork, () => ({
  ...EMPTY_MY_WORK,
}))

export const useMyWorkStore = create<MyWorkState>()((set, get) => {
  /** Write first, change memory only if the write worked. `recipe` returns null for "nothing to change". */
  function commit<T>(
    recipe: (data: MyWorkData) => { next: MyWorkData; value: T } | { fail: 'invalid' } | null,
    noChange: () => T
  ): WriteResult<T> {
    const out = recipe(pick(get()))
    if (out === null) return writeOk(noChange())
    if ('fail' in out) return writeFailed(out.fail)
    const written = writeEnvelope(MY_WORK_KEY, MY_WORK_VERSION, out.next)
    if (!written.ok) return written
    set(out.next)
    return writeOk(out.value)
  }

  return {
    ...initial.state,
    loadStatus: initial.status,

    addComment: ({ id, tag, body, now = new Date() }) => {
      const text = body.trim()
      const parsed = parseTag(tag)
      if (!text || text.length > MAX_COMMENT_LENGTH || !parsed || !id) return writeFailed('invalid')
      const existing = get().comments.find((c) => c.id === id)
      if (existing) return writeOk(existing)
      const stamp = now.toISOString()
      const comment: MyComment = {
        id,
        tag,
        anchorKind: parsed.anchorKind,
        body: text,
        createdAt: stamp,
        updatedAt: stamp,
        contentVersion: currentContentVersion(tag),
        edited: false,
      }
      return commit(
        (d) => ({ next: { ...d, comments: [...d.comments, comment] }, value: comment }),
        () => comment
      )
    },

    editComment: (id, body, now = new Date()) => {
      const text = body.trim()
      const current = get().comments.find((c) => c.id === id)
      if (!current || !text || text.length > MAX_COMMENT_LENGTH) return writeFailed('invalid')
      // Saving re-stamps the comment with the lesson's current version: the learner has re-read it (C06).
      const updated: MyComment = {
        ...current,
        body: text,
        updatedAt: now.toISOString(),
        contentVersion: currentContentVersion(current.tag),
        edited: true,
      }
      return commit(
        (d) => ({
          next: { ...d, comments: d.comments.map((c) => (c.id === id ? updated : c)) },
          value: updated,
        }),
        () => updated
      )
    },

    deleteComment: (id) => {
      if (!get().comments.some((c) => c.id === id)) return writeOk(id) // already gone: one logical change
      return commit(
        (d) => ({ next: { ...d, comments: d.comments.filter((c) => c.id !== id) }, value: id }),
        () => id
      )
    },

    registerOutputs: (inputs) => {
      const valid = inputs.filter((i) => i.runId && i.title.trim())
      if (valid.length !== inputs.length) return writeFailed('invalid')
      const current = get().outputs
      const byRun = new Map(current.map((o) => [o.runId, o]))
      const next = [...current]
      let added = 0
      let updated = 0
      for (const input of valid) {
        const existing = byRun.get(input.runId)
        const stamp = (input.now ?? new Date()).toISOString()
        if (existing) {
          // Same run: refresh what can change (title, approval, the document it points at), never add a second record (O07).
          const changed =
            existing.title !== input.title.trim() ||
            existing.approvalStatus !== input.approvalStatus ||
            existing.ref.id !== input.ref.id ||
            existing.unfilledFields !== input.unfilledFields
          if (!changed) continue
          const refreshed: TrackedOutput = {
            ...existing,
            title: input.title.trim(),
            approvalStatus: input.approvalStatus,
            ref: input.ref,
            unfilledFields: input.unfilledFields,
            updatedAt: stamp,
          }
          next[next.findIndex((o) => o.id === existing.id)] = refreshed
          byRun.set(input.runId, refreshed)
          updated++
          continue
        }
        const record: TrackedOutput = {
          id: stableId('out', input.runId),
          kind: input.kind,
          producer: input.producer,
          ref: input.ref,
          title: input.title.trim(),
          storage: input.storage,
          approvalStatus: input.approvalStatus,
          createdAt: stamp,
          updatedAt: stamp,
          objectiveId: input.objectiveId,
          stepTag: input.stepTag,
          runId: input.runId,
          unfilledFields: input.unfilledFields,
        }
        next.push(record)
        byRun.set(input.runId, record)
        added++
      }
      if (added === 0 && updated === 0) return writeOk({ added, updated })
      return commit(
        (d) => ({ next: { ...d, outputs: next }, value: { added, updated } }),
        () => ({ added, updated })
      )
    },

    registerOutput: (input) => {
      const r = get().registerOutputs([input])
      if (!r.ok) return r
      const record = get().outputs.find((o) => o.runId === input.runId)
      return record ? writeOk(record) : writeFailed('invalid')
    },

    fileOutput: (id, objectiveId, stepTag) => {
      const current = get().outputs.find((o) => o.id === id)
      if (!current) return writeFailed('invalid')
      const next: TrackedOutput = {
        ...current,
        objectiveId: objectiveId ?? undefined,
        stepTag: objectiveId ? stepTag : undefined,
      }
      if (next.objectiveId === current.objectiveId && next.stepTag === current.stepTag)
        return writeOk(id)
      return commit(
        (d) => ({
          next: { ...d, outputs: d.outputs.map((o) => (o.id === id ? next : o)) },
          value: id,
        }),
        () => id
      )
    },

    removeOutput: (id) =>
      get().outputs.some((o) => o.id === id)
        ? commit(
            (d) => ({ next: { ...d, outputs: d.outputs.filter((o) => o.id !== id) }, value: id }),
            () => id
          )
        : writeOk(id),

    saveAnswer: (record) => {
      if (!record.id) return writeFailed('invalid')
      const existing = get().answers.find((a) => a.id === record.id)
      if (existing) return writeOk({ record: existing, duplicate: true })
      return commit(
        (d) => ({
          next: { ...d, answers: [...d.answers, record] },
          value: { record, duplicate: false },
        }),
        () => ({ record, duplicate: false })
      )
    },

    removeAnswer: (id) =>
      get().answers.some((a) => a.id === id)
        ? commit(
            (d) => ({ next: { ...d, answers: d.answers.filter((a) => a.id !== id) }, value: id }),
            () => id
          )
        : writeOk(id),

    saveReference: (input) => {
      if (!input.tag) return writeFailed('invalid')
      const id = stableId('ref', input.tag)
      const existing = get().references.find((r) => r.id === id)
      if (existing) return writeOk({ record: existing, duplicate: true })
      const record: SavedReference = {
        id,
        tag: input.tag,
        title: input.title || input.tag,
        kind: input.kind,
        savedFrom: input.savedFrom,
        question: input.question,
        createdAt: (input.now ?? new Date()).toISOString(),
        objectiveId: input.objectiveId,
      }
      return commit(
        (d) => ({
          next: { ...d, references: [...d.references, record] },
          value: { record, duplicate: false },
        }),
        () => ({ record, duplicate: false })
      )
    },

    removeReference: (id) =>
      get().references.some((r) => r.id === id)
        ? commit(
            (d) => ({
              next: { ...d, references: d.references.filter((r) => r.id !== id) },
              value: id,
            }),
            () => id
          )
        : writeOk(id),

    rehydrate: () => {
      const loaded = readEnvelope<MyWorkData>(MY_WORK_KEY, MY_WORK_VERSION, migrateMyWork, () =>
        pick(get())
      )
      set({ ...loaded.state, loadStatus: loaded.status })
      return loaded.status
    },
  }
})

/** A new id for a comment box, made when the box opens. */
export const newCommentId = (): string => newId('cmt')

// Another tab saved: read its copy, so two tabs never overwrite each other with stale lists.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === MY_WORK_KEY) useMyWorkStore.getState().rehydrate()
  })
}
