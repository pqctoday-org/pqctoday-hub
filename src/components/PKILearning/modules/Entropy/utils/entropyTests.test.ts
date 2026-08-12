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
import { adaptiveProportionTest, repetitionCountTest, runAllTests } from './entropyTests'

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

  it('derives a cutoff in the range an ideal 8-bit source implies', () => {
    // W=1024, p=2^-8 → mean 4 recurrences. The 2^-20 tail cutoff sits well
    // above the mean but far below the window size; a cutoff outside this band
    // would mean the binomial maths is wrong, not merely differently rounded.
    const r = adaptiveProportionTest(goodSource())
    expect(r.threshold).toBeGreaterThan(4)
    expect(r.threshold).toBeLessThan(64)
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

describe('runAllTests', () => {
  it('includes both health tests SP 800-90B requires', () => {
    const names = runAllTests(goodSource()).map((t) => t.name)
    expect(names).toContain('Repetition Count') // §4.4.1
    expect(names).toContain('Adaptive Proportion') // §4.4.2
  })

  it('passes every test on a healthy source', () => {
    const failed = runAllTests(goodSource(8192))
      .filter((t) => !t.passed)
      .map((t) => `${t.name}: ${t.detail}`)
    expect(failed).toEqual([])
  })
})
