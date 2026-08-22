// SPDX-License-Identifier: GPL-3.0-only
/**
 * The exercises' stated answers must agree with the data the workshop renders.
 *
 * THE FAILURE THIS EXISTS FOR, found by hand on 2026-07-31 (three separate
 * instances in one module, none of which any automated check could see):
 *
 *  - Exercise 2 said the online flow's two quantum-vulnerable steps were "TLS
 *    key exchange, HSM key wrapping". The data flags ICC certificate-chain
 *    verification and TLS. The count matched by coincidence; the substance did
 *    not.
 *  - Exercise 4 instructed the learner to select Visa VTS, then gave the answer
 *    for MDES/Amex EST (4 of 6). VTS is 5 of 6.
 *  - Exercise 5 said the key-injection vulnerability was "specifically at Step
 *    2" and that steps 1 and 4 need no change — silently accounting for three of
 *    four steps and dropping step 3, which is also flagged vulnerable.
 *
 * These are agreement failures, not reference failures: every id resolved, every
 * link worked, every type checked. The maintenance flow validates that
 * references RESOLVE; nothing validated that prose and data AGREE.
 *
 * This is the module-local proof case for the general check (flow finding F3).
 * Keep the assertions derived from the data, never hardcoded — a test that
 * restates the numbers is a second copy that drifts in its own right.
 */
import { describe, it, expect } from 'vitest'
import { TRANSACTION_FLOWS } from './data/transactionFlowData'
import { TOKENIZATION_FLOWS } from './data/tokenizationData'
import { KEY_INJECTION_CEREMONY } from './data/posCryptoData'
import { EMV_KAT_SPECS } from './workshop/TransactionSimulator'

/** Primitives Shor breaks. A step naming one of these cannot be quantum-safe. */
const QUANTUM_BREAKABLE = /RSA|ECDSA|ECDH|ECC|X25519|Ed25519/

describe('exercise answers agree with the workshop data', () => {
  it('no step claims quantum safety while naming an asymmetric primitive', () => {
    const offenders = TRANSACTION_FLOWS.flatMap((f) =>
      f.steps
        .filter((s) => !s.quantumVulnerable && s.cryptoUsed.some((c) => QUANTUM_BREAKABLE.test(c)))
        .map((s) => `${f.id}/${s.id}: ${s.cryptoUsed.join(', ')}`)
    )
    expect(
      offenders,
      'A step listing RSA/ECDSA/ECDH cannot be quantum-safe. Either the flag is wrong or the ' +
        'cryptoUsed entry is. (2026-07-31: online-6 listed "HSM key wrapping (RSA-2048)" on a ' +
        'safe step; the entry was the error — per-transaction ARQC verification is symmetric.)'
    ).toEqual([])
  })

  it('online flow has exactly the two vulnerable steps exercise 2 names', () => {
    const online = TRANSACTION_FLOWS.find((f) => f.id === 'online')!
    const vulnerable = online.steps.filter((s) => s.quantumVulnerable)
    expect(vulnerable).toHaveLength(2)
    // Exercise 2 names card authentication and the terminal->acquirer TLS hop.
    expect(vulnerable.map((s) => s.id)).toEqual(['online-2', 'online-4'])
    expect(vulnerable[0].label).toMatch(/Card Authentication/i)
    expect(vulnerable[1].label).toMatch(/Acquirer/i)
  })

  it('offline CDA has the three vulnerable steps exercise 2 names', () => {
    const cda = TRANSACTION_FLOWS.find((f) => f.id === 'offline-cda')!
    expect(cda.steps.filter((s) => s.quantumVulnerable)).toHaveLength(3)
  })

  it('Visa VTS has the 5-of-6 split exercise 4 states, and differs from MDES/EST', () => {
    const counts = Object.fromEntries(
      TOKENIZATION_FLOWS.map((f) => [f.id, f.steps.filter((s) => s.quantumVulnerable).length])
    )
    // Exercise 4 sends the learner to VTS specifically, so its number is the
    // one that must match — this is exactly what was wrong before.
    expect(counts['visa-vts'], 'exercise 4 instructs "select Visa VTS"').toBe(5)
    expect(counts['mc-mdes']).toBe(4)
    expect(counts['amex-est']).toBe(4)
    TOKENIZATION_FLOWS.forEach((f) => expect(f.steps).toHaveLength(6))
  })

  it('key injection has two vulnerable steps, not one, as exercise 5 states', () => {
    const vulnerable = KEY_INJECTION_CEREMONY.steps.filter((s) => s.quantumVulnerable)
    expect(vulnerable.map((s) => s.order)).toEqual([2, 3])
    const safe = KEY_INJECTION_CEREMONY.steps.filter((s) => !s.quantumVulnerable)
    expect(safe.map((s) => s.order)).toEqual([1, 4])
  })

  it('declared per-flow aggregates match the steps they summarise', () => {
    TRANSACTION_FLOWS.forEach((f) => {
      expect(
        f.quantumVulnerableSteps,
        `${f.id}: declared quantumVulnerableSteps disagrees with the steps`
      ).toBe(f.steps.filter((s) => s.quantumVulnerable).length)
      expect(f.totalLatencyMs, `${f.id}: declared totalLatencyMs disagrees with the steps`).toBe(
        f.steps.reduce((sum, s) => sum + s.latencyMs, 0)
      )
    })
  })
})

/**
 * The KAT specs must agree with the module's own model of what EMV is.
 *
 * Added 2026-08-22 after the maintainer caught `emv-txn-sign`: it ran an ML-DSA-44
 * signature over a message labelled "EMV ARQC" and called it "EMV transaction
 * authorization". Everything else in this module already had it right — the
 * transaction-flow data marks ARQC steps quantum-safe, rag-summary.md calls
 * ARQC/ARPC "symmetric MACs — quantum-safe", the introduction says "3DES/AES ARQC
 * generation", and the test above cites the same fact from 2026-07-31. Only the
 * demo disagreed, and no guard covered the KAT specs, so it stood.
 *
 * An ARQC is a MAC. Bettale/De Oliveira/Dottax (IDEMIA), "Post-Quantum Protocols
 * for Banking Applications" (NIST 4th PQC Standardization Conference, 2022): EMV
 * uses "asymmetric cryptography (RSA) for card authentication by the terminal, and
 * symmetric cryptography (usually TDES) for transaction certificates intended for
 * the issuer". EMVCo's Quantum Position Statement adds that Grover is "completely
 * impractical and therefore is not a concern for EMV".
 */
describe('KAT specs agree with the module’s model of EMV', () => {
  const SYMMETRIC_MECHANISMS = /\bARQC\b|\bARPC\b|\bTC\b|application cryptogram/i
  const PQC_SIGNATURE = /mldsa|slhdsa|fndsa/i

  it('no post-quantum SIGNATURE demo targets a symmetric cryptogram', () => {
    const offenders = EMV_KAT_SPECS.filter(
      (spec) =>
        PQC_SIGNATURE.test(spec.kind.type) &&
        (SYMMETRIC_MECHANISMS.test(spec.useCase) || SYMMETRIC_MECHANISMS.test(spec.message ?? ''))
    ).map((s) => `${s.id}: ${s.useCase}`)

    expect(
      offenders,
      'A PQC signature cannot authenticate an ARQC/ARPC/TC — those are symmetric MACs, and ' +
        'EMVCo states the symmetric side is not a quantum concern. Point the demo at CDA / ' +
        'offline data authentication, which is the RSA-based step that must migrate.'
    ).toEqual([])
  })

  it('the ML-DSA demo names the asymmetric mechanism it actually models', () => {
    const mldsa = EMV_KAT_SPECS.filter((s) => PQC_SIGNATURE.test(s.kind.type))
    expect(mldsa.length).toBeGreaterThan(0)
    for (const spec of mldsa) {
      expect(
        `${spec.useCase} ${spec.standard}`,
        `${spec.id} should name CDA / data authentication, the RSA-based step PQC replaces`
      ).toMatch(/CDA|data authentication|card authentication/i)
    }
  })
})
