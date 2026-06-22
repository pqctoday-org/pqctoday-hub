// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the HybridCrypto ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after HybridCrypto
 * adopts <ModuleShell>, proving the conversion is behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { HybridCryptoModule } from './index'

describe('HybridCrypto render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <HybridCryptoModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (the &amp; entity renders as a literal "&")
    expect(
      screen.getByRole('heading', { name: 'Hybrid & Composite Cryptography' })
    ).toBeInTheDocument()
    // in-page description differs from the catalog description (the override slot)
    expect(
      screen.getByText(/Combine classical and PQC algorithms for defense in depth/)
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
