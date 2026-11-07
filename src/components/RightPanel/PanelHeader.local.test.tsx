// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { PanelHeader } from './PanelHeader'
import type { RightPanelTab } from '@/types/HistoryTypes'
function Header() {
  const [tab, setTab] = useState<RightPanelTab>('chat')
  return <PanelHeader activeTab={tab} onTabChange={setTab} onClose={vi.fn()} />
}
describe('Panel tab names and keyboard activation', () => {
  it('retains explicit accessible names when responsive text is hidden and updates selected state', async () => {
    const user = userEvent.setup()
    render(<Header />)
    for (const name of ['Assistant', 'Journey', 'Workshop', 'Bookmarks', 'FAQ']) {
      const tab = screen.getByRole('tab', { name })
      expect(tab).toHaveAttribute('aria-label', name)
    }
    const journey = screen.getByRole('tab', { name: 'Journey' })
    journey.focus()
    await user.keyboard('{Enter}')
    expect(journey).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Assistant' })).toHaveAttribute('aria-selected', 'false')
    await user.tab()
    expect(screen.getByRole('tab', { name: 'Workshop' })).toHaveFocus()
    await user.keyboard(' ')
    expect(screen.getByRole('tab', { name: 'Workshop' })).toHaveAttribute('aria-selected', 'true')
  })
})
