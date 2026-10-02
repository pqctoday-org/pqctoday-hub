// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { computeRotationPlan, HSM_OPS_PER_DEVICE, HSM_OPS_PER_SEC } from './fleetData'
import { DEFAULT_FLEET, type FleetConfig } from './fleetTypes'

const plan = (p: Partial<FleetConfig> = {}) => computeRotationPlan({ ...DEFAULT_FLEET, ...p })

describe('computeRotationPlan', () => {
  it('network time is per cell: doubling the fleet with the same cell size does not change it', () => {
    const a = plan({ fleetSize: 1_000_000 })
    const b = plan({ fleetSize: 2_000_000 })
    expect(a.networkHoursPerCell).toBeCloseTo(b.networkHoursPerCell, 9)
    expect(b.cells).toBe(2 * a.cells)
  })

  it('HSM time is its own figure (fleet × ops ÷ rating), not derived from the network', () => {
    const r = plan()
    expect(r.hsmHours).toBeCloseTo(
      (DEFAULT_FLEET.fleetSize * HSM_OPS_PER_DEVICE) / HSM_OPS_PER_SEC.standard / 3600,
      9
    )
    expect(r.bottleneck).toBe('hsm')
    expect(r.rotationHours).toBe(Math.max(r.hsmHours, r.networkHoursPerCell))
  })

  it('a faster HSM can move the bottleneck to the network', () => {
    expect(plan({ hsmCapacity: 'high-throughput' }).bottleneck).toBe('network')
  })

  it('security suite is wired: it sets the classical baseline, and Suite 0 has no public-key exchange', () => {
    const s1 = plan({ securitySuite: 'suite-1' })
    const s2 = plan({ securitySuite: 'suite-2' })
    const s0 = plan({ securitySuite: 'suite-0' })
    expect(s2.classicalBytesPerDevice).toBeGreaterThan(s1.classicalBytesPerDevice)
    expect(s0.suiteHasPublicKey).toBe(false)
    expect(s0.sizeMultiplier).toBeNull()
  })

  it('rotation frequency is wired: it sets the period and the yearly traffic', () => {
    const q = plan({ rotationFrequency: 'quarterly' })
    const a = plan({ rotationFrequency: 'annual' })
    expect(q.periodDays).toBeCloseTo(a.periodDays / 4, 9)
    expect(q.annualFleetGB).toBeCloseTo(4 * a.annualFleetGB, 9)
    expect(q.periodShare).toBeCloseTo(4 * a.periodShare, 9)
  })

  it('PQC bytes per device = KEM public key + ciphertext + framing', () => {
    expect(plan({ pqcAlgorithm: 'ml-kem-768' }).pqcBytesPerDevice).toBe(1184 + 1088 + 200)
  })

  it('LoRaWAN is flagged as having no public-key key establishment on the air', () => {
    expect(plan({ commTechnology: 'lorawan' }).publicKeyCapable).toBe(false)
  })
})
