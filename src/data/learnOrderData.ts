// SPDX-License-Identifier: AGPL-3.0-only
import { loadLatestCSV, splitSemicolon } from './csvUtils'

interface LearnOrderRow {
  module_id: string
  stage: string
  stage_name: string
  take_first: string
}

export interface LearnOrder {
  stage: number
  stageName: string
  takeFirst: string[]
  next: string[]
}

const csvModules = import.meta.glob('./learn_modules_*.csv', {
  eager: true,
  query: '?raw',
  import: 'default',
})

const { data: rows } = loadLatestCSV<
  LearnOrderRow,
  Omit<LearnOrder, 'next'> & { moduleId: string }
>(
  csvModules,
  /learn_modules_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => {
    const stage = Number.parseInt(row.stage, 10)
    if (!row.module_id || !Number.isInteger(stage)) return null

    return {
      moduleId: row.module_id,
      stage,
      stageName: row.stage_name,
      takeFirst: splitSemicolon(row.take_first),
    }
  },
  false,
  ['module_id', 'stage', 'stage_name', 'take_first']
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
