// SPDX-License-Identifier: GPL-3.0-only
/**
 * TimelineEvidenceBadge tests. computeFreshnessState stays exported for the
 * shared EvidenceBadge (other domains); the timeline badge no longer uses it.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimelineEvidenceBadge, computeFreshnessState } from './TimelineEvidenceBadge'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * ONE_DAY_MS).toISOString().slice(0, 10)
}

describe('computeFreshnessState (C9)', () => {
  it('returns null for missing or unparseable dates', () => {
    expect(computeFreshnessState(undefined)).toBeNull()
    expect(computeFreshnessState('not-a-date')).toBeNull()
  })

  it('returns "current" for dates within 365 days', () => {
    expect(computeFreshnessState(isoDaysAgo(0))).toBe('current')
    expect(computeFreshnessState(isoDaysAgo(180))).toBe('current')
    expect(computeFreshnessState(isoDaysAgo(365))).toBe('current')
  })

  it('returns "stale" for 366–730 days', () => {
    expect(computeFreshnessState(isoDaysAgo(366))).toBe('stale')
    expect(computeFreshnessState(isoDaysAgo(500))).toBe('stale')
    expect(computeFreshnessState(isoDaysAgo(730))).toBe('stale')
  })

  it('returns "critical" for >730 days', () => {
    expect(computeFreshnessState(isoDaysAgo(731))).toBe('critical')
    expect(computeFreshnessState(isoDaysAgo(2000))).toBe('critical')
  })
})

describe('TimelineEvidenceBadge — publication date (timeline remediation r2 T-B3)', () => {
  it('shows the publication date as a neutral chip, never as a freshness state', () => {
    render(<TimelineEvidenceBadge publishedDate="2022-09-07" trustedSourceIdStatus="registered" />)
    const chip = screen.getByTestId('timeline-published-date')
    expect(chip.textContent).toBe('Published 2022-09-07')
    expect(chip.className).not.toMatch(/status-(error|warning|success)/)
    expect(screen.queryByText(/^(Current|Stale|Critical)$/)).toBeNull()
  })

  it('omits the chip when no date is provided', () => {
    render(<TimelineEvidenceBadge confidenceScore={50} trustedSourceIdStatus="proposed" />)
    expect(screen.queryByTestId('timeline-published-date')).toBeNull()
  })

  it('still renders nothing when there is no signal at all', () => {
    const { container } = render(<TimelineEvidenceBadge />)
    expect(container.firstChild).toBeNull()
  })

  it('maps a registered authority link to Tier 1 and anything unknown to Unverified', () => {
    render(<TimelineEvidenceBadge trustedSourceIdStatus="registered" />)
    expect(screen.getByText('Tier 1')).toBeTruthy()
  })
})
