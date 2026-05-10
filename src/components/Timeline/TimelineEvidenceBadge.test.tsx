// SPDX-License-Identifier: GPL-3.0-only
/**
 * TimelineEvidenceBadge freshness tests (C9).
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

describe('TimelineEvidenceBadge — freshness rendering', () => {
  it('renders the freshness pill with state in data attribute', () => {
    render(<TimelineEvidenceBadge lastVerifiedDate={isoDaysAgo(500)} />)
    const pill = screen.getByTestId('timeline-freshness-badge')
    expect(pill.getAttribute('data-freshness')).toBe('stale')
    expect(pill.textContent).toBe('Stale')
    expect(pill.getAttribute('aria-label')).toBe('Source freshness: Stale')
  })

  it('renders critical with the error styling marker', () => {
    render(<TimelineEvidenceBadge lastVerifiedDate={isoDaysAgo(1000)} />)
    expect(screen.getByTestId('timeline-freshness-badge').getAttribute('data-freshness')).toBe(
      'critical'
    )
  })

  it('omits the freshness pill when no date is provided', () => {
    render(<TimelineEvidenceBadge confidenceScore={50} trustedSourceIdStatus="proposed" />)
    expect(screen.queryByTestId('timeline-freshness-badge')).toBeNull()
  })

  it('still renders nothing when there is no signal at all', () => {
    render(<TimelineEvidenceBadge />)
    expect(screen.queryByTestId('timeline-freshness-badge')).toBeNull()
  })
})
