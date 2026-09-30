// SPDX-License-Identifier: GPL-3.0-only
/**
 * Deep-link PR 4: the Library pop-up (opened over other pages, e.g. the
 * Compliance For-You view) carries its own Share and no longer touches the
 * host page's top-bar actions — it used to clear them on close.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { libraryData } from '@/data/libraryData'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { LibraryDetailPopover } from './LibraryDetailPopover'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))

const item = libraryData[0]
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function Host({ open, onClose = () => undefined }: { open: boolean; onClose?: () => void }) {
  return (
    <MemoryRouter initialEntries={['/compliance?tab=foryou&industry=Finance']}>
      <LibraryDetailPopover isOpen={open} onClose={onClose} item={item} />
    </MemoryRouter>
  )
}

describe('LibraryDetailPopover', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
    usePageActionsStore.getState().clearPageActions()
  })

  it("leaves the host page's top-bar actions intact across open and close", () => {
    const onExport = vi.fn()
    const hostActions = {
      title: 'Compliance',
      onExport,
      endorseUrl: 'https://example.test/endorse',
      flagUrl: 'https://example.test/flag',
    }
    usePageActionsStore.getState().setPageActions(hostActions)
    const before = usePageActionsStore.getState().current

    const { rerender, unmount } = render(<Host open={false} />)
    rerender(<Host open />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(usePageActionsStore.getState().current).toBe(before)

    rerender(<Host open={false} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(usePageActionsStore.getState().current).toBe(before)
    expect(usePageActionsStore.getState().current).toEqual(hostActions)

    rerender(<Host open />)
    unmount()
    expect(usePageActionsStore.getState().current).toEqual(hostActions)
  })

  it('Copy link copies the clean ?ref link and leaves the pop-up open', async () => {
    const onClose = vi.fn()
    render(<Host open onClose={onClose} />)
    const dialog = screen.getByRole('dialog')
    fireEvent.click(
      within(dialog).getByRole('button', {
        name: new RegExp(`^Share ${escapeRe(item.documentTitle.trim())}`),
      })
    )
    const menu = screen.getByRole('menu')
    expect(dialog.contains(menu)).toBe(false)
    const copy = within(menu).getByRole('button', { name: /Copy link/ })
    // Full pointer sequence: the pop-up closes on a document mousedown outside it.
    fireEvent.pointerDown(copy)
    fireEvent.mouseDown(copy)
    fireEvent.mouseUp(copy)
    fireEvent.click(copy)
    await vi.waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `${window.location.origin}/library?ref=${encodeURIComponent(item.referenceId)}`
      )
    )
    expect(onClose).not.toHaveBeenCalled()
  })
})
