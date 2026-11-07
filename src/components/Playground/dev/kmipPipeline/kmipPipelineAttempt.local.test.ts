// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  beginAttempt,
  completeAttempt,
  failAttempt,
  attemptBinding,
  type KmipAttemptInputs,
} from './kmipPipelineAttempt'
import { emitKmipPipeline } from './kmipPipelineCodegen'
import { KMIP_TEMPLATES } from './kmipPipelineTemplates'
const inputs = (name = 'ML-KEM round trip'): KmipAttemptInputs => {
  const steps = structuredClone(KMIP_TEMPLATES[name])
  const message = 'sample'
  return {
    name,
    templateName: name,
    steps,
    message,
    messageMode: 'text',
    detached: false,
    code: emitKmipPipeline(steps, { message, messageMode: 'text' }),
  }
}
const stdout = (data: KmipAttemptInputs) =>
  data.steps
    .map(
      (step) =>
        `###STEP ${step.id} detail### {"kind":"output","fields":[]}\n###STEP ${step.id} ok###`
    )
    .join('\n')
const result = (data: KmipAttemptInputs) => ({
  ok: true,
  stdout: stdout(data),
  stderr: '',
  error: null,
  elapsedMs: 5,
})
describe('KMIP attempt completion and attribution', () => {
  it('retains a deep original step snapshot', () => {
    const data = inputs()
    const attempt = beginAttempt(data)
    data.steps[0].id = 'edited'
    expect(attempt.inputs.steps[0].id).toBe('create')
    expect(attempt.state).toBe('running')
  })
  it('allows a template explanation only after complete required results', () => {
    const data = inputs()
    const attempt = completeAttempt(data, result(data), 5)
    expect(attempt.state).toBe('passed')
    expect(attempt.explanation).toContain('agreement was not checked')
  })
  it('does not infer agreement from two operations running', () => {
    const data = inputs()
    const attempt = completeAttempt(data, result(data), 5)
    expect(attempt.explanation).not.toContain('derive matching shared secrets')
    expect(attempt.inputs.steps.some((s) => s.kind === 'assert-equals')).toBe(false)
  })
  it('runtime failure cannot pass even when all step markers look successful', () => {
    const data = inputs()
    const attempt = completeAttempt(data, { ...result(data), ok: false, error: 'Python failed' }, 5)
    expect(attempt.state).toBe('failed')
    expect(attempt.explanation).toBeNull()
    expect(attempt.parsed?.status.create).toBe('ok')
  })
  it('a step failure blocks success even with a successful process return', () => {
    const data = inputs()
    const r = result(data)
    r.stdout = r.stdout.replace('###STEP decap ok###', '###STEP decap error### rejected')
    expect(completeAttempt(data, r, 5).state).toBe('failed')
  })
  it('error detail cannot be replaced with an ok marker', () => {
    const data = inputs()
    const r = result(data)
    r.stdout = r.stdout.replace(
      '{"kind":"output","fields":[]}',
      '{"kind":"error","message":"failed","excType":"Error","traceback":""}'
    )
    expect(completeAttempt(data, r, 5).state).toBe('failed')
  })
  it.each(['blank', 'missing-marker', 'missing-detail', 'duplicate-marker', 'unknown-marker'])(
    'keeps %s output incomplete',
    (kind) => {
      const data = inputs()
      const r = result(data)
      if (kind === 'blank') r.stdout = ''
      if (kind === 'missing-marker') r.stdout = r.stdout.replace('###STEP decap ok###', '')
      if (kind === 'missing-detail')
        r.stdout = r.stdout.replace('###STEP decap detail### {"kind":"output","fields":[]}', '')
      if (kind === 'duplicate-marker') r.stdout += '\n###STEP create ok###'
      if (kind === 'unknown-marker') r.stdout += '\n###STEP unrelated ok###'
      expect(completeAttempt(data, r, 5).state).toBe('incomplete')
    }
  )
  it('empty and duplicate step identities cannot establish completion', () => {
    const data = inputs()
    data.steps = []
    expect(completeAttempt(data, result(data), 5).state).toBe('incomplete')
    data.steps = [KMIP_TEMPLATES['ML-KEM round trip'][0], KMIP_TEMPLATES['ML-KEM round trip'][0]]
    expect(completeAttempt(data, result(data), 5).state).toBe('incomplete')
  })
  it('uses template origin rather than the editable title', () => {
    const data = inputs()
    data.name = 'Governed lifecycle'
    expect(completeAttempt(data, result(data), 5).explanation).toContain(
      'agreement was not checked'
    )
  })
  it.each(['imported', 'edited-steps', 'edited-code', 'detached'])(
    'does not borrow an explanation for %s code',
    (kind) => {
      const data = inputs()
      if (kind === 'imported') data.templateName = null
      if (kind === 'edited-steps') {
        data.steps[0].id = 'changed'
        data.code = emitKmipPipeline(data.steps, { message: data.message })
      }
      if (kind === 'edited-code') data.code += '\nprint("custom")'
      if (kind === 'detached') data.detached = true
      const completed = completeAttempt(data, result(data), 5)
      expect(completed.explanation).toBeNull()
      if (kind === 'detached') expect(completed.state).toBe('script-finished')
    }
  )
  it('changing each relevant input invalidates the old binding', () => {
    const data = inputs()
    const original = attemptBinding(data)
    for (const changed of [
      { ...data, name: 'new' },
      { ...data, message: 'new' },
      { ...data, messageMode: 'hex' as const },
      { ...data, code: data.code + '\n' },
      { ...data, templateName: null },
    ])
      expect(attemptBinding(changed)).not.toBe(original)
  })
  it('keeps bridge/runtime exceptions failed with their original inputs', () => {
    const data = inputs()
    const failed = failAttempt(data, new Error('bridge unavailable'), 5)
    expect(failed.state).toBe('failed')
    expect(failed.inputs.name).toBe(data.name)
    expect(failed.explanation).toBeNull()
  })
})
