// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the SkillsTeamStructurePqc ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after the module
 * adopts <ModuleShell>, proving the conversion is behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { SkillsTeamStructureModule } from './index'

describe('SkillsTeamStructurePqc render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <SkillsTeamStructureModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (differs from manifest.title — the override slot)
    expect(screen.getByRole('heading', { name: 'Building Your PQC Team' })).toBeInTheDocument()
    // in-page description differs from the catalog description (the override slot)
    expect(screen.getByText(/Staff a post-quantum migration program/)).toBeInTheDocument()
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
