// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { calculateVramImpact } from './aiVramMath'

describe('calculateVramImpact', () => {
  it('should successfully calculate VRAM for a low-concurrency classical payload', () => {
    // 24GB GPU, 14GB weights, 100 sessions, 10MB KV cache per session, 2KB classical crypto per session
    const impact = calculateVramImpact(24, 14, 100, 10, 2)

    expect(impact.modelVramGB).toBe(14)
    expect(impact.kvCacheVramGB).toBeCloseTo(0.976, 2) // 100 * 10 / 1024 = 0.9765 GB
    expect(impact.cryptoVramGB).toBeCloseTo(0.00019, 4) // 100 * 2 / 1048576 = 0.00019 GB
    expect(impact.isOOM).toBe(false)
    expect(impact.remainingVramGB).toBeGreaterThan(0)
  })

  it('should trigger OOM (Out of Memory) due to massive PQC crypto state at high concurrency', () => {
    // 80GB GPU, 35GB weights, 100,000 sessions, 0.4MB KV cache per session, 25KB PQC crypto per session
    // This simulates a high-throughput endpoint using cuPQC batch decryption
    const impact = calculateVramImpact(80, 35, 100_000, 0.4, 25)

    expect(impact.modelVramGB).toBe(35)
    expect(impact.kvCacheVramGB).toBeCloseTo(39.06, 2) // 40,000 MB / 1024 = 39.06 GB
    expect(impact.cryptoVramGB).toBeCloseTo(2.38, 2) // 2,500,000 KB / 1048576 = 2.38 GB

    // Total: 35 + 39.06 + 2.38 = 76.44 GB. Wait, this fits in 80GB.
    expect(impact.isOOM).toBe(false)

    // Let's push the concurrency to 110,000
    const oomImpact = calculateVramImpact(80, 35, 110_000, 0.4, 25)
    // model: 35
    // kv: 110,000 * 0.4 / 1024 = 42.96 GB
    // crypto: 110,000 * 25 / 1048576 = 2.62 GB
    // total: 35 + 42.96 + 2.62 = 80.58 GB -> OOM!
    expect(oomImpact.isOOM).toBe(true)
    expect(oomImpact.totalVramGB).toBeGreaterThan(80)
    expect(oomImpact.remainingVramGB).toBe(0)
  })

  it('should throw an error for invalid negative parameters', () => {
    expect(() => calculateVramImpact(-24, 14, 100, 10, 2)).toThrow()
    expect(() => calculateVramImpact(24, -14, 100, 10, 2)).toThrow()
    expect(() => calculateVramImpact(24, 14, -100, 10, 2)).toThrow()
  })
})
