// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SimTour, TOUR_STEPS, GUIDED_DEFS } from './SimTour'

function renderTour(over: { guided?: boolean } = {}) {
  const props = { guided: false, onEnableGuided: vi.fn(), onClose: vi.fn(), ...over }
  render(<SimTour {...props} />)
  return props
}

describe('SimTour (WS-12 + PR-4 guided)', () => {
  it('walks through every standard step and finishes via the last action', () => {
    const { onClose } = renderTour()
    expect(screen.getByText(TOUR_STEPS[0].title)).toBeInTheDocument()
    for (let i = 0; i < TOUR_STEPS.length - 1; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Next/ }))
    }
    expect(screen.getByText(TOUR_STEPS[TOUR_STEPS.length - 1].title)).toBeInTheDocument()
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

  it('offers to enable plain-language guidance on the first step when not guided', () => {
    const { onEnableGuided } = renderTour({ guided: false })
    fireEvent.click(screen.getByRole('button', { name: /plain-language guidance/i }))
    expect(onEnableGuided).toHaveBeenCalledTimes(1)
  })

  it('guided mode appends the plain-language definition steps and hides the enable button', () => {
    const { onClose } = renderTour({ guided: true })
    // already guided → no "enable guidance" affordance
    expect(screen.queryByRole('button', { name: /plain-language guidance/i })).toBeNull()
    // the tour now spans the standard steps + the guided definitions
    const total = TOUR_STEPS.length + GUIDED_DEFS.length
    for (let i = 0; i < total - 1; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Next/ }))
    }
    expect(screen.getByText(GUIDED_DEFS[GUIDED_DEFS.length - 1].title)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Start playing/ }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
