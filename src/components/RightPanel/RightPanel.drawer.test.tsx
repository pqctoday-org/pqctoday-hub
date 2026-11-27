// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'
import { RightPanel } from './RightPanel'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { useWorkshopStore } from '@/store/useWorkshopStore'
import { usePageModal } from '../Assistant/usePageModal'

const layout = vi.hoisted(() => ({ value: 'docked' as 'docked' | 'sheet' }))

vi.mock('../Assistant/usePageModal', async (orig) => {
  const actual = await orig<typeof import('../Assistant/usePageModal')>()
  return { ...actual, usePageModal: vi.fn(actual.usePageModal) }
})
vi.mock('./BookmarksPanel', () => ({ BookmarksPanel: () => <p>Saved items</p> }))
vi.mock('../Assistant/useAssistantLayout', async (orig) => ({
  ...(await orig<typeof import('../Assistant/useAssistantLayout')>()),
  useAssistantLayout: () => layout.value,
}))

beforeEach(() => {
  layout.value = 'docked'
  useWorkshopStore.getState().reset()
  useRightPanelStore.setState({ isOpen: true, activeTab: 'chat' })
})
afterEach(() => localStorage.removeItem('pqc-feature-model-assistant'))

const mount = () =>
  render(
    <MemoryRouter>
      <RightPanel />
    </MemoryRouter>
  )

describe('drawer on the default path', () => {
  it('is a region named Assistant beside the page: no tabs and no expand or minimise buttons, and a visible Close', async () => {
    mount()
    const region = screen.getByRole('region', { name: 'Assistant' })
    expect(region).toHaveAttribute('data-assistant-layout', 'docked')
    // the window is 1024 px wide here, so the automatic width is the narrower one
    expect(region).toHaveStyle({ width: '400px' })
    expect(screen.queryByRole('tab')).toBeNull()
    expect(screen.queryByRole('button', { name: /expand|shrink|minimi[sz]e/i })).toBeNull()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    expect(
      await screen.findByText('Ask anything. No sign-up or objective needed.')
    ).toBeInTheDocument()
    expect(screen.getByText('No objective yet')).toBeInTheDocument()
  })

  it('is not modal on the desktop, and a full-screen modal sheet with Close first on the phone', async () => {
    const { unmount } = mount()
    expect(screen.getByRole('region', { name: 'Assistant' })).not.toHaveAttribute(
      'aria-modal',
      'true'
    )
    // beside the page the drawer has a visible Close too, and it closes the drawer
    const user0 = userEvent.setup()
    await user0.click(screen.getByRole('button', { name: 'Close' }))
    expect(useRightPanelStore.getState().isOpen).toBe(false)
    useRightPanelStore.setState({ isOpen: true, activeTab: 'chat' })
    unmount()

    layout.value = 'sheet'
    mount()
    const sheet = screen.getByRole('dialog', { name: 'Assistant' })
    expect(sheet).toHaveAttribute('aria-modal', 'true')
    expect(sheet).toHaveClass('w-full')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(useRightPanelStore.getState().isOpen).toBe(false)
  })

  it('returns focus to what opened it when it closes, though its input took focus meanwhile', async () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'Opener'
    document.body.appendChild(trigger)
    trigger.focus()
    const { unmount } = mount()
    expect(await screen.findByRole('textbox', { name: 'Your question' })).toHaveFocus()
    unmount()
    expect(trigger).toHaveFocus()
    trigger.remove()
  })

  it('shows Bookmarks in the same slot, with no Assistant objective area', async () => {
    useRightPanelStore.setState({ isOpen: true, activeTab: 'bookmarks' })
    mount()
    expect(screen.getByRole('region', { name: 'Bookmarks' })).toBeInTheDocument()
    expect(await screen.findByText('Saved items')).toBeInTheDocument()
    expect(screen.queryByText('No objective yet')).toBeNull()
  })
})

describe('a browser that still holds the old rollback switch', () => {
  it('shows the Assistant: the switch no longer does anything', async () => {
    localStorage.setItem('pqc-feature-model-assistant', '1')
    mount()
    expect(
      await screen.findByText('Ask anything. No sign-up or objective needed.')
    ).toBeInTheDocument()
    expect(screen.queryByText(/model|provider|api key|download/i)).toBeNull()
  })

  it('offers no screen to set up a model or a key', () => {
    mount()
    expect(screen.queryByText(/model|provider|api key|download/i)).toBeNull()
  })
})

describe('the docked drawer and a dialog the page opens', () => {
  const addDialog = () => {
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    document.body.appendChild(dialog)
    return dialog
  }

  it('steps behind the page dialog while it is open and comes back when it closes', async () => {
    mount()
    const region = screen.getByRole('region', { name: 'Assistant' })
    expect(region).toHaveClass('z-panel')
    expect(region).not.toHaveClass('z-panel-behind')

    const dialog = addDialog()
    await waitFor(() => expect(region).toHaveClass('z-panel-behind'))
    expect(region).not.toHaveClass('z-panel')

    dialog.remove()
    await waitFor(() => expect(region).toHaveClass('z-panel'))
  })

  it('watches for page dialogs only beside the page, never for the phone sheet', async () => {
    const watched = vi.mocked(usePageModal)
    // Docked: the drawer watches (the argument is "enabled").
    watched.mockClear()
    const { unmount: unmountDocked } = mount()
    expect(watched.mock.calls.some(([enabled]) => enabled === true)).toBe(true)
    unmountDocked()

    // Sheet: it never subscribes, and adding a dialog does not change its layer.
    layout.value = 'sheet'
    watched.mockClear()
    mount()
    const sheet = screen.getByRole('dialog', { name: 'Assistant' })
    const dialog = addDialog()
    await new Promise((r) => setTimeout(r, 50))
    expect(watched.mock.calls.length).toBeGreaterThan(0)
    expect(watched.mock.calls.every(([enabled]) => enabled === false)).toBe(true)
    expect(sheet).toHaveClass('z-dialog')
    dialog.remove()
  })
})
