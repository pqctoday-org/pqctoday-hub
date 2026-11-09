// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  REPORTED_PERCENT_MAX,
  parseReportedPercent,
  reportedPercentMessage,
  reportingOnlyScoreCell,
  reportingOnlyStatus,
  withoutNeverEnteredReportingScores,
} from './reportingOnlyMeasure'

describe('parseReportedPercent', () => {
  it.each(['0', '80', '100', '125.5', ' 42 ', String(REPORTED_PERCENT_MAX)])(
    'accepts %j',
    (raw) => {
      expect(parseReportedPercent(raw)).toEqual({ ok: true, value: Number(raw) })
    }
  )

  it('stores a plain 0 for negative zero', () => {
    const result = parseReportedPercent('-0')
    expect(result.ok && Object.is(result.value, 0)).toBe(true)
  })

  it.each([
    ['a negative number', '-5'],
    ['a tiny negative number', '-0.0001'],
    ['infinity written out', 'Infinity'],
    ['an exponent that overflows to infinity', '1e999'],
    ['NaN written out', 'NaN'],
    ['text', 'abc'],
    ['an empty entry', ''],
    ['only spaces', '   '],
    ['just above the ceiling', String(REPORTED_PERCENT_MAX + 1)],
    ['a huge finite number', '1e300'],
  ])('rejects %s with the visible message instead of clamping', (_label, raw) => {
    expect(parseReportedPercent(raw)).toEqual({ ok: false })
  })
})

describe('reportedPercentMessage', () => {
  it('names the range, and claims a kept value only when there was one', () => {
    expect(reportedPercentMessage(true)).toBe(
      'Enter a number from 0 to 1000. The previous value was kept.'
    )
    expect(reportedPercentMessage(false)).toBe('Enter a number from 0 to 1000.')
  })
})

describe('reporting-only export text', () => {
  it('names the value, then the qualifier, then the exclusion', () => {
    expect(reportingOnlyScoreCell(80, false)).toBe('80% — reporting only; excluded from readiness')
    expect(reportingOnlyScoreCell(0, false)).toBe('0% — reporting only; excluded from readiness')
    expect(reportingOnlyScoreCell(undefined, false)).toBe(
      'Unknown — reporting only; excluded from readiness'
    )
  })

  it('adds the not-assessed qualifier only to a value that exists', () => {
    expect(reportingOnlyScoreCell(80, true)).toBe(
      '80% — not assessed for current use; reporting only; excluded from readiness'
    )
    expect(reportingOnlyScoreCell(undefined, true)).toBe(
      'Unknown — reporting only; excluded from readiness'
    )
    expect(reportingOnlyStatus(80, true)).toBe(
      'Reporting only — excluded from readiness; not assessed for current use'
    )
    expect(reportingOnlyStatus(80, false)).toBe('Reporting only — excluded from readiness')
    expect(reportingOnlyStatus(undefined, true)).toBe('Reporting only — excluded from readiness')
  })
})

describe('withoutNeverEnteredReportingScores', () => {
  const dimensions = [{ id: 'ordinary' }, { id: 'budget', reportingOnly: true }]

  it('drops only a reporting-only score whose origin is not-entered', () => {
    expect(
      withoutNeverEnteredReportingScores(
        dimensions,
        { ordinary: 0, budget: 0 },
        { ordinary: 'not-entered', budget: 'not-entered' }
      )
    ).toEqual({ ordinary: 0 })
  })

  it.each(['learner-entered', 'learner-override', 'unrecorded', 'calculated-snapshot'] as const)(
    'keeps a reporting-only 0 whose origin is %s',
    (origin) => {
      expect(
        withoutNeverEnteredReportingScores(dimensions, { budget: 0 }, { budget: origin })
      ).toEqual({ budget: 0 })
    }
  )

  it('drops the budget default even when the persona on screen has no budget row', () => {
    // A persona lens without the row can open a save and switch to one that has it.
    expect(
      withoutNeverEnteredReportingScores(
        [{ id: 'ordinary' }],
        { ordinary: 0, 'budget-utilization': 0 },
        { 'budget-utilization': 'not-entered', ordinary: 'not-entered' }
      )
    ).toEqual({ ordinary: 0 })
    expect(
      withoutNeverEnteredReportingScores(
        [],
        { 'budget-utilization': 0 },
        { 'budget-utilization': 'learner-entered' }
      )
    ).toEqual({ 'budget-utilization': 0 })
  })

  it('keeps a score with no recorded origin and passes undefined through', () => {
    expect(withoutNeverEnteredReportingScores(dimensions, { budget: 0 }, undefined)).toEqual({
      budget: 0,
    })
    expect(withoutNeverEnteredReportingScores(dimensions, undefined, undefined)).toBeUndefined()
  })
})
