// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SimConceptPeek } from './SimConceptPeek'
import { EXEC_TOUR_CONCEPTS } from './execTourConfig'

const hndl = EXEC_TOUR_CONCEPTS.hndl

describe('SimConceptPeek', () => {
  it('renders nothing for an empty concept list', () => {
    const { container } = render(<SimConceptPeek concepts={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the concept title and body (resolved via GUIDED_DEFS)', () => {
    render(<SimConceptPeek concepts={[hndl]} />)
    expect(screen.getByTestId('concept-peek-hndl')).toBeInTheDocument()
    expect(screen.getByText(hndl.title)).toBeInTheDocument()
  })

  it('calls onDismiss with the concept id when the dismiss button is clicked', () => {
    const onDismiss = vi.fn()
    render(<SimConceptPeek concepts={[hndl]} onDismiss={onDismiss} />)
    fireEvent.click(screen.getByLabelText(`Dismiss ${hndl.title} tip`))
    expect(onDismiss).toHaveBeenCalledWith('hndl')
  })

  it('omits the dismiss button when onDismiss is not provided', () => {
    render(<SimConceptPeek concepts={[hndl]} />)
    expect(screen.queryByLabelText(`Dismiss ${hndl.title} tip`)).toBeNull()
  })

  it('calls onLearnMore with the mapped module id when clicked', () => {
    const onLearnMore = vi.fn()
    render(<SimConceptPeek concepts={[hndl]} onLearnMore={onLearnMore} />)
    fireEvent.click(screen.getByText('Learn more →'))
    expect(onLearnMore).toHaveBeenCalledWith('quantum-threats')
  })

  it('omits the learn-more link when onLearnMore is not provided', () => {
    render(<SimConceptPeek concepts={[hndl]} />)
    expect(screen.queryByText('Learn more →')).toBeNull()
  })
})
