// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { ProtectionWindow } from '../data/platformEngConstants'
import { PIPELINE_STAGES } from '../data/pipelineStagesData'
import {
  assessProtectionWindows,
  compareProtectionWindow,
  formatProtectionWindow,
} from './protectionWindows'

const years = (min: number, max?: number): ProtectionWindow => ({
  min: { value: min, unit: 'years' },
  ...(max === undefined ? {} : { max: { value: max, unit: 'years' as const } }),
})

describe('explicit sample bounds', () => {
  it.each([
    [years(10), 2030, 'beyond'],
    [years(10), 2040, 'indeterminate'],
    [years(4, 4), 2030, 'ends-by'],
    [years(4), 2030, 'indeterminate'],
    [years(2, 5), 2030, 'indeterminate'],
    [years(2, 5), 2035, 'ends-by'],
    [years(0, 0), 2026, 'ends-by'],
    [undefined, 2030, 'unassessed'],
    [years(5, 2), 2030, 'unassessed'],
    [years(-1), 2030, 'unassessed'],
    [years(1.5), 2030, 'unassessed'],
    [years(Infinity), 2030, 'unassessed'],
    [years(1e10), 2030, 'unassessed'],
    [years(1, NaN), 2030, 'unassessed'],
    [years(1), Infinity, 'unassessed'],
    [years(1), 2030.5, 'unassessed'],
    [years(1), 2025, 'unassessed'],
  ] as const)('compares %j at %s as %s without fallback', (window, year, expected) => {
    expect(compareProtectionWindow(window, year)).toBe(expected)
  })

  it.each([{ max: { value: 1, unit: 'years' } }, { min: { value: 1, unit: 'years' }, max: null }])(
    'rejects malformed structured bounds without throwing: %j',
    (malformed) => {
      const window = malformed as unknown as ProtectionWindow
      expect(() => compareProtectionWindow(window, 2030)).not.toThrow()
      expect(compareProtectionWindow(window, 2030)).toBe('unassessed')
      expect(formatProtectionWindow(window)).toBe('Invalid bounds')
    }
  )

  it('normalizes day/hour windows and rejects reversed cross-unit or invalid end dates', () => {
    const mixed: ProtectionWindow = {
      min: { value: 90, unit: 'days' },
      max: { value: 1, unit: 'years' },
    }
    expect(compareProtectionWindow(mixed, 2027)).toBe('ends-by')
    expect(
      compareProtectionWindow(
        { min: { value: 1, unit: 'hours' }, max: { value: 24, unit: 'hours' } },
        2026
      )
    ).toBe('beyond')
    expect(
      compareProtectionWindow(
        { min: { value: 366, unit: 'days' }, max: { value: 1, unit: 'years' } },
        2030
      )
    ).toBe('unassessed')
    expect(
      compareProtectionWindow(
        { min: { value: 1, unit: 'years' }, max: { value: 1, unit: 'hours' } },
        2030
      )
    ).toBe('unassessed')
    expect(compareProtectionWindow({ min: { value: Number.MAX_VALUE, unit: 'hours' } }, 2030)).toBe(
      'unassessed'
    )
    expect(formatProtectionWindow(mixed)).toBe('90 days–1 year')
    expect(formatProtectionWindow(years(10))).toBe('10+ years')
    expect(formatProtectionWindow(years(2, 5))).toBe('2–5 years')
    expect(formatProtectionWindow(undefined)).toBe('Not modeled in this record')
    expect(formatProtectionWindow(years(5, 2))).toBe('Invalid bounds')
  })

  it('distinguishes calendar years from a fixed365-day approximation across leap years', () => {
    // Jan1 2026→Jan1 2030 includes leap2028:1461 days, not1460.
    expect(compareProtectionWindow({ min: { value: 1460.5, unit: 'days' } }, 2030)).toBe(
      'indeterminate'
    )
    expect(compareProtectionWindow({ min: { value: 1461.5, unit: 'days' } }, 2030)).toBe('beyond')
  })

  it('uses the independently transcribed inventory totals for both purposes and horizons', () => {
    expect(PIPELINE_STAGES.flatMap((s) => s.cryptoAssets)).toHaveLength(16)
    const a = assessProtectionWindows(PIPELINE_STAGES, 2030)
    expect(a.assets).toHaveLength(15)
    expect(a.confidentiality).toEqual({
      total: 3,
      beyond: 3,
      endsBy: 0,
      indeterminate: 0,
      unassessed: 0,
    })
    expect(a.authenticity).toEqual({
      total: 13,
      beyond: 7,
      endsBy: 5,
      indeterminate: 1,
      unassessed: 0,
    })
    const b = assessProtectionWindows(PIPELINE_STAGES, 2035)
    expect(b.confidentiality).toEqual({
      total: 3,
      beyond: 2,
      endsBy: 0,
      indeterminate: 1,
      unassessed: 0,
    })
    expect(b.authenticity).toEqual({
      total: 13,
      beyond: 7,
      endsBy: 6,
      indeterminate: 0,
      unassessed: 0,
    })
    const c = assessProtectionWindows(PIPELINE_STAGES, 2040)
    expect(c.confidentiality).toMatchObject({ beyond: 0, endsBy: 1, indeterminate: 2 })
    expect(c.authenticity).toMatchObject({ beyond: 2, endsBy: 6, indeterminate: 5 })
  })

  it('filters actual named records and keeps runtime cert/authenticity separate from payload confidentiality', () => {
    const runtime = assessProtectionWindows(PIPELINE_STAGES, 2030, 'runtime')
    expect(runtime.assets).toHaveLength(2)
    expect(runtime.confidentiality).toMatchObject({ total: 1, beyond: 1 })
    expect(runtime.authenticity).toMatchObject({ total: 2, endsBy: 2 })
    const source = assessProtectionWindows(PIPELINE_STAGES, 2030, 'source')
    expect(source.assets.map((a) => a.id)).toEqual(['src-commit-sign', 'src-deploy-key'])
    expect(source.confidentiality.total).toBe(0)
    expect(source.authenticity).toMatchObject({ beyond: 1, indeterminate: 1 })
  })

  it('recalculates controlled edits, preserves missing metadata as unassessed and excludes nonvulnerable assets', () => {
    const stages = PIPELINE_STAGES.map((s) => ({
      ...s,
      cryptoAssets: s.cryptoAssets.map((a) =>
        a.id === 'build-vault-mtls'
          ? { ...a, protectionWindows: { confidentiality: years(1, 1) } }
          : a.id === 'src-commit-sign'
            ? { ...a, protectionWindows: undefined }
            : a
      ),
    }))
    const result = assessProtectionWindows(stages, 2030)
    expect(result.confidentiality).toMatchObject({ beyond: 2, endsBy: 1 })
    expect(result.authenticity).toMatchObject({ total: 12, beyond: 6 })
    expect(result.notModeled).toBe(1)
    expect(result.assets.find((a) => a.id === 'src-commit-sign')).toMatchObject({
      confidentiality: 'unassessed',
      authenticity: 'unassessed',
    })
    expect(result.assets.some((a) => a.id === 'src-webhook')).toBe(false)
    expect(
      assessProtectionWindows(
        stages.filter((s) => s.id !== 'source'),
        2030
      ).assets
    ).toHaveLength(13)
  })
})
