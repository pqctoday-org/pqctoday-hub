// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LibraryViewRedesign } from './LibraryViewRedesign'
import { usePersonaStore } from '@/store/usePersonaStore'
import { libraryData } from '@/data/libraryData'
import type { LifecycleLabel } from '@/utils/libraryLifecycle'

vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => false }))
beforeEach(() => usePersonaStore.getState().setPersona(null))
function renderView(initial = '/library') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <LibraryViewRedesign />
    </MemoryRouter>
  )
}
// Keep full-corpus rendering cases in bounded files; assertions and heap limit are unchanged.
describe('Library lifecycle URL aliases', { timeout: 60_000 }, () => {
  // The Lifecycle filter was renamed (Published to Released, Proposed to Draft,
  // Superseded to Historical) and gained Research Paper and Misc. A shared link
  // written with an old name must still open, with the matching new label, over
  // the real library data. Counts come from the data, not from fixed numbers.
  describe('?lifecycle= lists the matching documents', () => {
    const cases: Array<[string, LifecycleLabel | 'All']> = [
      ['Published', 'Released'],
      ['Proposed', 'Draft'],
      ['Superseded', 'Historical'],
    ]

    it.each(cases)('?lifecycle=%s lists the %s documents', (value, label) => {
      const expected =
        label === 'All'
          ? libraryData.length
          : libraryData.filter((item) => item.lifecycleLabel === label).length
      renderView(`/library?lifecycle=${value}`)
      expect(screen.getByText(/^\d+ documents?$/i).textContent).toBe(
        `${expected} ${expected === 1 ? 'document' : 'documents'}`
      )
    })

    it('shows every document for a value that is not a label', () => {
      renderView('/library?lifecycle=Archived')
      expect(screen.getByText(/^\d+ documents?$/i).textContent).toBe(
        `${libraryData.length} documents`
      )
    })
  })
})
