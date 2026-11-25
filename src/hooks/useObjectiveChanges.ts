// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Hooks over the curriculum changes of the learner's objectives. They read; the journey store's actions write.
 */
import { useMemo } from 'react'
import { useMyWorkStore } from '@/store/useMyWorkStore'
import { computeObjectiveChanges, type ObjectiveChange } from '@/services/journey/changes'
import type { Objective } from '@/services/journey/types'
import { useRoleObjectives } from './useJourney'

/** The unanswered changes of one objective; with `stepId`, only those about that step. */
export function useObjectiveChanges(
  objective: Objective | null | undefined,
  stepId?: string
): ObjectiveChange[] {
  const comments = useMyWorkStore((s) => s.comments)
  return useMemo(() => {
    if (!objective) return []
    const all = computeObjectiveChanges(objective, comments)
    return stepId ? all.filter((c) => c.stepId === stepId) : all
  }, [objective, comments, stepId])
}

/** The unanswered changes of every objective of the learner's role. */
export function useAllObjectiveChanges(): ObjectiveChange[] {
  const objectives = useRoleObjectives()
  const comments = useMyWorkStore((s) => s.comments)
  return useMemo(
    () => objectives.flatMap((o) => computeObjectiveChanges(o, comments)),
    [objectives, comments]
  )
}
