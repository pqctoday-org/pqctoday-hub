// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the PKIEnrollmentProtocols ModuleShell
 * conversion (A2 hard tail, clean-fit). Captured against the PRE-conversion
 * module; must stay green after it adopts <ModuleShell> with a reduced 5-tab
 * set (no Exercises) + onReset (the original Reset cleared the cross-step
 * keypair/cert state).
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { PKIEnrollmentProtocolsModule } from './index'

describe('PKIEnrollmentProtocols render parity', () => {
  it('renders the header, the in-page description, and the 5-tab set (no Exercises)', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <PKIEnrollmentProtocolsModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // the &amp; entity renders as a literal &
    expect(
      screen.getByRole('heading', { name: 'PKI Enrollment Protocols (EST & CMP)' })
    ).toBeInTheDocument()
    // in-page <p> DIFFERS from the catalog description (paren placement) —
    // matching this distinguishing form proves the override slot.
    expect(
      screen.getByText(/RFC 7030 \(EST\) and RFC 9810 \(CMP, KEM update\)/)
    ).toBeInTheDocument()
    for (const name of ['Learn', 'Visual', 'Workshop', 'References', 'Tools & Products']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
    expect(screen.queryByRole('button', { name: 'Exercises' })).not.toBeInTheDocument()
  })
})
