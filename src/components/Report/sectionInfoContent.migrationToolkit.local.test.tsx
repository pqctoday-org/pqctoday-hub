// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionInfoModal } from './SectionInfoModal'
import { SECTION_INFO } from './sectionInfoContent'

// The Migration Toolkit list is chosen by infrastructure layer and sub-category
// only; the visitor's industry never filters it, and with no layer selected the
// whole catalog is listed.
describe('Migration Toolkit explanation matches how the list is built', () => {
  const entry = SECTION_INFO.migrationToolkit

  it('says the list follows layers and sub-categories, ordered by priority', () => {
    expect(entry.summary).toContain(
      'in the infrastructure layers and sub-categories you selected, ordered by migration priority'
    )
    expect(entry.summary).toContain('Your industry does not change the list')
    expect(entry.summary).toContain('if no layer is selected, the whole catalog is listed')
    expect(entry.summary).not.toMatch(/match your infrastructure and industry/)
  })

  it('states that the industry answer does not filter the list', () => {
    const industry = entry.wizardInputs.find((input) => input.label === 'Industry (Step 1)')
    expect(industry?.detail).toBe(
      'Does not filter this list; products are chosen by infrastructure layer and sub-category only.'
    )
    expect(industry?.detail).not.toMatch(/further filtered/)
  })

  it('states that no selected layer means no filtering', () => {
    const infrastructure = entry.wizardInputs.find(
      (input) => input.label === 'Infrastructure (Step 12)'
    )
    expect(infrastructure?.detail).toMatch(
      /With no layer selected, nothing is filtered and the whole catalog is listed\.$/
    )
  })

  it('shows the corrected summary in the reader modal', () => {
    render(<SectionInfoModal isOpen onClose={vi.fn()} sectionId="migrationToolkit" />)
    expect(screen.getByText(/Your industry does not change the list/)).toBeInTheDocument()
  })
})
