// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { optionsFor, validate } from './kmipPipelineBindings'
import { KMIP_TEMPLATES } from './kmipPipelineTemplates'
import type { KmipStep } from './kmipPipelineCodegen'

const GOVERNED = KMIP_TEMPLATES['Governed lifecycle']

describe('validate — the shipped templates are clean', () => {
  it('Governed lifecycle has zero findings', () => {
    expect(validate(GOVERNED)).toEqual([])
  })

  it('ML-KEM round trip has zero findings', () => {
    expect(validate(KMIP_TEMPLATES['ML-KEM round trip'])).toEqual([])
  })

  it('Policy dry-run compare has zero findings', () => {
    expect(validate(KMIP_TEMPLATES['Policy dry-run compare'])).toEqual([])
  })
})

describe('validate — empty pipeline', () => {
  it('warns, does not error', () => {
    const findings = validate([])
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('warn')
  })
})

describe('validate — op step finding classes (sabotage: mutate a known-good template)', () => {
  it('flags an unknown primitive', () => {
    const steps = structuredClone(GOVERNED)
    ;(steps[0] as Extract<KmipStep, { kind: 'op' }>).primId = 'not-a-real-primitive'
    const findings = validate(steps)
    expect(findings.some((f) => /Unknown primitive/.test(f.text))).toBe(true)
  })

  it('flags an op the primitive does not support', () => {
    const steps = structuredClone(GOVERNED)
    // aes-256 (symmetric) has no 'sign' op.
    steps.push({ kind: 'op', id: 'bad-op', primId: 'aes-256', op: 'sign', params: {} })
    const findings = validate(steps)
    expect(findings.some((f) => /does not support "sign"/.test(f.text))).toBe(true)
  })

  it('flags a required param that is not bound', () => {
    const steps = structuredClone(GOVERNED)
    const activate = steps.find((s) => s.id === 'activate') as Extract<KmipStep, { kind: 'op' }>
    activate.params = {}
    const findings = validate(steps)
    expect(findings.some((f) => /"uid" is not bound/.test(f.text))).toBe(true)
  })

  it('flags a param pointing at a deleted step', () => {
    const steps = structuredClone(GOVERNED).filter((s) => s.id !== 'create')
    const findings = validate(steps)
    expect(findings.some((f) => /points at a deleted step/.test(f.text))).toBe(true)
  })

  it('flags a param pointing at a later step', () => {
    const steps: KmipStep[] = [
      {
        kind: 'op',
        id: 'activate',
        primId: 'ml-dsa-65',
        op: 'activate',
        params: { uid: { bind: 'ref', step: 'create', part: 'priv' } },
      },
      { kind: 'op', id: 'create', primId: 'ml-dsa-65', op: 'createKeyPair', params: {} },
    ]
    const findings = validate(steps)
    expect(findings.some((f) => /points at a later step/.test(f.text))).toBe(true)
  })

  it('flags a param bound to an incompatible output (pub key where priv is required)', () => {
    const steps: KmipStep[] = [
      { kind: 'op', id: 'create', primId: 'ml-kem-768', op: 'createKeyPair', params: {} },
      {
        kind: 'op',
        id: 'decap',
        primId: 'ml-kem-768',
        op: 'decapsulate',
        params: {
          privUid: { bind: 'ref', step: 'create', part: 'pub' }, // wrong half on purpose
          ciphertext: { bind: 'ref', step: 'create' },
        },
      },
    ]
    const findings = validate(steps)
    expect(findings.some((f) => /"privUid" is bound to an incompatible output/.test(f.text))).toBe(
      true
    )
  })

  it('flags an op step referencing a key already destroyed at an earlier step', () => {
    const steps = structuredClone(GOVERNED)
    // Governed lifecycle's own order already destroys last — insert a use AFTER destroy.
    steps.push({
      kind: 'op',
      id: 'use-after-destroy',
      primId: 'ml-dsa-65',
      op: 'getAttributes',
      params: { uid: { bind: 'ref', step: 'create', part: 'priv' } },
    })
    const findings = validate(steps)
    expect(findings.some((f) => /already destroyed at an earlier step/.test(f.text))).toBe(true)
  })

  it('never flags an unbound "text" param — it falls back to the pipeline message', () => {
    // Every shipped Sign step omits `text` entirely; this is the control case
    // proving the validator does not treat that as a defect.
    const signStep = GOVERNED.find((s) => s.kind === 'op' && s.op === 'sign') as Extract<
      KmipStep,
      { kind: 'op' }
    >
    expect(signStep.params.text).toBeUndefined()
    expect(validate(GOVERNED).some((f) => /"text"/.test(f.text))).toBe(false)
  })
})

describe('validate — load-policy / dry-run / expect-deny finding classes', () => {
  it('flags a load-policy step with no policy file', () => {
    const steps: KmipStep[] = [{ kind: 'load-policy', id: 'lp', policyFile: '' }]
    const findings = validate(steps)
    expect(findings.some((f) => /no policy file selected/.test(f.text))).toBe(true)
  })

  it('flags a dry-run step with no operation', () => {
    const steps: KmipStep[] = [{ kind: 'dry-run', id: 'dr', op: '' }]
    const findings = validate(steps)
    expect(findings.some((f) => /no operation selected/.test(f.text))).toBe(true)
  })

  it('flags an expect-deny step with no target', () => {
    const steps: KmipStep[] = [{ kind: 'expect-deny', id: 'ed', targetStepId: '' }]
    const findings = validate(steps)
    expect(findings.some((f) => /no target step selected/.test(f.text))).toBe(true)
  })

  it('flags an expect-deny step targeting a deleted step', () => {
    const steps: KmipStep[] = [{ kind: 'expect-deny', id: 'ed', targetStepId: 'gone' }]
    const findings = validate(steps)
    expect(findings.some((f) => /target step was deleted/.test(f.text))).toBe(true)
  })

  it('flags an expect-deny step targeting a later step', () => {
    const steps: KmipStep[] = [
      { kind: 'expect-deny', id: 'ed', targetStepId: 'sign' },
      { kind: 'op', id: 'sign', primId: 'ml-dsa-65', op: 'sign', params: {} },
    ]
    const findings = validate(steps)
    expect(findings.some((f) => /must come earlier in the pipeline/.test(f.text))).toBe(true)
  })

  it('flags an expect-deny step targeting a non-op step', () => {
    const steps: KmipStep[] = [
      { kind: 'load-policy', id: 'lp', policyFile: 'training-permissive.yaml' },
      { kind: 'expect-deny', id: 'ed', targetStepId: 'lp' },
    ]
    const findings = validate(steps)
    expect(findings.some((f) => /must be an operation/.test(f.text))).toBe(true)
  })

  it('does not flag a valid expect-deny targeting an earlier op step', () => {
    const deny = GOVERNED.find((s) => s.kind === 'expect-deny') as Extract<
      KmipStep,
      { kind: 'expect-deny' }
    >
    expect(validate(GOVERNED).some((f) => f.stepIndex === GOVERNED.indexOf(deny))).toBe(false)
  })
})

describe('optionsFor', () => {
  const afterCreateKeyPair: KmipStep[] = [
    { kind: 'op', id: 'kp', primId: 'ml-dsa-65', op: 'createKeyPair', params: {} },
  ]
  const afterCreateSymmetric: KmipStep[] = [
    { kind: 'op', id: 'sym', primId: 'aes-256', op: 'create', params: {} },
  ]
  const afterEncapsulate: KmipStep[] = [
    { kind: 'op', id: 'kp', primId: 'ml-kem-768', op: 'createKeyPair', params: {} },
    {
      kind: 'op',
      id: 'encap',
      primId: 'ml-kem-768',
      op: 'encapsulate',
      params: { pubUid: { bind: 'ref', step: 'kp', part: 'pub' } },
    },
  ]

  it('"text" kind is never bindable', () => {
    expect(optionsFor('text', afterCreateKeyPair, 1)).toEqual([])
  })

  it('"pubUid" offers only the public half of an earlier keypair', () => {
    const opts = optionsFor('pubUid', afterCreateKeyPair, 1)
    expect(opts).toHaveLength(1)
    expect(opts[0].value).toEqual({ bind: 'ref', step: 'kp', part: 'pub' })
  })

  it('"privUid" offers only the private half of an earlier keypair', () => {
    const opts = optionsFor('privUid', afterCreateKeyPair, 1)
    expect(opts).toHaveLength(1)
    expect(opts[0].value).toEqual({ bind: 'ref', step: 'kp', part: 'priv' })
  })

  it('"uid" offers both keypair halves', () => {
    const opts = optionsFor('uid', afterCreateKeyPair, 1)
    expect(opts).toHaveLength(2)
  })

  it('"uid" offers a plain symmetric key with no part', () => {
    const opts = optionsFor('uid', afterCreateSymmetric, 1)
    expect(opts).toEqual([{ label: '1. AES-256 · key', value: { bind: 'ref', step: 'sym' } }])
  })

  it('"ciphertextHex" offers only an earlier encapsulate step\'s ciphertext', () => {
    const opts = optionsFor('ciphertextHex', afterEncapsulate, 2)
    expect(opts).toEqual([
      {
        label: '2. ML-KEM-768 · ciphertext',
        value: { bind: 'ref', step: 'encap', part: 'ciphertext' },
      },
    ])
  })

  it('never offers an option from a step at or after the given index', () => {
    expect(optionsFor('uid', afterCreateKeyPair, 0)).toEqual([])
  })
})
