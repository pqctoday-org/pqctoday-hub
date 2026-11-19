// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ChatMessage } from './ChatMessage'

function message(
  content: string,
  isStreaming: boolean,
  sender: 'user' | 'assistant' = 'assistant'
) {
  return (
    <MemoryRouter>
      <ChatMessage sender={sender} content={content} isStreaming={isStreaming} />
    </MemoryRouter>
  )
}

describe('assistant verification progress', () => {
  it('shows a progress status and displays content after verification', () => {
    const view = render(message('**Controlled unsupported draft**', true))
    const status = screen.getByRole('status')
    expect(status).toBeVisible()
    expect(status).not.toHaveClass('sr-only')
    expect(status).toHaveTextContent('Checking sources before showing the answer')
    expect(screen.queryByText('Controlled unsupported draft')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Copy response' })).not.toBeInTheDocument()
    view.rerender(message('Changed draft text', true))
    expect(screen.getByRole('status')).toHaveTextContent('Checking sources')
    expect(screen.queryByText('Changed draft text')).toBeNull()
    view.rerender(message('Final source-linked text', false))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('Final source-linked text')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Copy response' })).toBeVisible()
    expect(screen.queryByText(/factually verified/i)).not.toBeInTheDocument()
  })

  it('does not present a learner message as an assistant draft', () => {
    render(message('Sample learner question', true, 'user'))
    expect(screen.getByText('Sample learner question')).toBeVisible()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
