// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the MigrationProgram ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after
 * MigrationProgram adopts <ModuleShell>, proving the conversion is
 * behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { MigrationProgramModule } from './index'

describe('MigrationProgram render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <MigrationProgramModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (in-page h1 differs from the catalog/manifest title)
    expect(
      screen.getByRole('heading', { name: 'Migration Program Management' })
    ).toBeInTheDocument()
    // in-page description differs from the catalog description (the override slot)
    expect(
      screen.getByText(/Plan, execute, and track enterprise-wide PQC migration programs/)
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
