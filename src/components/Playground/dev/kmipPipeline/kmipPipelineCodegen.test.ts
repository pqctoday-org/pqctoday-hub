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
import { emitKmipPipeline } from './kmipPipelineCodegen'
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
    expect(code).toContain("c.create_key_pair('ML_DSA_65'")
    expect(code).not.toContain("c.create_key_pair('ML-DSA-65'")
    expect(code).not.toContain(
      "c.sign(priv_create, b'pqctoday KMIP Developer tab payload', 'ML-DSA-65')"
    )
  })
})
