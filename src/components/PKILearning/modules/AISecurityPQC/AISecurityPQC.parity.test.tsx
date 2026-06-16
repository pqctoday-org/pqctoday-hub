// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the AISecurityPQC ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after
 * AISecurityPQC adopts <ModuleShell>, proving the conversion is
 * behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { AISecurityPQCModule } from './index'

describe('AISecurityPQC render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <AISecurityPQCModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (renders the literal "&" — JSX entity in source only)
    expect(screen.getByRole('heading', { name: 'AI Security & PQC' })).toBeInTheDocument()
    // in-page description differs from the catalog description (the override slot)
    expect(screen.getByText(/Quantum threats to AI systems/)).toBeInTheDocument()
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
