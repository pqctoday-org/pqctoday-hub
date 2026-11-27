// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Sizes, durations, ratios, money, percentages and scores (UX grammar v2.1, section 2.4).
 * Every function returns text for a reader; none ever returns "NaN", "undefined" or "-$".
 */
import { formatNumberOrMissing } from './missing'
import { MINUS, groupInteger, groupOneDecimal, trimOneDecimal } from './number'

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

// ---------------------------------------------------------------- bytes

export interface FormatBytesOptions {
  /**
   * Add the binary size on a value card: "7,856 B (7.7 KiB)". Only applied from 1,024 B up;
   * smaller values stay a plain byte count. From 1 MiB the size reads in MiB, from 1 GiB in GiB.
   */
  kib?: boolean
}

/** "7,856 B"; with `kib` and n >= 1,024 B: "7,856 B (7.7 KiB)". */
export function formatBytes(
  n: number | null | undefined,
  options: FormatBytesOptions = {}
): string {
  if (!isNum(n)) return formatNumberOrMissing(n)
  const bytes = Math.round(n)
  const text = `${groupInteger(bytes)} B`
  if (options.kib && Math.abs(bytes) >= 1024) {
    const abs = Math.abs(bytes)
    const [size, unit] =
      abs >= 1024 ** 3 ? [1024 ** 3, 'GiB'] : abs >= 1024 ** 2 ? [1024 ** 2, 'MiB'] : [1024, 'KiB']
    return `${text} (${groupOneDecimal(bytes / size)} ${unit})`
  }
  return text
}

// ---------------------------------------------------------------- duration

export type DurationUnit = 'ms' | 's' | 'yr' | 'mo' | 'd' | 'fte'

export interface FormatDurationOptions {
  /** Spell the unit out for running text: "3 years", "50 months", "90 days". */
  prose?: boolean
}

const PROSE: Record<'yr' | 'mo' | 'd', [string, string]> = {
  yr: ['year', 'years'],
  mo: ['month', 'months'],
  d: ['day', 'days'],
}

/**
 * Tool timings (ms in, "48 ms" / "0.4 ms" / "1.2 s" out) and planning spans
 * ("3 yr", "50 mo", "90 d", "0.5 FTE"). Always a space before the unit.
 */
export function formatDuration(
  v: number | null | undefined,
  unit: DurationUnit,
  options: FormatDurationOptions = {}
): string {
  if (!isNum(v)) return formatNumberOrMissing(v)
  if (unit === 'ms' || unit === 's') {
    const ms = unit === 's' ? v * 1000 : v
    if (Math.abs(ms) >= 1000) return `${trimOneDecimal(ms / 1000)} s`
    if (Math.abs(ms) >= 10) return `${groupInteger(ms)} ms`
    return `${trimOneDecimal(ms)} ms`
  }
  const text = groupOneDecimal(v)
  if (unit === 'fte') return `${text} FTE`
  if (options.prose) {
    const [one, many] = PROSE[unit]
    return `${text} ${v === 1 ? one : many}`
  }
  return `${text} ${unit}`
}

// ---------------------------------------------------------------- hex

export interface FormatHexResult {
  /** Display lines, at most two, lowercase, four-byte words separated by a space. */
  lines: string[]
  /** True when the value is shortened (first 16 and last 8 bytes kept). */
  shortened: boolean
  /** Total length in bytes. */
  totalBytes: number
  /** "… Show all (1,088 B)" when shortened, otherwise null. */
  showAllLabel: string | null
  /** What Copy puts on the clipboard: the full value, lowercase, no spaces. */
  copyValue: string
}

const HEAD_BYTES = 16
const TAIL_BYTES = 8
const WORD_BYTES = 4
const LINE_BYTES = 16

function hexOf(bytes: Uint8Array | number[] | string): string {
  if (typeof bytes === 'string') {
    return bytes
      .replace(/^0x/i, '')
      .replace(/[^0-9a-f]/gi, '')
      .toLowerCase()
  }
  let out = ''
  for (const b of bytes) out += (b & 0xff).toString(16).padStart(2, '0')
  return out
}

function words(hex: string): string {
  const parts: string[] = []
  for (let i = 0; i < hex.length; i += WORD_BYTES * 2) parts.push(hex.slice(i, i + WORD_BYTES * 2))
  return parts.join(' ')
}

/**
 * Hex for a value card. Lowercase, four-byte words, at most two lines. A value longer than
 * two lines (32 bytes) shows its first 16 and last 8 bytes with "…" between, and a
 * "… Show all (1,088 B)" control; Copy always copies the full value without spaces.
 */
export function formatHex(bytes: Uint8Array | number[] | string): FormatHexResult {
  const hex = hexOf(bytes)
  const totalBytes = Math.floor(hex.length / 2)
  const full = hex.slice(0, totalBytes * 2)
  if (totalBytes <= LINE_BYTES * 2) {
    const first = words(full.slice(0, LINE_BYTES * 2))
    const second = words(full.slice(LINE_BYTES * 2))
    return {
      lines: second ? [first, second] : first ? [first] : [],
      shortened: false,
      totalBytes,
      showAllLabel: null,
      copyValue: full,
    }
  }
  const head = full.slice(0, HEAD_BYTES * 2)
  const tail = full.slice(-TAIL_BYTES * 2)
  return {
    lines: [words(head), `… ${words(tail)}`],
    shortened: true,
    totalBytes,
    showAllLabel: `… Show all (${groupInteger(totalBytes)} B)`,
    copyValue: full,
  }
}

// ---------------------------------------------------------------- ratio, delta, percent

/** "×7.6" for a separate delta column, never "7.6×" inside the value cell. */
export function formatRatio(a: number | null | undefined, b: number | null | undefined): string {
  if (!isNum(a) || !isNum(b)) return 'Not applicable'
  if (b === 0) return 'Not applicable'
  const r = a / b
  const text = Math.abs(r) >= 100 ? groupInteger(r) : groupOneDecimal(r)
  return `×${text}`
}

/** "9.3%": one decimal only when the input needs one. */
export function formatPercent(v: number | null | undefined): string {
  if (!isNum(v)) return formatNumberOrMissing(v)
  return `${groupOneDecimal(v)}%`
}

/** A change between two percentages, in percentage points: "+2 pp", "−1.5 pp". */
export function formatPercentPoints(v: number | null | undefined): string {
  if (!isNum(v)) return formatNumberOrMissing(v)
  const r = Math.round(v * 10) / 10
  if (r === 0) return '0 pp'
  return `${r > 0 ? '+' : MINUS}${groupOneDecimal(Math.abs(r))} pp`
}

/**
 * A change against a baseline: "+12%", "−3%". Always name the baseline ("+12% vs run 1");
 * with no baseline value it reads "Baseline", and a change that rounds to nothing reads
 * "No change", never "+0%".
 */
export function formatDelta(p: number | null | undefined, baselineLabel?: string): string {
  if (p === null || p === undefined) return 'Baseline'
  if (!isNum(p)) return formatNumberOrMissing(p)
  const r = Math.round(p * 10) / 10
  const body = r === 0 ? 'No change' : `${r > 0 ? '+' : MINUS}${groupOneDecimal(Math.abs(r))}%`
  return baselineLabel ? `${body} vs ${baselineLabel}` : body
}

// ---------------------------------------------------------------- money

export type MoneyStyle = 'compact' | 'exact'

export interface FormatMoneyOptions {
  /** Add a rate: per 'yr' gives "$563K / yr". */
  per?: 'yr' | 'mo' | 'd' | 'user' | 'record'
}

function compact(abs: number): string {
  const steps: Array<[number, string]> = [
    [1e12, 'T'],
    [1e9, 'B'],
    [1e6, 'M'],
    [1e3, 'K'],
  ]
  for (const [size, suffix] of steps) {
    if (abs >= size) {
      const scaled = abs / size
      // 563K, 12.5K, 6.3M: a decimal only below 100 of the unit.
      // 999.6K rounds up to 1,000K: promote to the next unit instead.
      if (Math.round(scaled) >= 1000 && suffix !== 'T') return compact(size * 1000)
      const text = scaled >= 100 ? groupInteger(scaled) : trimOneDecimal(scaled)
      return `$${text}${suffix}`
    }
  }
  return `$${groupInteger(abs)}`
}

/**
 * "$6.3M" / "$563K" for tiles and charts, "$6,300,000" for tables and inputs.
 * A true minus: "−$1.5M". A rate: "$563K / yr".
 */
export function formatMoney(
  v: number | null | undefined,
  style: MoneyStyle = 'compact',
  options: FormatMoneyOptions = {}
): string {
  if (!isNum(v)) return formatNumberOrMissing(v)
  const abs = Math.abs(v)
  let body: string
  if (style === 'compact') {
    body = compact(abs)
  } else {
    const cents = Number.isInteger(abs)
      ? groupInteger(abs)
      : abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    body = `$${cents}`
  }
  const signed = v < 0 && body !== '$0' ? `${MINUS}${body}` : body
  return options.per ? `${signed} / ${options.per}` : signed
}

// ---------------------------------------------------------------- score

/**
 * One headline score with what it rests on: "42 / 100 · Migration readiness · 80% coverage".
 * `coverage` is a percentage (0-100) or a ready-made phrase. Show one headline score per tool.
 */
export function formatScore(
  v: number | null | undefined,
  lens: string,
  coverage: number | string | null | undefined
): string {
  if (!isNum(v)) return formatNumberOrMissing(v)
  const parts = [`${groupOneDecimal(v)} / 100`, lens]
  if (typeof coverage === 'number' && Number.isFinite(coverage)) {
    parts.push(`${groupOneDecimal(coverage)}% coverage`)
  } else if (typeof coverage === 'string' && coverage.trim()) {
    parts.push(coverage.trim())
  } else {
    parts.push('Coverage not recorded')
  }
  return parts.join(' · ')
}
