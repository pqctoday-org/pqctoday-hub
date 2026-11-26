// SPDX-License-Identifier: AGPL-3.0-only
import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { PERSONAS } from '@/data/learningPersonas'
import { useIsDone } from '@/hooks/useJourney'
import { useObjectiveChanges } from '@/hooks/useObjectiveChanges'
import { CHANGE_LABEL } from '@/services/journey/changes'
import { sectionsOfLesson, takeFirstTags } from '@/services/journey/curriculum'
import {
  compareTreeOrder,
  lessonById,
  lessonByTag,
  tagOfModule,
  TREE_LESSONS,
} from '@/services/journey/lessons'
import { nowStep } from '@/services/journey/stepRules'
import { NO_ROLE, type Objective } from '@/services/journey/types'
import { objectiveTitle } from '@/services/journey/stepView'
import { pageTagFor } from '@/services/assistant/pageTag'
import { loadedKnowledgeReader, type KnowledgeReader } from '@/services/knowledge/knowledgeReader'
import { useJourneyStore } from '@/store/useJourneyStore'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import {
  rankSuggestions,
  type ChangedLesson,
  type LessonRef,
  type RankedSuggestion,
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

/** The lesson finished most recently: the learner's own marks and the Hub's completion signal, newest first. */
function lastFinished(
  completions: Record<string, { at: number }>,
  modules: Record<string, { status: string; lastVisited: number }>
): (LessonRef & { at: number }) | null {
  const found = new Map<string, number>()
  for (const [tag, c] of Object.entries(completions)) {
    if (lessonByTag(tag)) found.set(tag, Math.max(found.get(tag) ?? 0, c.at))
  }
  for (const [id, m] of Object.entries(modules)) {
    const tag = m.status === 'completed' ? tagOfModule(id) : undefined
    if (tag) found.set(tag, Math.max(found.get(tag) ?? 0, m.lastVisited))
  }
  let best: (LessonRef & { at: number }) | null = null
  for (const [tag, at] of found) {
    const ref = lessonRef(tag)
    if (!ref) continue
    if (!best || at > best.at || (at === best.at && ref.order < best.order)) best = { ...ref, at }
  }
  return best
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

export function useSuggestions(askedQuestions: readonly string[]): RankedSuggestion[] {
  const { pathname, search, key } = useLocation()
  const objectives = useJourneyStore((s) => s.objectives)
  const order = useJourneyStore((s) => s.order)
  const focus = useJourneyStore((s) => s.focus)
  const persona = usePersonaStore((s) => s.selectedPersona)
  const objective = useMemo(
    () => focusedObjectiveOf(objectives, order, focus, persona ?? NO_ROLE),
    [objectives, order, focus, persona]
  )
  const isDone = useIsDone()
  const changes = useObjectiveChanges(objective)
  const completions = useJourneyStore((s) => s.completions)
  const modules = useModuleStore((s) => s.modules)
  const reader = loadedKnowledgeReader()
  const asked = askedQuestions.join('\n')

  // The clock is read when the state it goes with changes, so the same state is ranked at one time.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => Date.now(), [completions, modules, key, asked])

  return useMemo(() => {
    const active = objective?.state === 'active' ? objective : null
    const step = active ? nowStep(active, isDone) : null
    const next = step?.kind === 'module' ? lessonRef(step.resourceTag) : null
    const prerequisites =
      step && next ? takeFirstTags(step.resourceTag).filter((t) => !isDone(t)) : []
    const updates = new Map<string, ChangedLesson>()
    for (const c of active ? changes : []) {
      const ref = lessonRef(c.lessonTag)
      if (ref && !updates.has(ref.tag))
        updates.set(ref.tag, { ...ref, kindLabel: CHANGE_LABEL[c.kind] })
    }
    const state: SuggestionState = {
      now,
      asked: askedQuestions,
      finished: lastFinished(completions, modules),
      viewing: viewingFor(pathname, search, reader),
      objective: active
        ? {
            title: objectiveTitle(active),
            next,
            prerequisites: prerequisites.flatMap((t) => lessonRef(t) ?? []),
            updates: [...updates.values()],
          }
        : null,
      role: persona ? { id: persona, label: PERSONAS[persona].label } : null,
    }
    return rankSuggestions(state)
  }, [
    now,
    askedQuestions,
    completions,
    modules,
    pathname,
    search,
    reader,
    objective,
    isDone,
    changes,
    persona,
  ])
}
