// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SimRunComplete } from './SimRunComplete'

const base = {
  horizonYear: 2029,
  readinessPct: 82,
  clearedCount: 9,
  totalPhases: 9,
  onClose: () => {},
}

describe('SimRunComplete (W2b run-end verdict)', () => {
  it('renders the "beat Q-Day" verdict when the Mosca margin is safe (over <= 0)', () => {
    render(<SimRunComplete {...base} over={-3} />)
    expect(screen.getByRole('dialog', { name: /migration program complete/i })).toBeInTheDocument()
    expect(screen.getByText(/All 9 of 9 phases cleared/i)).toBeInTheDocument()
    // |over| years of margin, framed as a win
    expect(screen.getByText(/3y of margin before Q-Day 2029/i)).toBeInTheDocument()
    expect(screen.getByText(/readiness 82%/i)).toBeInTheDocument()
  })

  it('renders the "behind" verdict when the migration finishes past Q-Day (over > 0)', () => {
    render(<SimRunComplete {...base} over={4} />)
    expect(screen.getByText(/4y past Q-Day 2029/i)).toBeInTheDocument()
    expect(screen.getByText(/sensitive assets were exposed/i)).toBeInTheDocument()
  })

  it('closes on Escape (a11y)', () => {
    const onClose = vi.fn()
    render(<SimRunComplete {...base} over={-1} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
