// SPDX-License-Identifier: GPL-3.0-only
// Share inside the expanded inline Community card (cards + table views): the
// clean /leaders?leader=<leaderId> link, never the reader's filters.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { leadersData, type Leader } from '@/data/leadersData'
import { LeaderDetailSection } from './LeaderDetailSection'

vi.mock('@/embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))

describe('LeaderDetailSection — Share', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
    // jsdom has no scrollIntoView; the section scrolls itself into view on open.
    Element.prototype.scrollIntoView = vi.fn()
  })

  async function copy(leader: Leader, expectedPath: string) {
    const onClose = vi.fn()
    render(
      <MemoryRouter initialEntries={['/leaders?sector=Public&q=nist&view=cards']}>
        <LeaderDetailSection leader={leader} onClose={onClose} />
      </MemoryRouter>
    )
    const region = screen.getByRole('region', { name: `Additional details for ${leader.name}` })
    fireEvent.click(within(region).getByRole('button', { name: /^Share / }))
    const item = within(screen.getByRole('menu')).getByRole('button', { name: /Copy link/ })
    fireEvent.mouseDown(item)
    fireEvent.click(item)
    await vi.waitFor(() =>
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        `${window.location.origin}${expectedPath}`
      )
    )
    expect(onClose).not.toHaveBeenCalled()
    expect(region).toBeInTheDocument()
  }

  it('shares /leaders?leader=<leaderId>', async () => {
    const leader = leadersData[0]!
    await copy(leader, `/leaders?leader=${encodeURIComponent(leader.leaderId)}`)
  })

  it('falls back to the name when a row has no leaderId', async () => {
    const leader = { ...leadersData[0]!, leaderId: '', name: 'Ada Q. Lovelace' }
    await copy(leader, '/leaders?leader=Ada%20Q.%20Lovelace')
  })

  it('keeps the Collapse control working', () => {
    const onClose = vi.fn()
    const leader = leadersData[0]!
    render(
      <MemoryRouter>
        <LeaderDetailSection leader={leader} onClose={onClose} />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Collapse details' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
