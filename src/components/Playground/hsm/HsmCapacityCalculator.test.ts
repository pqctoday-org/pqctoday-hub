// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { computeScenarios } from './HsmCapacityCalculator'
import { USE_CASES, CLASSICAL_HSM_DEFAULT, PQC_HSM_DEFAULT } from '@/data/hsmCapacityDefaults'

function stateWith(enabled: string[], tps = 1000) {
  const out: Record<string, { enabled: boolean; tps: number }> = {}
  for (const uc of USE_CASES) {
    out[uc.id] = { enabled: enabled.includes(uc.id), tps }
  }
  return out
}

describe('HSM capacity — computeScenarios', () => {
  it('returns zero required HSMs when no use case is enabled', () => {
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith([]),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
    })
    expect(r).toHaveLength(3)
    expect(r.every((s) => s.requiredRaw === 0)).toBe(true)
    expect(r.every((s) => s.sufficient)).toBe(true)
  })

  it('aggregates load across multiple enabled use cases (shared fleet)', () => {
    // TLS alone at 10,000 TPS in PQC workload = 10,000 ML-DSA sign/s + 10,000 ML-KEM-768 ops/s.
    // On classical HSM (ML-DSA = 500 ops/s) that is 20 HSMs just for ML-DSA (bottleneck).
    // ML-KEM-768 at 3,000 ops/s needs ceil(10k/3k)=4 HSMs — less than ML-DSA.
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 10_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
    })
    const [, tomorrow, upgraded] = r
    expect(tomorrow.bottleneck).toBe('ml-dsa-65')
    expect(tomorrow.requiredRaw).toBe(20)
    expect(tomorrow.requiredWithRedundancy).toBe(21) // N+1 with 1 location: ceil(20/1)+1 = 21
    // Next-gen HSM at 8,000 ML-DSA/s handles the same load with far fewer units.
    expect(upgraded.requiredRaw).toBeLessThan(tomorrow.requiredRaw)
  })

  it('flags a fleet as overloaded when deployed count is below requirement', () => {
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 10_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 5, upgraded: 1 },
      numLocations: 1,
    })
    // Post-PQC on classical fleet needs 21 HSMs/location but only 5 are deployed.
    expect(r[1].sufficient).toBe(false)
    expect(r[1].fleetUtilizationPct).toBeGreaterThan(100)
  })

  it('marks a fleet sufficient when deployed count meets the requirement', () => {
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 10_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 2, tomorrow: 21, upgraded: 3 },
      numLocations: 1,
    })
    expect(r[1].sufficient).toBe(true)
    expect(r[1].fleetUtilizationPct).toBeLessThanOrEqual(100)
  })

  it('applies 2N redundancy as double the raw requirement', () => {
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 10_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: '2n',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
    })
    expect(r[1].requiredWithRedundancy).toBe(r[1].requiredRaw * 2)
  })

  it('adds load across multiple checked use cases (shared fleet)', () => {
    // Enable TLS (10k TPS × 1 sign) + SSH (10k TPS × 1 sign) — total 20k ML-DSA/s.
    // On classical HSM that is 40 HSMs for ML-DSA.
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls', 'ssh'], 10_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
    })
    expect(r[1].requiredRaw).toBe(40)
  })

  it('distributes load across locations and applies local HA', () => {
    // 3 locations, N+1, TLS at 10k TPS → raw = 20 HSMs globally
    // per-location raw = ceil(20/3) = 7, per-location HA (N+1) = 8, total = 24
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 10_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 8, upgraded: 1 },
      numLocations: 3,
    })
    const tomorrow = r[1]
    expect(tomorrow.requiredRaw).toBe(20)
    expect(tomorrow.perLocationRaw).toBe(7) // ceil(20/3)
    expect(tomorrow.perLocationRequired).toBe(8) // 7+1
    expect(tomorrow.requiredWithRedundancy).toBe(24) // 3×8
    expect(tomorrow.sufficient).toBe(true) // 8 HSMs/loc meets perLocationRequired=8
  })

  it('inventory mode: N=10 classical HSMs at TLS 5k PQC TPS — today sufficient, tomorrow overloaded', () => {
    // Inventory mode: user owns 10 classical HSMs.
    // TLS at 5,000 PQC TPS → ML-DSA load = 5,000 ops/s, needs ceil(5k/500)=10 raw → N+1=11
    // With 10 deployed: tomorrow is overloaded (needs 11, has 10).
    const inventoryHsmCount = 10
    const numLocations = 1
    const perLocClassical = Math.ceil(inventoryHsmCount / numLocations) // 10

    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 5_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: perLocClassical, tomorrow: perLocClassical, upgraded: 2 },
      numLocations,
    })
    expect(r[0].sufficient).toBe(true) // classical workload on 10 HSMs is fine
    expect(r[1].requiredRaw).toBe(10) // ceil(5000/500)=10 raw for ML-DSA
    expect(r[1].perLocationRequired).toBe(11) // 10+1 N+1
    expect(r[1].sufficient).toBe(false) // 10 deployed < 11 required
  })

  it('inventory mode: equivalentNextGenTotal formula matches expected replacement ratio', () => {
    // With N=10 classical HSMs: equivalent next-gen = ceil(10 × 500 / 8000) = 1
    const inventoryHsmCount = 10
    const equivalentNextGenTotal = Math.ceil(
      (inventoryHsmCount * CLASSICAL_HSM_DEFAULT.opsPerSec['ml-dsa-65']) /
        PQC_HSM_DEFAULT.opsPerSec['ml-dsa-65']
    )
    expect(equivalentNextGenTotal).toBe(1) // 10 classical → 1 next-gen for ML-DSA

    // With N=20 classical HSMs: ceil(20 × 500 / 8000) = ceil(1.25) = 2
    const equivalentFor20 = Math.ceil(
      (20 * CLASSICAL_HSM_DEFAULT.opsPerSec['ml-dsa-65']) / PQC_HSM_DEFAULT.opsPerSec['ml-dsa-65']
    )
    expect(equivalentFor20).toBe(2) // 20 classical → 2 next-gen
  })

  it('inventory mode: large fleet — 1000 HSMs across 10 locations, N+1', () => {
    // 1000 HSMs ÷ 10 locations = 100/location.
    // TLS at 5000 TPS PQC → ML-DSA load = 5000 ops/s, raw = ceil(5000/500) = 10.
    // perLocationRaw = ceil(10/10) = 1, perLocationRequired (N+1) = 2
    // Total required = 10 × 2 = 20. With 100/location deployed: sufficient.
    const inventoryHsmCount = 1000
    const numLocations = 10
    const perLocClassical = Math.ceil(inventoryHsmCount / numLocations) // 100

    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 5_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: perLocClassical, tomorrow: perLocClassical, upgraded: 2 },
      numLocations,
    })
    expect(r[1].perLocationRaw).toBe(1) // ceil(10/10)
    expect(r[1].perLocationRequired).toBe(2) // 1+1 N+1
    expect(r[1].requiredWithRedundancy).toBe(20) // 10 × 2
    expect(r[1].sufficient).toBe(true) // 100/loc >> 2 required/loc
  })

  it('ML-KEM-768 load is correctly aggregated for PQC TLS workload', () => {
    // TLS PQC ops: { 'ml-dsa-65': 1, 'ml-kem-768': 1 }
    // At 10k TPS: ML-KEM-768 load = 10,000 ops/s; at 3,000 ops/s → ceil(10k/3k)=4 HSMs
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 10_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 25, upgraded: 5 },
      numLocations: 1,
    })
    const tomorrow = r[1]
    const mlKemEntry = tomorrow.perAlgoHsms.find((x) => x.algo === 'ml-kem-768')
    expect(mlKemEntry).toBeDefined()
    expect(mlKemEntry!.load).toBe(10_000) // 10k TPS × 1 ML-KEM op/tx
    expect(mlKemEntry!.hsms).toBe(4) // ceil(10000/3000)=4
    // ML-DSA is still the bottleneck
    expect(tomorrow.bottleneck).toBe('ml-dsa-65')
  })
})
