// SPDX-License-Identifier: GPL-3.0-only
//
// P0.3 — a bad raw source must be caught BEFORE conditioning, because after
// conditioning it looks random. P0.5 — the combined-source conclusion comes
// from stated assumptions and can end in "not enough evidence" or "unsafe".
import { describe, it, expect } from 'vitest'
import { runVisualizationChecks } from '../utils/entropyTests'
import {
  assessConstruction,
  assessRawSource,
  COUNTEREXAMPLES,
  creditedEntropyBits,
  DECLARED_MIN_ENTROPY_PER_SAMPLE,
  fullEntropyConditioningRequirement,
  instantiateEntropyRequirement,
  simulateRawSamples,
  type ConstructionAssumptions,
} from './sourceAssessment'

/** Deterministic stand-in noise so no test can flake on an unlucky draw. */
function fixedNoise(seed = 0x2545f491) {
  let s = seed >>> 0
  return (n: number): Uint8Array => {
    const out = new Uint8Array(n)
    for (let i = 0; i < n; i++) {
      // xorshift32
      s ^= s << 13
      s ^= s >>> 17
      s ^= s << 5
      s >>>= 0
      out[i] = s & 0xff
    }
    return out
  }
}

/** SHA-256 in counter mode — a stand-in for the workshop's vetted conditioning. */
async function conditionSha256(input: Uint8Array, outBytes: number): Promise<Uint8Array> {
  const out = new Uint8Array(outBytes)
  let off = 0
  for (let counter = 1; off < outBytes; counter++) {
    const block = new Uint8Array(input.length + 1)
    block[0] = counter
    block.set(input, 1)
    const d = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', block))
    out.set(d.slice(0, Math.min(d.length, outBytes - off)), off)
    off += d.length
  }
  return out
}

const N = 1024 + 64

describe('raw-source health tests (SP 800-90B §4.4, before conditioning)', () => {
  it('passes a healthy simulated source', () => {
    const raw = simulateRawSamples('healthy', N, fixedNoise())
    expect(assessRawSource(raw).failed).toBe(false)
  })

  it('flags a stuck source with the Repetition Count Test at startup', () => {
    const raw = simulateRawSamples('stuck', N, fixedNoise())
    const h = assessRawSource(raw)
    expect(h.failed).toBe(true)
    expect(h.startup.find((r) => r.name === 'Repetition Count')!.passed).toBe(false)
  })

  it('flags a biased source with the Adaptive Proportion Test, not the RCT', () => {
    const raw = simulateRawSamples('biased', N, fixedNoise())
    const h = assessRawSource(raw)
    expect(h.startup.find((r) => r.name === 'Repetition Count')!.passed).toBe(true)
    const apt = h.startup.find((r) => r.name === 'Adaptive Proportion')!
    expect(apt.passed).toBe(false)
    // H = 4 bits/sample, W = 512 → C = 62 (SP 800-90B Table 2)
    expect(apt.threshold).toBe(62)
  })

  for (const condition of ['stuck', 'biased'] as const) {
    it(`a ${condition} source is flagged raw even though its conditioned output looks random`, async () => {
      const raw = simulateRawSamples(condition, N, fixedNoise())
      expect(assessRawSource(raw).failed).toBe(true) // caught at the raw boundary

      const conditioned = await conditionSha256(raw.slice(1024), 256)
      const visual = runVisualizationChecks(conditioned)
      // After SHA-256 the failed source's output sits within range on every
      // visual check — so testing only the conditioned output would pass it.
      expect(visual.filter((r) => !r.passed).map((r) => r.name)).toEqual([])
    })
  }
})

describe('entropy accounting', () => {
  it('uses the SP 800-90C amounts', () => {
    expect(instantiateEntropyRequirement(256)).toBe(384) // §2.6 item 11: 3s/2
    expect(fullEntropyConditioningRequirement(256)).toBe(320) // §3.2.2.2: output_len + 64
  })

  it('credits only sources that have not failed', () => {
    const both = creditedEntropyBits([
      { name: 'A', failed: false, samplesUsed: 64 },
      { name: 'B', failed: false, samplesUsed: 64 },
    ])
    const oneFailed = creditedEntropyBits([
      { name: 'A', failed: true, samplesUsed: 64 },
      { name: 'B', failed: false, samplesUsed: 64 },
    ])
    expect(both).toBe(2 * 64 * DECLARED_MIN_ENTROPY_PER_SAMPLE)
    expect(oneFailed).toBe(64 * DECLARED_MIN_ENTROPY_PER_SAMPLE)
  })
})

describe('assessConstruction — outcome follows the stated assumptions', () => {
  const best: ConstructionAssumptions = {
    independence: 'independent',
    adversaryControl: 'none',
    failureHandling: 'detected-excluded',
    sourceValidation: 'validated',
    inputFreshness: 'fresh',
    rbgClass: 'RBG2(P)',
    creditedEntropyBits: 512,
    failedSourceOutputUsed: false,
  }

  it('reaches at best "consistent with the stated assumptions", never "secure"', () => {
    const r = assessConstruction(best)
    expect(r.verdict).toBe('consistent-with-assumptions')
    expect(r.reasons.join(' ')).toContain('Random Bit Generator Validation Certificate')
    expect(JSON.stringify(r).toLowerCase()).not.toContain('remains secure')
  })

  it('stuck source detected and excluded → not enough entropy → not enough evidence', () => {
    const r = assessConstruction({ ...best, creditedEntropyBits: 256 })
    expect(r.verdict).toBe('not-enough-evidence')
  })

  it('conditioned output from a failed source → unsafe', () => {
    expect(assessConstruction({ ...best, failedSourceOutputUsed: true }).verdict).toBe('unsafe')
  })

  it('correlated sources → not enough evidence', () => {
    expect(assessConstruction({ ...best, independence: 'correlated' }).verdict).toBe(
      'not-enough-evidence'
    )
  })

  it('malicious cancellation → unsafe', () => {
    const r = assessConstruction({
      ...best,
      independence: 'correlated',
      adversaryControl: 'choose',
    })
    expect(r.verdict).toBe('unsafe')
  })

  it('repeated fixed input → unsafe; stale remote data → not enough evidence', () => {
    expect(assessConstruction({ ...best, inputFreshness: 'repeated' }).verdict).toBe('unsafe')
    expect(assessConstruction({ ...best, inputFreshness: 'stale-remote' }).verdict).toBe(
      'not-enough-evidence'
    )
  })

  it('an RBG3 claim without enough entropy is unsafe as claimed', () => {
    expect(
      assessConstruction({ ...best, rbgClass: 'RBG3(XOR)', creditedEntropyBits: 256 }).verdict
    ).toBe('unsafe')
  })

  it('unvalidated sources or no named SP 800-90C class → not enough evidence', () => {
    expect(assessConstruction({ ...best, sourceValidation: 'not-validated' }).verdict).toBe(
      'not-enough-evidence'
    )
    expect(assessConstruction({ ...best, rbgClass: 'none' }).verdict).toBe('not-enough-evidence')
  })

  it('every shipped counterexample ends in "unsafe" or "not enough evidence"', () => {
    for (const cx of COUNTEREXAMPLES) {
      const credited = cx.sourceA === 'healthy' ? 512 : 256
      const r = assessConstruction({
        ...cx.assumptions,
        creditedEntropyBits: credited,
        failedSourceOutputUsed: cx.useFailedSource,
      })
      expect(r.verdict, cx.id).not.toBe('consistent-with-assumptions')
      expect(r.reasons.length, cx.id).toBeGreaterThan(0)
    }
  })
})
