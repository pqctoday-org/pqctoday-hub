// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrustBadge } from './TrustBadge'

describe('TrustBadge', () => {
  it('renders the tier label', () => {
    render(<TrustBadge tier="Authoritative" score={92} />)
    expect(screen.getByText('Authoritative')).toBeInTheDocument()
  })

  it('renders the score in title', () => {
    render(<TrustBadge tier="High" score={75} />)
    expect(screen.getByTitle('Trust Score: 75/100 (High)')).toBeInTheDocument()
  })

  it('applies success styles for Authoritative tier', () => {
    render(<TrustBadge tier="Authoritative" score={90} />)
    expect(screen.getByText('Authoritative').closest('span')).toHaveClass('text-status-success')
  })

  it('applies primary styles for High tier', () => {
    render(<TrustBadge tier="High" score={75} />)
    expect(screen.getByText('High').closest('span')).toHaveClass('text-primary')
  })

  it('applies warning styles for Moderate tier', () => {
    render(<TrustBadge tier="Moderate" score={55} />)
    expect(screen.getByText('Moderate').closest('span')).toHaveClass('text-status-warning')
  })

  it('applies error styles for Low tier', () => {
    render(<TrustBadge tier="Low" score={30} />)
    expect(screen.getByText('Low').closest('span')).toHaveClass('text-status-error')
  })

  it('supports small size', () => {
    render(<TrustBadge tier="High" score={75} size="sm" />)
    expect(screen.getByText('High').closest('span')).toHaveClass('text-[10px]')
  })
})
