// SPDX-License-Identifier: GPL-3.0-only
/**
 * Deep-link PR 4: the Library drawer (also the ?spec= drawer and the table
 * view's drawer) carries its own Share, shares the clean `?ref` link, keeps
 * focus inside itself, and still hands focus to its nested Community leader
 * pop-up (portalled to <body>, with its own focus lock).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { Button } from '@/components/ui/button'
import { libraryData } from '@/data/libraryData'
import { libraryEnrichments } from '@/data/libraryEnrichmentData'
import { relatedLeadersFor } from '@/components/Library/relatedLeaders'
import { LibraryDetailDrawer } from './LibraryDetailDrawer'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))
const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: mockUseIsMobileShell }))

function openDrawer(item = libraryData[0], onClose = vi.fn()) {
  render(
    <MemoryRouter initialEntries={['/library?view=table&q=kem&sort=date&ref=x']}>
      <Button type="button">outside</Button>
      <LibraryDetailDrawer
        item={item}
        bookmarked={false}
        onToggleBookmark={() => undefined}
        onClose={onClose}
      />
    </MemoryRouter>
  )
  return onClose
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

describe('LibraryDetailDrawer — Share inside the drawer', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
  })

  it('Copy link copies the clean ?ref link; Esc closes only the menu', async () => {
    const item = libraryData[0]
    const onClose = openDrawer(item)
    const drawer = screen.getByRole('dialog')
    const shareName = new RegExp(`^Share ${escapeRe(item.documentTitle)}`)
    fireEvent.click(within(drawer).getByRole('button', { name: shareName }))
    const menu = screen.getByRole('menu')
    expect(drawer.contains(menu)).toBe(false)

    // The drawer's own Esc handler runs in the capture phase too — it must
    // leave Esc to the open menu.
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(within(drawer).getByRole('button', { name: shareName }))
    fireEvent.click(within(screen.getByRole('menu')).getByRole('button', { name: /Copy link/ }))
    await vi.waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `${window.location.origin}/library?ref=${encodeURIComponent(item.referenceId)}`
      )
    )
    expect(onClose).not.toHaveBeenCalled()
    await vi.waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    // The menu closes from an async clipboard callback, and its Escape
    // listener goes in a passive-effect cleanup that can land a tick after the
    // DOM update — retry until that cleanup has run (as it has long before a
    // real user's next key press).
    await vi.waitFor(() => {
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('traps focus inside the open drawer', async () => {
    openDrawer()
    const drawer = screen.getByRole('dialog')
    await vi.waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true))
    screen.getByRole('button', { name: 'outside', hidden: true }).focus()
    await vi.waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true))
  })

  it('the nested Community leader pop-up (portalled) still receives focus and clicks', async () => {
    const item = libraryData.find(
      (i) => libraryEnrichments[i.referenceId] && relatedLeadersFor(i).length > 0
    )
    expect(item).toBeDefined()
    const leader = relatedLeadersFor(item!)[0]
    openDrawer(item!)
    const drawer = screen.getByRole('dialog')
    fireEvent.click(within(drawer).getByRole('button', { name: /Document Analysis/ }))
    fireEvent.click(within(drawer).getByRole('button', { name: new RegExp(escapeRe(leader.name)) }))

    const popover = await screen.findByRole('dialog', { name: new RegExp(escapeRe(leader.name)) })
    expect(drawer.contains(popover)).toBe(false)
    await vi.waitFor(() => expect(popover.contains(document.activeElement)).toBe(true))
    const inner = within(popover).getAllByRole('button')[0]
    inner.focus()
    await vi.waitFor(() => expect(document.activeElement).toBe(inner))
  })
})

describe('LibraryDetailDrawer — layer in the phone shell', () => {
  it('sits above the sticky phone header / bottom nav (z-dialog) only in the mobile shell', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    const { unmount } = render(
      <MemoryRouter>
        <LibraryDetailDrawer
          item={libraryData[0]}
          bookmarked={false}
          onToggleBookmark={() => undefined}
          onClose={() => undefined}
        />
      </MemoryRouter>
    )
    expect(screen.getByRole('dialog')).toHaveClass('z-dialog')
    expect(screen.getByRole('dialog')).not.toHaveClass('z-50')
    unmount()

    mockUseIsMobileShell.mockReturnValue(false)
    openDrawer()
    expect(screen.getByRole('dialog')).toHaveClass('z-50')
    expect(screen.getByRole('dialog')).not.toHaveClass('z-dialog')
  })
})
