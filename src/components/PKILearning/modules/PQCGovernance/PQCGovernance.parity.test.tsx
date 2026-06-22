// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the PQCGovernance ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after
 * PQCGovernance adopts <ModuleShell>, proving the conversion is
 * behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { PQCGovernanceModule } from './index'

describe('PQCGovernance render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <PQCGovernanceModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (renders the literal "&" — JSX entity in source only)
    expect(screen.getByRole('heading', { name: 'PQC Governance & Policy' })).toBeInTheDocument()
    // in-page description differs from the catalog description (the override slot)
    expect(
      screen.getByText(/Establish governance frameworks, define roles, and create policies/)
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
