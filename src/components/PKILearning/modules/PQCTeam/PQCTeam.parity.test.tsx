// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the PQCTeam ModuleShell conversion (A2 hard
 * tail, clean-fit). Captured against the PRE-conversion module; must stay green
 * after it adopts <ModuleShell> with a reduced 3-tab set (manifest.tabs) and a
 * non-stepper `workshop` slot (a single TeamSizingCalculator).
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { PQCTeamModule } from './index'

describe('PQCTeam render parity', () => {
  it('renders the header, the in-page description, and the 3-tab set only', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <PQCTeamModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(screen.getByRole('heading', { name: 'Building Your PQC Team' })).toBeInTheDocument()
    // in-page <p> DIFFERS from the catalog description ("Build-Borrow-Buy
    // decisions ... team-sizing") — matching this proves the override slot.
    expect(
      screen.getByText(/Build-Borrow-Buy, and a 1-per-500 sizing calculator/)
    ).toBeInTheDocument()
    for (const name of ['Learn', 'Workshop', 'Exercises']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
    // reduced tab set: Visual/References/Tools are excluded
    expect(screen.queryByRole('button', { name: 'Visual' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'References' })).not.toBeInTheDocument()
  })
})
