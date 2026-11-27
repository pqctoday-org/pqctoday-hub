// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  MISSING_LABELS,
  compareNumbersMissingLast,
  describeNumber,
  formatNumberOrMissing,
} from './missing'

describe('formatNumberOrMissing', () => {
  it('shows numbers, including 0', () => {
    expect(formatNumberOrMissing(1184)).toBe('1,184')
    expect(formatNumberOrMissing(0)).toBe('0')
    expect(formatNumberOrMissing(12.34)).toBe('12.3')
    expect(formatNumberOrMissing(-5)).toBe('−5')
    expect(formatNumberOrMissing('1,184')).toBe('1,184')
  })

  it('keeps the four live labels, whatever their case', () => {
    expect(MISSING_LABELS).toEqual([
      'Research needed',
      'Not specified by the source',
      'Not measured',
      'Not applicable',
    ])
    for (const label of MISSING_LABELS) expect(formatNumberOrMissing(label)).toBe(label)
    expect(formatNumberOrMissing('research needed')).toBe('Research needed')
    expect(formatNumberOrMissing('N/A')).toBe('Not applicable')
    expect(formatNumberOrMissing('Not specified')).toBe('Not specified by the source')
  })

  it('maps any other text to the nearest live label', () => {
    expect(formatNumberOrMissing('TBD')).toBe('Research needed')
    expect(formatNumberOrMissing('see appendix')).toBe('Research needed')
  })

  it('says "Not recorded" for a plain blank only', () => {
    for (const v of [null, undefined, '', '   ']) {
      expect(formatNumberOrMissing(v)).toBe('Not recorded')
    }
    for (const label of MISSING_LABELS)
      expect(formatNumberOrMissing(label)).not.toBe('Not recorded')
  })

  it('never shows NaN, undefined or 0 for a missing value', () => {
    for (const v of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      null,
      undefined,
      '',
      'Research needed',
    ]) {
      const out = formatNumberOrMissing(v)
      expect(out).not.toMatch(/NaN|undefined|Infinity/)
      expect(out).not.toBe('0')
      expect(out).not.toMatch(/^[–—-]$/)
    }
  })
})

describe('describeNumber', () => {
  it('flags the four labels with the Needs-data cue, and nothing else', () => {
    expect(describeNumber('Not measured')).toMatchObject({
      kind: 'missing',
      needsData: true,
      value: null,
    })
    expect(describeNumber(12)).toMatchObject({ kind: 'number', needsData: false, value: 12 })
    expect(describeNumber(null)).toMatchObject({ kind: 'blank', needsData: false, value: null })
  })
})

describe('compareNumbersMissingLast', () => {
  it('sorts numbers ascending and missing values last, never as zero', () => {
    const rows: unknown[] = ['Research needed', 5, null, 0, 'Not measured', 2]
    const sorted = [...rows].sort(compareNumbersMissingLast)
    expect(sorted.slice(0, 3)).toEqual([0, 2, 5])
    expect(sorted.slice(3)).toHaveLength(3)
    expect([...rows].reverse().sort(compareNumbersMissingLast).slice(0, 3)).toEqual([0, 2, 5])
  })
})
