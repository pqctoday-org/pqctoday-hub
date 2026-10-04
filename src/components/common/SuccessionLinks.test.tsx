// SPDX-License-Identifier: GPL-3.0-only
/**
 * An older document links to the newer one that updates or replaces it, and the
 * newer one lists what it replaces with a link back. The library data has no
 * such pair until the label data lands, so these tests mark two real documents
 * (FIPS 203 as older, FIPS 204 as newer) and put them back afterwards.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { libraryData, findLibraryItemByRef, type LibraryItem } from '@/data/libraryData'
import { SuccessionLinks } from './SuccessionLinks'
import { LibraryDetailDrawer } from '@/components/Library/redesign/LibraryDetailDrawer'
import { LibraryDetailPopover } from '@/components/Library/LibraryDetailPopover'
import { LibraryViewRedesign } from '@/components/Library/redesign/LibraryViewRedesign'
import { MobileLibraryView } from '@/components/Mobile/screens/MobileLibraryView'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))
const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: mockUseIsMobileShell }))

const older = findLibraryItemByRef('FIPS 203') as LibraryItem
const newer = findLibraryItemByRef('FIPS 204') as LibraryItem

/** Mark `older` as replaced by `newer`, as the label data will, and undo it after. */
const saved = {
  olderLabel: older.lifecycleLabel,
  olderNewer: older.supersededByRefs,
  newerReplaces: newer.replacesRefs,
}
function linkThem() {
  older.supersededByRefs = [newer.referenceId]
  older.lifecycleLabel = 'Historical'
  newer.replacesRefs = [older.referenceId]
}
afterEach(() => {
  older.supersededByRefs = saved.olderNewer
  older.lifecycleLabel = saved.olderLabel
  newer.replacesRefs = saved.newerReplaces
  mockUseIsMobileShell.mockReturnValue(false)
})

const noop = () => undefined

describe('SuccessionLinks', () => {
  it('on an older document, links to the newer one and opens it on click', () => {
    const onOpenRef = vi.fn()
    render(
      <MemoryRouter>
        <SuccessionLinks
          item={{ ...older, supersededByRefs: [newer.referenceId] }}
          onOpenRef={onOpenRef}
        />
      </MemoryRouter>
    )
    const group = screen.getByRole('region', { name: 'Newer document' })
    expect(screen.queryByRole('region', { name: 'Replaces' })).toBeNull()
    fireEvent.click(within(group).getByRole('button', { name: new RegExp(newer.referenceId) }))
    expect(onOpenRef).toHaveBeenCalledWith(newer.referenceId)
  })

  it('on a newer document, lists what it replaces with a link back', () => {
    const onOpenRef = vi.fn()
    render(
      <MemoryRouter>
        <SuccessionLinks
          item={{ ...newer, replacesRefs: [older.referenceId] }}
          onOpenRef={onOpenRef}
        />
      </MemoryRouter>
    )
    const group = screen.getByRole('region', { name: 'Replaces' })
    expect(screen.queryByRole('region', { name: 'Newer document' })).toBeNull()
    fireEvent.click(within(group).getByRole('button', { name: new RegExp(older.referenceId) }))
    expect(onOpenRef).toHaveBeenCalledWith(older.referenceId)
  })

  it('shows both on a document in the middle of a chain, and the label of each target', () => {
    render(
      <MemoryRouter>
        <SuccessionLinks
          item={{
            ...libraryData[2],
            supersededByRefs: [newer.referenceId],
            replacesRefs: [older.referenceId],
          }}
          onOpenRef={noop}
        />
      </MemoryRouter>
    )
    expect(screen.getByRole('region', { name: 'Newer document' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Replaces' })).toBeInTheDocument()
    const newerRow = within(screen.getByRole('region', { name: 'Newer document' }))
    expect(newerRow.getByText(newer.lifecycleLabel)).toBeInTheDocument()
  })

  it('without an open handler, each link goes to /library?ref=', () => {
    render(
      <MemoryRouter>
        <SuccessionLinks item={{ ...older, supersededByRefs: [newer.referenceId] }} />
      </MemoryRouter>
    )
    expect(
      within(screen.getByRole('region', { name: 'Newer document' })).getByRole('link')
    ).toHaveAttribute('href', `/library?ref=${encodeURIComponent(newer.referenceId)}`)
  })

  it('shows nothing for a document with no newer or older document', () => {
    const { container } = render(
      <MemoryRouter>
        <SuccessionLinks
          item={{ ...older, supersededByRefs: undefined, replacesRefs: undefined }}
        />
      </MemoryRouter>
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('never shows a link to a document that is not in the library', () => {
    const { container } = render(
      <MemoryRouter>
        <SuccessionLinks
          item={{ ...older, supersededByRefs: ['NOT-IN-THE-LIBRARY'], replacesRefs: ['ALSO-GONE'] }}
          onOpenRef={noop}
        />
      </MemoryRouter>
    )
    expect(container).toBeEmptyDOMElement()
  })
})

describe('succession links where a document is shown', () => {
  it('the drawer of the older document links to the newer one', () => {
    const onOpenRef = vi.fn()
    render(
      <MemoryRouter initialEntries={['/library?ref=x']}>
        <LibraryDetailDrawer
          item={{ ...older, supersededByRefs: [newer.referenceId] }}
          bookmarked={false}
          onToggleBookmark={noop}
          onClose={noop}
          onOpenRef={onOpenRef}
        />
      </MemoryRouter>
    )
    const group = within(screen.getByRole('dialog')).getByRole('region', {
      name: 'Newer document',
    })
    fireEvent.click(within(group).getByRole('button', { name: new RegExp(newer.referenceId) }))
    expect(onOpenRef).toHaveBeenCalledWith(newer.referenceId)
  })

  it('the pop-up of the newer document lists what it replaces', () => {
    render(
      <MemoryRouter>
        <LibraryDetailPopover
          isOpen
          onClose={noop}
          item={{ ...newer, replacesRefs: [older.referenceId] }}
        />
      </MemoryRouter>
    )
    const group = within(screen.getByRole('dialog')).getByRole('region', { name: 'Replaces' })
    expect(within(group).getByRole('link')).toHaveAttribute(
      'href',
      `/library?ref=${encodeURIComponent(older.referenceId)}`
    )
  })

  it('the phone sheet links both ways, and a tap opens the other document in the sheet', () => {
    linkThem()
    mockUseIsMobileShell.mockReturnValue(true)
    render(
      <MemoryRouter initialEntries={[`/library?ref=${encodeURIComponent(older.referenceId)}`]}>
        <MobileLibraryView />
      </MemoryRouter>
    )
    let sheet = screen.getByTestId('library-detail-sheet')
    fireEvent.click(
      within(within(sheet).getByRole('region', { name: 'Newer document' })).getByRole('button', {
        name: new RegExp(newer.referenceId),
      })
    )
    sheet = screen.getByTestId('library-detail-sheet')
    expect(within(sheet).getAllByText(newer.documentTitle).length).toBeGreaterThan(0)
    const back = within(within(sheet).getByRole('region', { name: 'Replaces' })).getByRole(
      'button',
      { name: new RegExp(older.referenceId) }
    )
    fireEvent.click(back)
    sheet = screen.getByTestId('library-detail-sheet')
    expect(within(sheet).getByRole('region', { name: 'Newer document' })).toBeInTheDocument()
  })

  it('on the Library page, the link opens the newer document and its link goes back', () => {
    linkThem()
    function Probe() {
      return <output data-testid="search">{useLocation().search}</output>
    }
    render(
      <MemoryRouter initialEntries={[`/library?ref=${encodeURIComponent(older.referenceId)}`]}>
        <LibraryViewRedesign />
        <Probe />
      </MemoryRouter>
    )
    let drawer = screen.getByRole('dialog')
    fireEvent.click(
      within(within(drawer).getByRole('region', { name: 'Newer document' })).getByRole('button', {
        name: new RegExp(newer.referenceId),
      })
    )
    expect(new URLSearchParams(screen.getByTestId('search').textContent ?? '').get('ref')).toBe(
      newer.referenceId
    )
    drawer = screen.getByRole('dialog')
    expect(within(drawer).getAllByText(newer.documentTitle).length).toBeGreaterThan(0)
    fireEvent.click(
      within(within(drawer).getByRole('region', { name: 'Replaces' })).getByRole('button', {
        name: new RegExp(older.referenceId),
      })
    )
    expect(new URLSearchParams(screen.getByTestId('search').textContent ?? '').get('ref')).toBe(
      older.referenceId
    )
  }, 60_000)
})
