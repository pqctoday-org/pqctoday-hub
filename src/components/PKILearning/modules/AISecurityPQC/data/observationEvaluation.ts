// SPDX-License-Identifier: AGPL-3.0-only
export type ObservationLabel = 'positive' | 'negative' | 'unknown'
export type EvaluationQuestion = 'synthetic' | 'near-duplicate' | 'watermark'
export interface Observation {
  id: string
  reference: ObservationLabel
  result: ObservationLabel
}
export interface EvaluationRatio {
  numerator: number
  denominator: number
  percent: number | null
}

export const isObservationLabel = (value: string): value is ObservationLabel =>
  value === 'positive' || value === 'negative' || value === 'unknown'

export function createObservations(preset: 'balanced' | 'imbalanced' | 'empty'): Observation[] {
  return Array.from({ length: 8 }, (_, index) => ({
    id: `sample-${index + 1}`,
    reference:
      preset === 'empty'
        ? 'unknown'
        : index < (preset === 'balanced' ? 4 : 1)
          ? 'positive'
          : 'negative',
    result:
      preset === 'empty'
        ? 'unknown'
        : preset === 'balanced' && (index < 3 || index === 4)
          ? 'positive'
          : 'negative',
  }))
}

export function evaluateObservations(rows: readonly Observation[]) {
  let tp = 0
  let fn = 0
  let fp = 0
  let tn = 0
  let unassessed = 0
  for (const row of rows) {
    if (row.reference === 'unknown' || row.result === 'unknown') unassessed++
    else if (row.reference === 'positive') {
      if (row.result === 'positive') tp++
      else fn++
    } else if (row.result === 'positive') fp++
    else tn++
  }
  const assessed = tp + fn + fp + tn
  const ratio = (numerator: number, denominator: number): EvaluationRatio => ({
    numerator,
    denominator,
    percent: denominator === 0 ? null : (100 * numerator) / denominator,
  })
  return {
    tp,
    fn,
    fp,
    tn,
    assessed,
    unassessed,
    accuracy: ratio(tp + tn, assessed),
    precision: ratio(tp, tp + fp),
    recall: ratio(tp, tp + fn),
  }
}
