// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { FIRMWARE_SIGNING_ALGORITHMS, SIGSTORE_STEPS } from './constants'

describe('Sigstore flow and signing-state wording', () => {
  it('says the ephemeral key is created in memory, without a key lifetime', () => {
    const step = SIGSTORE_STEPS.find((s) => s.step === 2)!
    expect(step.description).toContain('keypair created in memory')
    expect(step.description).not.toMatch(/valid ~?\d+ minutes/)
  })

  it('lists what verification actually checks instead of saying no keys are needed', () => {
    const step = SIGSTORE_STEPS.find((s) => s.step === 7)!
    expect(step.description).toBe(
      'Verifier checks the signature, the expected identity and issuer, the certificate chain to the Sigstore trust root, and the Rekor inclusion proof'
    )
    expect(step.description).not.toContain('no keys to distribute')
  })

  it('separates signing state from verification state for the stateless algorithm', () => {
    const mlDsa = FIRMWARE_SIGNING_ALGORITHMS.find((a) => a.id === 'ml-dsa')!
    expect(mlDsa.stateRequirement).toBe(
      'No signing state: the signer needs no counter. Verification keeps no state for any of these algorithms.'
    )
    expect(mlDsa.stateRequirement).not.toContain('fully stateless')
  })
})
