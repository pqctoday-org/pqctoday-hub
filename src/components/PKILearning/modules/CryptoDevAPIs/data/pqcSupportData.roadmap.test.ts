// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { ROADMAP_EVENTS } from './pqcSupportData'

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

/** "2025-Q4" -> 2025*4+3 so quarters compare as integers. */
function quarterIndex(date: string): number {
  const m = /^(\d{4})-Q([1-4])$/.exec(date)
  if (!m) throw new Error(`bad roadmap date ${date}`)
  return Number(m[1]) * 4 + Number(m[2]) - 1
}

/** Every explicit "[d] Mon[th] YYYY" date named in an event's text, as a quarter index. */
function namedQuarters(text: string): number[] {
  const out: number[] = []
  const re =
    /\b(?:\d{1,2}\s+)?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{4})\b/g
  for (const m of text.matchAll(re)) {
    const month = MONTHS.indexOf(m[1].toLowerCase())
    out.push(Number(m[2]) * 4 + Math.floor(month / 3))
  }
  return out
}

describe('roadmap events sit in the quarter of the dates they name', () => {
  it('no event names a date later than its own quarter', () => {
    const late = ROADMAP_EVENTS.filter((e) =>
      namedQuarters(e.event).some((q) => q > quarterIndex(e.date))
    ).map((e) => `${e.apiId} ${e.date}: ${e.event}`)
    expect(late).toEqual([])
  })

  it('a final-standard release is not dated before the standard it implements was published', () => {
    // NIST published FIPS 203/204/205 on 13 Aug 2024 (2024-Q3); a release using the final
    // names cannot sit in an earlier quarter.
    const finalNames = ROADMAP_EVENTS.filter((e) => /final FIPS 203\/204\/205 names/i.test(e.event))
    expect(finalNames.length).toBeGreaterThan(0)
    for (const e of finalNames) expect(quarterIndex(e.date)).toBeGreaterThanOrEqual(2024 * 4 + 2)
  })

  it('pre-standard algorithm support is labelled as such', () => {
    const early = ROADMAP_EVENTS.filter((e) => quarterIndex(e.date) < 2024 * 4 + 2)
    for (const e of early.filter((x) => /Kyber|Dilithium|SPHINCS/.test(x.event))) {
      expect(e.event, e.event).toMatch(/finalist|pre-standard|before the standards/i)
    }
  })

  it('PKCS#11 v3.2 has a committee-specification event and a later OASIS Standard event', () => {
    const p11 = ROADMAP_EVENTS.filter((e) => e.apiId === 'pkcs11')
    const cs = p11.find((e) => /Committee Specification 01/.test(e.event))!
    const std = p11.find((e) => /published as an OASIS Standard/.test(e.event))!
    expect(cs).toBeDefined()
    expect(std).toBeDefined()
    expect(cs.event).toMatch(/not yet an OASIS Standard/)
    expect(quarterIndex(std.date)).toBeGreaterThan(quarterIndex(cs.date))
    expect(std.date).toBe('2026-Q2')
  })
})
