// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Hooks over the journey store for the screens: the "done" predicate (the learner's own marks plus
 * the Hub's completion signal for a finished lesson), the objectives of the current role and the
 * one in focus. Nothing here writes; the store's actions do.
 */
import { useCallback, useMemo } from 'react'
import { useJourneyStore } from '@/store/useJourneyStore'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { lessonByTag } from '@/services/journey/lessons'
import { NO_ROLE, type Objective } from '@/services/journey/types'

/** True for a tag the learner marked complete, or a lesson the Hub's own progress shows finished. */
export function useIsDone(): (tag: string) => boolean {
  const completions = useJourneyStore((s) => s.completions)
  const modules = useModuleStore((s) => s.modules)
  return useCallback(
    (tag: string) => {
      if (tag in completions) return true
      const lesson = lessonByTag(tag)
      return lesson ? modules[lesson.id]?.status === 'completed' : false
    },
    [completions, modules]
  )
}

/** The role key the objectives are filed under: the persona id, or `none`. */
export function useRoleKey(): string {
  return usePersonaStore((s) => s.selectedPersona) ?? NO_ROLE
}

/** The objectives of the current role, in the order they were made. */
export function useRoleObjectives(): Objective[] {
  const role = useRoleKey()
  const objectives = useJourneyStore((s) => s.objectives)
  const order = useJourneyStore((s) => s.order)
  return useMemo(
    () =>
      order
        .map((id) => objectives[id])
        .filter((o): o is Objective => Boolean(o) && o.role === role),
    [objectives, order, role]
  )
}

/** The objective in focus for the current role: the one chosen, else the first active one, else null. */
export function useFocusedObjective(): Objective | null {
  const role = useRoleKey()
  const list = useRoleObjectives()
  const focusId = useJourneyStore((s) => s.focus[role]) // eslint-disable-line security/detect-object-injection
  return useMemo(
    () => list.find((o) => o.id === focusId) ?? list.find((o) => o.state === 'active') ?? null,
    [list, focusId]
  )
}

/** True when any module has progress; the store's own starter entry is "not-started" and does not count. */
function hasOpenedAnyModule(modules: Record<string, { status: string }>): boolean {
  return Object.values(modules).some((m) => m.status !== 'not-started')
}

/**
 * True before the learner has chosen a role, made an objective or opened a lesson (the first visit,
 * UX handoff 6.17). Read once when Learn opens, to pick the view it opens on.
 */
export function isFirstVisit(): boolean {
  return (
    !usePersonaStore.getState().selectedPersona &&
    useJourneyStore.getState().order.length === 0 &&
    !hasOpenedAnyModule(useModuleStore.getState().modules)
  )
}

/** The same, kept up to date while mounted (the first-visit prompt hides as soon as a role is chosen). */
export function useIsFirstVisit(): boolean {
  const persona = usePersonaStore((s) => s.selectedPersona)
  const objectiveCount = useJourneyStore((s) => s.order.length)
  const touched = useModuleStore((s) => hasOpenedAnyModule(s.modules))
  return !persona && objectiveCount === 0 && !touched
}
