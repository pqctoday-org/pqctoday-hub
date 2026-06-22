// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the PQCTestingValidation ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after the module
 * adopts <ModuleShell>, proving the conversion is behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { PQCTestingValidationModule } from './index'

describe('PQCTestingValidation render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <PQCTestingValidationModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (renders the literal "&" — JSX entity in source only)
    expect(
      screen.getByRole('heading', { name: 'PQC Network Testing & Validation' })
    ).toBeInTheDocument()
    // in-page description (override slot)
    expect(
      screen.getByText(/Design and execute testing strategies for post-quantum cryptography/)
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
