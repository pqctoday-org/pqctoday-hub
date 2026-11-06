// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

vi.mock('./MLSCryptoOperations', () => ({ MLSCryptoOperations: () => null }))
vi.mock('./TreeKEMVisualizer', () => ({ TreeKEMVisualizer: () => null }))
vi.mock('./ProviderArchitecture', () => ({ ProviderArchitecture: () => null }))

import { MLSGroupMessagingPlayground } from './MLSGroupMessagingPlayground'

function playgroundText(): string {
  render(<MLSGroupMessagingPlayground />)
  // the explanation is collapsed until the learner opens it
  fireEvent.click(screen.getByRole('button', { name: /TreeKEM: From Double-Ratchet/ }))
  return document.body.textContent ?? ''
}

describe('MLSGroupMessagingPlayground explanation', () => {
  it('does not say members compromised before a Commit lose access to all future epochs', () => {
    const text = playgroundText()
    expect(text).toMatch(/Recovery from a compromised member/i)
    expect(text).not.toMatch(/lose access to all\s+future epochs/i)
    expect(text).not.toMatch(/this is group PCS/i)
  })

  it('compares ordinary sends, another member Commit and a committed fresh leaf key', () => {
    const text = playgroundText()
    expect(text).toMatch(/Ordinary sends/)
    expect(text).toMatch(/only steps a one-way hash ratchet/i)
    expect(text).toMatch(/adds no fresh randomness/i)
    expect(text).toMatch(/Another member.s Commit/)
    expect(text).toMatch(/still holds/i)
    expect(text).toMatch(/Bob.s fresh leaf key, committed/)
    expect(text).toMatch(/Update proposal alone has no effect until it is committed/i)
  })

  it('states the snapshot assumption and the signature-key limit', () => {
    const text = playgroundText()
    expect(text).toMatch(/one-time snapshot, not persistent control/i)
    expect(text).toMatch(/signature key/i)
    expect(text).toMatch(/external Commits/i)
  })

  it('ties the post-quantum pairing to a suite the draft registers', () => {
    const text = playgroundText()
    expect(text).toMatch(/MLS_192_MLKEM768_AES256GCM_SHA384_MLDSA65/)
    expect(text).toMatch(/post-quantum confidentiality only/i)
  })
})
