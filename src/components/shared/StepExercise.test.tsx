// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StepExercise } from './StepExercise'

describe('StepExercise (round 9, wave 2)', () => {
  it('shows the question, marks the pick, and gives the reason on a wrong and a right answer', () => {
    render(<StepExercise moduleId="pqc-101" stepId="algorithm-families" />)
    expect(screen.getByTestId('step-exercise')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Inverting a hash function/ }))
    expect(screen.getByTestId('step-feedback')).toHaveTextContent(/Not quite/)
    expect(screen.getByTestId('step-feedback')).toHaveTextContent(/Lattice and hash problems/)
    fireEvent.click(screen.getByRole('button', { name: /Integer factorisation/ }))
    expect(screen.getByTestId('step-feedback')).toHaveTextContent(/^Right\./)
  })
  it('renders nothing for a step without an exercise', () => {
    const { container } = render(<StepExercise moduleId="pqc-101" stepId="nope" />)
    expect(container).toBeEmptyDOMElement()
  })
})
