// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { describeDryRun, policyDefaultLabel, resolvePolicyDefault } from './policyDefault'

describe('policy default pill', () => {
  it('an allow with no algorithm is "any (no default)", not "denied"', () => {
    // The permissive baseline (rules: []) allows everything and names no default.
    expect(policyDefaultLabel(describeDryRun({ kind: 'Allow', algorithm: null }))).toBe(
      'any (no default)'
    )
  })

  it('a deny is "denied"', () => {
    expect(policyDefaultLabel(describeDryRun({ kind: 'Deny' }))).toBe('denied')
  })

  it('an allow with an algorithm shows it, and a rekey shows its target', () => {
    expect(policyDefaultLabel(describeDryRun({ kind: 'Allow', algorithm: 'ML-DSA-65' }))).toBe(
      'ML-DSA-65'
    )
    expect(policyDefaultLabel(describeDryRun({ kind: 'Rekey', to: 'ML-KEM-768' }))).toBe(
      'ML-KEM-768'
    )
  })

  it('an engine error is shown as unknown, never as denied', () => {
    const engine = {
      dryRun: () => {
        throw new Error('no policy')
      },
    }
    expect(policyDefaultLabel(resolvePolicyDefault(engine, 'CreateKeyPair:Sign'))).toBe('—')
  })
})
