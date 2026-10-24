// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The drawer shows the document's own dates (first published, updated) from the
 * row's initial_publication_date and last_update_date, and labels the catalog
 * check date as a catalog date — it is when the record was last looked at, not a
 * date of the document.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { libraryData, type LibraryItem } from '@/data/libraryData'
import { LibraryDetailDrawer } from './LibraryDetailDrawer'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))
const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: mockUseIsMobileShell }))

const noop = () => undefined

function withDates(overrides: Partial<LibraryItem>): LibraryItem {
  return { ...libraryData[0], priorRevisions: undefined, lastVerified: undefined, ...overrides }
}

function openDrawer(item: LibraryItem) {
  render(
    <MemoryRouter initialEntries={['/library?ref=x']}>
      <LibraryDetailDrawer item={item} bookmarked={false} onToggleBookmark={noop} onClose={noop} />
    </MemoryRouter>
  )
  return screen.queryByTestId('drawer-document-dates')
}

describe('Library drawer: document dates', () => {
  it('shows first published, updated and the labelled catalog check date', () => {
    // Shape of the FIPS 140-3 Implementation Guidance row.
    const line = openDrawer(
      withDates({
        initialPublicationDate: '2020-09-21',
        lastUpdateDate: '2026-08-19',
        lastVerified: '2026-09-24',
      })
    )
    expect(line).toHaveTextContent(
      'First published Sep 21, 2020 · updated Aug 19, 2026 · catalog checked Sep 24, 2026'
    )
    // The check date is never presented as a bare "verified" date.
    expect(line).not.toHaveTextContent(/\bverified\b/i)
  })

  it('keeps a month-only first publication at month precision', () => {
    // Shape of the FIPS 140-3 CMVP Management Manual row.
    const line = openDrawer(
      withDates({
        initialPublicationDate: '2020-09',
        lastUpdateDate: '2026-04-09',
        lastVerified: '2026-09-24',
      })
    )
    expect(line).toHaveTextContent(
      'First published Sep 2020 · updated Apr 9, 2026 · catalog checked Sep 24, 2026'
    )
    expect(line).not.toHaveTextContent('Sep 1, 2020')
  })

  it('leaves out a date that is missing', () => {
    const line = openDrawer(
      withDates({ initialPublicationDate: '2019-04', lastUpdateDate: '', lastVerified: undefined })
    )
    expect(line).toHaveTextContent(/^First published Apr 2019$/)
  })

  it('shows only the catalog check date when the document has no date', () => {
    const line = openDrawer(
      withDates({ initialPublicationDate: '', lastUpdateDate: '', lastVerified: '2026-09-24' })
    )
    expect(line).toHaveTextContent(/^catalog checked Sep 24, 2026$/)
  })

  it('renders no dates line when nothing is recorded', () => {
    const line = openDrawer(
      withDates({ initialPublicationDate: '', lastUpdateDate: '', lastVerified: undefined })
    )
    expect(line).toBeNull()
  })
})
