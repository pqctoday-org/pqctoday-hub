// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the SkillsTeamStructurePqc ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after the module
 * adopts <ModuleShell>, proving the conversion is behaviour-preserving.
 *
 * Reduced to a 5-tab set (no Tools & Products) on 2026-09-01: this module is
 * staffing/process methodology, not a product category, and the migrate
 * catalog has no workforce/training category that could ever populate it.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { SkillsTeamStructureModule } from './index'

describe('SkillsTeamStructurePqc render parity', () => {
  it('renders the gradient header, the in-page description, and the 5-tab set (no Tools & Products)', () => {
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
    // reduced tab set (WS7: triggers expose role="tab")
    for (const name of ['Learn', 'Visual', 'Workshop', 'Exercises', 'References']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
    // reduced tab set: no Tools & Products tab
    expect(screen.queryByRole('tab', { name: 'Tools & Products' })).not.toBeInTheDocument()
  })
})
