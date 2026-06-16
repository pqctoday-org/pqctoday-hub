// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the SLHDSAModule ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after SLHDSAModule
 * adopts <ModuleShell>, proving the conversion is behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { SLHDSAModule } from './index'

describe('SLHDSAModule render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <SLHDSAModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (renders the FIPS 205 suffix; differs from manifest.title)
    expect(
      screen.getByRole('heading', { name: 'SLH-DSA: Stateless Hash Signatures (FIPS 205)' })
    ).toBeInTheDocument()
    // in-page description (the override slot; &mdash; renders as —)
    expect(
      screen.getByText(/Master FIPS 205 SLH-DSA .* stateless hash-based signatures/)
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
