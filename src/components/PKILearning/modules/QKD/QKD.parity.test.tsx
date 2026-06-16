// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the QKD ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after QKD
 * adopts <ModuleShell>, proving the conversion is behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { QKDModule } from './index'

describe('QKD render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <QKDModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (matches the manifest title)
    expect(screen.getByRole('heading', { name: 'Quantum Key Distribution' })).toBeInTheDocument()
    // in-page description differs from the catalog description (the override slot)
    expect(
      screen.getByText(/Explore QKD fundamentals, BB84 protocol simulation/)
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
