// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { useModuleStore } from '@/store/useModuleStore'
import { CertQuantumImpactModule, SelfAssessmentStep } from './index'
import { content } from './content'

describe('CertQuantumImpact render parity', () => {
  beforeEach(() => {
    useModuleStore.getState().resetProgress()
  })

  it('renders the gradient header, in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <CertQuantumImpactModule />
        </MemoryRouter>
      </EmbedProvider>
    )

    expect(
      screen.getByRole('heading', { name: 'Certification Engineer Quantum Impact' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Understand how post-quantum cryptography transforms cryptographic module validation/
      )
    ).toBeInTheDocument()

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

describe('Certification evidence scope self-assessment', () => {
  beforeEach(() => {
    useModuleStore.getState().resetProgress()
  })

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
      screen.getByRole('link', { name: 'Explore the Cryptographic Product Certification guide' })
    ).toHaveAttribute('href', '/learn/crypto-product-certification')
  })

  it('lists applicable drivers and evidence questions when answered and marks step complete at 9/9', () => {
    const markStepSpy = vi.fn()
    const origMarkStep = useModuleStore.getState().markStepComplete
    useModuleStore.setState({ markStepComplete: markStepSpy })

    try {
      render(
        <MemoryRouter>
          <SelfAssessmentStep />
        </MemoryRouter>
      )

      const yesButtons = screen.getAllByRole('button', { name: 'yes' })
      const unknownButtons = screen.getAllByRole('button', { name: 'unknown' })
      const noButtons = screen.getAllByRole('button', { name: 'no' })

      fireEvent.click(yesButtons[0])
      expect(screen.getByText('1/9')).toBeInTheDocument()
      expect(
        screen.getAllByText(
          /Our product portfolio or estate still relies on FIPS 140-2 certificates moved to the CMVP Historical List/
        )
      ).toHaveLength(2)
      expect(screen.getAllByText(/Unanswered/)).toHaveLength(8)

      fireEvent.click(unknownButtons[1])
      expect(screen.getByText('2/9')).toBeInTheDocument()
      expect(screen.getAllByText(/Marked Unknown/)).toHaveLength(1)
      expect(screen.getAllByText(/Unanswered/)).toHaveLength(7)

      // Complete remaining 7 questions
      for (const btn of noButtons.slice(2)) {
        fireEvent.click(btn)
      }
      expect(screen.getByText('9/9')).toBeInTheDocument()
      expect(markStepSpy).toHaveBeenCalledWith('cert-quantum-impact', 'self-assessment')
    } finally {
      useModuleStore.setState({ markStepComplete: origMarkStep })
    }
  })
})

describe('CertQuantumImpact content metadata', () => {
  it('omits lastReviewed for an unreviewed new module and resolves all standards', () => {
    expect(content.moduleId).toBe('cert-quantum-impact')
    expect(content.lastReviewed).toBeUndefined()
    expect(content.lastEdited).toBe('2026-11-18')
    expect(content.standards.length).toBeGreaterThanOrEqual(15)
    expect(content.algorithms.length).toBe(3)
    expect(content.deadlines.length).toBeGreaterThanOrEqual(6)
  })
})

describe('Certification engineering exercises tab', () => {
  beforeEach(() => {
    useModuleStore.getState().resetProgress()
  })

  it('renders all three scenarios and toggles decision checklists', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <CertQuantumImpactModule />
        </MemoryRouter>
      </EmbedProvider>
    )

    fireEvent.click(screen.getByRole('tab', { name: 'Exercises' }))

    expect(
      screen.getByRole('heading', { name: 'Scenario: Scoped CMVP vs. ACVP Evidence Audit' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Scenario: FIPS 140-2 Historical Cutover & Re-Submission Triage',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Scenario: Multi-Scheme (FIPS 140-3 + EUCC + PCI) Boundary Mapping',
      })
    ).toBeInTheDocument()

    const showButtons = screen.getAllByRole('button', { name: /Show decision checklist/ })
    expect(showButtons).toHaveLength(3)

    fireEvent.click(showButtons[0])
    expect(
      screen.getByText(
        /the ACVP certificate proves only that the ML-KEM-768 implementation passed automated test vectors/
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Hide decision checklist/ })).toBeInTheDocument()
  })
})
