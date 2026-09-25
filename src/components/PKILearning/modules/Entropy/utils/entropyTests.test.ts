// SPDX-License-Identifier: GPL-3.0-only
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
  aptWindowSize,
  rctCutoff,
  repetitionCountTest,
  runAllTests,
  runHealthTests,
  runVisualizationChecks,
} from './entropyTests'

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
})
