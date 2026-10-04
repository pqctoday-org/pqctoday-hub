// SPDX-License-Identifier: GPL-3.0-only
// Compliance For-You opens the Library / Threat / Timeline pop-ups as local
// state, so /compliance never names the item. Each pop-up therefore carries
// Share (clean canonical link) AND an "Open on its page" link to that same
// restorable URL — hidden on the item's own page.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { libraryData } from '@/data/libraryData'
import type { ThreatItem } from '@/data/threatsData'
import { LibraryDetailPopover } from '@/components/Library/LibraryDetailPopover'
import { ThreatDetailDialog } from '@/components/Threats/ThreatDetailDialog'
import { TimelineDocumentDetailPopover } from '@/components/Timeline/TimelineDocumentDetailPopover'
import { OpenOnPageLink } from '@/components/common/OpenOnPageLink'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))
vi.mock('@/components/ui/AskAssistantButton', () => ({ AskAssistantButton: () => null }))

const FOR_YOU = '/compliance?tab=foryou&industry=Finance'

const libItem = libraryData[0]!
const threat: ThreatItem = {
  industry: 'Finance & Banking',
  threatId: 'FIN 001',
  description: 'A test threat.',
  criticality: 'High',
  cryptoAtRisk: 'TLS',
  pqcReplacement: 'ML-KEM-768',
  mainSource: 'Test Source',
  sourceUrl: '',
  relatedModules: [],
  threatClass: 'hndl',
}
const row = {
  countryName: 'Testland',
  org: 'Agency',
  phase: 'Discovery',
  type: 'Milestone',
  title: 'Doc title',
  startYear: 2025,
  endYear: 2025,
  description: 'd',
  eventId: 'TL-9',
}

const cases = [
  {
    name: 'Library',
    home: '/library',
    href: `/library?ref=${encodeURIComponent(libItem.referenceId)}`,
    ui: (onClose: () => void) => <LibraryDetailPopover isOpen onClose={onClose} item={libItem} />,
  },
  {
    name: 'Threats',
    home: '/threats',
    href: '/threats?id=FIN%20001',
    ui: (onClose: () => void) => <ThreatDetailDialog threat={threat} onClose={onClose} />,
  },
  {
    name: 'Timeline',
    home: '/timeline',
    href: '/timeline?event=TL-9',
    ui: (onClose: () => void) => (
      <TimelineDocumentDetailPopover isOpen onClose={onClose} row={row} />
    ),
  },
] as const

describe('For-You pop-ups — Open on its page', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
  })

  for (const c of cases) {
    it(`${c.name} pop-up over /compliance links to its clean canonical URL`, async () => {
      const onClose = vi.fn()
      render(<MemoryRouter initialEntries={[FOR_YOU]}>{c.ui(onClose)}</MemoryRouter>)
      const dialog = screen.getAllByRole('dialog').at(-1)!
      const link = within(dialog).getByRole('link', { name: `Open on the ${c.name} page` })
      expect(link).toHaveAttribute('href', c.href)

      // Share copies that same link, not the For-You URL.
      fireEvent.click(within(dialog).getByRole('button', { name: /^Share / }))
      const copy = within(screen.getByRole('menu')).getByRole('button', { name: /Copy link/ })
      fireEvent.pointerDown(copy)
      fireEvent.mouseDown(copy)
      fireEvent.click(copy)
      await vi.waitFor(() =>
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          `${window.location.origin}${c.href}`
        )
      )
      expect(onClose).not.toHaveBeenCalled()

      fireEvent.click(link)
      expect(onClose).toHaveBeenCalled()
    })

    it(`${c.name} pop-up on its own page has no "Open on" link`, () => {
      render(
        <MemoryRouter initialEntries={[`${c.home}?q=x`]}>{c.ui(() => undefined)}</MemoryRouter>
      )
      expect(screen.queryByRole('link', { name: `Open on the ${c.name} page` })).toBeNull()
    })
  }

  it('OpenOnPageLink renders nothing (no crash) outside a router', () => {
    render(<OpenOnPageLink to="/library?ref=X" homePath="/library" pageLabel="Library" />)
    expect(screen.queryByRole('link')).toBeNull()
  })
})
