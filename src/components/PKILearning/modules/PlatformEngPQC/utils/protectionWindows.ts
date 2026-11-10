// SPDX-License-Identifier: AGPL-3.0-only
import type { PipelineStage, ProtectionWindow, SampleDuration } from '../data/platformEngConstants'

export const SAMPLE_COHORT_YEAR = 2026
const START = Date.UTC(SAMPLE_COHORT_YEAR, 0, 1)
export type WindowOutcome = 'beyond' | 'ends-by' | 'indeterminate' | 'unassessed'

/** Fictional Jan 1 UTC cohort: calendar years, 24-hour days and 60-minute hours. */
function endDate(duration: SampleDuration | null | undefined): number | undefined {
  if (!duration || typeof duration !== 'object') return undefined
  if (!Number.isFinite(duration.value) || duration.value < 0) return undefined
  let end: number
  switch (duration.unit) {
    case 'years':
      if (!Number.isInteger(duration.value)) return undefined
      end = Date.UTC(SAMPLE_COHORT_YEAR + duration.value, 0, 1)
      break
    case 'days':
      end = START + duration.value * 24 * 60 * 60 * 1000
      break
    case 'hours':
      end = START + duration.value * 60 * 60 * 1000
      break
    default:
      return undefined
  }
  return Number.isFinite(new Date(end).getTime()) ? end : undefined
}

export function compareProtectionWindow(
  window: ProtectionWindow | undefined,
  horizonYear: number
): WindowOutcome {
  if (!window || !Number.isInteger(horizonYear) || horizonYear < SAMPLE_COHORT_YEAR)
    return 'unassessed'
  const horizon = Date.UTC(horizonYear, 0, 1)
  const min = endDate(window.min)
  const max = window.max === undefined ? undefined : endDate(window.max)
  if (
    !Number.isFinite(new Date(horizon).getTime()) ||
    min === undefined ||
    (window.max !== undefined && (max === undefined || max < min))
  )
    return 'unassessed'
  if (min > horizon) return 'beyond'
  if (max !== undefined && max <= horizon) return 'ends-by'
  return 'indeterminate'
}

export function windowOutcomeLabel(outcome: WindowOutcome): string {
  switch (outcome) {
    case 'beyond':
      return 'Protection extends beyond horizon'
    case 'ends-by':
      return 'Window ends by horizon'
    case 'indeterminate':
      return 'Indeterminate at horizon'
    case 'unassessed':
      return 'Unassessed — window not modeled or invalid'
  }
}

function durationLabel(duration: SampleDuration) {
  return `${duration.value} ${duration.value === 1 ? duration.unit.slice(0, -1) : duration.unit}`
}

export function formatProtectionWindow(window: ProtectionWindow | undefined): string {
  if (!window) return 'Not modeled in this record'
  // Validate independently of any selected horizon before displaying an asserted bound.
  if (compareProtectionWindow(window, SAMPLE_COHORT_YEAR) === 'unassessed') return 'Invalid bounds'
  if (!window.max) return `${window.min.value}+ ${window.min.unit}`
  if (window.min.value === window.max.value && window.min.unit === window.max.unit)
    return durationLabel(window.min)
  if (window.min.unit === window.max.unit) return `${window.min.value}–${durationLabel(window.max)}`
  return `${durationLabel(window.min)}–${durationLabel(window.max)}`
}

function tally(outcomes: WindowOutcome[]) {
  return {
    total: outcomes.length,
    beyond: outcomes.filter((o) => o === 'beyond').length,
    endsBy: outcomes.filter((o) => o === 'ends-by').length,
    indeterminate: outcomes.filter((o) => o === 'indeterminate').length,
    unassessed: outcomes.filter((o) => o === 'unassessed').length,
  }
}

export function assessProtectionWindows(
  stages: PipelineStage[],
  horizonYear: number,
  stageFilter = 'All'
) {
  const assets = stages
    .filter((stage) => stageFilter === 'All' || stage.id === stageFilter)
    .flatMap((stage) =>
      stage.cryptoAssets
        .filter((asset) => asset.quantumVulnerable)
        .map((asset) => ({
          ...asset,
          stageName: stage.label,
          confidentiality: compareProtectionWindow(
            asset.protectionWindows?.confidentiality,
            horizonYear
          ),
          authenticity: compareProtectionWindow(asset.protectionWindows?.authenticity, horizonYear),
        }))
    )
  // An omitted other purpose is not a claim of safety. Count only authored windows in
  // purpose summaries and separately expose records with no window metadata at all.
  const confidentiality = tally(
    assets
      .filter((a) => a.protectionWindows?.confidentiality !== undefined)
      .map((a) => a.confidentiality)
  )
  const authenticity = tally(
    assets.filter((a) => a.protectionWindows?.authenticity !== undefined).map((a) => a.authenticity)
  )
  const notModeled = assets.filter(
    (a) => !a.protectionWindows?.confidentiality && !a.protectionWindows?.authenticity
  ).length
  return { assets, confidentiality, authenticity, notModeled }
}

export function describeWindowCounts(counts: ReturnType<typeof tally>) {
  return `${counts.beyond} extend beyond horizon, ${counts.endsBy} end by horizon, ${counts.indeterminate} indeterminate, ${counts.unassessed} unassessed`
}
