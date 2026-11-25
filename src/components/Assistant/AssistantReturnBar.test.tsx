// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect } from 'react'
import { act, render, screen } from '@testing-library/react'
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
    useAssistantReturnStore.getState().begin({ path: '/learn', label: 'Learn' })
    mount()
    expect(screen.queryByRole('navigation', { name: 'Return' })).toBeNull()
    act(() => go('/go/CMP:CNSA-2'))
    expect(screen.queryByRole('navigation', { name: 'Return' })).toBeNull()
  })

  it('desktop: "Back to your answer" returns to the page and reopens the drawer', async () => {
    useAssistantReturnStore.getState().begin({ path: '/learn', label: 'Learn' })
    mount()
    act(() => go('/compliance'))
    const back = await screen.findByRole('button', { name: 'Back to your answer' })
    await userEvent.setup().click(back)
    expect(screen.getByTestId('where')).toHaveTextContent('/learn')
    expect(useRightPanelStore.getState()).toMatchObject({ isOpen: true, activeTab: 'chat' })
    expect(useAssistantReturnStore.getState().target).toBeNull()
  })

  it('phone: names where it goes, and does not reopen the sheet', async () => {
    layout.value = 'sheet'
    useAssistantReturnStore.getState().begin({ path: '/learn', label: 'TLS Basics' })
    mount()
    act(() => go('/compliance'))
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Back to TLS Basics' }))
    expect(screen.getByTestId('where')).toHaveTextContent('/learn')
    expect(useRightPanelStore.getState().isOpen).toBe(false)
  })

  it('ends when the learner moves on from the opened page', async () => {
    useAssistantReturnStore.getState().begin({ path: '/learn', label: 'Learn' })
    mount()
    act(() => go('/compliance'))
    await screen.findByRole('button', { name: 'Back to your answer' })
    act(() => go('/library'))
    expect(screen.queryByRole('button', { name: 'Back to your answer' })).toBeNull()
    expect(useAssistantReturnStore.getState().target).toBeNull()
  })
})
