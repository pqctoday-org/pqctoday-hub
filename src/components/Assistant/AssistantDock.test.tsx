// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import '@testing-library/jest-dom'
import { AssistantDock } from './AssistantDock'
import { useAssistantSessionStore } from '@/store/useAssistantSessionStore'
import { useRightPanelStore } from '@/store/useRightPanelStore'

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
  it('is one button, with no text box and no suggested question', () => {
    mount()
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(
      screen.getByRole('button', { name: 'Ask the Assistant about this page' })
    ).toHaveTextContent('Ask about this page')
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByText('Suggested')).toBeNull()
  })

  it('opens the Assistant sheet and asks nothing', async () => {
    mount()
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Ask the Assistant about this page' }))
    expect(useRightPanelStore.getState()).toMatchObject({ isOpen: true, activeTab: 'chat' })
    expect(useAssistantSessionStore.getState().turns).toHaveLength(0)
  })
})
