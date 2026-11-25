// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Update receipts (handoff 14, `UpdateReceipt`): what this learner has already been told about, so a notice
 * comes once per learner and per material revision (U04) and opening, dismissing or revisiting it never
 * makes a second one.
 *
 *  - `learnerReleaseSeen`: the Hub release the learner last looked at the "what changed" digest for.
 *  - `engaged`: for each lesson the learner has worked with (a comment, a step of an objective), the
 *    content version they were last told about, so a later revision is noticed (U01, including skipped revisions).
 *  - `noticesSeen`: (lesson tag, revision) pairs the learner has seen or dismissed.
 *
 * Device-local, key `pqc-updates`. Like My work it is NOT in the Drive sync, the embed auto-save or the
 * backup snapshot. The facts a notice is made of (versions, titles, change records) are read from the Hub's
 * own data files; this store keeps only the learner's receipts.
 */
import { create } from 'zustand'
import {
  readEnvelope,
  writeEnvelope,
  writeFailed,
  writeOk,
  type LoadStatus,
  type WriteResult,
} from './deviceLocalJson'

export const UPDATES_KEY = 'pqc-updates'
export const UPDATES_VERSION = 1

export interface EngagedLesson {
  /** The content version the learner was last told about for this lesson. */
  version: number
  /** The lesson's page id when engaged, so a retired lesson can still be named and traced to its replacement. */
  moduleId: string
  title: string
  /** The lessons listed to take first at that time (lesson tags), so a new prerequisite shows as new (A07). */
  takeFirst: string[]
}

export interface SeenNotice {
  tag: string
  revision: number
}

export interface UpdatesData {
  learnerReleaseSeen: string | null
  releaseSeenAt: string | null
  engaged: Record<string, EngagedLesson>
  noticesSeen: SeenNotice[]
}

export const EMPTY_UPDATES: UpdatesData = {
  learnerReleaseSeen: null,
  releaseSeenAt: null,
  engaged: {},
  noticesSeen: [],
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

export function migrateUpdates(persisted: unknown, fromVersion: number): UpdatesData {
  const s = isRecord(persisted) ? persisted : {}
  void fromVersion
  const engaged: Record<string, EngagedLesson> = {}
  if (isRecord(s.engaged)) {
    for (const [tag, v] of Object.entries(s.engaged)) {
      if (!isRecord(v) || typeof v.version !== 'number' || !Number.isFinite(v.version)) continue
      engaged[tag] = {
        version: v.version,
        moduleId: typeof v.moduleId === 'string' ? v.moduleId : '',
        title: typeof v.title === 'string' ? v.title : tag,
        takeFirst: Array.isArray(v.takeFirst)
          ? v.takeFirst.filter((t): t is string => typeof t === 'string')
          : [],
      }
    }
  }
  return {
    learnerReleaseSeen: typeof s.learnerReleaseSeen === 'string' ? s.learnerReleaseSeen : null,
    releaseSeenAt: typeof s.releaseSeenAt === 'string' ? s.releaseSeenAt : null,
    engaged,
    noticesSeen: Array.isArray(s.noticesSeen)
      ? s.noticesSeen.flatMap((n) =>
          isRecord(n) && typeof n.tag === 'string' && typeof n.revision === 'number'
            ? [{ tag: n.tag, revision: n.revision }]
            : []
        )
      : [],
  }
}

interface UpdatesState extends UpdatesData {
  loadStatus: LoadStatus
  /** First visit only: treat the current release as already seen, so a new learner starts caught up. */
  seedRelease: (release: string, now?: Date) => WriteResult<boolean>
  /** Remember which version of each lesson the learner has been told about. Lessons already known are left alone. */
  noteEngaged: (lessons: Record<string, EngagedLesson>) => WriteResult<number>
  /** Mark a notice seen, and move the learner's baseline for that lesson up to the revision. */
  markNoticeSeen: (tag: string, revision: number, lesson?: EngagedLesson) => WriteResult<boolean>
  markReleaseSeen: (release: string, now?: Date) => WriteResult<boolean>
  rehydrate: () => LoadStatus
}

const pick = (s: UpdatesData): UpdatesData => ({
  learnerReleaseSeen: s.learnerReleaseSeen,
  releaseSeenAt: s.releaseSeenAt,
  engaged: s.engaged,
  noticesSeen: s.noticesSeen,
})

const initial = readEnvelope<UpdatesData>(UPDATES_KEY, UPDATES_VERSION, migrateUpdates, () => ({
  ...EMPTY_UPDATES,
}))

export const useUpdatesStore = create<UpdatesState>()((set, get) => {
  function commit<T>(next: UpdatesData, value: T): WriteResult<T> {
    const written = writeEnvelope(UPDATES_KEY, UPDATES_VERSION, next)
    if (!written.ok) return written
    set(next)
    return writeOk(value)
  }

  return {
    ...initial.state,
    loadStatus: initial.status,

    seedRelease: (release, now = new Date()) => {
      const d = pick(get())
      if (d.learnerReleaseSeen !== null) return writeOk(false)
      return commit({ ...d, learnerReleaseSeen: release, releaseSeenAt: now.toISOString() }, true)
    },

    noteEngaged: (lessons) => {
      const d = pick(get())
      const fresh = Object.entries(lessons).filter(([tag]) => !(tag in d.engaged))
      if (fresh.length === 0) return writeOk(0)
      return commit({ ...d, engaged: { ...d.engaged, ...Object.fromEntries(fresh) } }, fresh.length)
    },

    markNoticeSeen: (tag, revision, lesson) => {
      if (!tag || !Number.isFinite(revision)) return writeFailed('invalid')
      const d = pick(get())
      const already = d.noticesSeen.some((n) => n.tag === tag && n.revision === revision)
      const prior = d.engaged[tag]
      const base = lesson ?? prior
      const moved = base !== undefined && (prior === undefined || prior.version < revision)
      if (already && !moved) return writeOk(false) // one notice, one record (U04)
      return commit(
        {
          ...d,
          noticesSeen: already ? d.noticesSeen : [...d.noticesSeen, { tag, revision }],
          engaged: moved ? { ...d.engaged, [tag]: { ...base, version: revision } } : d.engaged,
        },
        true
      )
    },

    markReleaseSeen: (release, now = new Date()) => {
      const d = pick(get())
      if (d.learnerReleaseSeen === release) return writeOk(false)
      return commit({ ...d, learnerReleaseSeen: release, releaseSeenAt: now.toISOString() }, true)
    },

    rehydrate: () => {
      const loaded = readEnvelope<UpdatesData>(UPDATES_KEY, UPDATES_VERSION, migrateUpdates, () =>
        pick(get())
      )
      set({ ...loaded.state, loadStatus: loaded.status })
      return loaded.status
    },
  }
})

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === UPDATES_KEY) useUpdatesStore.getState().rehydrate()
  })
}
