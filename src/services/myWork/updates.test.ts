// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Updates acceptance: A06 (a shared new optional lesson is one notice naming both objectives, required totals hold,
 * a repeat makes no new notice) and A07 (a new prerequisite is explained; a retired lesson resolves to its
 * replacement, or says there is none; prior completion stays visible), plus U01 to U05 on the pure functions.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  buildCatalog,
  computeUpdateNotices,
  lessonsToEngage,
  revisedStrip,
  type LessonCatalog,
  type UpdatesObjective,
  type UpdatesRevision,
} from './updates'
import {
  useUpdatesStore,
  EMPTY_UPDATES,
  UPDATES_KEY,
  migrateUpdates,
} from '@/store/useUpdatesStore'
import { LEARN_MODULES } from '@/data/generated/learnModules.generated'

const lesson = (tag: string, moduleId: string, version: number, takeFirst: string[] = []) => ({
  tag,
  moduleId,
  title: `Lesson ${moduleId}`,
  version,
  takeFirst,
})

const catalog = (): LessonCatalog => ({
  'LM-901': lesson('LM-901', 'basics', 3),
  'LM-902': lesson('LM-902', 'review', 5, []),
  'LM-904': lesson('LM-904', 'shared-practice', 1, ['LM-902']),
})
const entry = (moduleId: string, version: number, takeFirst: string[] = []) => ({
  version,
  moduleId,
  title: `Lesson ${moduleId}`,
  takeFirst,
})
const objectives = (): UpdatesObjective[] => [
  {
    id: 'o1',
    title: 'TLS review',
    state: 'active',
    steps: [
      { tag: 'LM-901', required: true, status: 'completed' },
      { tag: 'LM-902', required: true, status: 'now' },
    ],
  },
  {
    id: 'o2',
    title: 'Board briefing',
    state: 'active',
    steps: [{ tag: 'LM-902', required: true, status: 'not-started' }],
  },
]
const rev = (moduleId: string, at: string, sha = 'abc'): UpdatesRevision => ({
  merge_sha: sha,
  merge_timestamp: at,
  domain: 'module',
  record_ids: [moduleId],
})

beforeEach(() => {
  localStorage.clear()
  useUpdatesStore.setState({ ...EMPTY_UPDATES })
})

describe('A06: shared optional practice', () => {
  const since = '2026-11-10T00:00:00.000Z'
  const revisions = [rev('shared-practice', '2026-11-18T09:00:00.000Z')]
  const base = () => ({
    catalog: catalog(),
    objectives: objectives(),
    comments: [],
    engaged: { 'LM-901': entry('basics', 3), 'LM-902': entry('review', 5) },
    seen: [],
    revisions,
    releaseSeenAt: since,
  })

  it('is one notice that names both objectives, and leaves the required steps as they were', () => {
    const before = JSON.stringify(objectives())
    const notices = computeUpdateNotices(base())
    expect(notices).toHaveLength(1)
    expect(notices[0]).toMatchObject({ kind: 'new-optional', tag: 'LM-904', revision: 1 })
    expect(notices[0].affects.map((a) => a.objectiveTitle)).toEqual([
      'TLS review',
      'Board briefing',
    ])
    expect(notices[0].affects.every((a) => a.role === 'optional')).toBe(true)
    // Required totals: nothing about the objectives was read as changed.
    const required = (os: UpdatesObjective[]) =>
      os.flatMap((o) => o.steps).filter((s) => s.required).length
    expect(required(objectives())).toBe(3)
    expect(JSON.stringify(objectives())).toBe(before)
  })

  it('a replay of the same release makes the same single notice, and once seen no new one (U04)', () => {
    const first = computeUpdateNotices(base())
    const replay = computeUpdateNotices(base())
    expect(replay.map((n) => n.id)).toEqual(first.map((n) => n.id))
    const seen = [{ tag: first[0].tag, revision: first[0].revision }]
    expect(computeUpdateNotices({ ...base(), seen })).toHaveLength(0)
    expect(computeUpdateNotices({ ...base(), seen: [...seen, ...seen] })).toHaveLength(0)
  })

  it('a lesson that was already on record before the learner last looked is not new', () => {
    expect(
      computeUpdateNotices({
        ...base(),
        revisions: [rev('shared-practice', '2026-11-01T09:00:00.000Z')],
      })
    ).toHaveLength(0)
  })
})

describe('A07: new prerequisite, retired step', () => {
  it('a revision that adds a lesson to take first says so, and keeps what was completed', () => {
    const cat = catalog()
    cat['LM-902'].takeFirst = ['LM-901']
    const notices = computeUpdateNotices({
      catalog: cat,
      objectives: objectives(),
      comments: [],
      engaged: { 'LM-902': entry('review', 4, []) },
      seen: [],
    })
    expect(notices).toHaveLength(1)
    expect(notices[0]).toMatchObject({ kind: 'revised', since: 4, revision: 5, progressKept: true })
    expect(notices[0].newPrerequisites).toEqual([{ tag: 'LM-901', title: 'Lesson basics' }])
  })

  it('a retired lesson with a declared replacement is a "moved" notice naming it', () => {
    const notices = computeUpdateNotices({
      catalog: catalog(),
      objectives: [
        {
          id: 'o1',
          title: 'TLS review',
          state: 'active',
          steps: [{ tag: 'LM-950', required: true, status: 'completed' }],
        },
      ],
      comments: [],
      engaged: { 'LM-950': entry('old-review', 2) },
      seen: [],
      renames: { 'old-review': 'review' },
    })
    expect(notices).toHaveLength(1)
    expect(notices[0]).toMatchObject({
      kind: 'moved',
      replacement: { tag: 'LM-902' },
      progressKept: true,
    })
    expect(notices[0].affects[0].status).toBe('completed') // prior completion stays visible
  })

  it('a retired lesson with no replacement says so and offers the objective to inspect', () => {
    const notices = computeUpdateNotices({
      catalog: catalog(),
      objectives: [
        {
          id: 'o1',
          title: 'TLS review',
          state: 'active',
          steps: [{ tag: 'LM-950', required: true, status: 'now' }],
        },
      ],
      comments: [],
      engaged: { 'LM-950': entry('gone', 2) },
      seen: [],
      renames: {},
    })
    expect(notices[0]).toMatchObject({ kind: 'retired', progressKept: true })
    expect(notices[0].replacement).toBeUndefined()
    expect(notices[0].affects[0].objectiveId).toBe('o1')
  })
})

describe('revision notices (U01, U03, U04)', () => {
  it('skipped revisions are one notice at the newest version, ordered current step first', () => {
    const cat = catalog()
    cat['LM-901'].version = 9
    const notices = computeUpdateNotices({
      catalog: cat,
      objectives: objectives(),
      comments: [],
      engaged: { 'LM-901': entry('basics', 3), 'LM-902': entry('review', 3) },
      seen: [],
    })
    expect(notices.map((n) => [n.tag, n.since, n.revision, n.tier])).toEqual([
      ['LM-902', 3, 5, 0],
      ['LM-901', 3, 9, 1],
    ])
  })

  it('names the learner’s own older comments (A19 leads here), and ignores a lesson they do not use', () => {
    const notices = computeUpdateNotices({
      catalog: catalog(),
      objectives: [],
      comments: [
        { id: 'c', tag: 'LM-902/s:x', contentVersion: 4 },
        { id: 'd', tag: 'LM-902/s:y', contentVersion: 5 },
      ],
      engaged: { 'LM-902': entry('review', 4), 'LM-901': entry('basics', 1) },
      seen: [],
    })
    expect(notices).toHaveLength(1) // LM-901 has neither an objective step nor a comment
    expect(notices[0].staleCommentTags).toEqual(['LM-902/s:x'])
  })

  it('a notice seen at or above its revision does not come back (U04), and a later revision does', () => {
    const input = {
      catalog: catalog(),
      objectives: objectives(),
      comments: [],
      engaged: { 'LM-902': entry('review', 4) },
    }
    expect(computeUpdateNotices({ ...input, seen: [{ tag: 'LM-902', revision: 5 }] })).toHaveLength(
      0
    )
    const later = catalog()
    later['LM-902'].version = 6
    expect(
      computeUpdateNotices({ ...input, catalog: later, seen: [{ tag: 'LM-902', revision: 5 }] })
    ).toHaveLength(1)
  })

  it('a real catalogue from the lessons data file builds, with TLS Basics at its data-file version', () => {
    const real = buildCatalog()
    const tls = LEARN_MODULES.find((m) => m.lmId === 'LM-008')!
    expect(real['LM-008'].version).toBe(tls.contentVersion ?? 1)
    expect(real['LM-008'].takeFirst.every((t) => real[t] !== undefined)).toBe(true)
  })
})

describe('the strip on a revised section', () => {
  it('shows when the lesson is past what the learner was told, and not once marked seen', () => {
    const cat = catalog()
    const engaged = { 'LM-902': entry('review', 4) }
    const comments = [{ id: 'c', tag: 'LM-902/s:x', contentVersion: 4 }]
    const strip = revisedStrip('LM-902/s:x', cat, engaged, [], comments)
    expect(strip).toMatchObject({ current: 5, since: 4, staleComments: 1 })
    expect(
      revisedStrip('LM-902/s:x', cat, engaged, [{ tag: 'LM-902', revision: 5 }], comments)
    ).toBeNull()
    expect(revisedStrip('LM-901/s:x', cat, engaged, [], [])).toBeNull()
    expect(revisedStrip('GL:ml-kem', cat, engaged, [], [])).toBeNull()
  })

  it('a new learner starts caught up; a commented lesson starts at the version of its oldest comment', () => {
    const cat = catalog()
    const fresh = lessonsToEngage(
      cat,
      objectives(),
      [{ id: 'c', tag: 'LM-901/s:x', contentVersion: 2 }],
      {}
    )
    expect(fresh['LM-902'].version).toBe(5) // caught up
    expect(fresh['LM-901'].version).toBe(2) // so the later revision still leads to a notice
    expect(lessonsToEngage(cat, objectives(), [], fresh)).toEqual({})
  })
})

describe('update receipts store', () => {
  it('marking a notice seen is one record however often it is pressed, and moves the baseline up (U04)', () => {
    const s = () => useUpdatesStore.getState()
    s().noteEngaged({ 'LM-902': entry('review', 4) })
    expect(s().markNoticeSeen('LM-902', 5).ok).toBe(true)
    expect(s().markNoticeSeen('LM-902', 5).ok).toBe(true)
    expect(s().noticesSeen).toEqual([{ tag: 'LM-902', revision: 5 }])
    expect(s().engaged['LM-902'].version).toBe(5)
    // Items already known are left alone.
    expect(s().noteEngaged({ 'LM-902': entry('review', 1) })).toEqual({ ok: true, value: 0 })
    expect(s().engaged['LM-902'].version).toBe(5)
  })

  it('seeds the release once, and moves it only when asked', () => {
    const s = () => useUpdatesStore.getState()
    expect(s().seedRelease('4.225.0')).toEqual({ ok: true, value: true })
    expect(s().seedRelease('4.226.0')).toEqual({ ok: true, value: false })
    expect(s().learnerReleaseSeen).toBe('4.225.0')
    s().markReleaseSeen('4.226.0')
    expect(s().learnerReleaseSeen).toBe('4.226.0')
  })

  it('migrates damaged or older shapes, keeps what reads, and persists a versioned envelope', () => {
    expect(migrateUpdates(undefined, 0)).toEqual(EMPTY_UPDATES)
    const m = migrateUpdates(
      {
        learnerReleaseSeen: '4.1.0',
        engaged: { 'LM-001': { version: 2 }, bad: { version: 'x' }, worse: null },
        noticesSeen: [{ tag: 'LM-001', revision: 2 }, { tag: 1 }, 'x'],
      },
      0
    )
    expect(m.engaged['LM-001']).toMatchObject({ version: 2, takeFirst: [] })
    expect(Object.keys(m.engaged)).toEqual(['LM-001'])
    expect(m.noticesSeen).toEqual([{ tag: 'LM-001', revision: 2 }])
    useUpdatesStore.getState().markReleaseSeen('4.225.0')
    expect(JSON.parse(localStorage.getItem(UPDATES_KEY)!)).toMatchObject({
      version: 1,
      state: { learnerReleaseSeen: '4.225.0' },
    })
  })

  it('a failed write changes nothing and names why (U04 never double-counts on retry)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(useUpdatesStore.getState().markNoticeSeen('LM-902', 5, entry('review', 4))).toEqual({
      ok: false,
      reason: 'quota',
    })
    expect(useUpdatesStore.getState().noticesSeen).toEqual([])
    spy.mockRestore()
    expect(useUpdatesStore.getState().markNoticeSeen('LM-902', 5, entry('review', 4)).ok).toBe(true)
    expect(useUpdatesStore.getState().noticesSeen).toHaveLength(1)
  })
})
