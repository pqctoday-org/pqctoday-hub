// SPDX-License-Identifier: GPL-3.0-only
/**
 * Every place a library document's lifecycle label is shown reads `lifecycleLabel`
 * (Released, Draft, Expired, Historical, Research Paper, Misc). Before the Library
 * UI was moved over, cards, the drawer, the table and the pills still said
 * "Published" and "Superseded", and a document labelled Research Paper or Misc
 * showed the wrong word, or none. Each surface below gets documents carrying a
 * label that the old five-bucket vocabulary could not express.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { libraryData, type LibraryItem, type PriorRevision } from '@/data/libraryData'
import { LIFECYCLE_LABELS, type LifecycleLabel } from '@/utils/libraryLifecycle'
import { lifecycleLabel, lifecyclePillClass } from './redesign/libraryPills'
import { LibraryDocumentCard } from './redesign/LibraryDocumentCard'
import { LibraryDetailDrawer } from './redesign/LibraryDetailDrawer'
import { LibraryDetailPopover } from './LibraryDetailPopover'
import { LibraryTreeTable } from './LibraryTreeTable'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))
const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: mockUseIsMobileShell }))

const noop = () => undefined

/** A document that carries `label`, with nothing else that could say a label too. */
function docWith(label: LifecycleLabel, overrides: Partial<LibraryItem> = {}): LibraryItem {
  return {
    ...libraryData[0],
    referenceId: `TEST-${label}`,
    documentTitle: `Test document ${label}`,
    documentStatus: 'Final',
    lifecycleLabel: label,
    groupLifecycleLabel: undefined,
    priorRevisions: undefined,
    supersededByRefs: undefined,
    replacesRefs: undefined,
    children: [],
    ...overrides,
  }
}

function priorWith(label: LifecycleLabel): PriorRevision {
  return {
    referenceId: `PRIOR-${label}`,
    documentTitle: `Older edition ${label}`,
    documentStatus: 'Final',
    lifecycleLabel: label,
    downloadUrl: '',
    supersededBy: 'TEST',
  }
}

/** The words the old vocabulary used that a reader must no longer see as a label. */
const OLD_ONLY = /^(Published|Proposed|Superseded)$/

const LABELS_THE_OLD_VOCABULARY_LACKED: LifecycleLabel[] = ['Historical', 'Research Paper', 'Misc']

describe('the pill helpers', () => {
  it('give every label its own word and a badge', () => {
    for (const label of LIFECYCLE_LABELS) {
      expect(lifecycleLabel(label)).toBe(label)
      expect(lifecyclePillClass(label).length).toBeGreaterThan(0)
    }
  })
})

describe('Library card', () => {
  it.each(LIFECYCLE_LABELS)('shows %s', (label) => {
    render(
      <LibraryDocumentCard
        item={docWith(label)}
        bookmarked={false}
        onToggleBookmark={noop}
        onOpen={noop}
      />
    )
    expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.queryByText(OLD_ONLY)).toBeNull()
  })
})

describe('Library detail drawer', () => {
  function openDrawer(item: LibraryItem) {
    render(
      <MemoryRouter initialEntries={['/library?ref=x']}>
        <LibraryDetailDrawer
          item={item}
          bookmarked={false}
          onToggleBookmark={noop}
          onClose={noop}
        />
      </MemoryRouter>
    )
    return screen.getByRole('dialog')
  }

  it.each(LIFECYCLE_LABELS)('shows %s in its header', (label) => {
    const drawer = openDrawer(docWith(label))
    expect(within(drawer).getAllByText(label).length).toBeGreaterThan(0)
    expect(within(drawer).queryByText(OLD_ONLY)).toBeNull()
  })

  it('shows the furthest label of a revision group, and the label of each older revision', () => {
    const drawer = openDrawer(
      docWith('Draft', {
        groupLifecycleLabel: 'Released',
        priorRevisions: [priorWith('Misc'), priorWith('Research Paper')],
      })
    )
    expect(within(drawer).getAllByText('Released').length).toBeGreaterThan(0)
    const misc = within(drawer).getByText('Older edition Misc').closest('div')?.parentElement
    expect(misc).not.toBeNull()
    expect(within(misc as HTMLElement).getByText('Misc')).toBeInTheDocument()
    const paper = within(drawer)
      .getByText('Older edition Research Paper')
      .closest('div')?.parentElement
    expect(within(paper as HTMLElement).getByText('Research Paper')).toBeInTheDocument()
  })
})

describe('Library detail pop-up', () => {
  it.each(LABELS_THE_OLD_VOCABULARY_LACKED)('shows %s on an older revision', (label) => {
    render(
      <MemoryRouter>
        <LibraryDetailPopover
          isOpen
          onClose={noop}
          item={docWith('Released', { priorRevisions: [priorWith(label)] })}
        />
      </MemoryRouter>
    )
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(label)).toBeInTheDocument()
    expect(within(dialog).queryByText(OLD_ONLY)).toBeNull()
  })
})

describe('Library table', () => {
  it("shows each document's own label in its Status column", () => {
    const items = LIFECYCLE_LABELS.map((label) => docWith(label))
    render(
      <MemoryRouter>
        <LibraryTreeTable data={items} onOpen={noop} />
      </MemoryRouter>
    )
    const table = screen.getByRole('table')
    for (const label of LIFECYCLE_LABELS) {
      const row = within(table).getByText(`Test document ${label}`).closest('tr')
      expect(row, label).not.toBeNull()
      expect(within(row as HTMLElement).getByText(label)).toBeInTheDocument()
    }
    expect(within(table).queryByText(OLD_ONLY)).toBeNull()
  })
})
