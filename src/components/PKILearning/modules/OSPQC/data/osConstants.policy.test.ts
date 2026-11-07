// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { SYSTEM_TLS_POLICIES } from './osConstants'

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
