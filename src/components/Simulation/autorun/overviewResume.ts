// SPDX-License-Identifier: AGPL-3.0-only
import type { PhaseId } from '@/data/frameworkPhases'
import type { AutoRunQueueItem } from './simAutoRun'

export type OverviewMode = 'walkthrough' | 'walkthrough-deep'
export interface OverviewBookmark {
  mode: OverviewMode
  phase: PhaseId
  routeSignature: string
}

export function overviewRouteSignature(queue: readonly AutoRunQueueItem[]): string {
  return JSON.stringify(
    queue.map(({ phase, step, reuseArtifact }) => [
      phase,
      step.kind,
      step.to,
      step.artifactType ?? '',
      reuseArtifact ?? false,
    ])
  )
}

export function readOverviewBookmark(value: unknown): OverviewBookmark | null {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  if (
    (record.mode !== 'walkthrough' && record.mode !== 'walkthrough-deep') ||
    typeof record.phase !== 'string' ||
    typeof record.routeSignature !== 'string'
  )
    return null
  return record as unknown as OverviewBookmark
}

/** Resume at a stable chapter boundary, never at an index from another route. */
export function overviewResumeIndex(
  value: unknown,
  queue: readonly AutoRunQueueItem[],
  mode: string
): number | undefined {
  const bookmark = readOverviewBookmark(value)
  if (
    !bookmark ||
    bookmark.mode !== mode ||
    bookmark.routeSignature !== overviewRouteSignature(queue)
  )
    return undefined
  const index = queue.findIndex((item) => item.phase === bookmark.phase)
  return index >= 0 ? index : undefined
}
