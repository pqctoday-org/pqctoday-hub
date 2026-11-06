// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { TLSIntroduction } from './TLSIntroduction'

function echSectionText(): string {
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={['/learn/tls-basics']}>
        <TLSIntroduction onNavigateToSimulate={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  const heading = Array.from(document.querySelectorAll('h2')).find((h) =>
    /Encrypted Client Hello/.test(h.textContent ?? '')
  )
  return heading?.parentElement?.textContent ?? ''
}

describe('TLSIntroduction Encrypted Client Hello section', () => {
  it('keeps the ECH encryption and the TLS session key exchange as separate mechanisms', () => {
    const text = echSectionText()
    expect(text).toMatch(/HPKE/)
    expect(text).toMatch(/KEM named in the ECH configuration/)
    expect(text).toMatch(/hybrid group protects the key exchange of the TLS session/)
  })

  it('does not promise that hybrid TLS key exchange hides metadata from future adversaries', () => {
    const text = echSectionText()
    expect(text).not.toMatch(/protect both the metadata/i)
    expect(text).not.toMatch(/against current and future adversaries/i)
    expect(text).toMatch(/does not by itself keep ECH-protected metadata private/)
    expect(text).toMatch(/no forward secrecy for the inner ClientHello/)
  })

  it('limits what ECH hides to the ClientHello and says the server can still be visible', () => {
    const text = echSectionText()
    expect(text).not.toMatch(/ECH\) solves this/)
    expect(text).toMatch(/not in itself sufficient to protect the identity of the server/)
    expect(text).toMatch(/plaintext DNS queries or the server's IP address/)
  })
})
