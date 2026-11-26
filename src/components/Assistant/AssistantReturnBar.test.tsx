// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'
import { AssistantReturnBar } from './AssistantReturnBar'
import { useAssistantReturnStore } from '@/store/useAssistantReturnStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'

const layout = vi.hoisted(() => ({ value: 'docked' as 'docked' | 'sheet' }))
vi.mock('./useAssistantLayout', async (orig) => ({
  ...(await orig<typeof import('./useAssistantLayout')>()),
  useAssistantLayout: () => layout.value,
}))

const nav: { go: (to: string) => void } = { go: () => {} }
const go = (to: string) => nav.go(to)
function Probe() {
  const l = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    nav.go = (to) => void navigate(to)
  }, [navigate])
  return <p data-testid="where">{l.pathname}</p>
}

function mount() {
  return render(
    <MemoryRouter initialEntries={['/learn']}>
      <AssistantReturnBar />
      <Probe />
    </MemoryRouter>
  )
}

beforeEach(() => {
  layout.value = 'docked'
  useAssistantReturnStore.getState().clear()
  useRightPanelStore.setState({ isOpen: false, activeTab: 'chat' })
})

describe('return from a page opened from an answer', () => {
  it('shows nothing until the row has opened its page', () => {
    useAssistantReturnStore.getState().begin({ path: '/learn', fromKey: 'default', label: 'Learn' })
    mount()
    expect(screen.queryByRole('navigation', { name: 'Return' })).toBeNull()
    act(() => go('/go/CMP:CNSA-2'))
    expect(screen.queryByRole('navigation', { name: 'Return' })).toBeNull()
  })

  it('desktop: "Back to your answer" returns to the page and reopens the drawer', async () => {
    useAssistantReturnStore.getState().begin({ path: '/learn', fromKey: 'default', label: 'Learn' })
    mount()
    act(() => go('/compliance'))
    const back = await screen.findByRole('button', { name: 'Back to your answer' })
    await userEvent.setup().click(back)
    expect(screen.getByTestId('where')).toHaveTextContent('/learn')
    expect(useRightPanelStore.getState()).toMatchObject({ isOpen: true, activeTab: 'chat' })
    expect(useAssistantReturnStore.getState().target).toBeNull()
  })

  it('desktop: focus goes back to the row action that opened the page', async () => {
    const drawer = document.createElement('div')
    drawer.setAttribute('data-assistant-layout', 'docked')
    const opener = document.createElement('button')
    opener.setAttribute('aria-label', 'Go to page: CNSA 2.0')
    drawer.appendChild(opener)
    document.body.appendChild(drawer)
    try {
      useAssistantReturnStore.getState().begin({
        path: '/learn',
        fromKey: 'default',
        label: 'Learn',
        origin: 'Go to page: CNSA 2.0',
      })
      mount()
      act(() => go('/compliance'))
      await userEvent
        .setup()
        .click(await screen.findByRole('button', { name: 'Back to your answer' }))
      await waitFor(() => expect(opener).toHaveFocus())
    } finally {
      drawer.remove()
    }
  })

  it('phone: names where it goes, and does not reopen the sheet', async () => {
    layout.value = 'sheet'
    useAssistantReturnStore
      .getState()
      .begin({ path: '/learn', fromKey: 'default', label: 'TLS Basics' })
    mount()
    act(() => go('/compliance'))
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Back to TLS Basics' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/learn')
    expect(useRightPanelStore.getState().isOpen).toBe(false)
  })

  it('moves inside a modal dialog the opened page shows, so it is not left behind the backdrop', async () => {
    useAssistantReturnStore.getState().begin({ path: '/learn', fromKey: 'default', label: 'Learn' })
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    dialog.setAttribute('aria-label', 'CNSA 2.0 detail')
    document.body.appendChild(dialog)
    try {
      mount()
      act(() => go('/compliance'))
      const back = await screen.findByRole('button', { name: 'Back to your answer' })
      expect(dialog.contains(back)).toBe(true)
      expect(screen.getAllByRole('button', { name: 'Back to your answer' })).toHaveLength(1)
      await userEvent.setup().click(back)
      expect(screen.getByTestId('where')).toHaveTextContent('/learn')
      expect(useAssistantReturnStore.getState().target).toBeNull()
    } finally {
      dialog.remove()
    }
  })

  it('stays in the page when a modal opens and goes back to the page when it closes', async () => {
    useAssistantReturnStore.getState().begin({ path: '/learn', fromKey: 'default', label: 'Learn' })
    mount()
    act(() => go('/compliance'))
    const inPage = await screen.findByRole('button', { name: 'Back to your answer' })
    expect(inPage.closest('[aria-modal]')).toBeNull()
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    document.body.appendChild(dialog)
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Back to your answer' }).closest('[aria-modal]')
      ).toBe(dialog)
    )
    dialog.remove()
    await waitFor(() => {
      const back = screen.getByRole('button', { name: 'Back to your answer' })
      expect(back.closest('[aria-modal]')).toBeNull()
    })
  })

  it('ends when the learner moves on from the opened page', async () => {
    useAssistantReturnStore.getState().begin({ path: '/learn', fromKey: 'default', label: 'Learn' })
    mount()
    act(() => go('/compliance'))
    await screen.findByRole('button', { name: 'Back to your answer' })
    act(() => go('/library'))
    expect(screen.queryByRole('button', { name: 'Back to your answer' })).toBeNull()
    expect(useAssistantReturnStore.getState().target).toBeNull()
  })

  it('stays while the opened page only changes its own address query', async () => {
    useAssistantReturnStore.getState().begin({ path: '/learn', fromKey: 'default', label: 'Learn' })
    mount()
    act(() => go('/library?ref=NSA CNSA 2.0 FAQ'))
    await screen.findByRole('button', { name: 'Back to your answer' })
    act(() => go('/library?ref=NSA+CNSA+2.0+FAQ&prefs=off'))
    expect(screen.getByRole('button', { name: 'Back to your answer' })).toBeInTheDocument()
    expect(useAssistantReturnStore.getState().target).not.toBeNull()
  })

  it('an open that stays on the same page starts no return, and a later page never shows the bar', async () => {
    useAssistantReturnStore.getState().begin({ path: '/learn', fromKey: 'default', label: 'Learn' })
    mount()
    // The row's link was to the page the learner is already on (here with a hash).
    act(() => go('/learn#section'))
    await waitFor(() => expect(useAssistantReturnStore.getState().target).toBeNull())
    act(() => go('/playground'))
    expect(screen.queryByRole('navigation', { name: 'Return' })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Back to / })).toBeNull()
  })

  it('a short address that resolves to the current page starts no return either', async () => {
    useAssistantReturnStore.getState().begin({ path: '/learn', fromKey: 'default', label: 'Learn' })
    mount()
    act(() => go('/go/PAGE:learn'))
    act(() => go('/learn'))
    await waitFor(() => expect(useAssistantReturnStore.getState().target).toBeNull())
    act(() => go('/playground'))
    expect(screen.queryByRole('navigation', { name: 'Return' })).toBeNull()
  })
})
