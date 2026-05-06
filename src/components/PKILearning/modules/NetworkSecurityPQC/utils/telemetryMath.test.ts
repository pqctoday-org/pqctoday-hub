// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { calculateTelemetryImpact } from './telemetryMath'

describe('calculateTelemetryImpact', () => {
  it('should easily fit a classical ECDSA payload in a single flight', () => {
    // 2500 bytes (ECDSA payload) / 1440 MTU = 2 segments
    const impact = calculateTelemetryImpact(2500, 1440, 10)

    expect(impact.requiredSegments).toBe(2)
    expect(impact.requiresExtraRTT).toBe(false)
    expect(impact.rttPenalty).toBe(0)
    expect(impact.totalFlights).toBe(1)
    expect(impact.packets).toHaveLength(2)
    expect(impact.packets[0].flight).toBe(1)
    expect(impact.packets[1].flight).toBe(1)
  })

  it('should penalize a Pure PQC (ML-DSA-65) payload across multiple flights', () => {
    // 25000 bytes / 1440 MTU = 18 segments
    const impact = calculateTelemetryImpact(25000, 1440, 10)

    expect(impact.requiredSegments).toBe(18)
    expect(impact.requiresExtraRTT).toBe(true)
    expect(impact.rttPenalty).toBe(1) // 18 segments / 10 initCwnd = 2 flights = 1 penalty
    expect(impact.totalFlights).toBe(2)
    expect(impact.packets).toHaveLength(18)

    // First 10 packets should be in flight 1
    const flight1 = impact.packets.filter((p) => p.flight === 1)
    expect(flight1).toHaveLength(10)

    // Remaining 8 packets should be in flight 2
    const flight2 = impact.packets.filter((p) => p.flight === 2)
    expect(flight2).toHaveLength(8)
  })

  it('should severely penalize massive payloads (extreme fragmentation)', () => {
    // 45000 bytes / 1440 MTU = 32 segments -> requires 4 flights
    const impact = calculateTelemetryImpact(45000, 1440, 10)

    expect(impact.requiredSegments).toBe(32)
    expect(impact.requiresExtraRTT).toBe(true)
    expect(impact.totalFlights).toBe(4)
    expect(impact.rttPenalty).toBe(3)
  })

  it('should throw an error for invalid network parameters', () => {
    expect(() => calculateTelemetryImpact(-500, 1440, 10)).toThrow('Invalid network parameters')
    expect(() => calculateTelemetryImpact(2500, 0, 10)).toThrow('Invalid network parameters')
    expect(() => calculateTelemetryImpact(2500, 1440, 0)).toThrow('Invalid network parameters')
  })
})
