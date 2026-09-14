// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity smoke test for the DNSSECPQC module, mirroring the pattern
 * every other ModuleShell-based module uses (e.g. VPNSSHModule.parity.test.tsx).
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { DNSSECPQCModule } from './index'

describe('DNSSECPQCModule render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <DNSSECPQCModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(
      screen.getByRole('heading', { name: 'DNSSEC & Post-Quantum Signatures' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/How DNS Security Extensions are moving to post-quantum signatures/)
    ).toBeInTheDocument()
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
