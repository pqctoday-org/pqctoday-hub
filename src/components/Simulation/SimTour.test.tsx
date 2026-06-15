// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SimTour, TOUR_STEPS } from './SimTour'

describe('SimTour (WS-12)', () => {
  it('walks through every step and finishes via the last action', () => {
    const onClose = vi.fn()
    render(<SimTour onClose={onClose} />)
    expect(screen.getByText(TOUR_STEPS[0].title)).toBeInTheDocument()
    // advance to the last step
    for (let i = 0; i < TOUR_STEPS.length - 1; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Next/ }))
    }
    expect(screen.getByText(TOUR_STEPS[TOUR_STEPS.length - 1].title)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Start playing/ }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Skip closes immediately from the first step', () => {
    const onClose = vi.fn()
    render(<SimTour onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /^Skip$/ }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Back returns to the previous step', () => {
    render(<SimTour onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
    expect(screen.getByText(TOUR_STEPS[1].title)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Back/ }))
    expect(screen.getByText(TOUR_STEPS[0].title)).toBeInTheDocument()
  })
})
