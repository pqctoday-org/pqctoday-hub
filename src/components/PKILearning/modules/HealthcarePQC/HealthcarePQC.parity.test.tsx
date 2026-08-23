// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the HealthcarePQC ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after
 * HealthcarePQC adopts <ModuleShell>, proving the conversion is
 * behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { HealthcarePQCModule } from './index'

describe('HealthcarePQC render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <HealthcarePQCModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (matches manifest.title — no override needed)
    expect(screen.getByRole('heading', { name: 'Healthcare PQC' })).toBeInTheDocument()
    // in-page description differs from the catalog description (the override slot)
    expect(
      screen.getByText(/Biometric data permanence, pharmaceutical IP protection/)
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
