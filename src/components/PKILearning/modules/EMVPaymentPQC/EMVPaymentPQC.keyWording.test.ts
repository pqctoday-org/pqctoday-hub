// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { CARD_AUTH_SPECS, PROVISIONING_STEPS } from './data/cardCryptoData'
import ragSummary from './rag-summary.md?raw'
import curiousSummary from './curious-summary.md?raw'

describe('EMV card authentication data: no unsourced recommendation, conceptual PQC key establishment', () => {
  const all = JSON.stringify([CARD_AUTH_SPECS, PROVISIONING_STEPS])

  it('does not claim EMVCo recommends a method for all new card deployments', () => {
    expect(all).not.toContain('Recommended by EMVCo for all new card deployments')
  })

  it('labels the ML-KEM-768 replacement as conceptual key establishment', () => {
    expect(all).toContain('ML-KEM-768 key establishment (conceptual)')
    expect(all).not.toContain('ML-KEM-768 key transport')
  })
})

describe('EMV summaries: the terminal key is wrapped, the Base Derivation Key stays in the HSM', () => {
  it('names the derived initial key as the RSA-transported item', () => {
    expect(ragSummary).toContain(
      "RSA-2048 transport of the terminal's derived initial key (the BDK stays inside the HSM)"
    )
    expect(ragSummary).not.toContain('RSA-2048 transport of the BDK')
  })

  it('scopes the compromise to that terminal in the plain-language summary', () => {
    expect(curiousSummary).toContain(
      "where an RSA-wrapped initial terminal key, derived inside the HSM from the Base Derivation Key, protects that terminal's transactions — compromise the wrap and that terminal's initial key and the keys derived from it are exposed, while the Base Derivation Key itself stays inside the HSM"
    )
    expect(curiousSummary).not.toContain('protects millions of transactions')
  })

  it('does not attribute a signing algorithm to 3-D Secure 2.x in the e-commerce summary', () => {
    expect(ragSummary).toContain('3-D Secure 2.x (signing details unverified)')
    expect(ragSummary).not.toContain('3-D Secure 2.x ECDSA challenge signing')
  })
})
