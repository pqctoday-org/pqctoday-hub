// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { createObservations, evaluateObservations, type Observation } from './observationEvaluation'

const row = (reference: Observation['reference'], result: Observation['result']): Observation => ({
  id: 'example',
  reference,
  result,
})

describe('labelled observation evaluation', () => {
  it('derives balanced counts and all three 75 percent metrics from the eight rows', () => {
    const result = evaluateObservations(createObservations('balanced'))
    expect(result).toEqual({
      tp: 3,
      fn: 1,
      fp: 1,
      tn: 3,
      assessed: 8,
      unassessed: 0,
      accuracy: { numerator: 6, denominator: 8, percent: 75 },
      precision: { numerator: 3, denominator: 4, percent: 75 },
      recall: { numerator: 3, denominator: 4, percent: 75 },
    })
  })
  it('shows why 87.5 percent accuracy can conceal zero recall and undefined precision', () => {
    const result = evaluateObservations(createObservations('imbalanced'))
    expect(result).toMatchObject({ tp: 0, fn: 1, fp: 0, tn: 7, assessed: 8, unassessed: 0 })
    expect(result.accuracy).toEqual({ numerator: 7, denominator: 8, percent: 87.5 })
    expect(result.precision).toEqual({ numerator: 0, denominator: 0, percent: null })
    expect(result.recall).toEqual({ numerator: 0, denominator: 1, percent: 0 })
  })
  it('counts incomplete pairs once and excludes them from every denominator', () => {
    const result = evaluateObservations([
      row('unknown', 'positive'),
      row('positive', 'unknown'),
      row('unknown', 'unknown'),
      row('negative', 'negative'),
    ])
    expect(result).toMatchObject({ tp: 0, fn: 0, fp: 0, tn: 1, assessed: 1, unassessed: 3 })
    expect(result.accuracy.percent).toBe(100)
    expect(result.precision.percent).toBeNull()
    expect(result.recall.percent).toBeNull()
  })
  it.each([{ rows: [] }, { rows: createObservations('empty') }])(
    'does not assign an accuracy when no pair was assessed',
    ({ rows }) => {
      const result = evaluateObservations(rows)
      expect(result.assessed).toBe(0)
      expect(result.accuracy.percent).toBeNull()
      expect(result.precision.percent).toBeNull()
      expect(result.recall.percent).toBeNull()
    }
  )
  it('keeps all-wrong zero values rather than replacing them with defaults', () => {
    const result = evaluateObservations([row('positive', 'negative'), row('negative', 'positive')])
    expect(result.accuracy.percent).toBe(0)
    expect(result.precision.percent).toBe(0)
    expect(result.recall.percent).toBe(0)
  })
  it('handles an all-negative reference set without inventing recall', () => {
    const result = evaluateObservations([row('negative', 'negative'), row('negative', 'negative')])
    expect(result.accuracy.percent).toBe(100)
    expect(result.precision.percent).toBeNull()
    expect(result.recall.percent).toBeNull()
  })
  it('handles an all-positive set and does not mutate source observations', () => {
    const rows = [row('positive', 'positive'), row('positive', 'positive')]
    const before = structuredClone(rows)
    const result = evaluateObservations(rows)
    expect(result.accuracy.percent).toBe(100)
    expect(result.precision.percent).toBe(100)
    expect(result.recall.percent).toBe(100)
    expect(rows).toEqual(before)
  })
})
