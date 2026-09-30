// SPDX-License-Identifier: GPL-3.0-only
// Share inside the Community pop-up (deep-link PR 4).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { leadersData, type Leader } from '@/data/leadersData'
import { LeaderDetailPopover } from './LeaderDetailPopover'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))
vi.mock('../ui/AskAssistantButton', () => ({ AskAssistantButton: () => null }))

describe('LeaderDetailPopover — Share', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
  })

  async function copy(leader: Leader, expectedPath: string) {
    const onClose = vi.fn()
    render(
      <MemoryRouter initialEntries={['/leaders?sector=Public&q=nist']}>
        <LeaderDetailPopover isOpen onClose={onClose} leader={leader} />
      </MemoryRouter>
    )
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /^Share / }))
    const item = within(screen.getByRole('menu')).getByRole('button', { name: /Copy link/ })
    // The popover closes on a document mousedown outside it — the portaled
    // menu must not trigger that.
    fireEvent.mouseDown(item)
    fireEvent.click(item)
    await vi.waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `${window.location.origin}${expectedPath}`
      )
    )
    expect(onClose).not.toHaveBeenCalled()
    expect(dialog).toBeInTheDocument()
  }

  it('shares /leaders?leader=<leaderId>', async () => {
    const leader = leadersData[0]!
    await copy(leader, `/leaders?leader=${encodeURIComponent(leader.leaderId)}`)
  })

  it('falls back to the name when a row has no leaderId', async () => {
    const leader = { ...leadersData[0]!, leaderId: '', name: 'Ada Q. Lovelace' }
    await copy(leader, '/leaders?leader=Ada%20Q.%20Lovelace')
  })
})
