// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Teaching-content guards for the IAM data: each test states a concept the
 * lesson must keep apart (which key an attack needs, which signature a
 * credential makes) rather than pinning exact wording.
 */
import { describe, it, expect } from 'vitest'
import {
  CRYPTO_RISKS,
  DIRECTORY_SERVICES,
  IAM_COMPONENTS,
  IAM_PROTOCOLS,
  ZERO_TRUST_LAYERS,
} from './iamConstants'

const activeDirectory = DIRECTORY_SERVICES.find((d) => d.id === 'active-directory')!

describe('Kerberos teaching data separates the three keys an attack can need', () => {
  it('AS-REP roasting is taught as a password-derived-key attack, not a PKINIT/RSA one', () => {
    const entry = activeDirectory.vulnerabilities.find((v) => /AS-REP/i.test(v))
    expect(entry).toBeDefined()
    // The AS-REP of an account without pre-authentication is protected by a key
    // derived from the password; RSA does not appear anywhere in that exchange.
    expect(entry).toMatch(/password/i)
    expect(entry).toMatch(/pre-?authentication/i)
    expect(entry).not.toMatch(/RSA/)
  })

  it('Golden Ticket forgery is tied to the KRBTGT key, not to breaking a captured exchange', () => {
    const entry = activeDirectory.vulnerabilities.find((v) => /Golden Ticket/i.test(v))
    expect(entry).toBeDefined()
    expect(entry).toMatch(/KRBTGT/)
    expect(entry).toMatch(/classical/i)
  })

  it('the PKINIT entry names both key-delivery variants (Diffie-Hellman and RSA)', () => {
    const entry = activeDirectory.vulnerabilities.find((v) => /PKINIT/.test(v))
    expect(entry).toBeDefined()
    expect(entry).toMatch(/Diffie-Hellman/)
    expect(entry).toMatch(/RSA/)
    // and scopes the damage to one client's reply, not the domain
    expect(entry).toMatch(/one|that client/i)
  })

  it('the Kerberos risk rationale does not equate a recovered reply key with arbitrary ticket forgery', () => {
    const kerberos = CRYPTO_RISKS.find((r) => r.tokenType === 'Kerberos')!
    expect(kerberos.rationale).toMatch(/KRBTGT/)
    expect(kerberos.rationale).toMatch(/reply key/i)
    expect(kerberos.rationale).toMatch(/session key/i)
    // forging for any account is described as needing something extra
    expect(kerberos.rationale).toMatch(/additionally needs|also needs|requires/i)
  })

  it('the Kerberos ticket row does not say the ticket session key is wrapped by PKINIT RSA', () => {
    const ticket = IAM_PROTOCOLS.find((p) => p.id === 'kerberos-ticket')!
    expect(ticket.signingAlgorithm).not.toMatch(/wrapped via RSA/i)
    expect(ticket.signingAlgorithm).toMatch(/symmetric/i)
  })
})

describe('FIDO2 migration guidance covers the credential signature as well as attestation', () => {
  const mfa = IAM_COMPONENTS.find((c) => c.id === 'mfa')!

  it('names the assertion signature, attestation and re-enrolment separately', () => {
    expect(mfa.notes).toMatch(/assertion/i)
    expect(mfa.notes).toMatch(/attestation/i)
    expect(mfa.notes).toMatch(/re-enrol/i)
  })

  it('labels the candidate PQC profile as illustrative until support is shown', () => {
    expect(mfa.pqcReplacement).toMatch(/illustrative/i)
    expect(mfa.pqcReplacement).toMatch(/authenticators, browsers and relying parties/i)
  })
})

describe('hybrid TLS is not presented as universally available quantum-safe coverage', () => {
  const session = ZERO_TRUST_LAYERS.find((l) => l.id === 'session-management')!

  it('does not claim load balancers support it without testing', () => {
    expect(session.description).not.toMatch(/major load balancers/i)
    expect(session.description).toMatch(/every .*(proxy|load balancer)/i)
    expect(session.description).toMatch(/test/i)
  })

  it('keeps authentication separate from key exchange', () => {
    expect(session.description).toMatch(/authentication/i)
    expect(session.description).toMatch(/classical/i)
  })
})
