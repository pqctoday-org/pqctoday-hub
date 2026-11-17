// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { evaluateSamplePolicy, type SamplePolicyInputs } from './policyContradictionEvaluator'
const sample: SamplePolicyInputs = {
  algorithm: 'ML-KEM-768',
  useCase: 'key-establishment',
  quantumVulnerableDuringTransition: true,
  retentionYears: 3,
  migrationYears: 2,
  threatHorizonYears: 5,
  completionYear: 2030,
  policy: {
    id: 'FICTIONAL-PORTAL',
    revision: '1',
    source: 'Hub-authored fictional organizational policy',
    applies: true,
    deadlineYear: 2030,
  },
}
describe('scoped policy and scenario risk', () => {
  it('accepts an applicable boundary case', () =>
    expect(evaluateSamplePolicy(sample).findings).toEqual([]))
  it('rejects a signature/KEM use mismatch', () =>
    expect(evaluateSamplePolicy({ ...sample, algorithm: 'ML-DSA-65' }).findings[0].kind).toBe(
      'mismatch'
    ))
  it('distinguishes late applicable policy from out-of-scope policy', () => {
    expect(evaluateSamplePolicy({ ...sample, completionYear: 2031 }).findings[0].kind).toBe(
      'policy'
    )
    expect(
      evaluateSamplePolicy({
        ...sample,
        completionYear: 2031,
        policy: { ...sample.policy, applies: false },
      }).findings.map((f) => f.kind)
    ).toEqual(['out-of-scope'])
  })
  it('computes the scenario exposure and permits correction', () => {
    expect(
      evaluateSamplePolicy({
        ...sample,
        retentionYears: 10,
        migrationYears: 3,
        threatHorizonYears: 8,
      })
    ).toMatchObject({ exposureYears: 5, findings: [{ kind: 'scenario-risk' }] })
    expect(evaluateSamplePolicy(sample).exposureYears).toBe(0)
  })
  it('does not infer transition exposure when the vulnerable-key assumption is absent', () => {
    expect(
      evaluateSamplePolicy({
        ...sample,
        retentionYears: 100,
        quantumVulnerableDuringTransition: false,
      }).findings
    ).toEqual([])
  })
  it('does not conflate signature retention with HNDL decryption and rejects invalid inputs', () => {
    expect(
      evaluateSamplePolicy({
        ...sample,
        useCase: 'signature',
        algorithm: 'ML-DSA-65',
        retentionYears: 100,
      }).findings
    ).toEqual([])
    expect(() => evaluateSamplePolicy({ ...sample, retentionYears: NaN })).toThrow()
    expect(() => evaluateSamplePolicy({ ...sample, algorithm: 'unidentified' })).toThrow()
  })
})
