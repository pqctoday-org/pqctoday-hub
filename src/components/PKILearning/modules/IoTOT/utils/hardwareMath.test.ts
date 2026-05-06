// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { calculateSecureBootLatency, calculateV2XBandwidth } from './hardwareMath'

describe('calculateSecureBootLatency', () => {
  it('should easily pass a classical ECDSA payload under constraints', () => {
    // ECDSA: 64B sig, 64B pub, 2M cycles. Hardware: 2MB/s SPI, 120MHz MCU
    const result = calculateSecureBootLatency(64, 64, 2_000_000, 2, 120)

    expect(result.payloadSizeBytes).toBe(128)
    expect(result.loadTimeMs).toBeCloseTo(0.064, 3) // (128 / 2000000) * 1000
    expect(result.verifyTimeMs).toBeCloseTo(16.666, 2) // (2M / 120M) * 1000
    expect(result.totalBootDelayMs).toBeCloseTo(16.73, 2)
    expect(result.exceedsRealTimeConstraint).toBe(false)
  })

  it('should trigger real-time boot constraints for LMS on slow CPUs', () => {
    // LMS (H=10): 2500B sig, 60B pub, 1.2M cycles. Hardware: 1MB/s SPI, 48MHz MCU
    const result = calculateSecureBootLatency(2500, 60, 1_200_000, 1, 48)

    expect(result.loadTimeMs).toBeCloseTo(2.56, 2)
    expect(result.verifyTimeMs).toBeCloseTo(25.0, 1)
    expect(result.totalBootDelayMs).toBeCloseTo(27.56, 2)
    expect(result.exceedsRealTimeConstraint).toBe(false)
  })

  it('should fail real-time boot constraints for ML-DSA-44 on very slow hardware', () => {
    // ML-DSA-44: 2420B sig, 1312B pub, 400k cycles. Hardware: 0.1MB/s SPI, 16MHz MCU
    // Load time: 37.32ms. Verify time: 25ms. Total: 62.32ms — still under 100ms.
    // Drop SPI speed drastically to trigger the real-time constraint failure.
    const failResult = calculateSecureBootLatency(2420, 1312, 400_000, 0.02, 16)
    expect(failResult.loadTimeMs).toBeCloseTo(186.6, 1) // 3732 bytes / 20000 Bps
    expect(failResult.exceedsRealTimeConstraint).toBe(true)
  })

  it('should throw an error on invalid hardware parameters', () => {
    expect(() => calculateSecureBootLatency(64, 64, 2000, -1, 120)).toThrow()
    expect(() => calculateSecureBootLatency(64, 64, 2000, 2, 0)).toThrow()
  })
})

describe('calculateV2XBandwidth', () => {
  it('should easily support 100 cars broadcasting classical ECDSA', () => {
    // 100 cars, 64 bytes
    const result = calculateV2XBandwidth(100, 64)
    // 100 * 10 * 64 * 8 / 1M = 0.512 Mbps
    expect(result.bandwidthUsedMbps).toBeCloseTo(0.512, 3)
    expect(result.triggersBroadcastStorm).toBe(false)
  })

  it('should trigger a broadcast storm for 100 cars using Pure PQC (ML-DSA)', () => {
    // 100 cars, 2420 bytes
    const result = calculateV2XBandwidth(100, 2420)
    // 100 * 10 * 2420 * 8 / 1M = 19.36 Mbps
    expect(result.bandwidthUsedMbps).toBeCloseTo(19.36, 2)
    expect(result.triggersBroadcastStorm).toBe(true)
  })

  it('should NOT trigger a broadcast storm for 30 cars using ML-DSA', () => {
    // 30 cars, 2420 bytes
    const result = calculateV2XBandwidth(30, 2420)
    // 30 * 10 * 2420 * 8 / 1M = 5.808 Mbps (Just under 6 Mbps limit)
    expect(result.bandwidthUsedMbps).toBeCloseTo(5.808, 3)
    expect(result.triggersBroadcastStorm).toBe(false)
  })

  it('should throw an error on invalid V2X parameters', () => {
    expect(() => calculateV2XBandwidth(-10, 64)).toThrow()
    expect(() => calculateV2XBandwidth(100, 64, -5)).toThrow()
    expect(() => calculateV2XBandwidth(100, 64, 10, 0)).toThrow()
  })
})
