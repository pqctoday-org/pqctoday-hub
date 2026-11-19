// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Render-parity golden test for the ExecQuantumImpact ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after
 * ExecQuantumImpact adopts <ModuleShell>, proving the conversion is
 * behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { ExecQuantumImpactModule, SelfAssessmentStep } from './index'

describe('ExecQuantumImpact render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <ExecQuantumImpactModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (matches the manifest title — no override)
    expect(screen.getByRole('heading', { name: 'Executive Quantum Impact' })).toBeInTheDocument()
    // in-page description differs from the catalog description (the override slot);
    // the &mdash; entity renders as an em dash
    expect(
      screen.getByText(/Understand the quantum threat from an executive and governance perspective/)
    ).toBeInTheDocument()
    // the standard six-tab set (WS7: triggers expose role="tab")
    for (const name of [
      'Learn',
      'Visual',
      'Workshop',
      'Exercises',
      'References',
      'Tools & Products',
    ]) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
  })
})

describe('Executive organizational evidence scope', () => {
  it('never interprets unanswered questions as low exposure', () => {
    render(
      <MemoryRouter>
        <SelfAssessmentStep />
      </MemoryRouter>
    )

    expect(screen.getByText('0/9')).toBeInTheDocument()
    expect(screen.getByText(/Unanswered never means low exposure/)).toBeInTheDocument()
    expect(screen.queryByText(/Low Exposure/)).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'unknown' })).toHaveLength(9)
    expect(
      screen.getByRole('link', { name: 'Build the executive measurement pack' })
    ).toHaveAttribute('href', '/business/tools/kpi-dashboard')
  })

  it('lists selected applicable drivers and evidence questions when answered', () => {
    render(
      <MemoryRouter>
        <SelfAssessmentStep />
      </MemoryRouter>
    )

    const yesButtons = screen.getAllByRole('button', { name: 'yes' })
    fireEvent.click(yesButtons[0])

    expect(screen.getByText('1/9')).toBeInTheDocument()
    expect(
      screen.getAllByText('We store data requiring confidentiality beyond 10 years')
    ).toHaveLength(2)
    expect(screen.getAllByText(/Unanswered/)).toHaveLength(8)
  })
})
