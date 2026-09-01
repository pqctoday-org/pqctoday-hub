// SPDX-License-Identifier: GPL-3.0-only
//
// Codegen regression coverage (dev-tabs-pkcs11-kmip plan G6). Snapshots
// every shipped template's emitted Python so a codegen change shows up as
// an intentional, reviewed snapshot diff — plus explicit assertions for the
// two invariants the module's own docstrings call out by name, so a
// reviewer sees WHY these lines matter, not just that a snapshot changed.
import { describe, expect, it } from 'vitest'
import {
  emitPipeline,
  tryParsePipelineFromEditedCode,
  DEFAULT_PIPELINE_INPUT,
  type PipelineStep,
} from './pipelineCodegen'
import { TEMPLATES, TEMPLATE_NAMES } from './pipelineTemplates'

describe('emitPipeline — template snapshots', () => {
  for (const name of TEMPLATE_NAMES) {
    it(`emits stable code for "${name}"`, () => {
      const code = emitPipeline(TEMPLATES[name], { input: DEFAULT_PIPELINE_INPUT })
      expect(code).toMatchSnapshot()
    })
  }
})

describe('emitPipeline — D6 dedicated-slot threading', () => {
  const steps = TEMPLATES['ML-KEM round trip']

  it("omits an explicit slot when none is given (matches the sandbox's own emitted code)", () => {
    const code = emitPipeline(steps, {})
    expect(code).toContain('hsm.open_session(pin=PIN)')
    expect(code).not.toContain('slot=')
  })

  it("threads an explicit slot into open_session when one is given (D6: the Developer tab's own labeled token, never the shared playground one)", () => {
    const code = emitPipeline(steps, { slot: 7 })
    expect(code).toContain('hsm.open_session(slot=7, pin=PIN)')
  })
})

describe('emitPipeline — no-numeric-literal / no-unquoted-string invariants (pipelinePrimitives.ts / pipelineCodegen.ts headers)', () => {
  it("a sign step's mechanism is a named p11.CKM_* constant, never a bare hex/int literal", () => {
    // "Encrypt + sign (PQ)" contains an ml-dsa-65 sign step — the mechanism
    // there is `mechConst(CKM_ML_DSA)`, which must render as the p11.CKM_ML_DSA
    // NAME (mechName() in pipelinePrimitives.ts), never the raw 0x1d value —
    // the exact bug class the module's own "NO NUMERIC LITERAL" rule exists for.
    const code = emitPipeline(TEMPLATES['Encrypt + sign (PQ)'], {})
    expect(code).toContain('p11.CKM_ML_DSA')
    expect(code).not.toMatch(/0x1d\)/)
  })

  it('a literal ref value is always emitted as a quoted, escaped Python string, never interpolated raw', () => {
    // sign's `input` param is the one place a step can bind a literal that
    // render() actually embeds (see render()'s 'literal' case) — generate's
    // own keyLabel param is UI-display-only and never reaches codegen at all,
    // confirmed by reading emitGenerate directly (not assumed).
    const step = {
      id: 's1',
      primId: 'ml-dsa-65',
      op: 'sign' as const,
      params: {
        privKey: { bind: 'key' as const, step: 't4', part: 'priv' as const },
        input: { bind: 'literal' as const, value: "o'brien" },
      },
      status: 'idle' as const,
      output: null,
    }
    const code = emitPipeline([...TEMPLATES['Encrypt + sign (PQ)'].slice(0, 4), step], {})
    // The real defect class this guards against: an earlier generator
    // interpolated free text directly, so a value containing a quote broke
    // the emitted Python's own string syntax.
    expect(code).toContain("\\'brien")
    expect(code).not.toContain("'o'brien'") // the unescaped, syntax-breaking form
  })
})

describe('tryParsePipelineFromEditedCode — reverse-parsing the Code tab back to steps', () => {
  const markerLine = (lines: string[], id: string) =>
    lines.findIndex((l) => l.includes(`# ── ${id} ·`))

  it('(a) no edits round-trips to the identical steps', () => {
    const steps = TEMPLATES['Encrypt + sign (PQ)']
    const code = emitPipeline(steps, {})
    const result = tryParsePipelineFromEditedCode(code, steps)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.steps).toEqual(steps)
  })

  it('(b) an edited literal string value is correctly extracted', () => {
    // None of the shipped templates render a literal string through emitOp (a
    // generate step's own `keyLabel` literal is UI-display-only and never reaches
    // codegen — confirmed by the "no-unquoted-string" describe block above), so
    // build a small pipeline whose sign step's `input` is literal-bound, the one
    // place a literal actually reaches emitted Python.
    const steps: PipelineStep[] = [
      {
        id: 'gen1',
        primId: 'ml-dsa-65',
        op: 'generate',
        params: { keyLabel: { bind: 'literal', value: 'k' } },
        status: 'idle',
        output: null,
      },
      {
        id: 'lit1',
        primId: 'ml-dsa-65',
        op: 'sign',
        params: {
          privKey: { bind: 'key', step: 'gen1', part: 'priv' },
          input: { bind: 'literal', value: 'hello world' },
        },
        status: 'idle',
        output: null,
      },
    ]
    const generated = emitPipeline(steps, {})
    expect(generated).toContain("'hello world'")
    const edited = generated.replace("'hello world'", "'goodbye world'")
    const result = tryParsePipelineFromEditedCode(edited, steps)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const lit1 = result.steps.find((s) => s.id === 'lit1')
      expect(lit1?.params.input).toEqual({ bind: 'literal', value: 'goodbye world' })
      const gen1 = result.steps.find((s) => s.id === 'gen1')
      expect(gen1).toBe(steps[0]) // unedited step comes back as the SAME object
    }
  })

  it('(c) an edited literal bytes value is correctly extracted', () => {
    const steps: PipelineStep[] = [
      {
        id: 'b1',
        primId: 'sha3-256',
        op: 'digest',
        params: { input: { bind: 'bytes', value: 'abc' } },
        status: 'idle',
        output: null,
      },
    ]
    const generated = emitPipeline(steps, {})
    expect(generated).toContain("b'abc'")
    const edited = generated.replace("b'abc'", "b'xyz'")
    const result = tryParsePipelineFromEditedCode(edited, steps)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.steps[0].params.input).toEqual({ bind: 'bytes', value: 'xyz' })
    }
  })

  it('(d) a deleted step is correctly dropped', () => {
    const steps = TEMPLATES['ML-KEM round trip'] // t1 generate, t2 encapsulate, t3 decapsulate
    const generated = emitPipeline(steps, {})
    const lines = generated.split('\n')
    const t2 = markerLine(lines, 't2')
    const t3 = markerLine(lines, 't3')
    const edited = [...lines.slice(0, t2), ...lines.slice(t3)].join('\n')
    const result = tryParsePipelineFromEditedCode(edited, steps)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.steps.map((s) => s.id)).toEqual(['t1', 't3'])
  })

  it('(e) two reordered steps are correctly reordered', () => {
    const steps = TEMPLATES['Hybrid signature'] // t1, t2 independent generates, then t3-t5
    const generated = emitPipeline(steps, {})
    const lines = generated.split('\n')
    const t1 = markerLine(lines, 't1')
    const t2 = markerLine(lines, 't2')
    const t3 = markerLine(lines, 't3')
    const block1 = lines.slice(t1, t2)
    const block2 = lines.slice(t2, t3)
    const edited = [...lines.slice(0, t1), ...block2, ...block1, ...lines.slice(t3)].join('\n')
    const result = tryParsePipelineFromEditedCode(edited, steps)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.steps.map((s) => s.id)).toEqual(['t2', 't1', 't3', 't4', 't5'])
  })

  it('(f) an unrecognizable edit FAILS with a reason naming the right step, and does not silently produce wrong steps (sabotage case)', () => {
    const steps = TEMPLATES['Encrypt + sign (PQ)']
    const generated = emitPipeline(steps, {})
    const lines = generated.split('\n')
    const t2 = markerLine(lines, 't2') // aes-256-gcm encrypt — no literal/bytes params at all
    // insert an extra statement right inside t2's try block — a shape no
    // literal-substitution can explain away.
    lines.splice(t2 + 2, 0, '            print("SABOTAGE — extra logic inserted")')
    const edited = lines.join('\n')
    const result = tryParsePipelineFromEditedCode(edited, steps)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('`t2`')
  })

  it('a marker for a step id not present in originalSteps fails, naming that id, without guessing at what it does', () => {
    const steps = TEMPLATES['ML-KEM round trip']
    const generated = emitPipeline(steps, {})
    const lines = generated.split('\n')
    const t1 = markerLine(lines, 't1')
    const injected = [
      '        # ── new-step · Extra · sign ──',
      '        try:',
      '            pass',
      '        except Exception as _e:',
      '            raise',
      '',
    ]
    const edited = [...lines.slice(0, t1), ...injected, ...lines.slice(t1)].join('\n')
    const result = tryParsePipelineFromEditedCode(edited, steps)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('`new-step`')
  })
})
