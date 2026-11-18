// SPDX-License-Identifier: AGPL-3.0-only
import type { ScorecardObservation } from './DataDrivenScorecard'

export const SYSTEMS_INVENTORIED = 'systems-inventoried'

const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 })

export function inventoryCoverageText(
  dimensionId: string,
  observation?: Pick<ScorecardObservation, 'numerator' | 'denominator'>
): string | undefined {
  if (dimensionId !== SYSTEMS_INVENTORIED) return
  const completed = observation?.numerator?.trim() ?? ''
  const total = observation?.denominator?.trim() ?? ''
  if (!completed && !total) return
  const completedCount = Number(completed)
  const totalCount = Number(total)
  if (
    !/^\d+$/.test(completed) ||
    !/^\d+$/.test(total) ||
    !Number.isSafeInteger(completedCount) ||
    !Number.isSafeInteger(totalCount) ||
    totalCount === 0 ||
    completedCount > totalCount
  ) {
    return 'Enter whole-number counts with a positive total and no more inventoried systems than the total.'
  }

  return `${completedCount} of ${totalCount} systems inventoried (${percent.format(completedCount / totalCount)})`
}
