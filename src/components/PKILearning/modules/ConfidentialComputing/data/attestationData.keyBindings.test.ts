// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The attestation flows and the memory-protection table have to keep apart things that sound alike:
 * the key that signs a quote versus the key that certifies it, the platform root of trust versus the
 * monitor that relays evidence, and an access-control check versus a cryptographic integrity check.
 */
import { describe, it, expect } from 'vitest'
import {
  ATTESTATION_FLOWS,
  MEMORY_ENCRYPTION_ENGINES,
  QUANTUM_THREAT_VECTORS,
} from './attestationData'

const flow = (id: string) => {
  const f = ATTESTATION_FLOWS.find((x) => x.id === id)
  if (!f) throw new Error(`missing flow ${id}`)
  return f
}
const engine = (id: string) => {
  const e = MEMORY_ENCRYPTION_ENGINES.find((x) => x.id === id)
  if (!e) throw new Error(`missing engine ${id}`)
  return e
}

describe('Intel DCAP flow: quote signature and attestation-key certification are separate', () => {
  const steps = flow('intel-dcap').steps
  const signSteps = steps.filter((s) => s.type === 'sign')

  it('has two separate signing steps', () => {
    expect(signSteps.length).toBeGreaterThanOrEqual(2)
  })

  it('shows the PCK signing the QE REPORT that carries the hash of the attestation key', () => {
    const pckStep = signSteps.find(
      (s) => /PCK/.test(s.description) && /QE REPORT/.test(s.description)
    )
    expect(pckStep).toBeDefined()
    expect(pckStep?.description).toMatch(/hash of the AK public key/i)
  })

  it('shows the attestation key, not the PCK, signing the quote', () => {
    const quoteStep = signSteps.find((s) => /quote signature is the AK/i.test(s.description))
    expect(quoteStep).toBeDefined()
    expect(quoteStep?.description).toMatch(/The PCK does not sign the quote/)
  })

  it('never has the verifier check the quote signature with the PCK certificate', () => {
    const text = steps.map((s) => s.description).join(' ')
    expect(text).not.toMatch(/signature on the Quote using the PCK/i)
  })

  it('lists the three verifier checks and then appraisal as separate work', () => {
    const verify = steps.find((s) => s.type === 'verify' && /three bindings/i.test(s.description))
    expect(verify?.description).toMatch(/PCK certificate chain/)
    expect(verify?.description).toMatch(/PCK signature over the QE REPORT/)
    expect(verify?.description).toMatch(/AK signature over the quote/)
    const appraise = steps.find((s) => /appraisal policy/i.test(s.description))
    expect(appraise?.description).toMatch(/TCB Info and QE Identity/)
  })
})

describe('Arm CCA flow: platform evidence comes from the platform root of trust', () => {
  const steps = flow('arm-cca-attestation').steps
  const text = steps.map((s) => s.description).join(' ')

  it('does not say the Realm Management Monitor generates the platform token', () => {
    expect(text).not.toMatch(/Monitor \(RMM\) generates a Platform Token/i)
    expect(text).not.toMatch(/RMM generates the platform token/i)
  })

  it('places platform evidence in the root of trust below the monitor, signed with the CPAK', () => {
    const platform = steps.find((s) => /CPAK/.test(s.description) && s.actor === 'platform')
    expect(platform?.description).toMatch(/root of trust/i)
    expect(platform?.description).toMatch(/not from the RMM/)
  })

  it('keeps the Realm key (RAK) separate from the platform key (CPAK)', () => {
    const realm = steps.find(
      (s) => /Realm Attestation Key/.test(s.description) && /RMM/.test(s.label)
    )
    expect(realm?.description).toMatch(/different key from the CPAK/)
  })

  it('does not present a fixed signing algorithm the token profile does not mandate', () => {
    expect(flow('arm-cca-attestation').signingAlgorithm).toMatch(/Not mandated/)
  })
})

describe('memory protection table: access control is not cryptographic integrity', () => {
  it('every engine says what kind of integrity or ownership check it has', () => {
    for (const e of MEMORY_ENCRYPTION_ENGINES) {
      expect(typeof e.integrityKind).toBe('string')
      expect(e.integrityKind.length).toBeGreaterThan(0)
    }
  })

  it('never marks an ownership check or hypervisor isolation as cryptographic integrity', () => {
    for (const e of MEMORY_ENCRYPTION_ENGINES) {
      if (/ownership|isolation|access control/i.test(e.integrityKind ?? '')) {
        expect(e.integrityProtection).toBe(false)
      }
    }
  })

  it('separates SEV and SEV-ES from SEV-SNP and calls the ownership table access control', () => {
    const amd = engine('amd-sme-sev')
    expect(amd.integrityProtection).toBe(false)
    expect(amd.integrityKind).toMatch(/SEV-SNP only/)
    expect(amd.integrityMechanism).toMatch(/SEV and SEV-ES: no ownership or integrity check/)
    expect(amd.integrityMechanism).toMatch(/not a cryptographic MAC/)
  })

  it('does not describe an Intel integrity tree it has no source for', () => {
    expect(engine('intel-tme-mk').integrityMechanism).not.toMatch(/integrity tree/i)
    expect(engine('intel-tme-mk').integrityMechanism).toMatch(/SHA-3 based integrity/)
  })

  it('does not infer an AES key size or a quantum verdict from platform isolation', () => {
    const arm = engine('arm-tz-crypto')
    expect(arm.algorithm).not.toMatch(/typically AES-256/i)
    expect(arm.quantumNotes).not.toMatch(/provides 128-bit effective post-quantum security/i)
    expect(arm.quantumNotes).toMatch(/no memory encryption|describes no memory encryption/i)
    expect(engine('aws-nitro-kms').integrityKind).toMatch(/not cryptographic/)
  })
})

describe('memory-encryption upgrade advice', () => {
  const vector = QUANTUM_THREAT_VECTORS.find((v) => v.id === 'memory-encryption-grover')

  it('does not offer in-enclave software encryption as the alternative to the engine upgrade', () => {
    expect(vector?.pqcSolution).not.toMatch(/Alternatively, software-layer encryption/i)
  })

  it('says application-layer encryption protects data only while it stays encrypted', () => {
    expect(vector?.pqcSolution).toMatch(/not a replacement/i)
    expect(vector?.pqcSolution).toMatch(/only while the value stays encrypted/i)
    expect(vector?.pqcSolution).toMatch(/threat model and version limits still apply/i)
  })
})
