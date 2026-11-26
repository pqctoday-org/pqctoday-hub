// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useMemo } from 'react'
import { useLocation } from 'react-router'
import { PERSONAS } from '@/data/learningPersonas'
import { useIsDone } from '@/hooks/useJourney'
import { useObjectiveChanges } from '@/hooks/useObjectiveChanges'
import { CHANGE_LABEL } from '@/services/journey/changes'
import { sectionsOfLesson, takeFirstTags } from '@/services/journey/curriculum'
import { TOOL_RECORDS } from '@/data/generated/tools.generated'
import {
  compareTreeOrder,
  lessonById,
  lessonByTag,
  tagOfModule,
  TREE_LESSONS,
} from '@/services/journey/lessons'
import { nowStep } from '@/services/journey/stepRules'
import { NO_ROLE, type Objective, type Step } from '@/services/journey/types'
import { objectiveTitle } from '@/services/journey/stepView'
import { pageTagFor } from '@/services/assistant/pageTag'
import { loadedKnowledgeReader, type KnowledgeReader } from '@/services/knowledge/knowledgeReader'
import { useJourneyStore } from '@/store/useJourneyStore'
import { useAssistantAskedStore } from '@/store/useAssistantAskedStore'
import { useAssistantSessionStore, type AssistantTurn } from '@/store/useAssistantSessionStore'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { stateKey } from './askedKey'
import {
  rankSuggestions,
  type ChangedLesson,
  type LastAnswerRef,
  type LessonRef,
  type ObjectiveChoice,
  type RankedSuggestion,
  type StepRef,
  type SuggestionState,
  type ViewingRef,
} from './suggestionRanker'

/**
 * The questions the drawer offers, ranked from what the learner is doing. This hook only reads: the journey and objective
 * hooks, the progress stores and the page address come in; nothing is written back. The ranking itself is the pure
 * `rankSuggestions`.
 */

let orderOf: Map<string, number> | null = null
/** A lesson's place in the curriculum (stage, track, then id), as one number. */
function curriculumOrder(tag: string): number {
  orderOf ??= new Map([...TREE_LESSONS].sort(compareTreeOrder).map((m, i) => [m.lmId, i]))
  return orderOf.get(tag) ?? Number.MAX_SAFE_INTEGER
}

function lessonRef(tag: string): LessonRef | null {
  const lesson = lessonByTag(tag)
  return lesson ? { tag, title: lesson.title, order: curriculumOrder(tag) } : null
}

/** What the page at this address is: a lesson, a section of one, or a record of the knowledge model. */
export function viewingFor(
  pathname: string,
  search: string,
  reader: Pick<KnowledgeReader, 'get' | 'recordAt'> | null
): ViewingRef | null {
  const lessonId = /^\/learn\/([^/]+)\/?$/.exec(pathname)?.[1]
  const lesson = lessonId ? lessonById(lessonId) : undefined
  if (lesson) {
    const sectionId = new URLSearchParams(search).get('section')
    const section = sectionId ? sectionsOfLesson(lesson.id).find((s) => s.id === sectionId) : null
    if (section) {
      return {
        tag: `${lesson.lmId}/s:${section.id}`,
        title: section.label,
        kind: 'section',
        lessonTitle: lesson.title,
      }
    }
    return { tag: lesson.lmId, title: lesson.title, kind: 'lesson' }
  }
  if (!reader) return null
  const tag = pageTagFor(pathname + search, reader)
  const record = tag ? reader.get(tag) : undefined
  return record ? { tag: record.id, title: record.label, kind: 'record' } : null
}

/**
 * The lesson the learner recorded as finished most recently, with the time it was recorded. Only the journey's own completion
 * stamps count: the Hub's progress signal for a lesson (its "completed" status) carries no completion time, only the time the
 * lesson was last opened, and that moves when a finished lesson is read again. A lesson finished only by that signal is
 * never called just finished.
 */
function lastFinished(
  completions: Record<string, { at: number }>
): (LessonRef & { at: number }) | null {
  let best: (LessonRef & { at: number }) | null = null
  for (const [tag, c] of Object.entries(completions)) {
    const ref = lessonRef(tag)
    if (!ref) continue
    if (!best || c.at > best.at || (c.at === best.at && ref.order < best.order))
      best = { ...ref, at: c.at }
  }
  return best
}

/** The tool a business-tool step points at (its tag is the knowledge tag `BT:<id>`, `TOOL:<id>` or the bare id). */
function toolOfStep(tag: string) {
  const id = tag.replace(/^(?:BT|TOOL):/, '')
  return TOOL_RECORDS.find((t) => t.toolId === id)
}

/** What a step points at, when the Hub has a lesson or a tool of that name; null for a step with nothing to ask about. */
function stepRef(step: Step): StepRef | null {
  if (step.kind === 'module') {
    const ref = lessonRef(step.resourceTag)
    return ref ? { ...ref, kind: 'lesson' } : null
  }
  if (step.kind === 'business-tool') {
    const tool = toolOfStep(step.resourceTag)
    return tool
      ? { tag: step.resourceTag, title: tool.name, order: Number.MAX_SAFE_INTEGER, kind: 'tool' }
      : null
  }
  return null
}

/** The lessons to take first for a step that are not finished; for a tool, the lesson it belongs to. */
function prerequisitesOf(step: Step, isDone: (tag: string) => boolean): LessonRef[] {
  const tags =
    step.kind === 'module'
      ? takeFirstTags(step.resourceTag)
      : step.kind === 'business-tool'
        ? [lessonById(toolOfStep(step.resourceTag)?.module ?? '')?.lmId ?? '']
        : []
  return tags.filter((t) => t && !isDone(t)).flatMap((t) => lessonRef(t) ?? [])
}

/**
 * The objective in focus for the role, chosen as the header chooses it (the one set, else the first active one). It is read from
 * the store's data alone: the journey hooks that offer the same view also tidy the store when they mount (they adopt objectives
 * made before a role was chosen and record what an objective was built on), and the ranker's inputs must not write.
 */
export function focusedObjectiveOf(
  objectives: Record<string, Objective>,
  order: readonly string[],
  focus: Record<string, string | null>,
  role: string
): Objective | null {
  const list = order
    .map((id) => objectives[id]) // eslint-disable-line security/detect-object-injection
    .filter((o): o is Objective => Boolean(o) && o.role === role)
  // eslint-disable-next-line security/detect-object-injection
  return list.find((o) => o.id === focus[role]) ?? list.find((o) => o.state === 'active') ?? null
}

/**
 * The objective to rank by, and the choices when none is in focus. With no objective set in focus and two or more active ones,
 * there is no objective to rank by (requirement S08) and the active ones are the choices; otherwise the choices are empty and
 * the objective is the one the header shows.
 */
export function objectiveStateOf(
  objectives: Record<string, Objective>,
  order: readonly string[],
  focus: Record<string, string | null>,
  role: string
): { objective: Objective | null; choices: Objective[] } {
  const list = order
    .map((id) => objectives[id]) // eslint-disable-line security/detect-object-injection
    .filter((o): o is Objective => Boolean(o) && o.role === role)
  // eslint-disable-next-line security/detect-object-injection
  const explicit = list.find((o) => o.id === focus[role])
  const active = list.filter((o) => o.state === 'active')
  if (!explicit && active.length >= 2) return { objective: null, choices: active }
  return { objective: focusedObjectiveOf(objectives, order, focus, role), choices: [] }
}

/** The tags of the lessons the learner has finished: their own marks and the Hub's completion signal. */
function doneLessons(
  completions: Record<string, unknown>,
  modules: Record<string, { status: string }>
): string[] {
  const done = new Set(Object.keys(completions).filter((t) => lessonByTag(t)))
  for (const [id, m] of Object.entries(modules)) {
    const tag = m.status === 'completed' ? tagOfModule(id) : undefined
    if (tag) done.add(tag)
  }
  return [...done].sort()
}

/**
 * The key of "the focused objective and the learner's progress": the role, the objective in focus with its state and steps, the
 * active objectives when none is in focus, and every lesson finished. A question asked under one key is not offered again
 * under the same key; when any part changes, it is offered again.
 */
export function progressKey(
  role: string,
  objective: Objective | null,
  choices: readonly Objective[],
  done: readonly string[]
): string {
  const steps = (o: Objective) =>
    [...o.steps]
      .sort((a, b) => a.position - b.position)
      .map((s) => `${s.id}=${s.resourceTag}${s.required ? '' : '?'}${s.deferred ? '~' : ''}`)
      .join(',')
  return stateKey([
    role,
    objective ? `${objective.id}|${objective.state}|${steps(objective)}` : '-',
    choices.map((o) => `${o.id}|${steps(o)}`).join(';'),
    done.join(','),
  ])
}

/** The state the learner is in, read from the journey, the objective hooks and the progress stores, without writing to them. */
function useLearnerState() {
  const objectives = useJourneyStore((s) => s.objectives)
  const order = useJourneyStore((s) => s.order)
  const focus = useJourneyStore((s) => s.focus)
  const completions = useJourneyStore((s) => s.completions)
  const modules = useModuleStore((s) => s.modules)
  const persona = usePersonaStore((s) => s.selectedPersona)
  const role = persona ?? NO_ROLE
  const { objective, choices } = useMemo(
    () => objectiveStateOf(objectives, order, focus, role),
    [objectives, order, focus, role]
  )
  const done = useMemo(() => doneLessons(completions, modules), [completions, modules])
  const key = useMemo(
    () => progressKey(role, objective, choices, done),
    [role, objective, choices, done]
  )
  return { objective, choices, completions, persona, key }
}

/** What a next question can build on in the last answer shown. */
export function lastAnswerOf(turns: readonly AssistantTurn[]): LastAnswerRef | null {
  const turn = [...turns].reverse().find((t) => t.status === 'done')
  if (!turn || turn.status !== 'done') return null
  const a = turn.answer
  if (a.state === 'not-held') return null
  const record =
    a.state === 'direct' || a.state === 'resources'
      ? a.source
      : a.state === 'name'
        ? a.nameCard
        : null
  const rows =
    a.state === 'choices'
      ? []
      : a.groups.flatMap((g) => (g.name === 'Learn' ? [...g.rows, ...g.more] : []))
  const lessonRow = rows.find((r) => /^LM-\d+$/.test(r.tag))
  const matchedLesson = record && /^LM-\d+$/.test(record.tag) ? lessonRef(record.tag) : null
  const lesson = lessonRow ? lessonRef(lessonRow.tag) : matchedLesson
  return {
    matched:
      record && !/^(?:LM-|PAGE:)/.test(record.tag)
        ? { tag: record.tag, title: record.title }
        : null,
    lesson,
  }
}

export function useSuggestions(): RankedSuggestion[] {
  const { pathname, search, key: locationKey } = useLocation()
  const { objective, choices, completions, persona, key } = useLearnerState()
  const turns = useAssistantSessionStore((s) => s.turns)
  const isDone = useIsDone()
  const changes = useObjectiveChanges(objective)
  const entries = useAssistantAskedStore((s) => s.entries)
  const reader = loadedKnowledgeReader()
  const askedQuestions = useMemo(() => turns.map((t) => t.question), [turns])

  // The clock is read when the state it goes with changes, so the same state is ranked at one time.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => Date.now(), [completions, locationKey, turns])

  return useMemo(() => {
    const active = objective?.state === 'active' ? objective : null
    const step = active ? nowStep(active, isDone) : null
    const next = step ? stepRef(step) : null
    const updates = new Map<string, ChangedLesson>()
    for (const c of active ? changes : []) {
      const ref = lessonRef(c.lessonTag)
      if (ref && !updates.has(ref.tag))
        updates.set(ref.tag, { ...ref, kindLabel: CHANGE_LABEL[c.kind] })
    }
    const choiceRefs: ObjectiveChoice[] = choices.map((o) => {
      const s = nowStep(o, isDone)
      return {
        title: objectiveTitle(o),
        next: s ? stepRef(s) : null,
        usedAt: Math.max(o.updatedAt, o.createdAt),
      }
    })
    const state: SuggestionState = {
      now,
      asked: askedQuestions,
      askedKeys: entries.filter((e) => e.s === key).map((e) => e.q),
      lastAnswer: lastAnswerOf(turns),
      finished: lastFinished(completions),
      viewing: viewingFor(pathname, search, reader),
      objective: active
        ? {
            title: objectiveTitle(active),
            next,
            prerequisites: step && next ? prerequisitesOf(step, isDone) : [],
            updates: [...updates.values()],
          }
        : null,
      choices: choiceRefs,
      role: persona ? { id: persona, label: PERSONAS[persona].label } : null,
    }
    return rankSuggestions(state)
  }, [
    now,
    askedQuestions,
    entries,
    key,
    turns,
    completions,
    pathname,
    search,
    reader,
    objective,
    choices,
    isDone,
    changes,
    persona,
  ])
}

/**
 * Remembers each question answered in the drawer under the state the learner was in, so the suggestions do not offer it again
 * until the objective or the progress changes. Only hashes are kept (see the asked store); nothing is written to the journey.
 */
export function useRememberAsked(): void {
  const { key } = useLearnerState()
  const turns = useAssistantSessionStore((s) => s.turns)
  const remember = useAssistantAskedStore((s) => s.remember)
  useEffect(() => {
    const done = turns.filter((t) => t.status === 'done').map((t) => t.question)
    if (done.length > 0) remember(done, key)
  }, [turns, key, remember])
}
