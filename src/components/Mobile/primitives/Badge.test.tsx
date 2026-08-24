// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MobileBadge } from './Badge'

describe('MobileBadge', () => {
  it('renders a plain dot when no count is given', () => {
    render(<MobileBadge testId="dot" />)
    const dot = screen.getByTestId('dot')
    expect(dot).toHaveAttribute('aria-hidden', 'true')
    expect(dot).toHaveTextContent('')
  })

  it('renders a count', () => {
    render(<MobileBadge count={3} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('caps a large count at 99+', () => {
    render(<MobileBadge count={150} />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })
})
