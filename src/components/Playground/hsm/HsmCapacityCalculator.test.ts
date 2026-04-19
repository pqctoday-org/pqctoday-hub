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
      hsmCounts: { today: 1, tomorrow: 1, upgraded: 1 },
    })
    expect(r).toHaveLength(3)
    expect(r.every((s) => s.requiredRaw === 0)).toBe(true)
    expect(r.every((s) => s.sufficient)).toBe(true)
  })

  it('aggregates load across multiple enabled use cases (shared fleet)', () => {
    // TLS alone at 10,000 TPS in PQC workload = 10,000 ML-DSA sign/s + 10,000 ECDH/s.
    // On classical HSM (ML-DSA = 500 ops/s) that is 20 HSMs just for ML-DSA.
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 10_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmCounts: { today: 1, tomorrow: 1, upgraded: 1 },
    })
    const [, tomorrow, upgraded] = r
    expect(tomorrow.bottleneck).toBe('ml-dsa-65')
    expect(tomorrow.requiredRaw).toBe(20)
    expect(tomorrow.requiredWithRedundancy).toBe(21) // N+1
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
      hsmCounts: { today: 1, tomorrow: 5, upgraded: 1 },
    })
    // Post-PQC on classical fleet needs 21 HSMs but only 5 are deployed.
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
      hsmCounts: { today: 2, tomorrow: 21, upgraded: 3 },
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
      hsmCounts: { today: 1, tomorrow: 1, upgraded: 1 },
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
      hsmCounts: { today: 1, tomorrow: 1, upgraded: 1 },
    })
    expect(r[1].requiredRaw).toBe(40)
  })
})
