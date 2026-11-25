// SPDX-License-Identifier: AGPL-3.0-only
/**
 * My work as one list: comments and tracked outputs together, saved answers and saved references beside them
 * (requirement O04, handoff 6.7). Filtering and counting live here so the chips, the list and the export always
 * agree (A17).
 *
 * Nothing here is progress. An item never marks a step done, and no function reads or writes an objective's state (C04, O05).
 */
import { parseTag } from './tags'
import type {
  MyWorkData,
  MyComment,
  TrackedOutput,
  SavedAnswerRecord,
  SavedReference,
} from '@/store/useMyWorkStore'

/** The part of an objective My work needs: its name and the lessons its steps use. Lane C's objective maps onto this. */
export interface MyWorkObjective {
  id: string
  title: string
  steps: { tag: string }[]
}

export type ItemType =
  | 'comment'
  | 'technical-artifact'
  | 'business-artifact'
  | 'draft'
  | 'saved-answer'
  | 'saved-reference'

export type TypeFilter = 'all' | 'comments' | 'artifacts'
export const NOT_FILED = 'not-filed'
export const ALL_OBJECTIVES = 'all'

export type MyWorkItem =
  | { key: string; type: 'comment'; at: string; objectiveIds: string[]; comment: MyComment }
  | {
      key: string
      type: 'technical-artifact' | 'business-artifact' | 'draft'
      at: string
      objectiveIds: string[]
      output: TrackedOutput
    }
  | {
      key: string
      type: 'saved-answer'
      at: string
      objectiveIds: string[]
      answer: SavedAnswerRecord
    }
  | {
      key: string
      type: 'saved-reference'
      at: string
      objectiveIds: string[]
      reference: SavedReference
    }

const lessonOf = (tag: string): string => parseTag(tag)?.moduleTag ?? tag

/** Objectives a comment shows in: every objective with a step in the same lesson (C02, A12). */
function objectivesForComment(c: MyComment, objectives: readonly MyWorkObjective[]): string[] {
  const lesson = lessonOf(c.tag)
  return objectives.filter((o) => o.steps.some((s) => lessonOf(s.tag) === lesson)).map((o) => o.id)
}

const known = (id: string | undefined, objectives: readonly MyWorkObjective[]): string[] =>
  id && objectives.some((o) => o.id === id) ? [id] : []

export function buildItems(data: MyWorkData, objectives: readonly MyWorkObjective[]): MyWorkItem[] {
  const items: MyWorkItem[] = []
  for (const comment of data.comments) {
    items.push({
      key: `c:${comment.id}`,
      type: 'comment',
      at: comment.updatedAt,
      objectiveIds: objectivesForComment(comment, objectives),
      comment,
    })
  }
  for (const output of data.outputs) {
    items.push({
      key: `o:${output.id}`,
      type:
        output.kind === 'technical'
          ? 'technical-artifact'
          : output.kind === 'draft'
            ? 'draft'
            : 'business-artifact',
      at: output.updatedAt,
      objectiveIds: known(output.objectiveId, objectives),
      output,
    })
  }
  for (const answer of data.answers) {
    items.push({
      key: `a:${answer.id}`,
      type: 'saved-answer',
      at: answer.savedAt,
      objectiveIds: known(answer.objectiveId, objectives),
      answer,
    })
  }
  for (const reference of data.references) {
    items.push({
      key: `r:${reference.id}`,
      type: 'saved-reference',
      at: reference.createdAt,
      objectiveIds: known(reference.objectiveId, objectives),
      reference,
    })
  }
  // Newest first; the key breaks ties so the same data always lists the same way.
  return items.sort((a, b) => (a.at === b.at ? (a.key < b.key ? -1 : 1) : a.at < b.at ? 1 : -1))
}

export const isCommentItem = (i: MyWorkItem) => i.type === 'comment'

function matchesType(i: MyWorkItem, type: TypeFilter): boolean {
  if (type === 'all') return true
  return type === 'comments' ? i.type === 'comment' : i.type !== 'comment'
}

function matchesObjective(i: MyWorkItem, objective: string): boolean {
  if (objective === ALL_OBJECTIVES) return true
  if (objective === NOT_FILED) return i.objectiveIds.length === 0
  return i.objectiveIds.includes(objective)
}

export function filterItems(
  items: readonly MyWorkItem[],
  objective: string,
  type: TypeFilter
): MyWorkItem[] {
  return items.filter((i) => matchesType(i, type) && matchesObjective(i, objective))
}

export interface FilterCounts {
  /** "All (n)": counted within the chosen type. */
  all: number
  notFiled: number
  byObjective: Record<string, number>
  /** Type counts within the chosen objective. */
  types: Record<TypeFilter, number>
}

/** Chip counts that always equal the length of the list the chip would show (A17). */
export function countItems(
  items: readonly MyWorkItem[],
  objectives: readonly MyWorkObjective[],
  objective: string,
  type: TypeFilter
): FilterCounts {
  const byType = items.filter((i) => matchesType(i, type))
  const byObjective: Record<string, number> = {}
  for (const o of objectives)
    byObjective[o.id] = byType.filter((i) => i.objectiveIds.includes(o.id)).length
  const inObjective = items.filter((i) => matchesObjective(i, objective))
  return {
    all: byType.length,
    notFiled: byType.filter((i) => i.objectiveIds.length === 0).length,
    byObjective,
    types: {
      all: inObjective.length,
      comments: inObjective.filter((i) => i.type === 'comment').length,
      artifacts: inObjective.filter((i) => i.type !== 'comment').length,
    },
  }
}

/** Items grouped by the day they were last changed, newest day first (a local calendar day). */
export function groupByDay(items: readonly MyWorkItem[]): { day: string; items: MyWorkItem[] }[] {
  const groups = new Map<string, MyWorkItem[]>()
  for (const i of items) {
    const d = new Date(i.at)
    const day = Number.isNaN(d.getTime())
      ? 'Earlier'
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    groups.set(day, [...(groups.get(day) ?? []), i])
  }
  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([day, list]) => ({ day, items: list }))
}
