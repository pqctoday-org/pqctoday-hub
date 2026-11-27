// SPDX-License-Identifier: AGPL-3.0-only
/**
 * What changed in the curriculum since an objective was built (design note acceptance A06 and A07; requirements
 * U01, U04, U05, J02): a step whose lesson was retired, a new required step ("Curriculum changed"), and the four
 * kinds of change to a lesson the objective holds: a new section, a new tool, an updated section, an updated tool.
 *
 * Pure functions over the objective's record of what it was built on (`BuiltOn`) and the Hub's data. Nothing here
 * changes a learner's path: a notice is information, and every action that does change the path is the learner's.
 * Where the Hub holds no signal for a kind of change, that kind is not reported and nothing is guessed:
 *  - a section is "updated" only where the learner has a comment written against an older version of the lesson,
 *    because the Hub keeps one content version per lesson and none per section;
 *  - a tool is "updated" only where the Hub gives it a version (Playground tools), not business tools or sandbox
 *    scenarios.
 */
import { addressOf, parseTag } from '@/services/myWork/tags'
import { lessonByTag } from './lessons'
import {
  sectionsOfLesson,
  takeFirstTags,
  toolAddress,
  toolsOfLesson,
  toolVersion,
} from './curriculum'
import { retiredEntry, retiredName } from './retiredSteps'
import type { Objective } from './types'
import { formatDate } from '@/lib/format'

export type ChangeKind =
  | 'retired-step'
  | 'new-required-step'
  | 'new-section'
  | 'new-tool'
  | 'section-updated'
  | 'tool-updated'

/** The words a notice names its kind with. */
export const CHANGE_LABEL: Record<ChangeKind, string> = {
  'retired-step': 'Retired step',
  'new-required-step': 'Curriculum changed',
  'new-section': 'New section',
  'new-tool': 'New tool',
  // The Hub keeps one version per lesson, so a revised lesson is all it can say; the section is the learner's comment.
  'section-updated': 'Lesson revised',
  'tool-updated': 'Tool updated',
}

export interface ObjectiveChange {
  /** Stable: the same change has the same id, so answering it once answers it for good. */
  id: string
  kind: ChangeKind
  objectiveId: string
  /** The step of the objective this is about. */
  stepId: string
  lessonTag: string
  lessonTitle: string
  /** What the change is about: the section, the tool or the step. */
  subject: string
  /** One plain sentence. */
  detail: string
  /** A page or section address to look at. */
  href?: string
  /** Retired step: the lesson that took its place, and the Hub's reason and date. */
  replacement?: { tag: string; title: string }
  /** Retired step whose replacement is already a step of the objective: nothing to swap in. */
  replacementHeld?: { tag: string; title: string }
  retired?: { name: string; reason: string; date: string }
  /** New required step: the lesson the objective was built without. */
  addTag?: string
}

export interface CommentStamp {
  tag: string
  contentVersion: number
}

const dateWords = (iso: string): string => {
  const d = new Date(`${iso}T12:00:00`)
  return Number.isNaN(d.getTime()) ? iso : formatDate(d, 'day', { relative: false })
}

/**
 * The changes an objective has not yet answered. A retired step is reported for as long as it is in the
 * objective and neither put off nor marked seen; every other change is reported until the learner marks it seen or
 * acts on it.
 * An objective with no record of what it was built on reports retirements only.
 */
export function computeObjectiveChanges(
  objective: Objective,
  comments: readonly CommentStamp[] = []
): ObjectiveChange[] {
  const out: ObjectiveChange[] = []
  const seen = new Set(objective.acknowledged ?? [])
  const stepTags = new Set(objective.steps.map((s) => s.resourceTag))
  const base = objective.builtOn

  for (const step of objective.steps) {
    if (step.kind !== 'module') continue
    const tag = step.resourceTag
    const lesson = lessonByTag(tag)

    if (!lesson) {
      const entry = retiredEntry(tag)
      if (!entry || step.deferred || seen.has(`retired-step:${tag}`)) continue
      const to = lessonByTag(entry.to)
      const name = retiredName(entry)
      const target =
        to && entry.to.indexOf('/') === -1 ? { tag: entry.to, title: to.title } : undefined
      // A replacement the objective already holds is not offered again: there is nothing to swap in.
      const held = target && stepTags.has(target.tag)
      out.push({
        id: `retired-step:${tag}`,
        kind: 'retired-step',
        objectiveId: objective.id,
        stepId: step.id,
        lessonTag: tag,
        lessonTitle: name,
        subject: name,
        detail: `${name} was retired on ${dateWords(entry.date)}. ${entry.reason}`,
        href: to ? addressOf(entry.to) : undefined,
        replacement: held ? undefined : target,
        replacementHeld: held ? target : undefined,
        retired: { name, reason: entry.reason, date: entry.date },
      })
      continue
    }

    // eslint-disable-next-line security/detect-object-injection -- keyed by lesson tags
    const was = base?.lessons[tag]
    if (!base || !was) continue
    const push = (
      c: Omit<ObjectiveChange, 'objectiveId' | 'stepId' | 'lessonTag' | 'lessonTitle'>
    ) => {
      if (seen.has(c.id)) return
      out.push({
        ...c,
        objectiveId: objective.id,
        stepId: step.id,
        lessonTag: tag,
        lessonTitle: lesson.title,
      })
    }

    // New required step: the lesson now lists a lesson to take first that the objective was built without.
    // eslint-disable-next-line security/detect-object-injection
    const listedBefore = new Set(base.prerequisites[tag] ?? [])
    for (const p of takeFirstTags(tag)) {
      if (listedBefore.has(p) || stepTags.has(p)) continue
      const needed = lessonByTag(p)
      if (!needed) continue
      push({
        id: `new-required-step:${tag}:${p}`,
        kind: 'new-required-step',
        subject: needed.title,
        detail: `${lesson.title} now lists ${needed.title} to take first. This objective was built without it.`,
        href: addressOf(p),
        addTag: p,
      })
    }

    // New section.
    const knownSections = new Set(was.sections)
    for (const s of sectionsOfLesson(lesson.id)) {
      if (knownSections.has(s.id)) continue
      push({
        id: `new-section:${tag}:${s.id}`,
        kind: 'new-section',
        subject: s.label,
        detail: `${s.label} was added to ${lesson.title}.`,
        href: addressOf(`${tag}/s:${s.id}`),
      })
    }

    // New tool, and updated tool (only for a tool the Hub gives a version).
    for (const t of toolsOfLesson(lesson.id)) {
      if (!(t.toolId in was.tools)) {
        push({
          id: `new-tool:${tag}:${t.toolId}`,
          kind: 'new-tool',
          subject: t.name,
          detail: `${t.name} was added to ${lesson.title}.`,
          href: toolAddress(t),
        })
        continue
      }

      const before = was.tools[t.toolId]
      const now = toolVersion(t)
      if (before !== null && now !== null && before !== now) {
        push({
          id: `tool-updated:${tag}:${t.toolId}@${now}`,
          kind: 'tool-updated',
          subject: t.name,
          detail: `${t.name} is now version ${now}. It was version ${before} when this objective was built.`,
          href: toolAddress(t),
        })
      }
    }

    // Updated section: the lesson is on a newer version than the objective was built on, and the learner has a
    // comment on one of its sections written against an older one.
    const version = lesson.contentVersion ?? 1
    if (version > was.version) {
      const labels = new Map(sectionsOfLesson(lesson.id).map((s) => [s.id, s.label]))
      const done = new Set<string>()
      for (const c of comments) {
        const parsed = parseTag(c.tag)
        if (parsed?.anchorKind !== 'section' || parsed.moduleTag !== tag || !parsed.partId) continue
        // A section the lesson no longer has (removed or renamed) is not an update to that section.
        const label = labels.get(parsed.partId)
        if (label === undefined) continue
        if (c.contentVersion >= version || done.has(c.tag)) continue
        done.add(c.tag)
        push({
          id: `section-updated:${c.tag}@${version}`,
          kind: 'section-updated',
          subject: `${lesson.title}: ${label}`,
          detail: `${lesson.title} was revised since you commented on ${label}. This section may not have changed.`,
          href: addressOf(c.tag),
        })
      }
    }
  }
  return out
}

/** The changes of every objective, in the objectives' order. */
export function computeAllChanges(
  objectives: readonly Objective[],
  comments: readonly CommentStamp[] = []
): ObjectiveChange[] {
  return objectives.flatMap((o) => computeObjectiveChanges(o, comments))
}

/** The kinds that only inform: one card for them, whichever objectives hold the lesson. */
const INFORMATIONAL: ReadonlySet<ChangeKind> = new Set([
  'new-section',
  'new-tool',
  'section-updated',
  'tool-updated',
])

export interface ChangeGroup {
  /** The change to show (the first objective's). */
  change: ObjectiveChange
  /** Every objective the change is about, in the objectives' order. A retired or new required step is always alone. */
  objectiveIds: string[]
}

/**
 * The changes as the learner counts and answers them: a new section, new tool, updated section or updated tool is
 * one change however many objectives hold the lesson (the same rule as the release notices, which list one notice per
 * lesson); a retired step or a new required step stays one card per objective, because its buttons change one objective.
 */
export function groupChanges(changes: readonly ObjectiveChange[]): ChangeGroup[] {
  const out: ChangeGroup[] = []
  const byId = new Map<string, ChangeGroup>()
  for (const c of changes) {
    if (!INFORMATIONAL.has(c.kind)) {
      out.push({ change: c, objectiveIds: [c.objectiveId] })
      continue
    }
    const have = byId.get(c.id)
    if (have) {
      have.objectiveIds.push(c.objectiveId)
      continue
    }
    const group = { change: c, objectiveIds: [c.objectiveId] }
    byId.set(c.id, group)
    out.push(group)
  }
  return out
}
