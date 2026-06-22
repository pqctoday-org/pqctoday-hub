// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the ExecQuantumImpact ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after
 * ExecQuantumImpact adopts <ModuleShell>, proving the conversion is
 * behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { ExecQuantumImpactModule } from './index'

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
