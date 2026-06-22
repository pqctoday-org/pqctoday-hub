// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the ConfidentialComputing ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after
 * ConfidentialComputing adopts <ModuleShell>, proving the conversion is
 * behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { ConfidentialComputingModule } from './index'

describe('ConfidentialComputing render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <ConfidentialComputingModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (renders the literal "&" — JSX entity in source only)
    expect(
      screen.getByRole('heading', { name: 'Confidential Computing & TEEs' })
    ).toBeInTheDocument()
    // in-page description (the override slot)
    expect(
      screen.getByText(/TEE architectures, remote attestation, memory encryption/)
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
