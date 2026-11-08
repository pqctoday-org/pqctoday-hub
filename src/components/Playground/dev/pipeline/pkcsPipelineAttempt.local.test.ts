// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  beginAttempt,
  completeAttempt,
  failAttempt,
  attemptBinding,
  stepStructure,
  type PkcsAttemptInputs,
} from './pkcsPipelineAttempt'
import { emitPipeline } from './pipelineCodegen'
import { TEMPLATES } from './pipelineTemplates'
const inputs = (name = 'ML-KEM round trip'): PkcsAttemptInputs => {
  const steps = structuredClone(TEMPLATES[name])
  return {
    name,
    templateName: name,
    steps,
    input: 'sample',
    slot: 1,
    engine: 'rust',
    detached: false,
    code: emitPipeline(steps, { input: 'sample', slot: 1 }),
  }
}
const output = (d: PkcsAttemptInputs) =>
  d.steps
    .map((s) => `###STEP ${s.id} detail### {"kind":"output","fields":[]}\n###STEP ${s.id} ok###`)
    .join('\n')
const result = (d: PkcsAttemptInputs) => ({
  ok: true,
  stdout: output(d),
  stderr: '',
  error: null,
  elapsedMs: 5,
})
describe('PKCS sample outcome attribution', () => {
  it('deeply records original inputs', () => {
    const d = inputs()
    const a = beginAttempt(d)
    d.steps[0].id = 'changed'
    expect(a.inputs.steps[0].id).toBe('t1')
  })
  it.each(['Encrypt + sign (PQ)', 'PQ TLS handshake', 'Hybrid signature', 'ML-KEM round trip'])(
    'limits %s explanation to observed operations',
    (name) => {
      const d = inputs(name)
      const a = completeAttempt(d, result(d), 5)
      expect(a.state).toBe('passed')
      expect(a.explanation).toBeTruthy()
      expect(a.explanation).not.toMatch(
        /FIPS-validated|identical shared secret|valid under both|end to end/
      )
    }
  )
  it.each(['runtime', 'step', 'missing', 'duplicate', 'unknown', 'detail'])(
    'blocks %s result',
    (kind) => {
      const d = inputs()
      const r = result(d)
      if (kind === 'runtime') {
        r.ok = false
        r.error = 'failed' as never
      }
      if (kind === 'step') r.stdout = r.stdout.replace('t1 ok###', 't1 error### failed')
      if (kind === 'missing') r.stdout = ''
      if (kind === 'duplicate') r.stdout += '\n###STEP t1 ok###'
      if (kind === 'unknown') r.stdout += '\n###STEP other ok###'
      if (kind === 'detail') r.stdout = r.stdout.replace('"kind":"output"', '"kind":"error"')
      const a = completeAttempt(d, r, 5)
      expect(a.state).not.toBe('passed')
      expect(a.explanation).toBeNull()
    }
  )
  it('does not accept an empty generated pipeline', () => {
    const d = { ...inputs(), steps: [] }
    expect(completeAttempt(d, result(d), 5).state).toBe('incomplete')
  })
  it('does not infer template identity from an imported title', () => {
    const d = { ...inputs(), templateName: null }
    expect(completeAttempt(d, result(d), 5).explanation).toBeNull()
  })
  it('does not attach a template explanation to altered generated code', () => {
    const d = inputs()
    d.code += '\nprint("edited")'
    expect(completeAttempt(d, result(d), 5).explanation).toBeNull()
  })
  it('does not attach an explanation to edited step parameters', () => {
    const d = inputs()
    d.steps[0].params.keyLabel = { bind: 'literal', value: 'edited' }
    d.code = emitPipeline(d.steps, { input: d.input, slot: d.slot })
    expect(completeAttempt(d, result(d), 5).explanation).toBeNull()
  })
  it('recognizes fresh template IDs and internal references', () => {
    const d = inputs()
    const ids = new Map(d.steps.map((s) => [s.id, 'fresh-' + s.id]))
    d.steps = d.steps.map((s) => ({
      ...s,
      id: ids.get(s.id)!,
      params: Object.fromEntries(
        Object.entries(s.params).map(([k, v]) => [
          k,
          v.bind === 'ref' || v.bind === 'key' ? { ...v, step: ids.get(v.step) ?? v.step } : v,
        ])
      ),
    }))
    d.code = emitPipeline(d.steps, { input: d.input, slot: d.slot })
    expect(stepStructure(d.steps)).toBe(stepStructure(TEMPLATES[d.name]))
    expect(completeAttempt(d, result(d), 5).explanation).toContain('agreement was not checked')
  })
  it('keeps custom and empty custom scripts neutral', () => {
    for (const code of ['print("sample")', '']) {
      const d = { ...inputs(), detached: true, code }
      const a = completeAttempt(d, { ...result(d), stdout: '' }, 5)
      expect(a.state).toBe('script-finished')
      expect(a.explanation).toBeNull()
    }
  })
  it('ignores runtime decorations but binds actual input, slot and engine', () => {
    const d = inputs()
    const decorated = structuredClone(d)
    decorated.steps[0].status = 'ok'
    decorated.steps[0].output = { text: 'sample', status: 'ok' }
    expect(attemptBinding(decorated)).toBe(attemptBinding(d))
    for (const change of [
      { input: 'changed' },
      { slot: 2 },
      { engine: 'cpp' },
      { name: 'edited' },
      { detached: true },
    ])
      expect(attemptBinding({ ...d, ...change })).not.toBe(attemptBinding(d))
  })
  it('records thrown errors without an outcome claim', () => {
    expect(failAttempt(inputs(), new Error('bridge failed'), 5).state).toBe('failed')
  })
})
