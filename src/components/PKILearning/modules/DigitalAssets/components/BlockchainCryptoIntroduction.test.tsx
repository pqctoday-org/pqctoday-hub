// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { BlockchainCryptoIntroduction } from './BlockchainCryptoIntroduction'

function introText(): string {
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={['/learn/digital-assets']}>
        <BlockchainCryptoIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  return document.body.textContent ?? ''
}

describe('BlockchainCryptoIntroduction signature nonces', () => {
  it('does not call EdDSA immune to nonce problems or say the problem is eliminated entirely', () => {
    const text = introText()
    expect(text).not.toMatch(/immune to nonce/i)
    expect(text).not.toMatch(/eliminating this class of vulnerability entirely/i)
  })

  it('teaches that ECDSA needs a unique, unpredictable nonce that may be random or deterministic', () => {
    const text = introText()
    expect(text).not.toMatch(/ECDSA uses a random nonce per signature/i)
    expect(text).toMatch(/unique and unpredictable/i)
    expect(text).toMatch(/RFC 6979/)
  })

  it('states the EdDSA construction and that determinism does not remove side-channel risk', () => {
    const text = introText()
    expect(text).toMatch(/RFC 8032/)
    expect(text).toMatch(/hashing a secret part of the key together with the message/i)
    expect(text).toMatch(/side-channel/i)
  })
})
