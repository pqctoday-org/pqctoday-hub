// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  calculateV2XBandwidth,
  vehiclesToFillChannel,
  V2X_SIGNATURE_OPTIONS,
} from './v2xChannelMath'

describe('calculateV2XBandwidth', () => {
  it('100 vehicles with ECDSA P-256 signatures use a small share of 6 Mbps', () => {
    const r = calculateV2XBandwidth(100, 64)
    // 100 × 10 × 64 × 8 / 1e6 = 0.512 Mbps
    expect(r.bandwidthUsedMbps).toBeCloseTo(0.512, 3)
    expect(r.channelShare).toBeCloseTo(0.0853, 3)
    expect(r.exceedsChannel).toBe(false)
  })

  it('100 vehicles with ML-DSA-44 signatures exceed the raw 6 Mbps rate', () => {
    const r = calculateV2XBandwidth(100, 2420)
    // 100 × 10 × 2420 × 8 / 1e6 = 19.36 Mbps
    expect(r.bandwidthUsedMbps).toBeCloseTo(19.36, 2)
    expect(r.exceedsChannel).toBe(true)
  })

  it('30 vehicles with ML-DSA-44 sit just under the raw rate', () => {
    const r = calculateV2XBandwidth(30, 2420)
    expect(r.bandwidthUsedMbps).toBeCloseTo(5.808, 3)
    expect(r.exceedsChannel).toBe(false)
  })

  it('throws on invalid parameters', () => {
    expect(() => calculateV2XBandwidth(-10, 64)).toThrow()
    expect(() => calculateV2XBandwidth(100, 64, -5)).toThrow()
    expect(() => calculateV2XBandwidth(100, 64, 10, 0)).toThrow()
  })
})

describe('vehiclesToFillChannel', () => {
  it('gives the break-even vehicle count per signature size at 10 Hz / 6 Mbps', () => {
    expect(vehiclesToFillChannel(64)).toBe(1171)
    expect(vehiclesToFillChannel(666)).toBe(112)
    expect(vehiclesToFillChannel(2420)).toBe(30)
  })

  it('throws on non-positive inputs', () => {
    expect(() => vehiclesToFillChannel(0)).toThrow()
  })
})

describe('V2X_SIGNATURE_OPTIONS', () => {
  it('labels every size with a source', () => {
    for (const o of V2X_SIGNATURE_OPTIONS) expect(o.source.length, o.name).toBeGreaterThan(0)
  })
})
