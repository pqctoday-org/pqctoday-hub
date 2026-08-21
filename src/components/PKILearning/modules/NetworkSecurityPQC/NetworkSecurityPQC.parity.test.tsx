// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the NetworkSecurityPQC ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after
 * NetworkSecurityPQC adopts <ModuleShell>, proving the conversion is
 * behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { NetworkSecurityPQCModule } from './index'

describe('NetworkSecurityPQC render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <NetworkSecurityPQCModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (renders the literal "&" — JSX entity in source only)
    expect(
      screen.getByRole('heading', { name: 'Network Security & PQC Migration' })
    ).toBeInTheDocument()
    // in-page description (the override slot — differs from the catalog description)
    expect(
      screen.getByText(/Prepare NGFWs, IDS\/IPS, and network security appliances/)
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
