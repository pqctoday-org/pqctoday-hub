// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom'
import { AssistantDock } from './AssistantDock'
import { useAssistantSessionStore } from '@/store/useAssistantSessionStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'

vi.mock('./assistantClient', async () => {
  const engine = await import('@/test/fixtures/assistantFixtureEngine')
  return { askAssistant: engine.answer }
})

beforeEach(() => {
  useAssistantSessionStore.getState().reset()
  useRightPanelStore.setState({ isOpen: false, activeTab: 'chat' })
})

const mount = () =>
  render(
    <MemoryRouter initialEntries={['/learn']}>
      <AssistantDock />
    </MemoryRouter>
  )

describe('phone dock on Learn screens', () => {
  it('offers one suggested question, a box for your own question about this page, and Ask', () => {
    mount()
    expect(screen.getByText('Suggested')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'What is post-quantum cryptography, in two minutes?' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'Ask your own question about this page' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ask' })).toBeInTheDocument()
  })

  it('Return adds a new line; only Ask sends, and it opens the sheet with the question asked', async () => {
    const user = userEvent.setup()
    mount()
    const box = screen.getByRole('textbox', { name: 'Ask your own question about this page' })
    await user.type(box, 'ML-KEM{Enter}')
    expect(box).toHaveValue('ML-KEM\n')
    expect(useRightPanelStore.getState().isOpen).toBe(false)
    await user.click(screen.getByRole('button', { name: 'Ask' }))
    expect(useRightPanelStore.getState()).toMatchObject({ isOpen: true, activeTab: 'chat' })
    expect(useAssistantSessionStore.getState().turns.map((t) => t.question)).toEqual(['ML-KEM'])
    expect(box).toHaveValue('')
  })

  it('an empty Ask shows a message and sends nothing', async () => {
    mount()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Ask' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Type a question first.')
    expect(useRightPanelStore.getState().isOpen).toBe(false)
    expect(useAssistantSessionStore.getState().turns).toHaveLength(0)
  })

  it('the suggested question opens the sheet and asks it at once', async () => {
    await userEvent
      .setup()
      .click(
        (mount(),
        screen.getByRole('button', { name: 'What is post-quantum cryptography, in two minutes?' }))
      )
    expect(useRightPanelStore.getState().isOpen).toBe(true)
    expect(useAssistantSessionStore.getState().turns).toHaveLength(1)
  })
})
