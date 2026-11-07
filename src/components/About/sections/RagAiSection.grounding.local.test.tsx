// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { finalizeGroundedResponse } from '@/services/chat/responseFinalization'
import { RagAiSection } from './RagAiSection'

afterEach(() => vi.unstubAllGlobals())

describe('Assistant grounding disclosure', () => {
  it('acknowledges the retained uncited-answer case instead of promising universal rejection', () => {
    const draft = 'PQC 101 introduces post-quantum cryptography fundamentals.'
    const result = finalizeGroundedResponse(
      draft,
      [],
      [
        {
          id: 'sample-pqc-101',
          title: 'PQC 101',
          source: 'modules',
          content: draft,
          category: 'learning',
          metadata: {},
        },
      ]
    )
    expect(result.mode).toBe('format-tolerant')
    expect(result.decision.approved).toBe(false)
    expect(result.content).toContain(draft)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    render(<RagAiSection />)
    fireEvent.click(screen.getByRole('button', { name: /PQC Assistant/ }))
    expect(screen.getByText(/These checks reduce risk/).textContent).toMatch(
      /do not guarantee that every statement is supported or semantically correct/
    )
    expect(screen.getByText(/These checks reduce risk/).textContent).toMatch(
      /a model can still draw on its training knowledge/
    )
    expect(screen.getByText(/These checks reduce risk/).textContent).toMatch(
      /Check the cited passages before relying on an answer for a decision/
    )
    expect(screen.queryByText(/Unsupported drafts are retried once/)).toBeNull()
  })
})
