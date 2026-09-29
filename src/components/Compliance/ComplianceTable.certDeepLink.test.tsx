// SPDX-License-Identifier: GPL-3.0-only
//
// `?cert=` used to open only when the record's row was among the ~25 rows the
// virtualiser mounted first (the popover lived in each row behind a mount-time
// useState). The popover is table-level now, resolved against the full data.
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ComplianceTable } from './ComplianceTable'

// A WINDOWED virtualiser — the global test mock renders every row, which is
// exactly the condition that hid this bug. Only the first 25 rows mount here,
// like the real table on first paint, and scrollToIndex is recorded.
const scrollToIndex = vi.hoisted(() => vi.fn())
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => {
    const items = Array.from({ length: Math.min(count, 25) }, (_, i) => ({
      index: i,
      key: i,
      start: i * 48,
      end: (i + 1) * 48,
      size: 48,
      lane: 0,
    }))
    return {
      getVirtualItems: () => items,
      getTotalSize: () => count * 48,
      scrollToIndex,
      measureElement: () => {},
    }
  },
}))
import type { ComplianceRecord } from './types'

const records: ComplianceRecord[] = Array.from({ length: 300 }, (_, i) => ({
  id: `C${1000 + i}`,
  source: 'NIST',
  date: `2025-01-${String((i % 28) + 1).padStart(2, '0')}`,
  link: 'https://example.test',
  type: 'FIPS 140-3',
  status: i === 299 ? 'Historical' : 'Active',
  pqcCoverage: '',
  productName: `Module ${i}`,
  productCategory: 'HSM',
  vendor: `Vendor ${i}`,
}))

describe('ComplianceTable ?cert= deep link', () => {
  it('opens a record far outside the virtual window and scrolls the virtualiser to it', () => {
    scrollToIndex.mockClear()
    render(<ComplianceTable data={records} selectedRecordId="C1252" onCloseRecord={vi.fn()} />)
    // Its row is not mounted…
    // eslint-disable-next-line testing-library/no-node-access -- asserting on the deep-link hook's selector
    expect(document.querySelector('[data-deeplink-id="C1252"]')).toBeNull()
    // …but the record opens, and the table scrolls to its row.
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('C1252')).toBeInTheDocument()
    expect(scrollToIndex).toHaveBeenCalled()
  })

  it('clicking a row writes the selection through onSelectRecord', () => {
    const onSelect = vi.fn()
    render(<ComplianceTable data={records} onSelectRecord={onSelect} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'View details' })[0])
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect.mock.calls[0][0]).toMatch(/^C1\d{3}$/)
  })

  it('opens a record the current scope hides (resolved against all data)', () => {
    render(<ComplianceTable data={records} selectedRecordId="C1299" onCloseRecord={vi.fn()} />)
    expect(within(screen.getByRole('dialog')).getByText('C1299')).toBeInTheDocument()
  })

  it('reopens when the selected id changes on the same mount, and closes via onCloseRecord', () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <ComplianceTable data={records} selectedRecordId="C1010" onCloseRecord={onClose} />
    )
    rerender(<ComplianceTable data={records} selectedRecordId="C1200" onCloseRecord={onClose} />)
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('C1200')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
    rerender(<ComplianceTable data={records} onCloseRecord={onClose} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens nothing for an unknown id', () => {
    render(<ComplianceTable data={records} selectedRecordId="NOPE" />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
