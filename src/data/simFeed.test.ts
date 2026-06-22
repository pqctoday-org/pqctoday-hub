// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { feedFor, SIM_FEED } from './simFeed'

describe('simFeed', () => {
  it('has at least one record for every quarter Q1 2026 → Q4 2040', () => {
    for (let year = 2026; year <= 2040; year++) {
      for (let q = 1; q <= 4; q++) {
        expect(feedFor(year, q).length, `${year} Q${q} has no feed record`).toBeGreaterThan(0)
      }
    }
    expect(Object.keys(SIM_FEED).length).toBe((2040 - 2026 + 1) * 4)
  })

  it('marks Q1 2029 as Q-Day and uses only valid severities', () => {
    expect(feedFor(2029, 1).some((r) => /Q-DAY/i.test(r.txt))).toBe(true)
    const sevs = new Set(['danger', 'warning', 'success', 'info'])
    for (const rows of Object.values(SIM_FEED))
      for (const r of rows) expect(sevs.has(r.sev)).toBe(true)
  })

  it('is empty outside the simulation horizon', () => {
    expect(feedFor(2025, 4)).toEqual([])
    expect(feedFor(2041, 1)).toEqual([])
  })
})
