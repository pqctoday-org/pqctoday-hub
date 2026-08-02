// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SimTour, TOUR_STEPS, GUIDED_DEFS } from './SimTour'

function renderTour() {
  const props = { onClose: vi.fn() }
  render(<SimTour {...props} />)
  return props
}

/** Every player now gets the same tour: the standard steps PLUS the plain-language
 *  definitions. Both used to be gated on the retired GUIDED mode (2026-08-02). */
const ALL_STEPS = [...TOUR_STEPS, ...GUIDED_DEFS]

describe('SimTour (WS-12)', () => {
  it('walks through every step and finishes via the last action', () => {
    const { onClose } = renderTour()
    expect(screen.getByText(TOUR_STEPS[0].title)).toBeInTheDocument()
    for (let i = 0; i < ALL_STEPS.length - 1; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Next/ }))
    }
    expect(screen.getByText(ALL_STEPS[ALL_STEPS.length - 1].title)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Start playing/ }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Skip closes immediately from the first step', () => {
    const { onClose } = renderTour()
    fireEvent.click(screen.getByRole('button', { name: /^Skip$/ }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Back returns to the previous step', () => {
    renderTour()
    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
    expect(screen.getByText(TOUR_STEPS[1].title)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Back/ }))
    expect(screen.getByText(TOUR_STEPS[0].title)).toBeInTheDocument()
  })

  it('includes the plain-language definitions for every player, with no mode to enable', () => {
    renderTour()
    // the retired "turn on plain-language guidance" affordance is gone…
    expect(screen.queryByRole('button', { name: /plain-language guidance/i })).toBeNull()
    // …because its content is now unconditional: the tour spans standard + defs
    expect(screen.getByText(new RegExp(`1/${ALL_STEPS.length}`))).toBeInTheDocument()
    for (let i = 0; i < ALL_STEPS.length - 1; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Next/ }))
    }
    expect(screen.getByText(GUIDED_DEFS[GUIDED_DEFS.length - 1].title)).toBeInTheDocument()
  })
})
