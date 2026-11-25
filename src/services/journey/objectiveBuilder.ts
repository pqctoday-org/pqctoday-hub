// SPDX-License-Identifier: AGPL-3.0-only
/**
 * New objective: the preview (UX handoff 6.4). It maps the learner's goal to lessons by the words
 * the lessons data file holds (titles, short labels, track, algorithms, standards, description),
 * and adds the "take first" lessons of what it found. Prerequisites come from `take_first` only
 * (owner decision 3, 24 Nov). It is plain code over the data: no language model, no network.
 *
 * A preview creates nothing. `buildPreview` is pure; the store turns an accepted preview into an
 * objective, so the saved objective and the preview it came from show the same outcome,
 * prerequisite rationale and first step (acceptance A02).
 */
import type { PersonaId } from '@/data/personaIds'
import { personaDefaultRole } from '@/data/niceFramework'
import { TREE_LESSONS, compareTreeOrder, lessonByTag, type TreeLesson } from './lessons'
import type { Objective, Step, StepOrigin } from './types'
import { NO_ROLE } from './types'

export type PreviewState = 'broad' | 'ready' | 'duplicate' | 'gap'

export interface PreviewStep {
  tag: string
  kind: Step['kind']
  required: boolean
  origin: StepOrigin
  /** True when the learner has already finished it (the Hub's completion signal or an earlier objective). */
  alreadyDone: boolean
}

export interface ObjectivePreview {
  state: PreviewState
  goal: string
  /** The role the objective will belong to. */
  role: string
  /** Required and optional steps in order; the last required step is the self-assessed one. */
  steps: PreviewStep[]
  /** Tags of the lessons the words of the goal map to (the "Mapped topics"). */
  mapped: string[]
  /** Words of the goal that map to no lesson (the "Not covered"). */
  notCovered: string[]
  /** The lessons already finished that the objective reuses ("Already done for you"). */
  alreadyDone: string[]
  /** For `duplicate`: the open objective it matches. */
  duplicateOf: string | null
  /** The first required lesson that is not done yet; null when every required lesson is done (the self-assessed step is first). */
  firstStepTag: string | null
}

export interface PreviewInput {
  goal: string
  persona: PersonaId | null
  /** Industry the learner set, if any; used only to break ties between lessons. */
  industry?: string | null
  existing: readonly Objective[]
  isDone: (tag: string) => boolean
}

const STOP = new Set(
  (
    'a an the and or but of in on at to for from by with without about as is are was were be been being it its this that these those ' +
    'i me my we our us you your they their he she him her what which who whom how why when where can could should would will shall may might must do does did ' +
    'want wants wanted need needs able get gets make makes use uses using like just also more most some any all each very so if then than into over under ' +
    'learn learning understand know knowing build builds help helps new one two three first next ' +
    'review design plan prepare create explain brief explore study cover covers covering'
  ).split(' ')
)

/** Words that name the whole subject: a goal made only of these is too broad to map. */
const BROAD = new Set(
  (
    'pqc post quantum cryptography cryptographic crypto security secure cyber cybersecurity everything anything general overview ' +
    'introduction intro basics basic fundamentals topic topics stuff things safe resistant postquantum quantumsafe'
  ).split(' ')
)

function stem(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

/** Lowercase words of a text, with each run of letters and digits one word ("ML-KEM" gives "ml", "kem" and "mlkem"). */
export function words(text: string): string[] {
  const parts = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
  const out = parts.map(stem)
  for (let i = 0; i + 1 < parts.length; i++) out.push(`${parts[i]}${parts[i + 1]}`)
  return out
}

/** The words of a goal that carry meaning: no function words, no bare verbs. */
export function contentWords(goal: string): string[] {
  const parts = goal
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter((w) => !STOP.has(w) && w.length > 1)
  return [...new Set(parts.map(stem))]
}

interface Indexed {
  lesson: TreeLesson
  title: Set<string>
  keys: Set<string>
  text: Set<string>
}

let index: Indexed[] | undefined
function lessonIndex(): Indexed[] {
  index ??= TREE_LESSONS.map((lesson) => ({
    lesson,
    title: new Set(words(`${lesson.title} ${lesson.shortLabel ?? ''}`)),
    keys: new Set(
      words(
        [lesson.track ?? '', ...lesson.taxonomyAlgorithms, ...lesson.taxonomyStandards].join(' ')
      )
    ),
    text: new Set(words(lesson.description)),
  }))
  return index
}

/** Minimum score for a lesson to count as a match: one title or key hit, or three description hits. */
const MATCH_MIN = 3

function scoreLesson(row: Indexed, tokens: readonly string[], industry: Set<string>): number {
  let score = 0
  for (const t of tokens) {
    if (row.title.has(t)) score += 3
    else if (row.keys.has(t)) score += 3
    else if (row.text.has(t)) score += 1
  }
  for (const t of industry) if (row.text.has(t) || row.title.has(t)) score += 0.25
  return score
}

/** The words of the goal that at least one lesson holds. */
function coveredWords(tokens: readonly string[]): Set<string> {
  const covered = new Set<string>()
  for (const row of lessonIndex()) {
    for (const t of tokens)
      if (row.title.has(t) || row.keys.has(t) || row.text.has(t)) covered.add(t)
  }
  return covered
}

/** How many lessons a single word names in a title or key, for the "one word, many lessons" test. */
function lessonsNaming(token: string): number {
  return lessonIndex().filter((r) => r.title.has(token) || r.keys.has(token)).length
}

const MAX_REQUIRED_LESSONS = 7
const MAX_MATCHED = 3
const MAX_OPTIONAL = 3

function normalizedGoal(goal: string): string {
  return contentWords(goal).sort().join(' ')
}

function overlap(a: readonly string[], b: readonly string[]): number {
  const sa = new Set(a)
  const sb = new Set(b)
  let both = 0
  for (const x of sa) if (sb.has(x)) both += 1
  const union = sa.size + sb.size - both
  return union === 0 ? 0 : both / union
}

/**
 * The open objective of this role that the new goal would repeat: the same words, or nearly, or the
 * same required lessons. Completed objectives are not duplicates (reopening is how they come back).
 */
function findDuplicate(
  goal: string,
  role: string,
  requiredTags: readonly string[],
  existing: readonly Objective[]
): Objective | null {
  const mine = contentWords(goal)
  for (const o of existing) {
    if (o.role !== role || o.state === 'completed') continue
    const same = normalizedGoal(o.goal) === normalizedGoal(goal)
    const near = overlap(contentWords(o.goal), mine) >= 0.8
    const theirs = o.steps
      .filter((s) => s.required && s.kind === 'module')
      .map((s) => s.resourceTag)
    const sameLessons =
      requiredTags.length > 0 &&
      theirs.length === requiredTags.length &&
      requiredTags.every((t) => theirs.includes(t))
    if (same || near || sameLessons) return o
  }
  return null
}

function orderLessons(picked: Map<string, StepOrigin>): TreeLesson[] {
  // A lesson comes after the lessons it names in take-first, when both are in the objective;
  // ties go by the learning order. The data file has no cycles (a test checks), but a guard keeps this total.
  const lessons = [...picked.keys()]
    .map((t) => lessonByTag(t))
    .filter((l): l is TreeLesson => l !== undefined)
    .sort(compareTreeOrder)
  const placed: TreeLesson[] = []
  const tagById = new Map(lessons.map((l) => [l.id, l.lmId]))
  const remaining = [...lessons]
  let guard = remaining.length * remaining.length + 1
  while (remaining.length > 0 && guard-- > 0) {
    const at = remaining.findIndex((l) =>
      l.takeFirst.every((p) => {
        const tag = tagById.get(p)
        return !tag || placed.some((x) => x.lmId === tag)
      })
    )
    placed.push(...remaining.splice(at < 0 ? 0 : at, 1))
  }
  return placed
}

/** Builds the preview of a goal. Pure: it reads the lessons data and the arguments, nothing else. */
export function buildPreview(input: PreviewInput): ObjectivePreview {
  const goal = input.goal.trim()
  const role = input.persona ?? NO_ROLE
  const empty: ObjectivePreview = {
    state: 'broad',
    goal,
    role,
    steps: [],
    mapped: [],
    notCovered: [],
    alreadyDone: [],
    duplicateOf: null,
    firstStepTag: null,
  }
  const content = contentWords(goal)
  const specific = content.filter((w) => !BROAD.has(w))
  if (specific.length === 0 || (specific.length === 1 && lessonsNaming(specific[0]) > 12)) {
    return empty
  }

  const tokens = words(goal).filter((w) => !STOP.has(w) && w.length > 1)
  const industry = new Set(input.industry ? contentWords(input.industry) : [])
  const roleId = personaDefaultRole(input.persona)
  const scored = lessonIndex()
    .map((row) => {
      const base = scoreLesson(row, tokens, industry)
      const roleBoost = roleId && row.lesson.niceWorkRoles.includes(roleId) ? 0.5 : 0
      return { lesson: row.lesson, score: base > 0 ? base + roleBoost : 0 }
    })
    .filter((r) => r.score >= MATCH_MIN)
    .sort((a, b) => b.score - a.score || compareTreeOrder(a.lesson, b.lesson))

  const covered = coveredWords(specific)
  const notCovered = specific.filter((w) => !covered.has(w))

  if (scored.length === 0) return { ...empty, state: 'gap', notCovered: specific }

  const top = scored[0].score
  const matched = scored
    .filter((r) => r.score >= Math.max(MATCH_MIN, top * 0.5))
    .slice(0, MAX_MATCHED)
  const optional = scored.filter((r) => !matched.includes(r)).slice(0, MAX_OPTIONAL)

  // Required lessons: each match, then its take-first lessons, until the cap.
  const picked = new Map<string, StepOrigin>()
  for (const m of matched) {
    const adds: [string, StepOrigin][] = []
    if (!picked.has(m.lesson.lmId)) adds.push([m.lesson.lmId, { type: 'match' }])
    for (const p of m.lesson.takeFirst) {
      const pre = TREE_LESSONS.find((l) => l.id === p)
      if (pre && !picked.has(pre.lmId) && pre.lmId !== m.lesson.lmId) {
        adds.push([pre.lmId, { type: 'take-first', for: m.lesson.lmId }])
      }
    }
    if (picked.size > 0 && picked.size + adds.length > MAX_REQUIRED_LESSONS) continue
    for (const [tag, origin] of adds) picked.set(tag, origin)
  }
  const ordered = orderLessons(picked)
  const optionalTags = optional.map((r) => r.lesson.lmId).filter((t) => !picked.has(t))

  const steps: PreviewStep[] = [
    ...ordered.map((l) => ({
      tag: l.lmId,
      kind: 'module' as const,
      required: true,
      // `picked` holds an origin for every lesson in `ordered`; the fallback is unreachable.
      origin: picked.get(l.lmId) ?? ({ type: 'match' } as StepOrigin),
      alreadyDone: input.isDone(l.lmId),
    })),
    ...optionalTags.map((t) => ({
      tag: t,
      kind: 'module' as const,
      required: false,
      origin: { type: 'match' } as StepOrigin,
      alreadyDone: input.isDone(t),
    })),
  ]
  const requiredModuleTags = ordered.map((l) => l.lmId)
  const mapped = matched.map((m) => m.lesson.lmId)
  const alreadyDone = requiredModuleTags.filter((t) => input.isDone(t))

  const duplicate = findDuplicate(goal, role, requiredModuleTags, input.existing)
  const gap = notCovered.length >= 2 && notCovered.length / specific.length >= 0.5

  return {
    state: duplicate ? 'duplicate' : gap ? 'gap' : 'ready',
    goal,
    role,
    steps,
    mapped,
    notCovered,
    alreadyDone,
    duplicateOf: duplicate?.id ?? null,
    firstStepTag: steps.find((s) => s.required && !s.alreadyDone)?.tag ?? null,
  }
}

/** The id an objective gets: the same role and goal always give the same id, so a repeated save adds nothing (J08). */
export function objectiveIdFor(role: string, goal: string): string {
  const key = `${role}|${normalizedGoal(goal) || goal.trim().toLowerCase()}`
  let h = 5381
  for (let i = 0; i < key.length; i++) h = ((h * 33) ^ key.charCodeAt(i)) >>> 0
  return `obj-${h.toString(36)}`
}

/** The steps of a saved objective from a preview: the required lessons, the self-assessed last step, then the optional ones. */
export function stepsFromPreview(objectiveId: string, preview: ObjectivePreview): Step[] {
  const required = preview.steps.filter((s) => s.required)
  const optional = preview.steps.filter((s) => !s.required)
  const out: Step[] = []
  const push = (s: Omit<Step, 'id' | 'position'>) =>
    out.push({ ...s, id: `${objectiveId}-s${out.length + 1}`, position: out.length + 1 })
  for (const s of required) {
    push({ kind: s.kind, resourceTag: s.tag, required: true, origin: s.origin })
  }
  push({
    kind: 'self-assessed',
    resourceTag: `${objectiveId}/outcome`,
    required: true,
    origin: { type: 'match' },
  })
  for (const s of optional) {
    push({ kind: s.kind, resourceTag: s.tag, required: false, origin: s.origin })
  }
  return out
}
