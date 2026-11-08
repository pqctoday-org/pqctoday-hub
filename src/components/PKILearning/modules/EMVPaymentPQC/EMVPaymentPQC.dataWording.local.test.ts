// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { CARD_AUTH_SPECS } from './data/cardCryptoData'
import { PAYMENT_NETWORKS } from './data/paymentNetworkData'

describe('EMV sample data states what it knows', () => {
  it('marks every card authentication prevalence figure as illustrative', () => {
    expect(CARD_AUTH_SPECS.length).toBeGreaterThan(0)
    for (const spec of CARD_AUTH_SPECS) {
      expect(spec.prevalence, spec.id).toMatch(/^Illustrative: /)
    }
  })

  it('names the TLS key exchange and certificate signatures separately for e-commerce', () => {
    const tlsEntries = PAYMENT_NETWORKS.flatMap((n) => n.currentCrypto.ecommerce).filter((e) =>
      e.startsWith('TLS 1.2/1.3')
    )
    expect(tlsEntries.length).toBeGreaterThan(0)
    // The one network whose TLS profile differs (SM2) is outside this wording.
    expect(tlsEntries).toContain(
      'TLS 1.2/1.3 ((EC)DHE key exchange, RSA/ECDSA certificate signatures)'
    )
    expect(tlsEntries).not.toContain('TLS 1.2/1.3 RSA/ECDSA')
  })

  it('does not attribute a signing algorithm to 3-D Secure 2.x', () => {
    const entries = PAYMENT_NETWORKS.flatMap((n) => n.currentCrypto.ecommerce)
    expect(entries).toContain('3-D Secure 2.x (signing details unverified)')
    expect(entries).not.toContain('3-D Secure 2.x ECDSA')
  })
})
