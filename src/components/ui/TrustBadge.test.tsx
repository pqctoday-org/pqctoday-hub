// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrustBadge } from './TrustBadge'

describe('TrustBadge', () => {
  it.each([
    ['Authoritative', 92, 'text-status-success'],
    ['High', 75, 'text-primary'],
    ['Moderate', 55, 'text-status-warning'],
    ['Low', 30, 'text-status-error'],
  ] as const)('tier=%s score=%i → renders label, title, and %s class', (tier, score, cls) => {
    render(<TrustBadge tier={tier} score={score} />)
    const label = screen.getByText(tier)
    expect(label).toBeInTheDocument()
    expect(screen.getByTitle(`Trust Score: ${score}/100 (${tier})`)).toBeInTheDocument()
    expect(label.closest('span')).toHaveClass(cls)
  })

  it('applies small-size text class when size="sm"', () => {
    render(<TrustBadge tier="High" score={75} size="sm" />)
    expect(screen.getByText('High').closest('span')).toHaveClass('text-[10px]')
  })
})
