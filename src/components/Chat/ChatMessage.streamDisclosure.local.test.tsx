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

describe('visible provisional assistant text', () => {
  it('shows a visible provisional status beside actual streamed Markdown and removes it for the final response', () => {
    const view = render(message('**Controlled unsupported draft**', true))
    const status = screen.getByRole('status')
    expect(status).toBeVisible()
    expect(status).not.toHaveClass('sr-only')
    expect(status).toHaveTextContent(
      'Unverified draft. Automated source checks run after generation.'
    )
    expect(screen.getByText('Controlled unsupported draft', { selector: 'strong' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'Copy response' })).not.toBeInTheDocument()
    view.rerender(message('Changed draft text', true))
    expect(screen.getByRole('status')).toHaveTextContent('Unverified draft')
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
