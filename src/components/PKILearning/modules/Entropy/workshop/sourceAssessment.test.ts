// SPDX-License-Identifier: GPL-3.0-only
//
// P0.3 — a bad raw source must be caught BEFORE conditioning, because after
// conditioning it looks random. P0.5 — the combined-source conclusion comes
// from stated assumptions and can end in "not enough evidence" or "unsafe".
import { describe, it, expect } from 'vitest'
import { runVisualizationChecks } from '../utils/entropyTests'
import {
  accountEntropy,
  assessConstruction,
  assessRawSource,
  conditionedBlockEntropyBits,
  COUNTEREXAMPLES,
  creditedEntropyBits,
  DECLARED_MIN_ENTROPY_PER_SAMPLE,
  fullEntropyConditioningRequirement,
  instantiateEntropyRequirement,
  outputEntropy,
  simulateRawSamples,
  VETTED_CONDITIONER_BOUNDS,
  type ConstructionAssumptions,
  type SeedMaterial,
  type SourceContribution,
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

/** Two healthy sources, 64 samples each at H = 4 → 256 bits each; A may be adversary-controlled. */
function sources(aFailed = false, bFailed = false): SourceContribution[] {
  return [
    { name: 'Source A', failed: aFailed, samplesUsed: 64, mayBeAdversaryControlled: true },
    { name: 'Source B', failed: bFailed, samplesUsed: 64 },
  ]
}
/** Concatenated 2 × 64 bytes, delivered to the DRBG unconditioned. */
const UNCONDITIONED: SeedMaterial = { kind: 'unconditioned', bitstringBits: 1024 }
/** The Step 4 pipeline: one Hash_df block over the 1024-bit concatenation. */
const ONE_HASH_DF_BLOCK: SeedMaterial = {
  kind: 'conditioned-block',
  inputBits: 1024,
  bound: VETTED_CONDITIONER_BOUNDS['hash-df'],
}

describe('assessConstruction — outcome follows the stated assumptions', () => {
  const best: ConstructionAssumptions = {
    independence: 'independent',
    adversaryControl: 'none',
    failureHandling: 'detected-excluded',
    sourceValidation: 'validated',
    inputFreshness: 'fresh',
    rbgClass: 'RBG2(P)',
    sources: sources(),
    assembly: 'concat',
    seed: UNCONDITIONED,
    failedSourceOutputUsed: false,
  }

  it('reaches at best "consistent with the stated assumptions", never "secure"', () => {
    const r = assessConstruction(best)
    expect(r.verdict).toBe('consistent-with-assumptions')
    expect(r.reasons.join(' ')).toContain('Random Bit Generator Validation Certificate')
    expect(JSON.stringify(r).toLowerCase()).not.toContain('remains secure')
  })

  it('stuck source detected and excluded → not enough entropy → not enough evidence', () => {
    const r = assessConstruction({ ...best, sources: sources(true) })
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
      assessConstruction({ ...best, rbgClass: 'RBG3(XOR)', sources: sources(true) }).verdict
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
      for (const seed of [UNCONDITIONED, ONE_HASH_DF_BLOCK]) {
        const r = assessConstruction({
          ...cx.assumptions,
          sources: sources(cx.sourceA !== 'healthy'),
          assembly: 'concat',
          seed,
          failedSourceOutputUsed: cx.useFailedSource,
        })
        expect(r.verdict, `${cx.id} / ${seed.kind}`).not.toBe('consistent-with-assumptions')
        expect(r.reasons.length, cx.id).toBeGreaterThan(0)
      }
    }
  })
})

// Review pass 2, H1: a design with an attacker-controlled source reached
// "consistent with the stated assumptions" because the credit ignored the
// adversary. Reproduces the reviewer's exact assumptions.
describe('H1 — adversary control zeroes the controlled source', () => {
  const reviewerScenario: ConstructionAssumptions = {
    independence: 'independent',
    adversaryControl: 'choose',
    failureHandling: 'detected-excluded',
    sourceValidation: 'validated',
    inputFreshness: 'fresh',
    rbgClass: 'RBG2(P)',
    sources: sources(),
    assembly: 'concat',
    seed: UNCONDITIONED,
    failedSourceOutputUsed: false,
  }

  for (const adversaryControl of ['choose', 'observe'] as const) {
    it(`independent + ${adversaryControl}: A counts 0, only B's 256 bits remain → not consistent`, () => {
      const a = { ...reviewerScenario, adversaryControl }
      expect(accountEntropy(a.sources, a.seed, { adversaryControl, assembly: 'concat' })).toEqual({
        inputEntropyBits: 256,
        seedEntropyBits: 256,
      })
      const r = assessConstruction(a)
      expect(r.verdict).toBe('not-enough-evidence')
      expect(r.reasons.join(' ')).toMatch(/Source A is credited 0 bits/)
      expect(r.reasons.join(' ')).toContain('384')
    })

    it(`${adversaryControl} + an RBG3 claim → unsafe`, () => {
      expect(
        assessConstruction({ ...reviewerScenario, adversaryControl, rbgClass: 'RBG3(RS)' }).verdict
      ).toBe('unsafe')
    })
  }

  it('creditedEntropyBits applies the same rule the verdict uses', () => {
    expect(creditedEntropyBits(sources(), 4, { adversaryControl: 'none' })).toBe(512)
    expect(creditedEntropyBits(sources(), 4, { adversaryControl: 'observe' })).toBe(256)
    expect(creditedEntropyBits(sources(), 4, { adversaryControl: 'choose' })).toBe(256)
    // 'unknown' is reported as missing evidence, not silently zeroed
    expect(creditedEntropyBits(sources(), 4, { adversaryControl: 'unknown' })).toBe(512)
  })

  it('XOR / hash / HMAC assembly credits only the largest single source (§2.6 item 8)', () => {
    for (const assembly of ['xor', 'hash', 'hmac'] as const) {
      expect(creditedEntropyBits(sources(), 4, { assembly }), assembly).toBe(256)
    }
    expect(creditedEntropyBits(sources(), 4, { assembly: 'concat' })).toBe(512)
  })
})

// Review pass 2, H2: one 256-bit conditioned block was credited the full 512
// bits of its input, and compared with the 384-bit instantiation requirement.
describe('H2 — conditioner input/output bound', () => {
  // Reference values computed independently with mpmath at 400 digits from the
  // SP 800-90B §3.1.5.1.2 Output_Entropy steps.
  it.each([
    [1024, 256, 256, 512, 256],
    [1024, 256, 256, 320, 256],
    [1024, 256, 256, 256, 255],
    [1024, 256, 256, 128, 128],
    [1024, 128, 128, 512, 128],
    [1024, 256, 256, 257, 255.415037499279],
    [256, 256, 256, 256, 251.689764568727],
  ])('Output_Entropy(nin=%i, nout=%i, nw=%i, hin=%i) = %f', (nIn, nOut, nW, hIn, want) => {
    expect(outputEntropy(nIn, nOut, nW, hIn)).toBeCloseTo(want, 9)
  })

  it('a conditioned block never holds more than its input entropy or its output length', () => {
    for (const mode of ['hash-df', 'hash', 'hmac', 'aes-cmac'] as const) {
      const b = VETTED_CONDITIONER_BOUNDS[mode]
      for (const hIn of [0, 64, 128, 256, 320, 512, 1024]) {
        const got = conditionedBlockEntropyBits(hIn, 1024, b)
        expect(got, `${mode} hin=${hIn}`).toBeLessThanOrEqual(hIn)
        expect(got, `${mode} hin=${hIn}`).toBeLessThanOrEqual(b.outputBits)
      }
    }
    expect(conditionedBlockEntropyBits(512, 1024, VETTED_CONDITIONER_BOUNDS['hash-df'])).toBe(256)
    expect(conditionedBlockEntropyBits(256, 1024, VETTED_CONDITIONER_BOUNDS['hash-df'])).toBe(255)
    // one vetted CMAC call is 128 bits (SP 800-90B Table 1); the demo's second block is not credited
    expect(conditionedBlockEntropyBits(512, 1024, VETTED_CONDITIONER_BOUNDS['aes-cmac'])).toBe(128)
  })

  it('the default pipeline (two healthy sources, one Hash_df block) cannot meet 3s/2 = 384', () => {
    const a: ConstructionAssumptions = {
      independence: 'independent',
      adversaryControl: 'none',
      failureHandling: 'detected-excluded',
      sourceValidation: 'validated',
      inputFreshness: 'fresh',
      rbgClass: 'RBG2(P)',
      sources: sources(),
      assembly: 'concat',
      seed: ONE_HASH_DF_BLOCK,
      failedSourceOutputUsed: false,
    }
    expect(accountEntropy(a.sources, a.seed)).toEqual({
      inputEntropyBits: 512,
      seedEntropyBits: 256,
    })
    const r = assessConstruction(a)
    expect(r.verdict).toBe('not-enough-evidence')
    expect(r.reasons.join(' ')).toMatch(/Only 256 bits of entropy reach the DRBG/)
    expect(assessConstruction({ ...a, rbgClass: 'RBG3(XOR)' }).verdict).toBe('unsafe')
    // The same sources delivered unconditioned do carry 512 ≥ 384 bits.
    expect(assessConstruction({ ...a, seed: UNCONDITIONED }).verdict).toBe(
      'consistent-with-assumptions'
    )
  })
})
