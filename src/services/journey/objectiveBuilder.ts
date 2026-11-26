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
import { BROAD, STOP, stem } from './goalWords'
import { linkEvidence, type LessonReason, type NamedRecord } from './objectiveNamed'

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
  /** For a lesson of the objective that the knowledge model's links put there: the named thing it teaches, and where. */
  reasons?: Record<string, LessonReason[]>
}

export interface PreviewInput {
  goal: string
  persona: PersonaId | null
  /** Industry the learner set, if any; used only to break ties between lessons. */
  industry?: string | null
  existing: readonly Objective[]
  isDone: (tag: string) => boolean
  /**
   * The records the goal names, already looked up in the knowledge model (`resolveNamed`). Left out while the model is
   * not loaded or could not be loaded: the preview then reads the words only, exactly as it did before the model.
   */
  named?: readonly NamedRecord[]
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

/**
 * The words a goal is scored by: each content word, and each pair of neighbouring words written as
 * one ("key" "exchange" gives "keyexchange"). A pair that holds a function word is not a term
 * ("threats to" gives "threatsto"), so it is left out: it would only match by accident.
 */
function goalTokens(goal: string): string[] {
  const parts = goal
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
  const broad = (w: string) => BROAD.has(w) || BROAD.has(stem(w))
  const out = parts.map(stem).filter((w) => !STOP.has(w) && !broad(w) && w.length > 1)
  parts.forEach((part, i) => {
    const next = parts.at(i + 1)
    if (next === undefined || STOP.has(part) || STOP.has(next)) return
    if (broad(part) && broad(next)) return
    out.push(`${part}${next}`)
  })
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
  /** Labels the lesson carries without discussing them: its track and its algorithm and standard tags. */
  keys: Set<string>
  text: Set<string>
  /** Words in the description, for the length of the text a term has to stand out in. */
  descriptionLength: number
}

/** The lesson page's own longer title, without the site name after the bar. */
function pageTitle(seoTitle: string | undefined): string {
  return (seoTitle ?? '').split('|')[0]
}

let index: Indexed[] | undefined
function lessonIndex(): Indexed[] {
  index ??= TREE_LESSONS.map((lesson) => ({
    lesson,
    title: new Set(
      words(`${lesson.title} ${lesson.shortLabel ?? ''} ${pageTitle(lesson.seoTitle)}`)
    ),
    keys: new Set(
      words(
        [lesson.track ?? '', ...lesson.taxonomyAlgorithms, ...lesson.taxonomyStandards].join(' ')
      )
    ),
    text: new Set(words(`${lesson.description} ${lesson.seoDescription ?? ''}`)),
    descriptionLength: lesson.description.split(/\s+/).filter(Boolean).length,
  }))
  return index
}

let meanLength: number | undefined
/** The typical description length in the data; a term in a much longer description is more likely a passing mention. */
function meanDescriptionLength(): number {
  meanLength ??=
    lessonIndex().reduce((sum, r) => sum + r.descriptionLength, 0) / lessonIndex().length
  return meanLength
}

const textHolders = new Map<string, number>()
/** How many lessons name the word in their title or description (tags and track do not count). */
function textHolderCount(token: string): number {
  let n = textHolders.get(token)
  if (n === undefined) {
    n = lessonIndex().filter((r) => r.title.has(token) || r.text.has(token)).length
    textHolders.set(token, n)
  }
  return n
}

/** A word that some lesson carries in its title is taught by that lesson; description mentions elsewhere are side mentions. */
function namedInATitle(token: string): boolean {
  return lessonIndex().some((r) => r.title.has(token))
}

/** A word is distinctive when no more than this share of the lessons name it in title or description. */
const DISTINCTIVE_SHARE = 0.06
function isDistinctive(token: string): boolean {
  return textHolderCount(token) <= Math.max(3, Math.round(lessonIndex().length * DISTINCTIVE_SHARE))
}

/** Minimum text score for a lesson to count as a match: one title hit, one clear hit on a distinctive word, or three plain description hits. */
const MATCH_MIN = 3
/** A lesson that is only tagged with, or filed under, a word of the goal is optional at best; it needs this much to be listed. */
const OPTIONAL_MIN = 1.5
/** What a tag or track hit is worth for ordering the optional lessons, and what each further part of the same label adds. */
const LABEL_HIT = 1.5
const LABEL_HIT_EXTRA = 0.5
/** A hit on a distinctive word in a description, before the length adjustment (3.6 x factor reaches MATCH_MIN up to about 1.4 times the typical length). */
const DISTINCTIVE_DESCRIPTION_HIT = 3.6
const MAX_LENGTH_FACTOR = 1.2

interface LessonScore {
  /** What the lesson says: title hits and description hits. Only this makes a lesson a match. */
  text: number
  /** What the lesson is merely labelled with: the goal words that only its tags or track hold. */
  label: number
}

/**
 * Scores a lesson against the words of the goal.
 *  - a word in the title: 3
 *  - a word in the description: 3.6 scaled by description length when few lessons name the word
 *    (it is "distinctive", e.g. pkcs11) and no lesson carries it in a title, else 1
 *  - a word only in the tags or track: counted apart as `label`, never as `text`
 */
function scoreLesson(row: Indexed, tokens: readonly string[], industry: Set<string>): LessonScore {
  let text = 0
  let label = 0
  const mean = meanDescriptionLength()
  const lengthFactor = Math.min(MAX_LENGTH_FACTOR, (2 * mean) / (mean + row.descriptionLength))
  // One clear hit is enough for a match, so only the first distinctive description hit counts in full:
  // a term written as parts and joined ("ml", "kem", "mlkem") is still one mention.
  let clearHit = false
  let labelled = false
  for (const t of tokens) {
    if (row.title.has(t)) text += 3
    else if (row.text.has(t)) {
      if (!clearHit && isDistinctive(t) && !namedInATitle(t)) {
        clearHit = true
        text += DISTINCTIVE_DESCRIPTION_HIT * lengthFactor
      } else text += 1
    } else if (row.keys.has(t)) {
      // A tag written as parts and joined ("ml", "kem", "mlkem") is one label.
      label += labelled ? LABEL_HIT_EXTRA : LABEL_HIT
      labelled = true
    }
  }
  if (text > 0) for (const t of industry) if (row.text.has(t) || row.title.has(t)) text += 0.25
  return { text, label }
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

/** Tie-break for equal scores: the shorter description (a term there is more central), then the learning order. */
function byFocus(a: { lesson: TreeLesson }, b: { lesson: TreeLesson }): number {
  return (
    a.lesson.description.length - b.lesson.description.length ||
    compareTreeOrder(a.lesson, b.lesson)
  )
}

/** The words of the goal that a title or a description names (tags and track do not count). */
function coveredInText(tokens: readonly string[]): Set<string> {
  const said = new Set<string>()
  for (const row of lessonIndex()) {
    for (const t of tokens) if (row.title.has(t) || row.text.has(t)) said.add(t)
  }
  return said
}

/** How many lessons name a single word in a title or description, for the "one word, many lessons" test. */
function lessonsNaming(token: string): number {
  return textHolderCount(token)
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

/**
 * Builds the preview of a goal. Pure: it reads the lessons data and the arguments, nothing else.
 *
 * How the words and the knowledge model's links combine: a lesson's score is its word score (above) plus its link
 * score (`linkEvidence`: for every record the goal names, the lessons that record is taught in, each worth up to 6,
 * less for a link known only by a section title and much less the more lessons the record is taught in, so a term
 * taught in one to three lessons makes each a match by itself and a document cited by twenty lessons barely moves
 * any of them). A lesson is a match, and so required with its take-first lessons, when the sum reaches the same
 * minimum as before, whether the goal's words are in its title or not; matches are cut at half the best score, at
 * three matches and at seven required lessons as before. A goal that names no record, or a preview built without
 * the model, scores by words alone, unchanged.
 */
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
  const links = linkEvidence(input.named ?? [])
  // A single word that many lessons mention is too broad, unless the model says which lessons teach what it names.
  const taughtByName = [...links.values()].some((e) => e.score >= MATCH_MIN)
  if (
    specific.length === 0 ||
    (specific.length === 1 && lessonsNaming(specific[0]) > 12 && !taughtByName)
  ) {
    return empty
  }

  const tokens = goalTokens(goal)
  const industry = new Set(input.industry ? contentWords(input.industry) : [])
  const roleId = personaDefaultRole(input.persona)
  const scoredAll = lessonIndex()
    .map((row) => {
      const { text, label } = scoreLesson(row, tokens, industry)
      const roleBoost = roleId && row.lesson.niceWorkRoles.includes(roleId) ? 0.5 : 0
      const sum = text + (links.get(row.lesson.lmId)?.score ?? 0)
      return { lesson: row.lesson, score: sum > 0 ? sum + roleBoost : 0, label }
    })
    .filter((r) => r.score + r.label >= OPTIONAL_MIN)
  // Matches say the goal's words in their title or description, or are taught what the goal names; tag-only lessons never reach this list.
  const scored = scoredAll
    .filter((r) => r.score >= MATCH_MIN)
    .sort((a, b) => b.score - a.score || b.label - a.label || byFocus(a, b))
  // Other lessons, for the optional list: what they say first, then what they are labelled with.
  const others = scoredAll
    .filter((r) => r.score < MATCH_MIN)
    .sort(
      (a, b) =>
        Number(b.score > 0) - Number(a.score > 0) ||
        b.score + b.label - (a.score + a.label) ||
        byFocus(a, b)
    )

  const covered = coveredWords(specific)
  // A word of a phrase the model found teaching lessons is covered.
  for (const r of input.named ?? []) {
    for (const w of r.phrase.split(' ')) covered.add(stem(w))
  }
  const notCovered = specific.filter((w) => !covered.has(w))

  if (scored.length === 0) {
    // Nothing says it: a word only held as a tag or track is "not covered" for building required lessons.
    const said = coveredInText(specific)
    return { ...empty, state: 'gap', notCovered: specific.filter((w) => !said.has(w)) }
  }

  const top = scored[0].score
  const matched = scored
    .filter((r) => r.score >= Math.max(MATCH_MIN, top * 0.5))
    .slice(0, MAX_MATCHED)
  // Matches the cap left out come first among the optional lessons (the tail of `scored`), then the others.
  const optional = [...scored.filter((r) => !matched.includes(r)), ...others]

  // Required lessons: each match, then its take-first lessons, until the cap.
  const picked = new Map<string, StepOrigin>()
  const skipped: string[] = []
  for (const m of matched) {
    const adds: [string, StepOrigin][] = []
    if (!picked.has(m.lesson.lmId)) adds.push([m.lesson.lmId, { type: 'match' }])
    for (const p of m.lesson.takeFirst) {
      const pre = TREE_LESSONS.find((l) => l.id === p)
      if (pre && !picked.has(pre.lmId) && pre.lmId !== m.lesson.lmId) {
        adds.push([pre.lmId, { type: 'take-first', for: m.lesson.lmId }])
      }
    }
    if (picked.size > 0 && picked.size + adds.length > MAX_REQUIRED_LESSONS) {
      skipped.push(m.lesson.lmId)
      continue
    }
    for (const [tag, origin] of adds) picked.set(tag, origin)
  }
  const ordered = orderLessons(picked)
  // A match the cap left out is still worth offering: it leads the optional lessons.
  const optionalTags = [...new Set([...skipped, ...optional.map((r) => r.lesson.lmId)])]
    .filter((t) => !picked.has(t))
    .slice(0, MAX_OPTIONAL)

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
  // The matches that are steps: `mapped` and the required lessons tell the same story.
  const mapped = matched.map((m) => m.lesson.lmId).filter((t) => picked.has(t))
  const alreadyDone = requiredModuleTags.filter((t) => input.isDone(t))

  const duplicate = findDuplicate(goal, role, requiredModuleTags, input.existing)
  const gap = notCovered.length >= 2 && notCovered.length / specific.length >= 0.5
  const reasons: Record<string, LessonReason[]> = {}
  for (const s of steps) {
    const why = (links.get(s.tag)?.reasons ?? []).filter((x) => x.strength >= OPTIONAL_MIN)
    if (why.length > 0) reasons[s.tag] = why
  }

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
    ...(Object.keys(reasons).length > 0 ? { reasons } : {}),
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
