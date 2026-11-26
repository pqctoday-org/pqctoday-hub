// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { PanelHeader } from './PanelHeader'

// The objective area links into the app, so the header renders inside a router.
const inRouter = (ui: ReactElement) => <MemoryRouter>{ui}</MemoryRouter>

describe('Drawer header', () => {
  it('has no tabs and no expand or minimise controls', () => {
    render(inRouter(<PanelHeader title="Assistant" activeTab="chat" />))
    expect(screen.queryByRole('tab')).toBeNull()
    expect(screen.queryByRole('tablist')).toBeNull()
    expect(screen.queryByRole('button', { name: /expand|shrink|minimi[sz]e/i })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Assistant' })).toBeInTheDocument()
  })

  it('has no close control when it is given no way to close', () => {
    render(inRouter(<PanelHeader title="Assistant" activeTab="chat" />))
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
  })

  it('beside the page, shows a Close control after the width buttons, reachable by keyboard', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(inRouter(<PanelHeader title="Assistant" activeTab="chat" onClose={onClose} docked />))
    const close = screen.getByRole('button', { name: 'Close' })
    expect(close).toHaveAttribute('title', 'Close')
    const names: string[] = []
    for (let i = 0; i < 3; i++) {
      await user.tab()
      names.push(document.activeElement?.getAttribute('aria-label') ?? '')
    }
    // the width buttons come first, then Close: the order the header reads in
    expect(names).toEqual(['Narrower', 'Wider', 'Close'])
    expect(close).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows Close in the Bookmarks and other views too, without width buttons', () => {
    render(
      inRouter(<PanelHeader title="Bookmarks" activeTab="bookmarks" onClose={() => {}} docked />)
    )
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Wider' })).toBeNull()
  })

  it('puts Close first in the tab order on the phone sheet', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(inRouter(<PanelHeader title="Assistant" activeTab="chat" onClose={onClose} />))
    await user.tab()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows the objective area for the Assistant only, with "No objective yet"', () => {
    const { rerender } = render(inRouter(<PanelHeader title="Assistant" activeTab="chat" />))
    expect(screen.getByText('No objective yet')).toBeInTheDocument()
    rerender(inRouter(<PanelHeader title="Bookmarks" activeTab="bookmarks" />))
    expect(screen.queryByText('No objective yet')).toBeNull()
  })
})
