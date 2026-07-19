// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { RibbonTermTooltip } from './RibbonTermTooltip'

describe('RibbonTermTooltip (educational-value gap-closing)', () => {
  it('shows the definition on click and hides it again on a second click', () => {
    render(
      <RibbonTermTooltip concept="readiness">
        <span>Readiness</span>
      </RibbonTermTooltip>
    )
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /definition of grounded readiness/i }))
    expect(screen.getByRole('tooltip')).toHaveTextContent(/BOTH gates pass/i)
    fireEvent.click(screen.getByRole('button', { name: /definition of grounded readiness/i }))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows the definition on hover and hides it on mouse-leave', () => {
    render(
      <RibbonTermTooltip concept="mosca">
        <span>Years to Q-Day</span>
      </RibbonTermTooltip>
    )
    const trigger = screen.getByRole('button', { name: /definition of mosca/i })
    fireEvent.mouseEnter(trigger)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.mouseLeave(trigger)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('closes on Escape', () => {
    render(
      <RibbonTermTooltip concept="hndl">
        <span>HNDL risk</span>
      </RibbonTermTooltip>
    )
    fireEvent.click(screen.getByRole('button', { name: /definition of harvest now/i }))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
