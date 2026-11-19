// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { CryptoAgilityIntroduction } from './components/CryptoAgilityIntroduction'

describe('Crypto Agility current source wording', () => {
  it('names the current NIST paper and attributes the performance figure to Chrome', () => {
    render(
      <MemoryRouter>
        <CryptoAgilityIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    )
    const text = (document.body.textContent ?? '').replace(/\s+/g, ' ')
    expect(text).toMatch(/NIST's current crypto-agility white paper is CSWP 39-upd1/)
    expect(text).toMatch(/Chrome reported about a 4% TLS handshake slowdown/)
    expect(text).toMatch(/seven-phase migration framework is informed by/)
    expect(text).toMatch(/teaching model, not a seven-step sequence prescribed by those sources/)
  })
})
