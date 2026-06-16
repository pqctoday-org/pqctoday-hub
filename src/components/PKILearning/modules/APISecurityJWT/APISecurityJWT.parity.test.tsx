// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the APISecurityJWT ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after
 * APISecurityJWT adopts <ModuleShell>, proving the conversion is
 * behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { APISecurityJWTModule } from './index'

describe('APISecurityJWT render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <APISecurityJWTModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (renders the literal "&" — JSX entity in source only) —
    // differs from manifest.title ("API Security & JWT") via the title override
    expect(screen.getByRole('heading', { name: 'API Security & JWT with PQC' })).toBeInTheDocument()
    // in-page description differs from the catalog description (the override slot)
    expect(screen.getByText(/JWT\/JWS\/JWE with post-quantum algorithms/)).toBeInTheDocument()
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
