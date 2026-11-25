// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { PanelHeader } from './PanelHeader'

describe('Drawer header', () => {
  it('has no tabs and no expand or minimise controls', () => {
    render(<PanelHeader title="Assistant" activeTab="chat" />)
    expect(screen.queryByRole('tab')).toBeNull()
    expect(screen.queryByRole('tablist')).toBeNull()
    expect(screen.queryByRole('button', { name: /expand|shrink|minimi[sz]e/i })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Assistant' })).toBeInTheDocument()
  })

  it('has no close control on the desktop: the top bar toggle closes it', () => {
    render(<PanelHeader title="Assistant" activeTab="chat" />)
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
  })

  it('puts Close first in the tab order on the phone sheet', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<PanelHeader title="Assistant" activeTab="chat" onClose={onClose} />)
    await user.tab()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows the objective area for the Assistant only, with "No objective yet"', () => {
    const { rerender } = render(<PanelHeader title="Assistant" activeTab="chat" />)
    expect(screen.getByText('No objective yet')).toBeInTheDocument()
    rerender(<PanelHeader title="Bookmarks" activeTab="bookmarks" />)
    expect(screen.queryByText('No objective yet')).toBeNull()
  })
})
