// SPDX-License-Identifier: GPL-3.0-only
//
// Codegen regression coverage for the KMIP lane (dev-tabs-pkcs11-kmip plan
// G6). The deniable-step test locks in a REAL bug found and fixed during
// P3b's live verification: the first "Governed lifecycle" run failed for
// real (KMIP WrongKeyLifecycleState on the intentionally-early Sign step)
// because op-step emission unconditionally raised on failure — correct for
// every OTHER step, wrong for a step a later expect-deny step is meant to
// judge. This test is what stops that regressing silently.
import { describe, expect, it } from 'vitest'
import {
  emitKmipPipeline,
  tryParsePipelineFromEditedCode,
  type KmipOpStep,
  type KmipStep,
} from './kmipPipelineCodegen'
import { KMIP_TEMPLATES, KMIP_TEMPLATE_NAMES } from './kmipPipelineTemplates'

describe('emitKmipPipeline — template snapshots', () => {
  for (const name of KMIP_TEMPLATE_NAMES) {
    it(`emits stable code for "${name}"`, () => {
      const code = emitKmipPipeline(KMIP_TEMPLATES[name], { message: 'test payload' })
      expect(code).toMatchSnapshot()
    })
  }
})

describe('emitKmipPipeline — deniable-step raise suppression (real bug, P3b)', () => {
  const steps = KMIP_TEMPLATES['Governed lifecycle']
  const code = emitKmipPipeline(steps, {})
  const stepBlock = (id: string) => {
    const start = code.indexOf(`# ── ${id} ·`)
    const end = code.indexOf('# ──', start + 1)
    return code.slice(start, end === -1 ? undefined : end)
  }

  it('a step targeted by a LATER expect-deny does NOT raise on failure', () => {
    const block = stepBlock('sign-early')
    expect(block).not.toMatch(/if not r_sign_early\.ok: raise/)
  })

  it('the SAME primitive/op NOT targeted by expect-deny DOES raise on failure', () => {
    const block = stepBlock('sign')
    expect(block).toMatch(/if not r_sign\.ok: raise RuntimeError/)
  })

  it('every other lifecycle step in the template still raises on failure (only the deniable one is special-cased)', () => {
    for (const id of ['create', 'activate', 'attrs', 'locate', 'revoke', 'destroy']) {
      const block = stepBlock(id)
      expect(block, `step ${id} should still raise on failure`).toMatch(
        /if not r_\w+\.ok: raise RuntimeError/
      )
    }
  })

  it('the expect-deny step itself asserts non-ok and raises if the target was unexpectedly allowed', () => {
    const block = stepBlock('deny-early')
    expect(block).toContain('_denied = not r_sign_early.ok')
    expect(block).toMatch(/if not _denied: raise RuntimeError/)
  })
})

describe('emitKmipPipeline — algorithm normalization', () => {
  it('emits the real sandbox-convention algorithm name (underscore) as the actual call argument', () => {
    // The shim normalizes ML-DSA-65 -> ML_DSA_65 internally (see
    // pqctoday_kmip/__init__.py's _normalize_algorithm) — codegen must pass
    // the SANDBOX convention as the real call argument, matching what the
    // real 17-kmip-cacp.py sample writes. (The hyphenated "ML-DSA-65" form
    // legitimately still appears in the emitted comments/print labels —
    // those are display text, not the algorithm argument this test checks.)
    const code = emitKmipPipeline(KMIP_TEMPLATES['Governed lifecycle'], {})
    expect(code).toContain("leaf('CryptographicAlgorithm', 'Enumeration', 'ML_DSA_65')")
    expect(code).not.toContain("leaf('CryptographicAlgorithm', 'Enumeration', 'ML-DSA-65')")
  })
})

describe('emitKmipPipeline — messageMode (G9, W3b: genuinely binary payloads)', () => {
  it('text mode (default) is unchanged: a plain bytes literal, hex-encoded at runtime', () => {
    const code = emitKmipPipeline(KMIP_TEMPLATES['Governed lifecycle'], { message: 'hello' })
    expect(code).toContain("leaf('Data', 'ByteString', b'hello'.hex())")
    expect(code).not.toContain('fromhex')
  })

  it('hex mode passes the hex text straight through, not a bytes literal', () => {
    const code = emitKmipPipeline(KMIP_TEMPLATES['Governed lifecycle'], {
      message: 'ff00fe0180deadbeef',
      messageMode: 'hex',
    })
    expect(code).toContain("leaf('Data', 'ByteString', 'ff00fe0180deadbeef')")
    expect(code).not.toContain("b'ff00fe0180deadbeef'")
  })

  it('hex mode applies to every sign step the template has, not just the first', () => {
    const code = emitKmipPipeline(KMIP_TEMPLATES['Governed lifecycle'], {
      message: 'deadbeef',
      messageMode: 'hex',
    })
    const signCalls = code.match(/c\.submit\('Sign',/g) ?? []
    const hexLeaves = code.match(/leaf\('Data', 'ByteString', 'deadbeef'\)/g) ?? []
    expect(signCalls.length).toBeGreaterThan(1)
    expect(hexLeaves).toHaveLength(signCalls.length)
  })
})

describe('tryParsePipelineFromEditedCode — reverse-parsing the Code tab back to KMIP steps', () => {
  const markerLine = (lines: string[], id: string) =>
    lines.findIndex((l) => l.includes(`# ── ${id} ·`))

  it('(a) no edits round-trips to the identical steps', () => {
    const steps = KMIP_TEMPLATES['Governed lifecycle']
    const code = emitKmipPipeline(steps, {})
    const result = tryParsePipelineFromEditedCode(code, steps)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.steps).toEqual(steps)
  })

  it('(b) an edited literal string value is correctly extracted', () => {
    // No shipped template binds an op param literally (the builder always binds
    // via 'ref') — build one by hand, since a literal IS a legal KmipParamValue
    // and renderRef's 'literal' branch does render it as a quoted string.
    const steps: KmipStep[] = [
      {
        kind: 'op',
        id: 'k1',
        primId: 'ml-dsa-65',
        op: 'getAttributes',
        params: { uid: { bind: 'literal', value: 'some-uid-1' } },
      },
    ]
    const generated = emitKmipPipeline(steps, {})
    expect(generated).toContain("leaf('UniqueIdentifier', 'TextString', 'some-uid-1')")
    const edited = generated.replace("'some-uid-1'", "'some-uid-2'")
    const result = tryParsePipelineFromEditedCode(edited, steps)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const k1 = result.steps[0] as KmipOpStep
      expect(k1.params.uid).toEqual({ bind: 'literal', value: 'some-uid-2' })
    }
  })

  it('(c) an edited literal "bytes" (hex-mode Sign message) value is correctly extracted', () => {
    // KMIP has no separate bytes-bind ParamValue — the structurally equivalent
    // binary-literal surface is a Sign step's message in hex mode, which emits
    // `bytes.fromhex('...')` instead of a plain b'...' literal (see
    // kmipPipelineCodegen.ts's KmipMessageMode doc). Both shipped Sign steps
    // ('sign-early' and 'sign') use the pipeline-wide message by default, so
    // edit only the 'sign' step's occurrence.
    const steps = KMIP_TEMPLATES['Governed lifecycle']
    const generated = emitKmipPipeline(steps, { message: 'deadbeef', messageMode: 'hex' })
    const lines = generated.split('\n')
    const signStart = markerLine(lines, 'sign')
    const attrsStart = markerLine(lines, 'attrs')
    for (let i = signStart; i < attrsStart; i++) {
      if (lines[i].includes("leaf('Data', 'ByteString', 'deadbeef')")) {
        lines[i] = lines[i].replace(
          "leaf('Data', 'ByteString', 'deadbeef')",
          "leaf('Data', 'ByteString', 'cafebabe')"
        )
      }
    }
    const edited = lines.join('\n')
    const result = tryParsePipelineFromEditedCode(edited, steps, {
      message: 'deadbeef',
      messageMode: 'hex',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      const signStep = result.steps.find((s) => s.id === 'sign') as KmipOpStep
      expect(signStep.params.text).toEqual({ bind: 'literal', value: 'cafebabe' })
      // sign-early is untouched — still no params.text of its own, still using
      // the pipeline-wide message.
      const earlyStep = result.steps.find((s) => s.id === 'sign-early') as KmipOpStep
      expect(earlyStep.params.text).toBeUndefined()
      expect(earlyStep).toBe(steps.find((s) => s.id === 'sign-early'))
    }
  })

  it('(d) a deleted step is correctly dropped', () => {
    const steps = KMIP_TEMPLATES['Governed lifecycle']
    const generated = emitKmipPipeline(steps, {})
    const lines = generated.split('\n')
    const attrs = markerLine(lines, 'attrs')
    const locate = markerLine(lines, 'locate')
    const edited = [...lines.slice(0, attrs), ...lines.slice(locate)].join('\n')
    const result = tryParsePipelineFromEditedCode(edited, steps)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.steps.map((s) => s.id)).not.toContain('attrs')
  })

  it('(e) two reordered steps are correctly reordered', () => {
    const steps = KMIP_TEMPLATES['Governed lifecycle']
    const generated = emitKmipPipeline(steps, {})
    const lines = generated.split('\n')
    const locate = markerLine(lines, 'locate')
    const revoke = markerLine(lines, 'revoke')
    const destroy = markerLine(lines, 'destroy')
    const blockLocate = lines.slice(locate, revoke)
    const blockRevoke = lines.slice(revoke, destroy)
    const edited = [
      ...lines.slice(0, locate),
      ...blockRevoke,
      ...blockLocate,
      ...lines.slice(destroy),
    ].join('\n')
    const result = tryParsePipelineFromEditedCode(edited, steps)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const ids = result.steps.map((s) => s.id)
      expect(ids.indexOf('revoke')).toBeLessThan(ids.indexOf('locate'))
    }
  })

  it('(f) an unrecognizable edit FAILS with a reason naming the right step, and does not silently produce wrong steps (sabotage case)', () => {
    const steps = KMIP_TEMPLATES['Governed lifecycle']
    const generated = emitKmipPipeline(steps, {})
    const lines = generated.split('\n')
    const sign = markerLine(lines, 'sign')
    lines.splice(sign + 2, 0, "    print('SABOTAGE — extra logic inserted')")
    const edited = lines.join('\n')
    const result = tryParsePipelineFromEditedCode(edited, steps)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('`sign`')
  })

  it('a ref identifier changed to something else FAILS rather than silently accepting it', () => {
    const steps = KMIP_TEMPLATES['Governed lifecycle']
    const generated = emitKmipPipeline(steps, {})
    // 'activate' binds uid to priv_create (a ref) — swap it for a different
    // identifier entirely, the exact "guessed wrong" failure mode this feature
    // exists to prevent. Scoped to just the 'activate' block: priv_create is
    // also referenced verbatim by 'sign', so a global replace would touch
    // both steps' text instead of isolating the one edit this test means.
    const lines = generated.split('\n')
    const activateStart = markerLine(lines, 'activate')
    const activateEnd = markerLine(lines, 'sign')
    for (let i = activateStart; i < activateEnd; i++) {
      lines[i] = lines[i].replace('priv_create', 'pub_create')
    }
    const edited = lines.join('\n')
    const result = tryParsePipelineFromEditedCode(edited, steps)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('`activate`')
  })

  it('a marker for a step id not present in originalSteps fails, naming that id', () => {
    const steps = KMIP_TEMPLATES['ML-KEM round trip']
    const generated = emitKmipPipeline(steps, {})
    const lines = generated.split('\n')
    const create = markerLine(lines, 'create')
    const injected = [
      '# ── new-step · Extra step ──',
      'try:',
      '    pass',
      'except Exception as _e:',
      '    raise',
      '',
    ]
    const edited = [...lines.slice(0, create), ...injected, ...lines.slice(create)].join('\n')
    const result = tryParsePipelineFromEditedCode(edited, steps)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toContain('`new-step`')
  })
})
