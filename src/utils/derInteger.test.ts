// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { canonicalPositiveInteger } from './derInteger'

// Regression coverage for the 2026-08-18 serial-number bug: three separate
// call sites (certBuilder.ts, VpnSimulationPanel.tsx, opTemplates.local.test.ts)
// used to mask only the sign bit (`bytes[0] &= 0x7f`), which stops a value
// from NEEDING a pad but not the mirror case — a redundant leading zero,
// itself non-canonical DER. The original bug shipped with a fully green
// test suite because nothing asserted on the actual byte pattern, only that
// certificates built from it still validated. These tests assert on bytes.
describe('canonicalPositiveInteger', () => {
  it('leaves an already-canonical value untouched', () => {
    const input = new Uint8Array([0x7f, 0x01, 0x02])
    expect(Array.from(canonicalPositiveInteger(input))).toEqual([0x7f, 0x01, 0x02])
  })

  it('strips a single redundant leading zero', () => {
    const input = new Uint8Array([0x00, 0x7f, 0x01])
    expect(Array.from(canonicalPositiveInteger(input))).toEqual([0x7f, 0x01])
  })

  it('strips multiple redundant leading zeros down to the value', () => {
    const input = new Uint8Array([0x00, 0x00, 0x05])
    expect(Array.from(canonicalPositiveInteger(input))).toEqual([0x05])
  })

  it('preserves the ONE necessary leading zero when the next byte has its top bit set', () => {
    const input = new Uint8Array([0x00, 0x80, 0x01])
    expect(Array.from(canonicalPositiveInteger(input))).toEqual([0x00, 0x80, 0x01])
  })

  it('collapses multiple leading zeros down to exactly the one necessary pad byte', () => {
    const input = new Uint8Array([0x00, 0x00, 0x80, 0x01])
    expect(Array.from(canonicalPositiveInteger(input))).toEqual([0x00, 0x80, 0x01])
  })

  it('adds a pad byte to a single top-bit-set byte', () => {
    const input = new Uint8Array([0x80])
    expect(Array.from(canonicalPositiveInteger(input))).toEqual([0x00, 0x80])
  })

  it('leaves a single already-canonical byte untouched', () => {
    const input = new Uint8Array([0x05])
    expect(Array.from(canonicalPositiveInteger(input))).toEqual([0x05])
  })

  it('encodes an all-zero value as exactly one 0x00 byte, never empty', () => {
    const input = new Uint8Array([0x00, 0x00, 0x00])
    expect(Array.from(canonicalPositiveInteger(input))).toEqual([0x00])
  })

  it('returns a fresh array whose .buffer is exactly its own bytes, not a view into the input', () => {
    const input = new Uint8Array([0x00, 0x00, 0x05])
    const out = canonicalPositiveInteger(input)
    expect(out.buffer.byteLength).toBe(out.length)
    // Mutating the original input after the call must not affect the output.
    input[2] = 0xff
    expect(Array.from(out)).toEqual([0x05])
  })

  it('exhaustively covers every possible top byte for a fixed-length random serial (no crash, always canonical)', () => {
    for (let top = 0; top <= 0xff; top++) {
      const out = canonicalPositiveInteger(new Uint8Array([top, 0x11, 0x22, 0x33]))
      // Canonical means: a leading 0x00 appears ONLY when it's the sole
      // byte (the value zero) or the following byte's top bit is set (a
      // necessary sign-pad) — never a redundant leading zero.
      if (out[0] === 0x00) {
        expect(out.length === 1 || (out[1] & 0x80) !== 0).toBe(true)
      } else {
        expect(out.length).toBeGreaterThan(0)
      }
    }
  })
})
