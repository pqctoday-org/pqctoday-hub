// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Deep-link PR 2 (Library): table rows open the drawer through `?ref`, the
 * table honours/writes `?sort`, the drawer links "Builds on" ids, carries the
 * App. G/H crosswalk, lets nested pop-ups own Esc and outside clicks, and the
 * Advanced disclosure opens when its filters are active. Real rows throughout
 * (a 46-row slice of the catalogue, see src/test/fixtures/libraryCorpus.ts).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigationType } from 'react-router'
import { LibraryViewRedesign } from './LibraryViewRedesign'
import { LibraryDetailDrawer } from './LibraryDetailDrawer'
import { LibraryControlDeck } from './LibraryControlDeck'
import { usePersonaStore } from '@/store/usePersonaStore'
import { findLibraryItemByRef, libraryData } from '@/data/libraryData'
import { leadersData } from '@/data/leadersData'
import { isAppliedQuantumFramework } from '@/components/Library/FrameworkCrosswalkPanel'
import { relatedLeadersFor } from '@/components/Library/relatedLeaders'

// Render over a 46-row slice of the real catalogue (src/test/fixtures/libraryCorpus.ts): the full
// ~1,500-row corpus made these tests take 30-120 s and use over 3 GB of heap.
vi.mock('@/data/csvUtils', async (importOriginal) =>
  (await import('@/test/fixtures/libraryCorpus')).withLibraryCorpusSlice(await importOriginal())
)

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: mockUseIsMobileShell }))

function LocationProbe() {
  const loc = useLocation()
  const type = useNavigationType()
  return (
    <output data-testid="loc" data-nav={type}>
      {loc.search}
    </output>
  )
}

function renderPage(initial: string) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <LibraryViewRedesign />
      <LocationProbe />
    </MemoryRouter>
  )
}

const params = () => new URLSearchParams(screen.getByTestId('loc').textContent ?? '')
const navType = () => screen.getByTestId('loc').getAttribute('data-nav')

function tableRowIds(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('#library-table tbody tr[data-deeplink-id]')).map(
    (tr) => tr.getAttribute('data-deeplink-id') ?? ''
  )
}

beforeEach(() => usePersonaStore.getState().setPersona(null))

// Renders the table/drawer over a slice of the real library dataset. The full
// corpus took ~10 s per test and passed the default 30 s limit on a GitHub runner
// under the full parallel suite (seen on #773 and #769 pr-test, 30 Sep); the
// slice is far faster, and the allowance is kept as headroom. Same allowance as
// the drawer-links suite below (b9d7bd6bf).
describe('Library table view → drawer via ?ref', { timeout: 60_000 }, () => {
  it('a row click pushes ?ref and opens the detail drawer (no local popover)', () => {
    const { container } = renderPage('/library?view=table')
    const [firstId] = tableRowIds(container)
    expect(firstId).toBeTruthy()
    // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the tree table's rows carry only data-deeplink-id
    fireEvent.click(container.querySelector(`#library-table tr[data-deeplink-id="${firstId}"]`)!)
    expect(params().get('ref')).toBe(firstId)
    expect(navType()).toBe('PUSH')
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'aria-label',
      findLibraryItemByRef(firstId)!.documentTitle
    )
  })

  it('keeps the page ?sort order instead of re-sorting by reference id', () => {
    const { container } = renderPage('/library?view=table&sort=name')
    const titles = tableRowIds(container).map((id) => findLibraryItemByRef(id)!.documentTitle)
    expect(titles.length).toBeGreaterThan(2)
    const sorted = [...titles].sort((a, b) => a.localeCompare(b))
    expect(titles).toEqual(sorted)
  })

  it('a header sort writes ?sort with replace, and shows that column as sorted', () => {
    renderPage('/library?view=table&sort=referenceId')
    fireEvent.click(screen.getByRole('button', { name: /^Title/ }))
    expect(params().get('sort')).toBe('name')
    expect(navType()).toBe('REPLACE')
    expect(screen.getByRole('columnheader', { name: /^Title/ })).toHaveAttribute(
      'aria-sort',
      'ascending'
    )
  })
})

// Renders the drawer over a slice of the real library dataset; the allowance is
// kept as headroom for a loaded runner.
describe('Library detail drawer links and panels', { timeout: 60_000 }, () => {
  it('"Builds on" ids that resolve render as links that push ?ref', () => {
    const parent = libraryData.find((i) =>
      (i.dependencies ?? '')
        .split(';')
        .map((d) => d.trim())
        .some((d) => d && d !== i.referenceId && findLibraryItemByRef(d))
    )
    expect(parent).toBeDefined()
    const dep = parent!
      .dependencies!.split(';')
      .map((d) => d.trim())
      .find((d) => d && d !== parent!.referenceId && findLibraryItemByRef(d))!
    renderPage(`/library?ref=${encodeURIComponent(parent!.referenceId)}`)
    const drawer = screen.getByRole('dialog')
    fireEvent.click(within(drawer).getByRole('button', { name: dep }))
    expect(params().get('ref')).toBe(findLibraryItemByRef(dep)!.referenceId)
    expect(navType()).toBe('PUSH')
  })

  it('shows the App. G/H framework crosswalk that used to live only in the table popover', () => {
    // No live row carries manual_category=applied-quantum today, so tag one.
    const aq = { ...libraryData[0], manualCategory: 'applied-quantum' }
    expect(isAppliedQuantumFramework(aq)).toBe(true)
    render(
      <MemoryRouter>
        <LibraryDetailDrawer
          item={aq}
          bookmarked={false}
          onToggleBookmark={() => undefined}
          onClose={() => undefined}
        />
      </MemoryRouter>
    )
    expect(
      within(screen.getByRole('dialog')).getByText(/Framework Crosswalk \(App\. G\)/)
    ).toBeInTheDocument()
  })

  it('relatedLeadersFor finds leaders whose KeyResourceRefs cite the document', () => {
    const leader = leadersData.find((l) =>
      (l.keyResourceRefs ?? []).some((r) => findLibraryItemByRef(r))
    )
    expect(leader).toBeDefined()
    const ref = leader!.keyResourceRefs!.find((r) => findLibraryItemByRef(r))!
    expect(relatedLeadersFor(findLibraryItemByRef(ref)!).map((l) => l.id)).toContain(leader!.id)
  })
})

// See the note on the first describe: drawer render over the library slice.
describe('Library drawer with a nested pop-up on top', { timeout: 60_000 }, () => {
  function renderDrawer(onClose: () => void) {
    return render(
      <MemoryRouter>
        <LibraryDetailDrawer
          item={libraryData[0]}
          bookmarked={false}
          onToggleBookmark={() => undefined}
          onClose={onClose}
        />
      </MemoryRouter>
    )
  }
  function addNestedDialog() {
    const el = document.createElement('div')
    el.setAttribute('role', 'dialog')
    el.setAttribute('aria-modal', 'true')
    document.body.appendChild(el)
    return el
  }

  it('Esc closes only the top overlay', () => {
    const onClose = vi.fn()
    renderDrawer(onClose)
    const nested = addNestedDialog()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
    nested.remove()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('an outside click that dismisses the nested pop-up does not close the drawer', () => {
    const onClose = vi.fn()
    renderDrawer(onClose)
    const nested = addNestedDialog()
    const scrim = screen.getByRole('button', { name: 'Close detail' })
    fireEvent.pointerDown(scrim)
    nested.remove() // the pop-up's own outside-click handler closes it
    fireEvent.click(scrim)
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.pointerDown(scrim)
    fireEvent.click(scrim)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('Library Advanced disclosure', () => {
  function renderDeck(advancedActive: boolean) {
    const props = {
      search: '',
      onSearch: () => undefined,
      semanticMode: 'idle' as const,
      semanticLoading: false,
      semanticHitCount: 0,
      sortBy: 'published' as const,
      onSort: () => undefined,
      view: 'cards' as const,
      onView: () => undefined,
      orgs: ['NIST'],
      activeOrg: 'All',
      onOrg: () => undefined,
      authOnly: false,
      onAuthOnly: () => undefined,
      onReset: () => undefined,
    }
    const utils = render(<LibraryControlDeck {...props} advancedActive={advancedActive} />)
    return {
      ...utils,
      rerenderActive: (active: boolean) =>
        utils.rerender(<LibraryControlDeck {...props} advancedActive={active} />),
    }
  }
  const advanced = () => screen.getByRole('button', { name: 'Advanced' })

  it('starts closed with no Advanced filter, open with one', () => {
    const { unmount } = renderDeck(false)
    expect(advanced()).toHaveAttribute('aria-expanded', 'false')
    unmount()
    renderDeck(true)
    expect(advanced()).toHaveAttribute('aria-expanded', 'true')
  })

  it('opens when an Advanced filter turns on later (same-route link, Back)', () => {
    const { rerenderActive } = renderDeck(false)
    rerenderActive(true)
    expect(advanced()).toHaveAttribute('aria-expanded', 'true')
  })

  it('the page opens it for an active ?org (org, cswp39, algo, geo and sector all feed it)', () => {
    renderPage('/library?org=NIST')
    expect(advanced()).toHaveAttribute('aria-expanded', 'true')
  })
})
