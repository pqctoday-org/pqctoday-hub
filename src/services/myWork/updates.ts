// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Updates (phase P6, requirements U01 to U06, X08): what changed in the lessons a learner works with, said in
 * terms of their own work. Pure functions over the Hub's data and the learner's receipts.
 *
 * Facts come from the data the site already ships, once:
 *  - the lessons data file: each lesson's current content version, title and "take first" list;
 *  - the reviewed change records (`revisions.jsonl`, read through `useRevisions`): when a lesson was last revised;
 *  - the changelog (`CHANGELOG.md`, read through the What's new helpers): the on-demand digest.
 * The learner's receipts (`useUpdatesStore`) say what they were already told.
 *
 * Nothing here changes progress. A notice is information; an objective's required totals are never read or written (U02).
 */
import { LEARN_MODULES } from '@/data/generated/learnModules.generated'
import { lessonByTag, parseTag } from './tags'
import type { EngagedLesson, SeenNotice } from '@/store/useUpdatesStore'

// ── The catalogue of lessons, as the data file states it ──────────────────────

export interface CatalogLesson {
  tag: string
  moduleId: string
  title: string
  version: number
  /** Lessons to take first, as lesson tags. */
  takeFirst: string[]
}

export type LessonCatalog = Record<string, CatalogLesson>

export function buildCatalog(): LessonCatalog {
  const idToTag = new Map(LEARN_MODULES.flatMap((m) => (m.lmId ? [[m.id, m.lmId] as const] : [])))
  const out: LessonCatalog = {}
  for (const m of LEARN_MODULES) {
    if (!m.lmId) continue
    out[m.lmId] = {
      tag: m.lmId,
      moduleId: m.id,
      title: m.title,
      version: m.contentVersion ?? 1,
      takeFirst: m.takeFirst.flatMap((id) => idToTag.get(id) ?? []),
    }
  }
  return out
}

/** What a learner is told about a lesson the first time they work with it: the current version and its prerequisites. */
export function engagementOf(lesson: CatalogLesson): EngagedLesson {
  return {
    version: lesson.version,
    moduleId: lesson.moduleId,
    title: lesson.title,
    takeFirst: lesson.takeFirst,
  }
}

// ── Inputs ────────────────────────────────────────────────────────────────────

/** The part of an objective Updates needs. Lane C's objective maps onto this by structure. */
export interface UpdatesObjective {
  id: string
  title: string
  state: 'active' | 'paused' | 'completed'
  steps: { tag: string; required: boolean; status: 'completed' | 'now' | 'not-started' }[]
}

export interface UpdatesComment {
  id: string
  tag: string
  contentVersion: number
}

/** The part of a reviewed change record Updates needs (`RevisionEntry`). */
export interface UpdatesRevision {
  merge_sha: string
  merge_timestamp: string
  domain: string
  record_ids?: string[]
}

// ── Notices ───────────────────────────────────────────────────────────────────

export type NoticeKind = 'revised' | 'new-optional' | 'moved' | 'retired'

export interface NoticeAffect {
  objectiveId: string
  objectiveTitle: string
  /** How the lesson sits in that objective. */
  role: 'current-step' | 'step' | 'optional'
  status?: 'completed' | 'now' | 'not-started'
}

export interface UpdateNotice {
  /** `${tag}@${revision}`: one notice per learner and per material revision (U04). */
  id: string
  kind: NoticeKind
  tag: string
  /** The content version this notice is about; 0 for a lesson that moved or was retired. */
  revision: number
  /** The version the learner was last told about. */
  since?: number
  title: string
  /** ISO date of the latest reviewed change record for the lesson, when there is one. */
  releasedAt?: string
  /** 0 = your current step, 1 = another active step or a comment of yours, 2 = only in paused or finished work. */
  tier: 0 | 1 | 2
  affects: NoticeAffect[]
  /** The sections the learner commented on before this change (C03, U05). */
  staleCommentTags: string[]
  newPrerequisites: { tag: string; title: string }[]
  replacement?: { tag: string; title: string }
  /** The learner's progress is kept (U05). */
  progressKept: boolean
}

export interface ComputeNoticesInput {
  catalog: LessonCatalog
  objectives: readonly UpdatesObjective[]
  comments: readonly UpdatesComment[]
  engaged: Record<string, EngagedLesson>
  seen: readonly SeenNotice[]
  revisions?: readonly UpdatesRevision[]
  /** `{ 'old-module-id': 'new-module-id' }`, the Hub's declared renames. */
  renames?: Readonly<Record<string, string>>
  /** ISO time the learner last looked at the digest; lessons first revised after it count as new. */
  releaseSeenAt?: string | null
}

const moduleOf = (tag: string): string => parseTag(tag)?.moduleTag ?? tag

function latestRevisionDate(
  moduleId: string,
  revisions: readonly UpdatesRevision[]
): string | undefined {
  let best: string | undefined
  for (const r of revisions) {
    if (r.domain !== 'module' || r.merge_sha === 'pending' || r.merge_sha === 'baseline') continue
    if (!r.record_ids?.includes(moduleId)) continue
    if (best === undefined || r.merge_timestamp > best) best = r.merge_timestamp
  }
  return best
}

function earliestRevisionDate(
  moduleId: string,
  revisions: readonly UpdatesRevision[]
): string | undefined {
  let best: string | undefined
  for (const r of revisions) {
    if (r.domain !== 'module' || r.merge_sha === 'pending') continue
    if (!r.record_ids?.includes(moduleId)) continue
    if (best === undefined || r.merge_timestamp < best) best = r.merge_timestamp
  }
  return best
}

const isSeen = (seen: readonly SeenNotice[], tag: string, revision: number) =>
  seen.some((n) => n.tag === tag && n.revision >= revision)

function affectsOf(lessonTag: string, objectives: readonly UpdatesObjective[]): NoticeAffect[] {
  const out: NoticeAffect[] = []
  for (const o of objectives) {
    const step = o.steps.find((s) => moduleOf(s.tag) === lessonTag)
    if (!step) continue
    out.push({
      objectiveId: o.id,
      objectiveTitle: o.title,
      role: step.status === 'now' && o.state === 'active' ? 'current-step' : 'step',
      status: step.status,
    })
  }
  return out
}

function tierOf(
  affects: readonly NoticeAffect[],
  objectives: readonly UpdatesObjective[],
  hasComment: boolean
): 0 | 1 | 2 {
  if (affects.some((a) => a.role === 'current-step')) return 0
  const active = affects.some(
    (a) => objectives.find((o) => o.id === a.objectiveId)?.state === 'active'
  )
  if (active || hasComment) return 1
  return 2
}

/**
 * The notices for one learner (U01 to U05). A lesson the learner has worked with, whose version is now
 * higher than the one they were told about and whose (lesson, version) they have not seen, gets one
 * notice, however many releases it skipped and however many objectives use it (A06). Ordered by what the
 * learner is doing now (U03): current step, then other active steps and commented lessons, then the rest.
 */
export function computeUpdateNotices(input: ComputeNoticesInput): UpdateNotice[] {
  const { catalog, objectives, comments, engaged, seen } = input
  const revisions = input.revisions ?? []
  const renames = input.renames ?? {}
  const notices: UpdateNotice[] = []
  const covered = new Set<string>()

  const commentTagsByLesson = new Map<string, UpdatesComment[]>()
  for (const c of comments) {
    const lesson = moduleOf(c.tag)
    commentTagsByLesson.set(lesson, [...(commentTagsByLesson.get(lesson) ?? []), c])
  }

  for (const [tag, entry] of Object.entries(engaged)) {
    const live = catalog[tag]
    const affects = affectsOf(tag, objectives)
    const lessonComments = commentTagsByLesson.get(tag) ?? []

    if (!live) {
      // Retired or moved (U05). Progress and comments stay; a verified replacement is named, otherwise the
      // learner is offered a look at the affected objective.
      const replacementModule = renames[entry.moduleId]
      const replacement = replacementModule
        ? Object.values(catalog).find((c) => c.moduleId === replacementModule)
        : undefined
      if (isSeen(seen, tag, 0)) continue
      if (affects.length === 0 && lessonComments.length === 0) continue
      notices.push({
        id: `${tag}@0`,
        kind: replacement ? 'moved' : 'retired',
        tag,
        revision: 0,
        title: entry.title,
        tier: tierOf(affects, objectives, lessonComments.length > 0),
        affects,
        staleCommentTags: [],
        newPrerequisites: [],
        replacement: replacement ? { tag: replacement.tag, title: replacement.title } : undefined,
        progressKept: true,
      })
      covered.add(tag)
      continue
    }

    if (live.version <= entry.version || isSeen(seen, tag, live.version)) continue
    const staleCommentTags = lessonComments
      .filter((c) => c.contentVersion < live.version)
      .map((c) => c.tag)
    const knownBefore = new Set(entry.takeFirst)
    const newPrerequisites = live.takeFirst
      .filter((t) => !knownBefore.has(t) && catalog[t])
      .map((t) => ({ tag: t, title: catalog[t].title }))
    // A revision that touches nothing the learner has is not a notice (U03: those go to the digest).
    if (affects.length === 0 && lessonComments.length === 0) continue
    notices.push({
      id: `${tag}@${live.version}`,
      kind: 'revised',
      tag,
      revision: live.version,
      since: entry.version,
      title: live.title,
      releasedAt: latestRevisionDate(live.moduleId, revisions),
      tier: tierOf(affects, objectives, lessonComments.length > 0),
      affects,
      staleCommentTags: [...new Set(staleCommentTags)],
      newPrerequisites,
      progressKept: true,
    })
    covered.add(tag)
  }

  // New optional practice (U02, U03): a lesson first recorded after the learner last looked, that builds on a
  // lesson one of their objectives uses. One notice names every objective it fits (A06). Required totals never change.
  const since = input.releaseSeenAt
  if (since) {
    const stepLessons = new Set(objectives.flatMap((o) => o.steps.map((s) => moduleOf(s.tag))))
    for (const lesson of Object.values(catalog)) {
      if (stepLessons.has(lesson.tag) || isSeen(seen, lesson.tag, lesson.version)) continue
      const first = earliestRevisionDate(lesson.moduleId, revisions)
      if (!first || first <= since) continue
      const fits = objectives.filter((o) =>
        o.steps.some((s) => lesson.takeFirst.includes(moduleOf(s.tag)))
      )
      if (fits.length === 0) continue
      notices.push({
        id: `${lesson.tag}@${lesson.version}`,
        kind: 'new-optional',
        tag: lesson.tag,
        revision: lesson.version,
        title: lesson.title,
        releasedAt: first,
        tier: 1,
        affects: fits.map((o) => ({
          objectiveId: o.id,
          objectiveTitle: o.title,
          role: 'optional' as const,
        })),
        staleCommentTags: [],
        newPrerequisites: [],
        progressKept: true,
      })
    }
  }

  const order = (n: UpdateNotice) =>
    Math.min(
      ...n.affects
        .map((a) => objectives.findIndex((o) => o.id === a.objectiveId))
        .filter((i) => i >= 0),
      objectives.length
    )
  return notices.sort((a, b) => a.tier - b.tier || order(a) - order(b) || (a.tag < b.tag ? -1 : 1))
}

// ── The strip on a revised section ────────────────────────────────────────────

export interface RevisedStrip {
  tag: string
  lessonTitle: string
  /** The version the page is on now. */
  current: number
  /** The version the learner was last told about, or the oldest of their comments' versions. */
  since: number
  /** The learner's own comments on this tag written against an older version. */
  staleComments: number
}

/**
 * Whether a lesson or section page should say it changed since the learner last read it: the lesson is revised
 * past the version the learner was told about, and they have not marked that revision seen. A learner's own
 * older comments count toward the message (C03); their versions also set where "since" starts (see `lessonsToEngage`).
 */
export function revisedStrip(
  tag: string,
  catalog: LessonCatalog,
  engaged: Record<string, EngagedLesson>,
  seen: readonly SeenNotice[],
  comments: readonly UpdatesComment[]
): RevisedStrip | null {
  const lessonTag = moduleOf(tag)
  const live = catalog[lessonTag] ?? undefined
  const entry = engaged[lessonTag]
  if (!live || !entry || live.version <= entry.version || isSeen(seen, lessonTag, live.version)) {
    return null
  }
  const stale = comments.filter((c) => c.tag === tag && c.contentVersion < live.version)
  return {
    tag,
    lessonTitle: live.title,
    current: live.version,
    since: entry.version,
    staleComments: stale.length,
  }
}

/**
 * The lessons a learner has worked with that Updates does not know yet, with the version they were last told
 * about: a lesson with comments starts at the oldest version a comment was written against (so a comment made
 * before a revision still leads to a notice, A19), any other lesson at the current version, so a new learner starts caught up.
 */
export function lessonsToEngage(
  catalog: LessonCatalog,
  objectives: readonly UpdatesObjective[],
  comments: readonly UpdatesComment[],
  engaged: Record<string, EngagedLesson>
): Record<string, EngagedLesson> {
  const tags = new Set<string>([
    ...objectives.flatMap((o) => o.steps.map((s) => moduleOf(s.tag))),
    ...comments.map((c) => moduleOf(c.tag)),
  ])
  const out: Record<string, EngagedLesson> = {}
  for (const tag of tags) {
    const live = catalog[tag]
    if (!live || tag in engaged) continue
    const stamps = comments.filter((c) => moduleOf(c.tag) === tag).map((c) => c.contentVersion)
    out[tag] = { ...engagementOf(live), version: Math.min(live.version, ...stamps) }
  }
  return out
}

/** The lesson tag a notice or strip names, for callers that hold only a section tag. */
export function lessonTitleOf(tag: string): string {
  return lessonByTag(moduleOf(tag))?.title ?? tag
}
