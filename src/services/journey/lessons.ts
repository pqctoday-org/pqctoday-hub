// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The lessons the journey is built from. Everything here is read from the lessons data file
 * (through its generated records); nothing about a lesson is typed again in the journey code.
 * A "lesson in the tree" is a lesson with a stage; the practice quiz has none.
 */
import { LEARN_MODULES, type LearnModuleRecord } from '@/data/generated/learnModules.generated'

/** A lesson that sits in the learning order (has a stage and a tag). */
export interface TreeLesson extends LearnModuleRecord {
  lmId: string
  stage: number
  stageName: string
}

function inTree(m: LearnModuleRecord): m is TreeLesson {
  return m.lmId !== undefined && m.stage !== undefined && m.stageName !== undefined
}

/** The order the Learn tree reads in: stage, then the track's own order, then the lesson id. */
export function compareTreeOrder(a: TreeLesson, b: TreeLesson): number {
  return (
    a.stage - b.stage ||
    (a.trackOrder ?? 0) - (b.trackOrder ?? 0) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  )
}

export const TREE_LESSONS: readonly TreeLesson[] = LEARN_MODULES.filter(inTree)

const byTag = new Map(TREE_LESSONS.map((m) => [m.lmId, m]))
const byId = new Map(TREE_LESSONS.map((m) => [m.id, m]))

/** The lesson a canonical tag (`LM-008`) names, if it is in the tree. */
export function lessonByTag(tag: string): TreeLesson | undefined {
  return byTag.get(tag)
}

/** The lesson a module id names, if it is in the tree. */
export function lessonById(moduleId: string): TreeLesson | undefined {
  return byId.get(moduleId)
}

/** The canonical tag of a module id, if it has one. */
export function tagOfModule(moduleId: string): string | undefined {
  return byId.get(moduleId)?.lmId
}

/** Stages of the tree with their names, in order. */
export const STAGES: readonly { stage: number; name: string }[] = [
  ...new Map(TREE_LESSONS.map((m) => [m.stage, m.stageName])).entries(),
]
  .map(([stage, name]) => ({ stage, name }))
  .sort((a, b) => a.stage - b.stage)
