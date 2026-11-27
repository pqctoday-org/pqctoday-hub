// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  formatBytes,
  formatDelta,
  formatDuration,
  formatHex,
  formatMoney,
  formatPercent,
  formatPercentPoints,
  formatRatio,
  formatScore,
} from './units'

describe('formatBytes', () => {
  it('writes "7,856 B"', () => {
    expect(formatBytes(7856)).toBe('7,856 B')
    expect(formatBytes(32)).toBe('32 B')
    expect(formatBytes(1088)).toBe('1,088 B')
    expect(formatBytes(0)).toBe('0 B')
  })
  it('adds the KiB size on value cards from 1,024 B up', () => {
    expect(formatBytes(7856, { kib: true })).toBe('7,856 B (7.7 KiB)')
    expect(formatBytes(1024, { kib: true })).toBe('1,024 B (1 KiB)')
    expect(formatBytes(1023, { kib: true })).toBe('1,023 B')
    expect(formatBytes(5 * 1024 * 1024, { kib: true })).toBe('5,242,880 B (5 MiB)')
    expect(formatBytes(3 * 1024 ** 3, { kib: true })).toBe('3,221,225,472 B (3 GiB)')
  })
  it('never writes "bytes", "32B", an unseparated "1088 B" or "KB"', () => {
    for (const n of [32, 1088, 7856, 1234567]) {
      const out = formatBytes(n, { kib: true })
      expect(out).not.toMatch(/bytes/i)
      expect(out).not.toMatch(/\d+B\b/)
      expect(out).not.toMatch(/\d{4,} B/)
      expect(out).not.toMatch(/\bKB\b/)
    }
  })
  it('shows a missing label, never NaN', () => {
    expect(formatBytes(undefined)).toBe('Not recorded')
    expect(formatBytes(Number.NaN)).toBe('Not measured')
  })
})

describe('formatDuration', () => {
  it('writes tool timings', () => {
    expect(formatDuration(48, 'ms')).toBe('48 ms')
    expect(formatDuration(0.4, 'ms')).toBe('0.4 ms')
    expect(formatDuration(1200, 'ms')).toBe('1.2 s')
    expect(formatDuration(1.2, 's')).toBe('1.2 s')
    expect(formatDuration(47.6, 'ms')).toBe('48 ms')
  })
  it('writes planning spans with a space', () => {
    expect(formatDuration(3, 'yr')).toBe('3 yr')
    expect(formatDuration(50, 'mo')).toBe('50 mo')
    expect(formatDuration(90, 'd')).toBe('90 d')
    expect(formatDuration(0.5, 'fte')).toBe('0.5 FTE')
  })
  it('writes "3 years" in prose', () => {
    expect(formatDuration(3, 'yr', { prose: true })).toBe('3 years')
    expect(formatDuration(1, 'yr', { prose: true })).toBe('1 year')
    expect(formatDuration(50, 'mo', { prose: true })).toBe('50 months')
    expect(formatDuration(90, 'd', { prose: true })).toBe('90 days')
  })
  it('never writes [48ms], 3yr, 25 yrs or 50mo', () => {
    const outs = [
      formatDuration(48, 'ms'),
      formatDuration(3, 'yr'),
      formatDuration(25, 'yr'),
      formatDuration(50, 'mo'),
    ]
    for (const o of outs) {
      expect(o).not.toMatch(/\[\d+ms\]/)
      expect(o).not.toMatch(/\d(yr|mo|ms)\b/)
      expect(o).not.toMatch(/yrs/)
    }
  })
})

describe('formatHex', () => {
  it('writes lowercase four-byte words', () => {
    const r = formatHex(new Uint8Array([0xde, 0xad, 0xbe, 0xef, 0x01, 0x02, 0x03, 0x04, 0xff]))
    expect(r.lines).toEqual(['deadbeef 01020304 ff'])
    expect(r.shortened).toBe(false)
    expect(r.showAllLabel).toBeNull()
    expect(r.copyValue).toBe('deadbeef01020304ff')
  })
  it('fills two lines before shortening (32 bytes)', () => {
    const r = formatHex(new Uint8Array(32).fill(0xab))
    expect(r.lines).toHaveLength(2)
    expect(r.shortened).toBe(false)
    expect(r.lines[0]).toBe('abababab abababab abababab abababab')
  })
  it('keeps the first 16 and last 8 bytes of a long value and offers Show all', () => {
    const bytes = new Uint8Array(1088).map((_, i) => i % 256)
    const r = formatHex(bytes)
    expect(r.shortened).toBe(true)
    expect(r.totalBytes).toBe(1088)
    expect(r.lines).toHaveLength(2)
    expect(r.lines[0]).toBe('00010203 04050607 08090a0b 0c0d0e0f')
    // last 8 bytes of 0..1087 mod 256: 1080..1087 -> 0x38..0x3f
    expect(r.lines[1]).toBe('… 38393a3b 3c3d3e3f')
    expect(r.showAllLabel).toBe('… Show all (1,088 B)')
    expect(r.copyValue).toHaveLength(2176)
    expect(r.copyValue).not.toMatch(/\s/)
  })
  it('accepts a hex string and lowercases it', () => {
    expect(formatHex('0xDEADBEEF').lines).toEqual(['deadbeef'])
    expect(formatHex('DE AD-BE:EF').copyValue).toBe('deadbeef')
  })
  it('is never one continuous run and never cut with three dots', () => {
    const r = formatHex(new Uint8Array(200))
    for (const l of r.lines) expect(l).not.toMatch(/\.\.\./)
    expect(r.lines[0]).toMatch(/ /)
  })
  it('handles an empty value', () => {
    expect(formatHex(new Uint8Array(0)).lines).toEqual([])
  })
})

describe('formatRatio, formatDelta, formatPercent', () => {
  it('writes "×7.6", the sign first', () => {
    expect(formatRatio(7600, 1000)).toBe('×7.6')
    expect(formatRatio(2, 1)).toBe('×2')
    expect(formatRatio(1500, 10)).toBe('×150')
    expect(formatRatio(1, 0)).toBe('Not applicable')
    expect(formatRatio(undefined, 3)).toBe('Not applicable')
  })
  it('never writes "7.6×"', () => {
    expect(formatRatio(7600, 1000)).not.toMatch(/\d×/)
  })
  it('writes deltas with a true minus and names the baseline', () => {
    expect(formatDelta(12)).toBe('+12%')
    expect(formatDelta(-3)).toBe('−3%')
    expect(formatDelta(12, 'run 1')).toBe('+12% vs run 1')
    expect(formatDelta(null)).toBe('Baseline')
    expect(formatDelta(undefined, 'run 1')).toBe('Baseline')
  })
  it('never writes "+0%"', () => {
    expect(formatDelta(0)).toBe('No change')
    expect(formatDelta(0.04, 'run 1')).toBe('No change vs run 1')
    expect(formatDelta(0)).not.toMatch(/\+0/)
  })
  it('writes percentages with one decimal only when needed', () => {
    expect(formatPercent(9.3)).toBe('9.3%')
    expect(formatPercent(12)).toBe('12%')
    expect(formatPercent(12.0)).toBe('12%')
    expect(formatPercent(0)).toBe('0%')
    expect(formatPercent(null)).toBe('Not recorded')
  })
  it('writes percentage-point changes in "pp"', () => {
    expect(formatPercentPoints(2)).toBe('+2 pp')
    expect(formatPercentPoints(-1.5)).toBe('−1.5 pp')
    expect(formatPercentPoints(0)).toBe('0 pp')
  })
})

describe('formatMoney', () => {
  it('writes compact values for tiles and charts', () => {
    expect(formatMoney(6_300_000)).toBe('$6.3M')
    expect(formatMoney(563_000)).toBe('$563K')
    expect(formatMoney(563_400)).toBe('$563K')
    expect(formatMoney(12_500)).toBe('$12.5K')
    expect(formatMoney(2_400_000_000)).toBe('$2.4B')
    expect(formatMoney(900)).toBe('$900')
    expect(formatMoney(0)).toBe('$0')
    expect(formatMoney(999_600)).toBe('$1M')
  })
  it('writes exact values for tables and inputs', () => {
    expect(formatMoney(6_300_000, 'exact')).toBe('$6,300,000')
    expect(formatMoney(1234.5, 'exact')).toBe('$1,234.50')
  })
  it('writes a true minus', () => {
    expect(formatMoney(-1_500_000)).toBe('−$1.5M')
    expect(formatMoney(-1_500_000, 'exact')).toBe('−$1,500,000')
  })
  it('writes rates as "$563K / yr"', () => {
    expect(formatMoney(563_000, 'compact', { per: 'yr' })).toBe('$563K / yr')
  })
  it('never writes "-$" or "$1.5M/year"', () => {
    for (const v of [-1_500_000, -20, 1_500_000]) {
      for (const style of ['compact', 'exact'] as const) {
        expect(formatMoney(v, style)).not.toMatch(/-\$/)
      }
    }
    expect(formatMoney(1_500_000, 'compact', { per: 'yr' })).not.toMatch(/\/year/)
    expect(formatMoney(Number.NaN)).not.toMatch(/NaN/)
  })
})

describe('formatScore', () => {
  it('writes the score with its lens and coverage', () => {
    expect(formatScore(42, 'Migration readiness', 80)).toBe(
      '42 / 100 · Migration readiness · 80% coverage'
    )
    expect(formatScore(42.5, 'Risk', 'Covers 6 of 9 areas')).toBe(
      '42.5 / 100 · Risk · Covers 6 of 9 areas'
    )
  })
  it('says when coverage is not recorded and never shows NaN', () => {
    expect(formatScore(42, 'Risk', undefined)).toBe('42 / 100 · Risk · Coverage not recorded')
    expect(formatScore(undefined, 'Risk', 80)).toBe('Not recorded')
    expect(formatScore(Number.NaN, 'Risk', 80)).not.toMatch(/NaN/)
  })
})
