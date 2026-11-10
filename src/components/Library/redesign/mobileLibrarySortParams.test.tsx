// SPDX-License-Identifier: AGPL-3.0-only
// Real-data phone sorting checks are isolated from the desktop table/drawer
// fixtures so their render trees do not accumulate in the same test module.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { usePersonaStore } from '@/store/usePersonaStore'
import { findLibraryItemByRef } from '@/data/libraryData'
import { MobileLibraryView } from '@/components/Mobile/screens/MobileLibraryView'

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: mockUseIsMobileShell }))

beforeEach(() => usePersonaStore.getState().setPersona(null))

describe('MobileLibraryView honours ?sort', () => {
  it('orders the phone list by a shared desktop ?sort, and ignores an unknown one', () => {
    const ids = (initial: string) => {
      const { container, unmount } = render(
        <MemoryRouter initialEntries={[initial]}>
          <MobileLibraryView />
        </MemoryRouter>
      )
      // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- card order via the deep-link ids
      const out = Array.from(container.querySelectorAll('[data-deeplink-id]')).map(
        (el) => el.getAttribute('data-deeplink-id') ?? ''
      )
      unmount()
      return out
    }
    const byName = ids('/library?sort=name').map((id) => findLibraryItemByRef(id)!.documentTitle)
    expect(byName.length).toBeGreaterThan(2)
    expect(byName).toEqual([...byName].sort((a, b) => a.localeCompare(b)))
    expect(ids('/library?sort=bogus')).toEqual(ids('/library'))
  })
})
