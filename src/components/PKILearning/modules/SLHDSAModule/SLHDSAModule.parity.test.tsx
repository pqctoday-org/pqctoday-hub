// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Render-parity golden test for the SLHDSAModule ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after SLHDSAModule
 * adopts <ModuleShell>, proving the conversion is behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
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
    expect(screen.getByText(/security claims assume at most 2\^64 messages/)).toHaveTextContent(
      'about 585 years'
    )
    expect(screen.getByText(/Technical enforcement is a separate challenge/)).toHaveTextContent(
      'does not establish that an HSM counts these signatures or enforces a cutoff'
    )
    expect(screen.getByText(/Technical enforcement is a separate challenge/)).toHaveTextContent(
      'backup restore or rollback'
    )
    expect(screen.queryByText(/unlimited signatures from one key pair/)).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Practical example: organizational controls' })
    ).toBeInTheDocument()
    expect(screen.getByText(/Set a maximum signing-key lifetime/)).toBeInTheDocument()
    expect(screen.getByText(/Record where each key is deployed/)).toBeInTheDocument()
    expect(screen.getByText(/Estimate total signing volume/)).toBeInTheDocument()
    expect(screen.getByText(/Preserve the original key's retirement date/)).toBeInTheDocument()
    expect(screen.getByText(/These controls support a documented estimate/)).toHaveTextContent(
      'They do not enforce an exact signature count'
    )
    // header title (renders the FIPS 205 suffix; differs from manifest.title)
    expect(
      screen.getByRole('heading', { name: 'SLH-DSA: Stateless Hash Signatures (FIPS 205)' })
    ).toBeInTheDocument()
    // in-page description (the override slot; &mdash; renders as —)
    expect(
      screen.getByText(/Master FIPS 205 SLH-DSA .* stateless hash-based signatures/)
    ).toBeInTheDocument()
    // the standard six-tab set (WS7: triggers expose role="tab")
    for (const name of [
      'Learn',
      'Visual',
      'Workshop',
      'Exercises',
      'References',
      'Tools & Products',
    ]) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
  })
})
