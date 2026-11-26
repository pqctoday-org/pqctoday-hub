// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The one place the number of updates is worked out: the release notices the learner has not yet seen, plus the
 * changes in the lessons of their objectives. The "Updates" tab shows `total`; the Assistant's header shows
 * `forObjective` for the objective in focus. Both come from here, so they cannot count different things.
 */
import { useCallback } from 'react'
import { useUpdates } from '@/components/MyWork'
import { useAllChangeGroups, useAllObjectiveChanges } from '@/hooks/useObjectiveChanges'
import { usePanelObjectives } from '@/hooks/useJourney'

export interface UpdateCounts {
  /** Every update still to be answered, a change in several objectives counted once. */
  total: number
  /** The updates that are about one objective. */
  forObjective: (objectiveId: string) => number
}

export function useUpdateCounts(): UpdateCounts {
  const { updates } = usePanelObjectives()
  const { notices } = useUpdates(updates)
  const groups = useAllChangeGroups()
  const changes = useAllObjectiveChanges()
  const forObjective = useCallback(
    (objectiveId: string) =>
      notices.filter((n) => n.affects.some((a) => a.objectiveId === objectiveId)).length +
      changes.filter((c) => c.objectiveId === objectiveId).length,
    [notices, changes]
  )
  return { total: notices.length + groups.length, forObjective }
}
