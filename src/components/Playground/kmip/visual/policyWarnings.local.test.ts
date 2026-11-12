// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { toEditable } from './policyEditModel'
import { evaluatePolicy, type SimRequest } from './policySim'

const request: SimRequest = {
  op: 'CreateKeyPair:Sign',
  algorithm: 'ECDSA-P256',
  keyName: 'sample-signing-key',
  keyState: 'Active',
  bits: '256',
  date: '2026-11-01',
  attrs: [],
  usageFlags: ['Sign', 'Verify'],
  hash: '',
  blockMode: '',
  padding: '',
  mechanism: '',
  deterministic: '',
  keyActivatedOn: '',
}
export const warningYaml = `schema_version: "1"
metadata:
  name: fictional-warning-window
  effective: always
rules:
  - type: temporal_cutoff
    severity: warn
    op: "CreateKeyPair:Sign"
    algorithm_class: classical
    after: "2026-01-01"
    reason: "Sample deprecation warning"
  - type: temporal_cutoff
    op: "CreateKeyPair:Sign"
    algorithm_class: classical
    after: "2027-01-01"
    reason: "Sample later denial"
`
// Read the existing shipped sample; no fixture or engine policy is changed.
const shipped = () =>
  toEditable(readFileSync(resolve('public/kmip-policies/pqc-migration-2030.yaml'), 'utf8'))
describe('warning gates preserve the existing nonterminal severity contract', () => {
  it('records the 2026 warning but allows after all remaining gates pass', () => {
    const policy = toEditable(warningYaml)
    const result = evaluatePolicy(policy, request)
    expect(result.verdict.kind).toBe('allow')
    expect(result.deciderId).toBeNull()
    expect(result.trace[0]).toMatchObject({ matched: true, effect: 'warn' })
    expect(result.trace[0].note).toContain('Sample deprecation warning')
    expect(result.trace[1].effect).not.toBe('skip')
  })
  it('keeps the 2027 later denial terminal after recording the warning', () => {
    const policy = toEditable(warningYaml)
    const result = evaluatePolicy(policy, { ...request, date: '2027-11-01' })
    expect(result.verdict).toMatchObject({ kind: 'deny', reason: 'Sample later denial' })
    expect(result.deciderId).toBe(policy.rules[1].id)
    expect(result.trace.map((step) => step.effect)).toEqual(['warn', 'deny'])
  })
  it('matches the shipped sample’s warning in 2026 and actual cutoff in 2027', () => {
    const policy = shipped()
    expect(evaluatePolicy(policy, request).verdict.kind).toBe('allow')
    expect(evaluatePolicy(policy, { ...request, date: '2027-11-01' }).verdict.kind).toBe('deny')
  })
  it('does not warn for disabled, not-yet-active or nonmatching rules', () => {
    const policy = toEditable(warningYaml)
    policy.rules[0].enabled = false
    expect(evaluatePolicy(policy, request).trace[0].effect).toBe('off')
    policy.rules[0].enabled = true
    for (const input of [
      { ...request, date: '2025-11-01' },
      { ...request, algorithm: 'ML-DSA-65' },
    ]) {
      expect(evaluatePolicy(policy, input).trace.some((step) => step.effect === 'warn')).toBe(false)
    }
  })
  it('retains hard-deny behavior and does not turn warning rules into decisions', () => {
    const policy = toEditable(warningYaml)
    delete policy.rules[0].scalars.severity
    const result = evaluatePolicy(policy, request)
    expect(result.verdict.kind).toBe('deny')
    expect(result.deciderId).toBe(policy.rules[0].id)
    expect(result.trace[1].effect).toBe('skip')
  })
  it('preserves algorithm defaults while a matching warning continues evaluation', () => {
    const policy = toEditable(warningYaml)
    const defaultRule = toEditable(`schema_version: "1"
metadata:
  name: sample
rules:
  - type: algorithm_default
    op: "CreateKeyPair:Sign"
    default_algorithm: ECDSA-P256
`).rules[0]
    defaultRule.id = 'sample-default'
    policy.rules.unshift(defaultRule)
    const result = evaluatePolicy(policy, { ...request, algorithm: '' })
    expect(result.verdict).toEqual({ kind: 'allow', algorithm: 'ECDSA-P256' })
    expect(result.trace.map((step) => step.effect)).toEqual(['resolve', 'warn', 'pass'])
  })
  it('also respects warning severity on another existing denial rule', () => {
    const policy = toEditable(warningYaml)
    policy.rules = [
      {
        id: 'sample-minimum',
        type: 'min_key_length',
        enabled: true,
        scalars: {
          algorithm: 'ECDSA',
          min_bits: '384',
          severity: 'warn',
          reason: 'Sample short key',
        },
        lists: {},
        maps: {},
      },
    ]
    const result = evaluatePolicy(policy, request)
    expect(result.verdict.kind).toBe('allow')
    expect(result.trace[0]).toMatchObject({ matched: true, effect: 'warn' })
  })
})
