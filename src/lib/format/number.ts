// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Number helpers shared by the format functions. Fixed en-US grouping ("7,856"), so the
 * output does not change with the visitor's locale.
 */

const GROUPED = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

/** True minus sign (U+2212), never the hyphen-minus, for negative values shown to readers. */
export const MINUS = '−'

/** "7856" -> "7,856"; rounds to a whole number. */
export function groupInteger(n: number): string {
  return GROUPED.format(Math.round(n)).replace('-', MINUS)
}

/** Rounds to one decimal and drops a trailing ".0": 9.3 -> "9.3", 12 -> "12", 12.04 -> "12". */
export function trimOneDecimal(n: number): string {
  const rounded = Math.round(n * 10) / 10
  return (Object.is(rounded, -0) ? 0 : rounded).toString()
}

/** Rounds to one decimal and groups thousands: 1234.56 -> "1,234.6", 7 -> "7". */
export function groupOneDecimal(n: number): string {
  const rounded = Math.round(n * 10) / 10
  const [int, frac] = Math.abs(rounded).toString().split('.')
  const sign = rounded < 0 ? MINUS : ''
  const g = GROUPED.format(Number(int))
  return frac ? `${sign}${g}.${frac}` : `${sign}${g}`
}
