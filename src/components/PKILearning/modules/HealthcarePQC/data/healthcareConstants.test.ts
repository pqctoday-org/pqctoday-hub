// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  BIOMETRIC_PROFILES,
  MEDICAL_DEVICE_CATALOG,
  REVOCABILITY_MATRIX,
} from './healthcareConstants'

const PUBLIC_KEY_PRIMITIVE = /RSA|ECDH|ECDSA|ECC|X25519|P-256|Diffie-Hellman|certificate/i
const SYMMETRIC_PRIMITIVE = /AES/i

describe('device attack scenarios', () => {
  const scenarios = MEDICAL_DEVICE_CATALOG.flatMap((device) =>
    device.attackScenarios.map((scenario) => ({ device, scenario }))
  )

  it('lists scenarios for every device', () => {
    for (const device of MEDICAL_DEVICE_CATALOG) {
      expect(device.attackScenarios.length).toBeGreaterThan(0)
    }
  })

  it('never blames a quantum algorithm for replay or denial of service, which need no broken primitive', () => {
    for (const { scenario } of scenarios) {
      expect(['replay-attack', 'denial-of-service']).not.toContain(scenario.vector)
    }
  })

  it('ties each quantum algorithm to a primitive it can actually attack', () => {
    for (const { device, scenario } of scenarios) {
      const where = `${device.id}/${scenario.vector}`
      if (scenario.quantumMechanism === 'Shor') {
        expect(scenario.currentDefense, where).toMatch(PUBLIC_KEY_PRIMITIVE)
      } else {
        expect(scenario.currentDefense, where).toMatch(SYMMETRIC_PRIMITIVE)
      }
    }
  })

  it('labels each scenario as a hypothetical device and states its primitive and prerequisites', () => {
    for (const { device, scenario } of scenarios) {
      const where = `${device.id}/${scenario.vector}`
      expect(scenario.vectorLabel, where).toMatch(/hypothetical/i)
      expect(scenario.attackDescription, where).toMatch(/Primitive:/)
      expect(scenario.attackDescription, where).toMatch(/Prerequisites?:/)
    }
  })

  it('does not present a proprietary or weak authentication scheme as a quantum break', () => {
    const pacemaker = MEDICAL_DEVICE_CATALOG.find((d) => d.id === 'pacemaker')!
    for (const scenario of pacemaker.attackScenarios) {
      expect(scenario.currentDefense).not.toMatch(/proprietary|weak/i)
    }
  })

  it('says Grover gives the weakest quantum path against AES-128', () => {
    const grover = scenarios.filter(({ scenario }) => scenario.quantumMechanism === 'Grover')
    expect(grover.length).toBeGreaterThan(0)
    for (const { scenario } of grover) {
      expect(scenario.attackDescription).toMatch(/little or no advantage/i)
    }
  })
})

describe('pacemaker firmware verification feasibility', () => {
  const pacemaker = MEDICAL_DEVICE_CATALOG.find((d) => d.id === 'pacemaker')!
  const row = (name: RegExp) => pacemaker.pqcFeasibility.find((f) => name.test(f.algorithm))!

  it('charges the device only for verification, not for the signer-side FN-DSA floating-point cost', () => {
    const fn = row(/FN-DSA/)
    expect(fn.feasible).toBe(true)
    expect(fn.rationale).toMatch(/only verifies/i)
    expect(fn.rationale).toMatch(/cost falls on the signer/i)
    expect(fn.rationale).toMatch(/integer arithmetic/i)
  })

  it('gives separate sign and verify figures and says they are not Cortex-M0+ measurements', () => {
    const fn = row(/FN-DSA/)
    expect(fn.rationale).toMatch(/to verify/i)
    expect(fn.rationale).toMatch(/to sign/i)
    expect(fn.rationale).toMatch(/not measured on this Cortex-M0\+/i)
  })

  it('puts stateful hash-based signature state on the signer and keeps anti-rollback separate', () => {
    for (const name of [/LMS/, /XMSS/]) {
      const r = row(name)
      expect(r.rationale).toMatch(/device only verifies/i)
      expect(r.rationale).toMatch(/SP 800-208/)
    }
    expect(row(/XMSS/).rationale).toMatch(/anti-rollback/i)
    expect(row(/XMSS/).rationale).toMatch(/signing system, not the device/i)
  })

  it('treats the ML-DSA-44 memory outcome as dependent on the implementation chosen', () => {
    const r = row(/ML-DSA-44/)
    expect(r.rationale).toMatch(/depends on the implementation/i)
    expect(r.rationale).toMatch(/not a measurement/i)
  })
})

describe('biometric profile rationales', () => {
  it('do not say that a decrypted template means automatic, permanent identity loss', () => {
    for (const profile of BIOMETRIC_PROFILES) {
      const text = profile.pqcRecommendation.rationale
      expect(text, profile.id).not.toMatch(/permanently compromised/i)
      expect(text, profile.id).not.toMatch(/Any compromise is permanent/i)
      expect(text, profile.id).not.toMatch(/enables? identity theft/i)
    }
  })

  it('separate what cannot be reissued from whether authentication is at risk', () => {
    for (const profile of BIOMETRIC_PROFILES.filter((p) => p.id !== 'dna-snp')) {
      const text = profile.pqcRecommendation.rationale
      expect(text, profile.id).toMatch(/cannot be reissued/)
      expect(text, profile.id).toMatch(
        /PAD|presentation attack detection|should not be the only control/
      )
    }
  })

  it('keeps the genomic family-risk lesson', () => {
    const dna = BIOMETRIC_PROFILES.find((p) => p.id === 'dna-snp')!
    expect(dna.pqcRecommendation.rationale).toMatch(/shared with biological relatives/)
  })
})

describe('revocability matrix', () => {
  it('does not call an exposed biometric a permanent compromise with no remediation', () => {
    const biometric = REVOCABILITY_MATRIX.find((item) => item.category === 'Biometric Data')
    expect(biometric?.quantumImpact).toBeDefined()
    expect(biometric?.quantumImpact).not.toMatch(/permanent compromise|no remediation/i)
    expect(biometric?.quantumImpact).toMatch(/cannot be reissued/)
    expect(biometric?.quantumImpact).toMatch(/depends on/)
  })
})
