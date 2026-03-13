// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkshopStepHeader } from './WorkshopStepHeader'

describe('WorkshopStepHeader', () => {
  const defaultProps = {
    moduleId: 'kms-pqc',
    stepId: 'key-hierarchy',
    stepTitle: 'Step 1: Key Hierarchy',
    stepDescription: 'Design a 3-level PQC key hierarchy.',
    stepIndex: 0,
    totalSteps: 5,
  }

  it('renders step title and description', () => {
    render(<WorkshopStepHeader {...defaultProps} />)
    expect(screen.getByText('Step 1: Key Hierarchy')).toBeInTheDocument()
    expect(screen.getByText('Design a 3-level PQC key hierarchy.')).toBeInTheDocument()
  })

  it('renders an EndorseButton with correct aria-label', () => {
    render(<WorkshopStepHeader {...defaultProps} />)
    const btn = screen.getByRole('button', {
      name: /endorse.*kms.*key hierarchy/i,
    })
    expect(btn).toBeInTheDocument()
  })

  it('renders a FlagButton with correct aria-label', () => {
    render(<WorkshopStepHeader {...defaultProps} />)
    const btn = screen.getByRole('button', {
      name: /flag issue.*kms.*key hierarchy/i,
    })
    expect(btn).toBeInTheDocument()
  })

  it('falls back to moduleId when MODULE_CATALOG has no entry', () => {
    render(<WorkshopStepHeader {...defaultProps} moduleId="nonexistent-module" />)
    const btn = screen.getByRole('button', {
      name: /endorse.*nonexistent-module/i,
    })
    expect(btn).toBeInTheDocument()
  })
})
