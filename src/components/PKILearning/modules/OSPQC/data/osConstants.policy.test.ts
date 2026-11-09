// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { CRYPTO_SUBSYSTEMS, SYSTEM_TLS_POLICIES } from './osConstants'

describe('RHEL crypto-policies row in the system TLS policy table', () => {
  const rhel = SYSTEM_TLS_POLICIES.find((p) => p.id === 'rhel-crypto-policies')!

  it('gives DEFAULT:PQ for RHEL 9.7 and the DEFAULT policy for RHEL 10.1 and later', () => {
    expect(rhel.command).toBe('update-crypto-policies --set DEFAULT:PQ')
    expect(rhel.pqcPolicy).toMatch(/DEFAULT:PQ.*RHEL 9\.7/)
    expect(rhel.pqcPolicy).toMatch(/DEFAULT policy.*RHEL 10\.1/)
    expect(rhel.notes).toMatch(/RHEL 10\.1 and later the DEFAULT policy enables and prefers/)
  })

  it('does not teach the FUTURE policy as the way to get the hybrid group', () => {
    const all = `${rhel.pqcPolicy} ${rhel.command} ${rhel.notes}`
    expect(all).not.toMatch(/FUTURE|PQCONLY/)
  })
})

describe('Ubuntu row in the system TLS policy table', () => {
  const ubuntu = SYSTEM_TLS_POLICIES.find((p) => p.id === 'ubuntu-openssl')!

  it('is labelled for both Ubuntu releases, so the 26.04 path is reachable', () => {
    expect(ubuntu.os).toBe('Ubuntu 24.04 / 26.04 LTS')
  })

  it('states OpenSSL 3.5.0+ as the version with built-in PQC in the system OpenSSL row', () => {
    const row = CRYPTO_SUBSYSTEMS.find((o) => o.id === 'openssl-3x')!
    expect(row.version).toBe('OpenSSL 3.5.0+ for built-in PQC; earlier 3.x needs oqsprovider')
  })

  it('names the OpenSSL versions of 24.04 and 26.04 and the 3.5.0 requirement for the group', () => {
    expect(ubuntu.notes).toMatch(/Ubuntu 24\.04 LTS ships OpenSSL 3\.0\.13/)
    expect(ubuntu.notes).toMatch(/Ubuntu 26\.04 LTS ships OpenSSL 3\.5\.5/)
    expect(ubuntu.pqcPolicy).toMatch(/OpenSSL 3\.5\.0 or later/)
  })

  it('does not teach update-crypto-policies, OpenSSL 3.2 or an oqsprovider backport for Ubuntu', () => {
    const all = `${ubuntu.policyMechanism} ${ubuntu.pqcPolicy} ${ubuntu.command} ${ubuntu.notes}`
    expect(all).not.toMatch(/update-crypto-policies|OpenSSL 3\.2|oqsprovider|backported/)
  })
})
