// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the AutomotivePQC ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after
 * AutomotivePQC adopts <ModuleShell>, proving the conversion is
 * behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { AutomotivePQCModule } from './index'

describe('AutomotivePQC render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <AutomotivePQCModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (matches manifest.title)
    expect(screen.getByRole('heading', { name: 'Automotive PQC' })).toBeInTheDocument()
    // in-page description differs from the catalog description (the override slot)
    expect(
      screen.getByText(/V2X PKI migration, sensor data integrity, ISO 26262 safety-crypto/)
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
