// SPDX-License-Identifier: AGPL-3.0-only
import { LEARN_MODULES } from './generated/learnModules.generated'

export interface LearnOrder {
  stage: number
  stageName: string
  takeFirst: string[]
  next: string[]
}

// Stage, stage name and "take first" prerequisites live in the lessons data file
// (src/data/learn_modules_*.csv), read here through its generated records.
const rows = LEARN_MODULES.flatMap((lesson) =>
  lesson.stage === undefined || lesson.stageName === undefined
    ? []
    : [
        {
          moduleId: lesson.id,
          stage: lesson.stage,
          stageName: lesson.stageName,
          takeFirst: [...lesson.takeFirst],
        },
      ]
)

const nextByModuleId = new Map<string, string[]>()
for (const row of rows) {
  for (const prerequisiteId of row.takeFirst) {
    const next = nextByModuleId.get(prerequisiteId) ?? []
    next.push(row.moduleId)
    nextByModuleId.set(prerequisiteId, next)
  }
}

/** Learning-order metadata keyed by Learn module id. */
export const LEARN_ORDER: Readonly<Record<string, LearnOrder>> = Object.fromEntries(
  rows.map(({ moduleId, stage, stageName, takeFirst }) => [
    moduleId,
    { stage, stageName, takeFirst, next: nextByModuleId.get(moduleId) ?? [] },
  ])
)

/** Returns learning-order metadata when the id belongs to a Learn module. */
export function getLearnOrder(moduleId: string): LearnOrder | undefined {
  return LEARN_ORDER[moduleId]
}
