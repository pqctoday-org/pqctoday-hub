// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the OpsQuantumImpact ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after
 * OpsQuantumImpact adopts <ModuleShell>, proving the conversion is
 * behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { OpsQuantumImpactModule } from './index'

describe('OpsQuantumImpact render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <OpsQuantumImpactModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (matches manifest.title; no override needed)
    expect(screen.getByRole('heading', { name: 'Ops Quantum Impact' })).toBeInTheDocument()
    // in-page description differs from the catalog description (the override slot)
    expect(
      screen.getByText(/Understand how the quantum threat impacts IT operations/)
    ).toBeInTheDocument()
    // the standard six-tab set (triggers render as buttons)
    for (const name of [
      'Learn',
      'Visual',
      'Workshop',
      'Exercises',
      'References',
      'Tools & Products',
    ]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })
})
