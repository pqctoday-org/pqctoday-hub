// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { ARCHITECTURE_LAYERS, TRANSACTION_FLOW_STEPS } from './custodyConstants'

const allSubComponents = ARCHITECTURE_LAYERS.flatMap((l) => l.subComponents)
const byId = (id: string) => {
  const found = allSubComponents.find((s) => s.id === id)
  if (!found) throw new Error(`missing sub-component ${id}`)
  return found
}
const textOf = (value: unknown): string => JSON.stringify(value)
const everything = textOf([ARCHITECTURE_LAYERS, TRANSACTION_FLOW_STEPS])

describe('custody architecture: MAC strength statements', () => {
  it('does not present HMAC-SHA256 as universally 256-bit quantum strong', () => {
    expect(everything).not.toMatch(/HMAC-SHA256 remains quantum-resistant at 256-bit/i)
    expect(everything).not.toMatch(/HMAC-based auth is already quantum-safe/i)
    expect(everything).not.toMatch(/HMAC-SHA256 and SHA-256 provide 128-bit quantum security/i)
  })

  it('names key length, tag length and key handling as what the MAC strength depends on', () => {
    const api = byId('api-endpoints').pqcThreat
    expect(api.quantumAttack).toMatch(/idealized/i)
    expect(api.quantumAttack).toMatch(/length and randomness/i)
    expect(api.quantumAttack).toMatch(/tag length/i)
    expect(api.quantumAttack).toMatch(/not a blanket 256-bit quantum guarantee/i)
  })
})

describe('custody architecture: multi-factor statements', () => {
  it('separates WebAuthn registration attestation from login assertions', () => {
    const admin = byId('admin-console')
    expect(admin.cryptoPrimitives.join(' ')).toMatch(/assertion/i)
    expect(admin.cryptoPrimitives.join(' ')).toMatch(/attestation at registration/i)
    expect(admin.pqcThreat.quantumAttack).toMatch(/two different keys/i)
    expect(admin.pqcThreat.quantumAttack).toMatch(/credential key signs every login assertion/i)
  })

  it('does not present TOTP as an equivalent quantum-safe replacement', () => {
    expect(everything).not.toMatch(/quantum-safe MFA fallback/i)
    expect(everything).not.toMatch(/TOTP \(HMAC-based\) is inherently quantum-resistant/i)
    expect(everything).not.toMatch(/keep TOTP as quantum-safe fallback/i)
    const admin = byId('admin-console').pqcThreat
    expect(admin.migrationNotes).toMatch(/not an equivalent substitute/i)
    expect(admin.migrationNotes).toMatch(/not bound to a site/i)
  })

  it('does not state an unverified FIDO Alliance position as fact', () => {
    expect(everything).not.toMatch(/FIDO Alliance has not yet standardized/i)
    expect(everything).not.toMatch(/pending FIDO Alliance work/i)
  })
})

describe('custody architecture: secret sharing statements', () => {
  it('does not claim Shamir shares are elliptic-curve based or need lattice threshold schemes', () => {
    expect(everything).not.toMatch(/EC-based Shamir/i)
    expect(everything).not.toMatch(/lattice-based threshold schemes\)/i)
    expect(everything).not.toMatch(/PQC Shamir shards/i)
  })

  it('separates share confidentiality, share wrapping and authentication, and distributed signing', () => {
    const cold = byId('cold-wallet').pqcThreat
    expect(cold.quantumAttack).toMatch(/below the threshold/i)
    expect(cold.quantumAttack).toMatch(/undetermined/i)
    expect(cold.quantumAttack).toMatch(/wrapped, transported or authenticated/i)
    expect(cold.vulnerableAlgorithms.join(' ')).toMatch(/wrapping/i)
    expect(cold.pqcCountermeasures.join(' ')).toMatch(/wrapping/i)
    expect(cold.migrationNotes).toMatch(/rebuild the key in one place/i)
    expect(cold.migrationNotes).toMatch(/distributed-signing/i)
  })
})
