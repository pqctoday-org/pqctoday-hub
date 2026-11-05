// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ConversationMenu } from './ConversationMenu'

const { state, download } = vi.hoisted(() => ({
  state: {
    conversations: [
      {
        id: 'sample',
        title: 'Sample conversation',
        messages: [{ content: 'Sample answer' }],
        updatedAt: 1,
      },
    ],
    activeConversationId: 'sample',
    isLoading: false,
    isStreaming: false,
    createConversation: vi.fn(),
    switchConversation: vi.fn(),
    deleteConversation: vi.fn(),
  },
  download: vi.fn(),
}))
vi.mock('@/store/useChatStore', () => ({
  useChatStore: (select: (s: typeof state) => unknown) => select(state),
}))
vi.mock('@/services/chat/exportConversation', () => ({
  conversationToMarkdown: () => 'Sample exported answer',
  downloadMarkdown: download,
}))
beforeEach(() => vi.clearAllMocks())

describe('Conversation export keyboard activation', () => {
  it.each(['{Enter}', ' '])(
    'downloads with %s without activating the containing option',
    async (key) => {
      const user = userEvent.setup()
      render(<ConversationMenu />)
      await user.click(screen.getByRole('button', { name: 'Switch conversation' }))
      const button = screen.getByRole('button', {
        name: 'Export conversation: Sample conversation',
      })
      button.focus()
      await user.keyboard(key)
      expect(download).toHaveBeenCalledOnce()
      expect(download).toHaveBeenCalledWith('Sample exported answer', 'Sample-conversation.md')
      expect(state.switchConversation).not.toHaveBeenCalled()
      expect(screen.getByRole('option')).toBeVisible()
    }
  )
  it('preserves Enter selection and Escape dismissal on the containing conversation option', async () => {
    const user = userEvent.setup()
    render(<ConversationMenu />)
    const trigger = screen.getByRole('button', { name: 'Switch conversation' })
    await user.click(trigger)
    screen.getByRole('option').focus()
    await user.keyboard('{Enter}')
    expect(state.switchConversation).toHaveBeenCalledWith('sample')
    expect(download).not.toHaveBeenCalled()
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
    await user.click(trigger)
    screen.getByRole('option').focus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })
})
