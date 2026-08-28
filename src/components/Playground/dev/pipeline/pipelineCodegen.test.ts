// SPDX-License-Identifier: GPL-3.0-only
//
// Codegen regression coverage (dev-tabs-pkcs11-kmip plan G6). Snapshots
// every shipped template's emitted Python so a codegen change shows up as
// an intentional, reviewed snapshot diff — plus explicit assertions for the
// two invariants the module's own docstrings call out by name, so a
// reviewer sees WHY these lines matter, not just that a snapshot changed.
import { describe, expect, it } from 'vitest'
import { emitPipeline, DEFAULT_PIPELINE_INPUT } from './pipelineCodegen'
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

  it('omits an explicit slot when none is given (matches the sandbox\'s own emitted code)', () => {
    const code = emitPipeline(steps, {})
    expect(code).toContain("hsm.open_session(pin=PIN)")
    expect(code).not.toContain('slot=')
  })

  it('threads an explicit slot into open_session when one is given (D6: the Developer tab\'s own labeled token, never the shared playground one)', () => {
    const code = emitPipeline(steps, { slot: 7 })
    expect(code).toContain('hsm.open_session(slot=7, pin=PIN)')
  })
})

describe('emitPipeline — no-numeric-literal / no-unquoted-string invariants (pipelinePrimitives.ts / pipelineCodegen.ts headers)', () => {
  it('a sign step\'s mechanism is a named p11.CKM_* constant, never a bare hex/int literal', () => {
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
      id: 's1', primId: 'ml-dsa-65', op: 'sign' as const,
      params: {
        privKey: { bind: 'key' as const, step: 't4', part: 'priv' as const },
        input: { bind: 'literal' as const, value: "o'brien" },
      },
      status: 'idle' as const, output: null,
    }
    const code = emitPipeline([...TEMPLATES['Encrypt + sign (PQ)'].slice(0, 4), step], {})
    // The real defect class this guards against: an earlier generator
    // interpolated free text directly, so a value containing a quote broke
    // the emitted Python's own string syntax.
    expect(code).toContain("\\'brien")
    expect(code).not.toContain("'o'brien'") // the unescaped, syntax-breaking form
  })
})
