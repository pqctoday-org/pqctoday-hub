// SPDX-License-Identifier: GPL-3.0-only
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect } from 'vitest'
import { ModuleReferencesTab } from './ModuleReferencesTab'
import { MODULE_CITED_STANDARDS } from '@/data/moduleContentRegistry'
import { getLibraryItemsForModule } from '@/data/libraryData'

/**
 * Guards the seam added 2026-08-21.
 *
 * Before it, this tab rendered only `getLibraryItemsForModule()` — the LIBRARY's
 * view of which documents belong to a module, via its `module_ids` column. What
 * the module's own content.ts cited was shown nowhere. Measured across the
 * corpus at the time, 47 of 64 modules cited at least one standard that never
 * appeared in their References tab: 152 documents in total.
 *
 * These assert the module's half is rendered, linked into the Library, and not
 * duplicated by the library half.
 */
function renderTab(moduleId: string) {
  return render(
    <MemoryRouter>
      <ModuleReferencesTab moduleId={moduleId} />
    </MemoryRouter>
  )
}

describe('ModuleReferencesTab — cited standards', () => {
  it('renders every standard the module cites, linked by reference id', () => {
    const cited = MODULE_CITED_STANDARDS['quantum-threats']
    expect(cited?.length ?? 0).toBeGreaterThan(0)
    renderTab('quantum-threats')

    expect(screen.getByText('Cited in this module')).toBeInTheDocument()
    for (const std of cited) {
      const link = screen.getByRole('link', { name: std.title || std.id })
      expect(link).toHaveAttribute('href', `/library?ref=${encodeURIComponent(std.id)}`)
    }
  })

  it('does not repeat a cited standard in the library-derived list below it', () => {
    const moduleId = 'quantum-threats'
    const citedIds = new Set((MODULE_CITED_STANDARDS[moduleId] ?? []).map((s) => s.id))
    const overlap = getLibraryItemsForModule(moduleId).filter((i) => citedIds.has(i.referenceId))
    // The fixture is only meaningful if the two sets actually overlap.
    expect(overlap.length).toBeGreaterThan(0)

    renderTab(moduleId)
    for (const item of overlap) {
      // Once as a cited standard, never a second time as a "further" reference.
      expect(screen.getAllByText(item.documentTitle)).toHaveLength(1)
    }
  })

  it('still renders for a module with no cited standards', () => {
    const unknown = 'not-a-real-module-id'
    expect(MODULE_CITED_STANDARDS[unknown]).toBeUndefined()
    renderTab(unknown)
    expect(screen.getByText('No references yet')).toBeInTheDocument()
  })
})
