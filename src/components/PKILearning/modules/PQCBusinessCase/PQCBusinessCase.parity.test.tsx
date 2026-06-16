// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the PQCBusinessCase ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after
 * PQCBusinessCase adopts <ModuleShell>, proving the conversion is
 * behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { PQCBusinessCaseModule } from './index'

describe('PQCBusinessCase render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <PQCBusinessCaseModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title differs from the catalog manifest title (the override slot)
    expect(
      screen.getByRole('heading', { name: 'Building the PQC Business Case' })
    ).toBeInTheDocument()
    // in-page description differs from the catalog description (the override slot)
    expect(
      screen.getByText(/Quantify costs, model ROI, and build compelling investment cases/)
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
