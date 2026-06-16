// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the KmsPqc ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after KmsPqc
 * adopts <ModuleShell>, proving the conversion is behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { KmsPqcModule } from './index'

describe('KmsPqc render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <KmsPqcModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (renders the literal "&" — JSX entity in source only)
    expect(screen.getByRole('heading', { name: 'KMS & PQC Key Management' })).toBeInTheDocument()
    // in-page description (the override slot)
    expect(screen.getByText(/Master PQC key management patterns/)).toBeInTheDocument()
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
