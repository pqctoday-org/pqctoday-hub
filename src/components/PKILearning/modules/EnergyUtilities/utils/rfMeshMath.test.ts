// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { calculateRfMeshImpact } from './rfMeshMath'

describe('calculateRfMeshImpact', () => {
  it('should easily complete a classical daily meter read for 5000 meters', () => {
    // 500 bytes (meter data + 64B ECDSA). 50 kbps mesh. 5000 meters. 24h window.
    const impact = calculateRfMeshImpact(500, 50, 5000, 24)

    expect(impact.timeOnAirSecondsPerMeter).toBeCloseTo(0.08, 2) // (500 * 8) / 50000 = 0.08s
    expect(impact.totalCellTimeHours).toBeCloseTo(0.111, 3) // 400 seconds = ~0.11 hours
    expect(impact.meshCollapse).toBe(false)
  })

  it('should cause a mesh collapse when pushing a massive PQC firmware update', () => {
    // 250,000 byte firmware + 4627B ML-DSA-87 signature = 254627 bytes.
    // 50 kbps mesh. 5000 meters. 24h window.
    const impact = calculateRfMeshImpact(254627, 50, 5000, 24)

    expect(impact.timeOnAirSecondsPerMeter).toBeCloseTo(40.74, 2) // (254627 * 8) / 50000 = 40.74s
    expect(impact.totalCellTimeHours).toBeCloseTo(56.58, 2) // 40.74s * 5000 / 3600 = ~56 hours
    expect(impact.meshCollapse).toBe(true) // 56 hours > 24 hours
  })

  it('should not collapse if the mesh bandwidth is upgraded', () => {
    // Same PQC firmware update, but on a modern 300 kbps mesh
    const impact = calculateRfMeshImpact(254627, 300, 5000, 24)

    expect(impact.totalCellTimeHours).toBeCloseTo(9.43, 2) // Fits within 24 hours
    expect(impact.meshCollapse).toBe(false)
  })

  it('should throw an error for invalid negative parameters', () => {
    expect(() => calculateRfMeshImpact(-500, 50, 5000)).toThrow()
    expect(() => calculateRfMeshImpact(500, -50, 5000)).toThrow()
    expect(() => calculateRfMeshImpact(500, 50, -5000)).toThrow()
  })
})
