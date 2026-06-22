// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the VPNSSHModule ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after
 * VPNSSHModule adopts <ModuleShell>, proving the conversion is
 * behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { VPNSSHModule } from './index'

describe('VPNSSHModule render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <VPNSSHModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (renders the literal "&" — JSX entity in source only)
    expect(screen.getByRole('heading', { name: 'VPN/IPsec & SSH PQC' })).toBeInTheDocument()
    // in-page description differs from the catalog description (the override slot)
    expect(
      screen.getByText(/Explore post-quantum key exchange in IKEv2, SSH, and WireGuard protocols/)
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
