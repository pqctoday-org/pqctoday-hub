// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { QC_FIRST_YEAR, QC_BROAD_YEAR } from './quantumTimeline'
import { CRQC_ESTIMATES } from './regulatoryTimelines'

/**
 * Locks the documented relationship between the sim's Q-Day anchor
 * (quantumTimeline) and the public CRQC research range (CRQC_ESTIMATES) so the
 * two blocks can't silently drift into a contradiction (the 2026-06-17 audit
 * found QC_FIRST_YEAR sitting below CRQC_ESTIMATES.lowerBound with no documented
 * reason). The relationship is intentional, not accidental — see the comments in
 * both source files.
 */
describe('quantumTimeline ↔ CRQC_ESTIMATES consistency', () => {
  it('Q-Day is a deliberately aggressive anchor at/below the public conservative floor', () => {
    expect(QC_FIRST_YEAR).toBeLessThanOrEqual(CRQC_ESTIMATES.lowerBound)
    // but not absurdly early — keep it within one year of the public floor
    expect(CRQC_ESTIMATES.lowerBound - QC_FIRST_YEAR).toBeLessThanOrEqual(1)
  })

  it('broad-availability year matches the moderate public estimate', () => {
    expect(QC_BROAD_YEAR).toBe(CRQC_ESTIMATES.moderate)
  })

  it('first CRQC precedes broad availability', () => {
    expect(QC_FIRST_YEAR).toBeLessThan(QC_BROAD_YEAR)
  })
})
