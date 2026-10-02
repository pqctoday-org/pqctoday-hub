// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { BOOT_VERIFY_ALGORITHMS, calculateSecureBootLatency } from './bootLatencyMath'

const algo = (name: string) => {
  const a = BOOT_VERIFY_ALGORITHMS.find((x) => x.name === name)
  if (!a) throw new Error(`missing ${name}`)
  return a
}

describe('BOOT_VERIFY_ALGORITHMS', () => {
  it('carries the corrected Cortex-M4 cycle counts and standard sizes', () => {
    expect(algo('ECDSA P-256').verifyCycles).toBe(980_000)
    expect(algo('RSA-3072').verifyCycles).toBe(25_330_000)
    expect(algo('ML-DSA-44').verifyCycles).toBe(1_420_000)
    expect(algo('LMS H10/W4').verifyCycles).toBe(2_660_000)
    expect(algo('ML-DSA-44').sigBytes).toBe(2420)
    expect(algo('ML-DSA-44').pubBytes).toBe(1312)
    expect(algo('LMS H10/W4').sigBytes).toBe(2508)
    expect(algo('LMS H10/W4').pubBytes).toBe(56)
  })

  it('labels every figure with a source', () => {
    for (const a of BOOT_VERIFY_ALGORITHMS) {
      expect(a.sizeSource.length, a.name).toBeGreaterThan(0)
      expect(a.cycleSource.length, a.name).toBeGreaterThan(0)
    }
  })
})

describe('calculateSecureBootLatency', () => {
  it('ECDSA P-256 at 2 MB/s SPI, 120 MHz fits easily', () => {
    const r = calculateSecureBootLatency(64, 64, 980_000, 2, 120)
    expect(r.payloadSizeBytes).toBe(128)
    expect(r.loadTimeMs).toBeCloseTo(0.064, 3) // 128 B / 2,000,000 B/s
    expect(r.verifyTimeMs).toBeCloseTo(8.167, 2) // 0.98 M / 120 MHz
    expect(r.totalBootDelayMs).toBeCloseTo(8.231, 2)
    expect(r.exceedsBudget).toBe(false)
  })

  it('ML-DSA-44 at 2 MB/s SPI, 120 MHz: verify dominates, still well under budget', () => {
    const r = calculateSecureBootLatency(2420, 1312, 1_420_000, 2, 120)
    expect(r.payloadSizeBytes).toBe(3732)
    expect(r.loadTimeMs).toBeCloseTo(1.866, 3)
    expect(r.verifyTimeMs).toBeCloseTo(11.833, 2)
    expect(r.totalBootDelayMs).toBeCloseTo(13.699, 2)
    expect(r.exceedsBudget).toBe(false)
  })

  it('LMS H10/W4 at 1 MB/s SPI, 48 MHz stays under the illustrative budget', () => {
    const r = calculateSecureBootLatency(2508, 56, 2_660_000, 1, 48)
    expect(r.loadTimeMs).toBeCloseTo(2.564, 3)
    expect(r.verifyTimeMs).toBeCloseTo(55.417, 2)
    expect(r.totalBootDelayMs).toBeCloseTo(57.981, 2)
    expect(r.exceedsBudget).toBe(false)
  })

  it('RSA-3072 is the one that blows a 100 ms budget at 120 MHz', () => {
    const r = calculateSecureBootLatency(384, 384, 25_330_000, 2, 120)
    expect(r.verifyTimeMs).toBeCloseTo(211.083, 2)
    expect(r.exceedsBudget).toBe(true)
    // ...and reproduces the source benchmark: 149 ms at 170 MHz
    expect(calculateSecureBootLatency(384, 384, 25_330_000, 2, 170).verifyTimeMs).toBeCloseTo(
      149,
      0
    )
  })

  it('respects a custom budget', () => {
    const r = calculateSecureBootLatency(2420, 1312, 1_420_000, 2, 120, 10)
    expect(r.exceedsBudget).toBe(true)
  })

  it('throws on invalid hardware parameters', () => {
    expect(() => calculateSecureBootLatency(64, 64, 2000, -1, 120)).toThrow()
    expect(() => calculateSecureBootLatency(64, 64, 2000, 2, 0)).toThrow()
    expect(() => calculateSecureBootLatency(-1, 64, 2000, 2, 120)).toThrow()
  })
})
