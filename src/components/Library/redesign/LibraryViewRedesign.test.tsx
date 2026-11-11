// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LibraryViewRedesign } from './LibraryViewRedesign'
import { usePersonaStore } from '@/store/usePersonaStore'
import { usePageActionsStore } from '@/store/usePageActionsStore'

function renderView(initial = '/library') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <LibraryViewRedesign />
    </MemoryRouter>
  )
}

beforeEach(() => usePersonaStore.getState().setPersona(null))

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

// Every test here renders the whole Library view over the real corpus (2-10 s alone, 20-40 s on a
// loaded machine); the default 30 s limit failed pr-test (1) on #797 ("forwards a retired ref"),
// and 8b's loaded local run. Same allowance as libraryTableDrawerParams.test.tsx (#782).
describe('LibraryViewRedesign', { timeout: 60_000 }, () => {
  it('renders a populated results grid and does not render its own persona picker', () => {
    renderView()
    // At least one document card opens the drawer (role=button with the refId).
    expect(screen.getAllByText(/document/i).length).toBeGreaterThan(0)
    // The shared top-bar role switcher is the app's single global persona/role
    // control (design program cross-cutting rule) — LibraryRoleLens was removed,
    // so the page must not render a second one.
    expect(
      screen.queryByRole('radiogroup', { name: /viewing the library as/i })
    ).not.toBeInTheDocument()
  })

  it('registers a citation export (Cite) next to the CSV export in the top bar', () => {
    renderView()
    const actions = usePageActionsStore.getState().current
    expect(actions?.onExport).toBeTypeOf('function')
    render(<>{actions?.extra}</>)
    expect(screen.getByTestId('library-cite-trigger')).toHaveTextContent('Cite')
  })

  it('opens the detail drawer when a result card is clicked (?ref deep-link seam)', () => {
    // Seed a known ref so the drawer is open on first render.
    renderView('/library?ref=FIPS%20203')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('surfaces all prior revisions of a multi-revision document in the drawer', () => {
    // NIST-FIPS140-3-IG-PQC collapses an earlier edition into priorRevisions.
    renderView('/library?ref=NIST-FIPS140-3-IG-PQC')
    const drawer = screen.getByRole('dialog')
    expect(within(drawer).getByText(/Previous revisions/i)).toBeInTheDocument()
    expect(within(drawer).getByText('NIST-FIPS-140-3-IG-Sep-2025-PQC')).toBeInTheDocument()
  })
})
