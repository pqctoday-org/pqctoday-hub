// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Render-parity golden test for the ArchQuantumImpact ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after
 * ArchQuantumImpact adopts <ModuleShell>, proving the conversion is
 * behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { ArchQuantumImpactModule } from './index'
import manifest from './manifest'

describe('ArchQuantumImpact render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <ArchQuantumImpactModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (renders any JSX entity as its literal character)
    expect(screen.getByRole('heading', { name: 'Architect Quantum Impact' })).toBeInTheDocument()
    // in-page description differs from the catalog description (the override slot)
    expect(
      screen.getByText(/Understand how the quantum threat impacts system architecture/)
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

  it('declares six workshop steps, the sixth being the Trust Hardware Selector', () => {
    expect(manifest.workshopSteps?.map((s) => s.id)).toEqual([
      'why-it-matters',
      'what-to-learn',
      'how-to-act',
      'self-assessment',
      'strangler-fig',
      'trust-hardware',
    ])
    expect(manifest.duration).toBe('30 min')
  })

  it('offers Step 6 in the workshop and renders the selector there', () => {
    render(
      <EmbedProvider>
        <MemoryRouter initialEntries={['/?tab=workshop&step=5']}>
          <ArchQuantumImpactModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Workshop' }))
    expect(screen.getAllByText(/Step 6: Trust Hardware Selector/).length).toBeGreaterThan(0)
  })
})
