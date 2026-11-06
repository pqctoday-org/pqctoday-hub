// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { TLSHandshakeDiagram } from './TLSHandshakeDiagram'
import { useTLSStore } from '@/store/tls-learning.store'

vi.mock('@/store/useHistoryStore', () => ({
  useHistoryStore: {
    getState: () => ({ addEvent: () => {} }),
  },
}))

// One entry per handshake message, in diagram order: its label and whether it carries the
// "(mTLS)" badge (rendered right after the label).
function messages(container: HTMLElement): Array<{ label: string; badged: boolean }> {
  return Array.from(container.querySelectorAll('span.font-mono.font-bold')).map((el) => ({
    label: el.textContent ?? '',
    badged: el.nextElementSibling?.textContent === '(mTLS)',
  }))
}

const badgedLabels = (container: HTMLElement) =>
  messages(container)
    .filter((m) => m.badged)
    .map((m) => m.label)

describe('TLSHandshakeDiagram mTLS badges', () => {
  beforeEach(() => {
    localStorage.clear()
    useTLSStore.getState().reset()
  })

  // RFC 9846 Section 4.4.2 (CertificateRequest is optional), Section 4.5.1 (the client sends
  // Certificate if and only if requested) and Section 4.5.2 (client CertificateVerify when the
  // Certificate is non-empty): only these three messages exist because of client authentication.
  const EXPECTED = ['{CertificateRequest}', '{Certificate}', '{CertificateVerify}']

  it.each([
    ['educational mode (no mode chosen)', undefined],
    ['server-only TLS', false],
    ['mutual TLS', true],
  ])('marks only the optional client-authentication messages in %s', (_name, mode) => {
    const { container } = render(<TLSHandshakeDiagram mTLSEnabled={mode} />)
    expect(badgedLabels(container)).toEqual(EXPECTED)
    // The diagram still shows all eleven messages, so most of them carry no badge.
    expect(messages(container)).toHaveLength(11)
  })

  it('does not badge the messages every TLS 1.3 handshake contains', () => {
    const { container } = render(<TLSHandshakeDiagram mTLSEnabled={false} />)
    const all = messages(container)
    for (const always of ['ClientHello', 'ServerHello', '{EncryptedExtensions}', '{Finished}']) {
      all.filter((m) => m.label === always).forEach((m) => expect(m.badged).toBe(false))
    }
    // The server's Certificate and CertificateVerify (positions 5 and 6) are not mTLS-only either,
    // while the client's Certificate and CertificateVerify (positions 8 and 9) are.
    expect(all.map((m) => m.badged)).toEqual([
      false, // ClientHello
      false, // ServerHello
      false, // {EncryptedExtensions}
      true, // {CertificateRequest}
      false, // {Certificate} (server)
      false, // {CertificateVerify} (server)
      false, // {Finished} (server)
      true, // {Certificate} (client)
      true, // {CertificateVerify} (client)
      false, // {Finished} (client)
      false, // Application Data
    ])
  })
})
