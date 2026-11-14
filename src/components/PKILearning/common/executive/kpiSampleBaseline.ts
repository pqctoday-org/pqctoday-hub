// SPDX-License-Identifier: AGPL-3.0-only
import { KPI_CATALOG, type KpiSurface } from '@/data/kpiCatalog'
import type { KpiValueOrigin } from './scorecardValueOrigin'

/**
 * Fictional baseline for a sample organization part-way through its PQC
 * programme. It fills only the KPIs a learner normally types in (no catalogue
 * calculation), so the combined score and the persona weights can be explored on
 * a fresh worksheet. Every value is tagged `sample-baseline`, never as a learner
 * entry, and moving a slider replaces it with the learner's own value.
 */
export const KPI_SAMPLE_BASELINE: Readonly<Record<string, number>> = {
  'systems-inventoried': 65,
  'cbom-completeness': 40,
  'algorithms-migrated': 20,
  'compliance-gaps': 55,
  'pace-to-deadline': 45,
  'crown-jewel-coverage': 50,
  'threat-exposure': 60,
  'hndl-horizon': 35,
  'change-failure-rate': 85,
  'canary-coverage': 30,
  'training-completion': 60,
  'algorithm-diversity': 40,
  'standards-coverage': 55,
}

/** Manual readiness KPIs on a surface, across every persona lens. */
function manualKpiIds(surface: KpiSurface): string[] {
  return KPI_CATALOG.filter(
    (k) => k.surfaces.includes(surface) && k.autoScore === undefined && !k.reportingOnly
  )
    .map((k) => k.id)
    .filter((id) => KPI_SAMPLE_BASELINE[id] !== undefined)
}

/**
 * Add the sample baseline to the current values. Only a manual KPI with no value
 * at all, or one whose origin is "not entered", receives a sample value. Any
 * other existing value is kept untouched, including restored values whose origin
 * was never recorded and saved calculation snapshots, so Clear cannot delete
 * them. Ids for every persona lens are filled, so switching the lens keeps the
 * score available.
 */
export function withKpiSampleBaseline(
  surface: KpiSurface,
  scores: Record<string, number>,
  origins: Record<string, KpiValueOrigin>
): { scores: Record<string, number>; origins: Record<string, KpiValueOrigin> } {
  const nextScores = { ...scores }
  const nextOrigins = { ...origins }
  for (const id of manualKpiIds(surface)) {
    if (id in scores && origins[id] !== 'not-entered') continue
    nextScores[id] = KPI_SAMPLE_BASELINE[id]!
    nextOrigins[id] = 'sample-baseline'
  }
  return { scores: nextScores, origins: nextOrigins }
}

/** Remove every value still carrying the sample-baseline origin. */
export function withoutKpiSampleBaseline(
  scores: Record<string, number>,
  origins: Record<string, KpiValueOrigin>
): { scores: Record<string, number>; origins: Record<string, KpiValueOrigin> } {
  const sampleIds = new Set(
    Object.entries(origins)
      .filter(([, origin]) => origin === 'sample-baseline')
      .map(([id]) => id)
  )
  return {
    scores: Object.fromEntries(Object.entries(scores).filter(([id]) => !sampleIds.has(id))),
    origins: Object.fromEntries(Object.entries(origins).filter(([id]) => !sampleIds.has(id))),
  }
}

export function hasKpiSampleBaseline(origins: Record<string, KpiValueOrigin> | undefined): boolean {
  return Object.values(origins ?? {}).some((origin) => origin === 'sample-baseline')
}

/**
 * Export line stating how many of the values in the Overall Score are fictional
 * sample-baseline values, so a saved worksheet never reads as the learner's own
 * assessment. Returns '' when no counted value is a sample.
 */
export function sampleBaselineScoreNote(
  countedIds: readonly string[],
  origin: (id: string) => KpiValueOrigin | undefined
): string {
  const n = countedIds.filter((id) => origin(id) === 'sample-baseline').length
  if (n === 0) return ''
  return `_Includes ${n} fictional sample baseline value${n === 1 ? '' : 's'}; not your assessment._\n\n`
}
