// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StepExercise } from './StepExercise'
import { useModuleStore } from '@/store/useModuleStore'

describe('StepExercise (round 9, wave 2)', () => {
  beforeEach(() => useModuleStore.getState().resetProgress())
  it('shows the question, marks the pick, and gives the reason on a wrong and a right answer', () => {
    render(<StepExercise moduleId="pqc-101" stepId="algorithm-families" />)
    expect(screen.getByTestId('step-exercise')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Inverting a hash function/ }))
    expect(screen.getByTestId('step-feedback')).toHaveTextContent(/Not quite/)
    expect(screen.getByTestId('step-feedback')).toHaveTextContent(
      /No efficient quantum algorithm is known for the lattice problems behind ML-KEM and ML-DSA/
    )
    expect(screen.getByTestId('step-feedback')).toHaveTextContent(/Grover/)
    fireEvent.click(screen.getByRole('button', { name: /Integer factorisation/ }))
    expect(screen.getByTestId('step-feedback')).toHaveTextContent(/^Right\./)
  })
  it('renders nothing for a step without an exercise', () => {
    const { container } = render(<StepExercise moduleId="pqc-101" stepId="nope" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('withholds feedback for a saved answer to a superseded question', () => {
    useModuleStore.getState().updateModuleProgress('pqc-101', {
      workshopPractice: {
        'algorithm-families': { first: { question: 'Former prompt and option order', choice: 0 } },
      },
    })
    render(<StepExercise moduleId="pqc-101" stepId="algorithm-families" />)
    expect(screen.queryByTestId('step-feedback')).toBeNull()
    expect(screen.getByRole('button', { name: /Inverting a hash function/ })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })
})
