// SPDX-License-Identifier: AGPL-3.0-only
//
// Covers the Adaptive Proportion Test added 2026-08-12 — SP 800-90B §4.4.2, the
// second of the two continuous health tests the standard requires. Until this
// landed the tool shipped only Repetition Count (§4.4.1) while describing
// itself as an "SP 800-90B entropy test suite".
//
// The point of APT is to catch a source that becomes BIASED toward a value
// without repeating it consecutively — which Repetition Count cannot see. The
// interleaved case below is the one that matters: it passes §4.4.1 and fails
// §4.4.2, so it is what justifies the test existing at all.
import { describe, it, expect } from 'vitest'
import {
  adaptiveProportionTest,
  aptCutoff,
  groupResults,
  aptWindowSize,
  rctCutoff,
  repetitionCountTest,
  runAllTests,
  runHealthTests,
  runsStatistic,
  runsTest,
  runVisualizationChecks,
} from './entropyTests'
import { BAD_SAMPLE_PATTERN_1024 } from './entropyConstants'

/** Uniform random bytes — stands in for a healthy source. */
function goodSource(n = 4096): Uint8Array {
  const out = new Uint8Array(n)
  // Deterministic LCG so the test can never flake on an unlucky draw.
  let s = 0x2545f491
  for (let i = 0; i < n; i++) {
    s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff
    out[i] = (s >>> 16) & 0xff
  }
  return out
}

describe('adaptiveProportionTest — SP 800-90B §4.4.2', () => {
  it('passes a healthy uniform source', () => {
    const r = adaptiveProportionTest(goodSource())
    expect(r.passed).toBe(true)
    expect(r.value).toBeLessThan(r.threshold)
  })

  it('fails a source stuck at one value', () => {
    const r = adaptiveProportionTest(new Uint8Array(4096)) // all zeros
    expect(r.passed).toBe(false)
  })

  it('catches a biased source that Repetition Count misses', () => {
    // 0xAA on every other byte, random in between: no two identical bytes are
    // ever adjacent, so the longest run is 1 and §4.4.1 is satisfied — but half
    // the window is a single value, which is exactly the §4.4.2 failure mode.
    const rnd = goodSource(4096)
    const biased = new Uint8Array(4096)
    for (let i = 0; i < biased.length; i++) {
      biased[i] = i % 2 === 0 ? 0xaa : rnd[i] === 0xaa ? 0x01 : rnd[i]
    }

    expect(repetitionCountTest(biased).passed).toBe(true) // §4.4.1 sees nothing
    expect(adaptiveProportionTest(biased).passed).toBe(false) // §4.4.2 does
  })

  it('uses the non-binary window W = 512 for byte samples (§4.4.2)', () => {
    expect(aptWindowSize(false)).toBe(512)
    expect(aptWindowSize(true)).toBe(1024)
    const r = adaptiveProportionTest(goodSource())
    expect(r.description).toContain('512-sample window')
    // SP 800-90B Table 2: H = 8, W = 512, alpha = 2^-20 → C = 13.
    expect(r.threshold).toBe(13)
  })

  it('scores a short sample instead of silently passing it', () => {
    const r = adaptiveProportionTest(new Uint8Array(64)) // all zeros, < one window
    expect(r.passed).toBe(false)
    expect(r.detail).toContain('partial window')
  })

  it('reports insufficient data rather than throwing', () => {
    const r = adaptiveProportionTest(new Uint8Array(1))
    expect(r.passed).toBe(false)
    expect(r.detail).toBe('Insufficient data')
  })
})

describe('SP 800-90B cutoffs — published values', () => {
  it('applies the displayed cutoffs without silently raising low entropy estimates', () => {
    const data = new Uint8Array(1024)
    for (const h of [0.005, 0.05, 0.1, 0.415, 1, 8]) {
      expect(repetitionCountTest(data, h).threshold).toBe(rctCutoff(h))
      expect(adaptiveProportionTest(data, h).threshold).toBe(aptCutoff(512, h))
    }
    expect(adaptiveProportionTest(data, 0.05).threshold).toBe(511)
    expect(repetitionCountTest(data, 0.005).threshold).toBe(4001)
  })

  it('preserves an unreachable cutoff instead of lowering it to the window size', () => {
    expect(aptCutoff(512, 0.005)).toBe(513)
    expect(aptCutoff(512, Number.MIN_VALUE)).toBe(513)
    const result = adaptiveProportionTest(new Uint8Array(512), 0.005)
    expect(result.threshold).toBe(513)
    expect(result.detail).toContain('No count within this window can reach the cutoff')
  })

  it('signals failure at the exact low-entropy cutoff, not below it', () => {
    const at = new Uint8Array(512)
    at[511] = 1
    const below = at.slice()
    below[510] = 1
    expect(adaptiveProportionTest(at, 0.05).passed).toBe(false)
    expect(adaptiveProportionTest(below, 0.05).passed).toBe(true)
  })

  it('rejects invalid assumptions rather than substituting different ones', () => {
    for (const h of [0, -1, NaN, Infinity, 9]) {
      expect(() => rctCutoff(h)).toThrow(RangeError)
      expect(() => aptCutoff(512, h)).toThrow(RangeError)
    }
    for (const alpha of [0, 1, NaN]) expect(() => aptCutoff(512, 1, alpha)).toThrow(RangeError)
    expect(() => adaptiveProportionTest(new Uint8Array(1024), 2, undefined, true)).toThrow(
      RangeError
    )
  })
  // SP 800-90B Table 2 "Example cutoff values of the Adaptive Proportion Test",
  // alpha = 2^-20. Byte-for-byte the table, so a wrong window or tail formula fails.
  const TABLE_2_BINARY_W1024: Array<[number, number]> = [
    [0.2, 941],
    [0.4, 840],
    [0.6, 748],
    [0.8, 664],
    [1, 589],
  ]
  const TABLE_2_NONBINARY_W512: Array<[number, number]> = [
    [0.5, 410],
    [1, 311],
    [2, 177],
    [4, 62],
    [8, 13],
  ]

  for (const [H, C] of TABLE_2_BINARY_W1024) {
    it(`APT binary W=1024, H=${H} → C=${C}`, () => {
      expect(aptCutoff(1024, H)).toBe(C)
    })
  }
  for (const [H, C] of TABLE_2_NONBINARY_W512) {
    it(`APT non-binary W=512, H=${H} → C=${C}`, () => {
      expect(aptCutoff(512, H)).toBe(C)
    })
  }

  it('RCT cutoff matches the §4.4.1 worked examples', () => {
    // "for alpha = 2^-20, an entropy source with H = 2.0 bits per sample would
    // have a repetition count test cutoff value of 1+20/2.0 = 11"
    expect(rctCutoff(2, 2 ** -20)).toBe(11)
    // "a noise source evaluated at eight bits of min-entropy per sample has a
    // cutoff value of six repetitions to ensure a false-positive rate of
    // approximately once per 10^12 samples" (alpha = 2^-40)
    expect(rctCutoff(8, 2 ** -40)).toBe(6)
  })

  it('RCT fails at exactly C repetitions and passes at C - 1', () => {
    const C = rctCutoff(8) // 4 at alpha = 2^-20
    const atC = new Uint8Array(64)
    const belowC = new Uint8Array(64)
    for (let i = 0; i < 64; i++) {
      atC[i] = i < C ? 0x42 : i
      belowC[i] = i < C - 1 ? 0x42 : i
    }
    expect(repetitionCountTest(atC).passed).toBe(false)
    expect(repetitionCountTest(belowC).passed).toBe(true)
  })
})

describe('result groups (P0.4)', () => {
  it('tags every result with its group and a sample-size limit', () => {
    for (const r of runAllTests(goodSource())) {
      expect(['visualization', 'health']).toContain(r.group)
      expect(r.sampleLimit.length).toBeGreaterThan(20)
    }
  })

  it('never computes an SP 800-90B estimator or a 6-bits/byte pass mark', () => {
    const results = runAllTests(goodSource())
    expect(results.map((r) => r.name)).not.toContain('Min-Entropy')
    expect(results.some((r) => r.group === 'estimator')).toBe(false)
    expect(results.some((r) => /6 bits\/byte/.test(r.description))).toBe(false)
  })

  it('includes both approved SP 800-90B §4.4 health tests', () => {
    const names = runHealthTests(goodSource()).map((t) => t.name)
    expect(names).toEqual(['Repetition Count', 'Adaptive Proportion'])
  })

  it('shows the expected lesson: a predictable LCG passes the visual checks', () => {
    // goodSource() IS a linear congruential generator — fully predictable from
    // its state — and it passes group 1. That is why group 1 gives no verdict.
    const failed = runVisualizationChecks(goodSource(8192))
      .filter((t) => !t.passed)
      .map((t) => `${t.name}: ${t.detail}`)
    expect(failed).toEqual([])
  })

  it('states the startup-sample shortfall on a small buffer (§4.3 item 4)', () => {
    const [rct] = runHealthTests(goodSource(64))
    expect(rct.sampleLimit).toContain('fewer than the 1024 consecutive samples')
  })

  it('groupResults keeps visual checks and health tests apart, in group order', () => {
    const groups = groupResults(runAllTests(goodSource()))
    expect(groups.map((g) => g.group)).toEqual(['visualization', 'health'])
    for (const g of groups) expect(g.results.every((r) => r.group === g.group)).toBe(true)
  })

  it('the exercise outcomes hold: pattern trips only APT, a counter trips no health test', () => {
    const health = (d: Uint8Array) =>
      Object.fromEntries(runHealthTests(d).map((r) => [r.name, r.passed]))
    const pattern = new Uint8Array(64).map((_, i) => [0xde, 0xad, 0xbe, 0xef][i % 4])
    const counter = new Uint8Array(64).map((_, i) => i)
    expect(health(new Uint8Array(64))).toEqual({
      'Repetition Count': false,
      'Adaptive Proportion': false,
    })
    expect(health(pattern)).toEqual({ 'Repetition Count': true, 'Adaptive Proportion': false })
    expect(health(counter)).toEqual({ 'Repetition Count': true, 'Adaptive Proportion': true })
  })

  it('the 1,024-byte Repeating Pattern sample fails the real §4.4.2 test on full windows', () => {
    const data = BAD_SAMPLE_PATTERN_1024
    expect(data.length).toBe(1024) // meets the §4.3 item 4 startup minimum
    expect(Array.from(data.slice(0, 8))).toEqual([0xde, 0xad, 0xbe, 0xef, 0xde, 0xad, 0xbe, 0xef])
    const apt = adaptiveProportionTest(data)
    expect(apt.passed).toBe(false)
    expect(apt.threshold).toBe(13) // Table 2: H = 8, W = 512
    expect(apt.value).toBe(128) // 0xDE recurs 128 times in each 512-sample window
    expect(apt.detail).not.toContain('partial window')
    expect(apt.detail).toContain('2 windows')
    expect(repetitionCountTest(data).passed).toBe(true) // no byte repeats back-to-back
    expect(apt.sampleLimit).not.toContain('fewer than the 1024')
  })
})

// ── Runs check — NIST SP 800-22 Rev. 1a §2.3 ────────────────────────────────

/** erfc(x) from the Taylor series of erf — independent of the code under test. */
function erfc(x: number): number {
  const a = Math.abs(x)
  if (a > 6) return x > 0 ? 0 : 2
  let term = a
  let sum = a
  for (let k = 1; k < 200; k++) {
    term *= (-a * a) / k
    sum += term / (2 * k + 1)
  }
  const erf = (2 / Math.sqrt(Math.PI)) * sum
  return x >= 0 ? 1 - erf : 1 + erf
}

/** The §2.3.4 step 4 P-value for the tool's Z: erfc(Z / sqrt 2). */
const nistPValue = (z: number) => erfc(z / Math.SQRT2)

const bitsOf = (text: string) => Array.from(text, (c) => Number(c))
const bitString = (data: Uint8Array) =>
  Array.from(data, (b) => b.toString(2).padStart(8, '0')).join('')
const fromHex = (hex: string) =>
  Uint8Array.from(hex.match(/../g)!.map((pair) => parseInt(pair, 16)))

/** Seeded generator (mulberry32) so the simulation can never flake on an unlucky draw. */
function seededBytes(seed: number) {
  let a = seed >>> 0
  return (length: number) => {
    const out = new Uint8Array(length)
    for (let i = 0; i < length; i += 4) {
      a = (a + 0x6d2b79f5) >>> 0
      let t = a
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      const word = (t ^ (t >>> 14)) >>> 0
      for (let j = 0; j < 4 && i + j < length; j++) out[i + j] = (word >>> (8 * j)) & 0xff
    }
    return out
  }
}

describe('runsTest — NIST SP 800-22 Rev. 1a §2.3', () => {
  // §2.3.4: "ε = 1001101011, then n=10 and π = 6/10 = 3/5"; step 3:
  // "V10(obs)=(1+0+1+0+1+1+1+1+0)+1=7" (printed p. 2-6, PDF p. 28); step 4:
  // "For the example, P-value = erfc( ... ) = 0.147232" and §2.3.6 concludes the
  // sequence is random because the P-value is >= 0.01 (printed p. 2-7, PDF p. 29).
  it('reproduces the §2.3.4 worked example: n = 10, pi = 3/5, V_obs = 7, P-value = 0.147232', () => {
    const s = runsStatistic(bitsOf('1001101011'))
    expect(s.n).toBe(10)
    expect(s.pi).toBeCloseTo(3 / 5, 12)
    expect(s.runs).toBe(7)
    expect(s.expectedRuns).toBeCloseTo(2 * 10 * (3 / 5) * (2 / 5), 12) // 4.8
    expect(nistPValue(s.zScore)).toBeCloseTo(0.147232, 6)
    expect(nistPValue(s.zScore)).toBeGreaterThanOrEqual(0.01) // §2.3.5: random
    expect(s.zScore).toBeLessThanOrEqual(2.576) // the tool's cutoff agrees
  })

  // P-values below come from the §2.3.4 formula evaluated outside this code base.
  it.each([
    ['0x55 x 16 (alternating)', '55555555555555555555555555555555', 128, 128, 1.1224297e-29],
    ['0x0f x 16 (slow oscillation)', '0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f', 128, 32, 1.5417258e-8],
    ['random-looking, P = 0.7257', 'f56e67fb50f27264c331011c47c50aae', 128, 62, 0.7256806886581656],
  ])('matches the §2.3.4 formula on %s', (_label, hex, n, runs, p) => {
    const data = fromHex(hex)
    const s = runsStatistic(bitsOf(bitString(data)))
    expect(s.n).toBe(n)
    expect(s.runs).toBe(runs)
    const result = runsTest(data)
    expect(result.value).toBeCloseTo(s.zScore, 12)
    expect(nistPValue(result.value)).toBeCloseTo(p, 8)
    expect(result.passed).toBe(p >= 0.01)
  })

  it('fails a 128-bit sequence with P = 0.0085 and passes one with P = 0.0132', () => {
    // The first has V_obs = 49 and pi = 61/128; the second V_obs = 78 and pi = 65/128.
    const failing = runsTest(fromHex('b61c0c746f6600397083ef184e6f3879'))
    const passing = runsTest(fromHex('d2536da62574a3874db75c62d7cd504a'))
    expect(nistPValue(failing.value)).toBeCloseTo(0.008474, 5)
    expect(failing.passed).toBe(false)
    expect(nistPValue(passing.value)).toBeCloseTo(0.013203, 5)
    expect(passing.passed).toBe(true)
  })

  it('reports Z on the normal scale: the 2.576 cutoff is the SP 800-22 1% P-value', () => {
    const { threshold } = runsTest(goodSource(128))
    expect(threshold).toBe(2.576)
    expect(nistPValue(threshold)).toBeCloseTo(0.01, 4)
  })

  it('fails about 1% of fair random 1,024-bit sequences, and agrees with P < 0.01 on each', () => {
    const next = seededBytes(0x5eed1)
    const trials = 20000
    let failed = 0
    let disagreements = 0
    for (let i = 0; i < trials; i++) {
      const r = runsTest(next(128))
      if (!r.passed) failed++
      if (r.passed !== nistPValue(r.value) >= 0.01) disagreements++
    }
    // This seed gives 211 failures (1.06%). A Z that is 1/sqrt 2 of the true value gives about 0.03%.
    expect(failed / trials).toBeGreaterThan(0.005)
    expect(failed / trials).toBeLessThan(0.015)
    expect(disagreements).toBe(0)
  })

  it('still fails the Repeating Pattern sample', () => {
    const r = runsTest(BAD_SAMPLE_PATTERN_1024)
    expect(r.passed).toBe(false)
    // n = 8192, pi = 0.75, V_obs = 4097: Z = |4097 - 3072| / (2 * sqrt(8192) * 0.1875)
    expect(r.value).toBeCloseTo(30.1994, 3)
  })
})
