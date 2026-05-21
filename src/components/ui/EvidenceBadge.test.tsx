// SPDX-License-Identifier: GPL-3.0-only
/**
 * Tests for the generic EvidenceBadge — verifies the conditional
 * rendering surface: tier chip, freshness pill, confidence score, and
 * cached-doc link each appear only when their respective prop is set.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EvidenceBadge } from './EvidenceBadge'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * ONE_DAY_MS).toISOString().slice(0, 10)
}

describe('EvidenceBadge', () => {
  it('renders nothing when no props are supplied', () => {
    const { container } = render(<EvidenceBadge />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the tier chip when tier is supplied', () => {
    render(<EvidenceBadge tier="Authoritative" />)
    expect(screen.getByText('Authoritative')).toBeInTheDocument()
  })

  it('renders the freshness pill via the shared computeFreshnessState helper', () => {
    render(<EvidenceBadge lastVerifiedDate={isoDaysAgo(500)} />)
    const pill = screen.getByTestId('evidence-freshness-badge')
    expect(pill.getAttribute('data-freshness')).toBe('stale')
    expect(pill.textContent).toBe('Stale')
  })

  it('omits the freshness pill when no date is provided', () => {
    render(<EvidenceBadge tier="High" />)
    expect(screen.queryByTestId('evidence-freshness-badge')).toBeNull()
  })

  it('renders the confidence score chip with the score value', () => {
    render(<EvidenceBadge confidenceScore={82} />)
    expect(screen.getByText('82/100')).toBeInTheDocument()
  })

  it('renders a cached-doc link when localFile is provided', () => {
    render(<EvidenceBadge localFile="public/library/FIPS_203.pdf" />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/library/FIPS_203.pdf')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('falls back to sourceUrl when localFile is absent', () => {
    render(<EvidenceBadge sourceUrl="https://example.org/spec" />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('https://example.org/spec')
  })

  it('renders all four chips when every prop is supplied', () => {
    render(
      <EvidenceBadge
        tier="High"
        lastVerifiedDate={isoDaysAgo(100)}
        confidenceScore={75}
        localFile="public/threats/AERO-001.html"
      />
    )
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByTestId('evidence-freshness-badge').textContent).toBe('Current')
    expect(screen.getByText('75/100')).toBeInTheDocument()
    expect(screen.getByRole('link').getAttribute('href')).toBe('/threats/AERO-001.html')
  })
})
