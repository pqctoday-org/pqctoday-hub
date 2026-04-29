// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { computeScenarios } from './HsmCapacityCalculator'
import {
  USE_CASES,
  CLASSICAL_HSM_DEFAULT,
  PQC_HSM_DEFAULT,
  ORG_PARAM_DEFAULTS,
  deriveUseCaseTps,
  type DeploymentSize,
} from '@/data/hsmCapacityDefaults'

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
    // On classical HSM (ML-DSA = 150 ops/s) that is 67 HSMs just for ML-DSA (bottleneck).
    // ML-KEM-768 at 500 ops/s needs ceil(10k/500)=20 HSMs — less than ML-DSA.
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
    expect(tomorrow.requiredRaw).toBe(67)
    expect(tomorrow.requiredWithRedundancy).toBe(68) // N+1 with 1 location: ceil(67/1)+1 = 68
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
    // Post-PQC on classical fleet needs 68 HSMs/location but only 5 are deployed.
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
      hsmsPerLocation: { today: 2, tomorrow: 68, upgraded: 3 },
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
    // On classical HSM (150 ops/s) that is ceil(20000/150)=134 HSMs for ML-DSA.
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls', 'ssh'], 10_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
    })
    expect(r[1].requiredRaw).toBe(134)
  })

  it('distributes load across locations and applies local HA', () => {
    // 3 locations, N+1, TLS at 10k TPS → raw = 67 HSMs globally (ceil(10000/150))
    // per-location raw = ceil(67/3) = 23, per-location HA (N+1) = 24, total = 72
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 10_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 24, upgraded: 1 },
      numLocations: 3,
    })
    const tomorrow = r[1]
    expect(tomorrow.requiredRaw).toBe(67)
    expect(tomorrow.perLocationRaw).toBe(23) // ceil(67/3)
    expect(tomorrow.perLocationRequired).toBe(24) // 23+1
    expect(tomorrow.requiredWithRedundancy).toBe(72) // 3×24
    expect(tomorrow.sufficient).toBe(true) // 24 HSMs/loc meets perLocationRequired=24
  })

  it('inventory mode: N=10 classical HSMs at TLS 5k PQC TPS — today sufficient, tomorrow overloaded', () => {
    // Inventory mode: user owns 10 classical HSMs.
    // TLS at 5,000 PQC TPS → ML-DSA load = 5,000 ops/s, needs ceil(5k/150)=34 raw → N+1=35
    // With 10 deployed: tomorrow is overloaded (needs 35, has 10).
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
    expect(r[1].requiredRaw).toBe(34) // ceil(5000/150)=34 raw for ML-DSA
    expect(r[1].perLocationRequired).toBe(35) // 34+1 N+1
    expect(r[1].sufficient).toBe(false) // 10 deployed < 35 required
  })

  it('inventory mode: equivalentNextGenTotal formula matches expected replacement ratio', () => {
    // With N=10 classical HSMs: equivalent next-gen = ceil(10 × 150 / 8000) = 1
    const inventoryHsmCount = 10
    const equivalentNextGenTotal = Math.ceil(
      (inventoryHsmCount * CLASSICAL_HSM_DEFAULT.opsPerSec['ml-dsa-65']) /
        PQC_HSM_DEFAULT.opsPerSec['ml-dsa-65']
    )
    expect(equivalentNextGenTotal).toBe(1) // 10 classical → 1 next-gen for ML-DSA

    // With N=20 classical HSMs: ceil(20 × 150 / 8000) = ceil(0.375) = 1
    const equivalentFor20 = Math.ceil(
      (20 * CLASSICAL_HSM_DEFAULT.opsPerSec['ml-dsa-65']) / PQC_HSM_DEFAULT.opsPerSec['ml-dsa-65']
    )
    expect(equivalentFor20).toBe(1) // 20 classical → 1 next-gen
  })

  it('inventory mode: large fleet — 1000 HSMs across 10 locations, N+1', () => {
    // 1000 HSMs ÷ 10 locations = 100/location.
    // TLS at 5000 TPS PQC → ML-DSA load = 5000 ops/s, raw = ceil(5000/150) = 34.
    // perLocationRaw = ceil(34/10) = 4, perLocationRequired (N+1) = 5
    // Total required = 10 × 5 = 50. With 100/location deployed: sufficient.
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
    expect(r[1].perLocationRaw).toBe(4) // ceil(34/10)
    expect(r[1].perLocationRequired).toBe(5) // 4+1 N+1
    expect(r[1].requiredWithRedundancy).toBe(50) // 10 × 5
    expect(r[1].sufficient).toBe(true) // 100/loc >> 5 required/loc
  })

  it('ML-KEM-768 load is correctly aggregated for PQC TLS workload', () => {
    // TLS PQC ops: { 'ml-dsa-65': 1, 'ml-kem-768': 1 }
    // At 10k TPS: ML-KEM-768 load = 10,000 ops/s; at 500 ops/s → ceil(10k/500)=20 HSMs
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
    expect(mlKemEntry!.hsms).toBe(20) // ceil(10000/500)=20
    // ML-DSA is still the bottleneck
    expect(tomorrow.bottleneck).toBe('ml-dsa-65')
  })
})

// ---------------------------------------------------------------------------
// Size × Locations matrix — validates the model end-to-end against
// hand-derived expected values.
// ---------------------------------------------------------------------------

function stateForSize(size: DeploymentSize) {
  const org = ORG_PARAM_DEFAULTS[size]
  const out: Record<string, { enabled: boolean; tps: number }> = {}
  for (const uc of USE_CASES) {
    out[uc.id] = { enabled: uc.defaultEnabled, tps: deriveUseCaseTps(uc.id, org) }
  }
  return out
}

interface ScenarioExpect {
  requiredRaw: number
  perLocationRaw: number
  perLocationRequired: number
  requiredWithRedundancy: number
  bottleneck?: string
}

interface MatrixCase {
  size: DeploymentSize
  locations: number
  today: ScenarioExpect
  tomorrow: ScenarioExpect
  upgraded: ScenarioExpect
  deltaExistingFleet: number // tomorrow.requiredRaw - today.requiredRaw
  deltaWithUpgrade: number // upgraded.requiredRaw - today.requiredRaw
}

const MATRIX: MatrixCase[] = [
  // ---- small (requiredRaw: today=1, tomorrow=4, upgraded=1) ----
  {
    size: 'small',
    locations: 2,
    today: { requiredRaw: 1, perLocationRaw: 1, perLocationRequired: 2, requiredWithRedundancy: 4 },
    tomorrow: {
      requiredRaw: 4,
      perLocationRaw: 2,
      perLocationRequired: 3,
      requiredWithRedundancy: 6,
      bottleneck: 'ml-dsa-65',
    },
    upgraded: {
      requiredRaw: 1,
      perLocationRaw: 1,
      perLocationRequired: 2,
      requiredWithRedundancy: 4,
    },
    deltaExistingFleet: 3,
    deltaWithUpgrade: 0,
  },
  {
    size: 'small',
    locations: 3,
    today: { requiredRaw: 1, perLocationRaw: 1, perLocationRequired: 2, requiredWithRedundancy: 6 },
    tomorrow: {
      requiredRaw: 4,
      perLocationRaw: 2, // ceil(4/3)
      perLocationRequired: 3,
      requiredWithRedundancy: 9,
      bottleneck: 'ml-dsa-65',
    },
    upgraded: {
      requiredRaw: 1,
      perLocationRaw: 1,
      perLocationRequired: 2,
      requiredWithRedundancy: 6,
    },
    deltaExistingFleet: 3,
    deltaWithUpgrade: 0,
  },
  {
    size: 'small',
    locations: 20,
    today: {
      requiredRaw: 1,
      perLocationRaw: 1,
      perLocationRequired: 2,
      requiredWithRedundancy: 40,
    },
    tomorrow: {
      requiredRaw: 4,
      perLocationRaw: 1, // ceil(4/20)=1 — N+1 floor regime
      perLocationRequired: 2,
      requiredWithRedundancy: 40,
      bottleneck: 'ml-dsa-65',
    },
    upgraded: {
      requiredRaw: 1,
      perLocationRaw: 1,
      perLocationRequired: 2,
      requiredWithRedundancy: 40,
    },
    deltaExistingFleet: 3,
    deltaWithUpgrade: 0,
  },
  // ---- medium (requiredRaw: today=1, tomorrow=37, upgraded=1) ----
  {
    size: 'medium',
    locations: 2,
    today: { requiredRaw: 1, perLocationRaw: 1, perLocationRequired: 2, requiredWithRedundancy: 4 },
    tomorrow: {
      requiredRaw: 37,
      perLocationRaw: 19, // ceil(37/2)
      perLocationRequired: 20,
      requiredWithRedundancy: 40,
      bottleneck: 'ml-dsa-65',
    },
    upgraded: {
      requiredRaw: 1,
      perLocationRaw: 1,
      perLocationRequired: 2,
      requiredWithRedundancy: 4,
    },
    deltaExistingFleet: 36,
    deltaWithUpgrade: 0,
  },
  {
    size: 'medium',
    locations: 3,
    today: { requiredRaw: 1, perLocationRaw: 1, perLocationRequired: 2, requiredWithRedundancy: 6 },
    tomorrow: {
      requiredRaw: 37,
      perLocationRaw: 13, // ceil(37/3)
      perLocationRequired: 14,
      requiredWithRedundancy: 42,
      bottleneck: 'ml-dsa-65',
    },
    upgraded: {
      requiredRaw: 1,
      perLocationRaw: 1,
      perLocationRequired: 2,
      requiredWithRedundancy: 6,
    },
    deltaExistingFleet: 36,
    deltaWithUpgrade: 0,
  },
  {
    size: 'medium',
    locations: 20,
    today: {
      requiredRaw: 1,
      perLocationRaw: 1,
      perLocationRequired: 2,
      requiredWithRedundancy: 40,
    },
    tomorrow: {
      requiredRaw: 37,
      perLocationRaw: 2, // ceil(37/20)
      perLocationRequired: 3,
      requiredWithRedundancy: 60,
      bottleneck: 'ml-dsa-65',
    },
    upgraded: {
      requiredRaw: 1,
      perLocationRaw: 1,
      perLocationRequired: 2,
      requiredWithRedundancy: 40,
    },
    deltaExistingFleet: 36,
    deltaWithUpgrade: 0,
  },
  // ---- large (requiredRaw: today=6, tomorrow=370, upgraded=7) ----
  {
    size: 'large',
    locations: 2,
    today: { requiredRaw: 6, perLocationRaw: 3, perLocationRequired: 4, requiredWithRedundancy: 8 },
    tomorrow: {
      requiredRaw: 370,
      perLocationRaw: 185, // ceil(370/2)
      perLocationRequired: 186,
      requiredWithRedundancy: 372,
      bottleneck: 'ml-dsa-65',
    },
    upgraded: {
      requiredRaw: 7,
      perLocationRaw: 4, // ceil(7/2)
      perLocationRequired: 5,
      requiredWithRedundancy: 10,
    },
    deltaExistingFleet: 364,
    deltaWithUpgrade: 1,
  },
  {
    size: 'large',
    locations: 3,
    today: { requiredRaw: 6, perLocationRaw: 2, perLocationRequired: 3, requiredWithRedundancy: 9 },
    tomorrow: {
      requiredRaw: 370,
      perLocationRaw: 124, // ceil(370/3)
      perLocationRequired: 125,
      requiredWithRedundancy: 375,
      bottleneck: 'ml-dsa-65',
    },
    upgraded: {
      requiredRaw: 7,
      perLocationRaw: 3, // ceil(7/3)
      perLocationRequired: 4,
      requiredWithRedundancy: 12,
    },
    deltaExistingFleet: 364,
    deltaWithUpgrade: 1,
  },
  {
    size: 'large',
    locations: 20,
    today: {
      requiredRaw: 6,
      perLocationRaw: 1, // ceil(6/20)=1 — N+1 floor regime
      perLocationRequired: 2,
      requiredWithRedundancy: 40,
    },
    tomorrow: {
      requiredRaw: 370,
      perLocationRaw: 19, // ceil(370/20)
      perLocationRequired: 20,
      requiredWithRedundancy: 400,
      bottleneck: 'ml-dsa-65',
    },
    upgraded: {
      requiredRaw: 7,
      perLocationRaw: 1, // ceil(7/20)=1 — N+1 floor regime
      perLocationRequired: 2,
      requiredWithRedundancy: 40,
    },
    deltaExistingFleet: 364,
    deltaWithUpgrade: 1,
  },
]

describe('HSM capacity — size × locations matrix (PQC extra-capacity validation)', () => {
  it.each(MATRIX)(
    '$size × $locations locations: matches hand-derived model',
    ({ size, locations, today, tomorrow, upgraded, deltaExistingFleet, deltaWithUpgrade }) => {
      const r = computeScenarios({
        useCases: USE_CASES,
        state: stateForSize(size),
        classical: CLASSICAL_HSM_DEFAULT,
        pqc: PQC_HSM_DEFAULT,
        redundancy: 'n+1',
        hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
        numLocations: locations,
      })
      const [t, tm, up] = r

      // today
      expect(t.requiredRaw).toBe(today.requiredRaw)
      expect(t.perLocationRaw).toBe(today.perLocationRaw)
      expect(t.perLocationRequired).toBe(today.perLocationRequired)
      expect(t.requiredWithRedundancy).toBe(today.requiredWithRedundancy)

      // tomorrow (PQC on classical HSM)
      expect(tm.requiredRaw).toBe(tomorrow.requiredRaw)
      expect(tm.perLocationRaw).toBe(tomorrow.perLocationRaw)
      expect(tm.perLocationRequired).toBe(tomorrow.perLocationRequired)
      expect(tm.requiredWithRedundancy).toBe(tomorrow.requiredWithRedundancy)
      if (tomorrow.bottleneck) expect(tm.bottleneck).toBe(tomorrow.bottleneck)

      // upgraded (PQC on PQC HSM)
      expect(up.requiredRaw).toBe(upgraded.requiredRaw)
      expect(up.perLocationRaw).toBe(upgraded.perLocationRaw)
      expect(up.perLocationRequired).toBe(upgraded.perLocationRequired)
      expect(up.requiredWithRedundancy).toBe(upgraded.requiredWithRedundancy)

      // PQC extra-capacity deltas
      expect(tm.requiredRaw - t.requiredRaw).toBe(deltaExistingFleet)
      expect(up.requiredRaw - t.requiredRaw).toBe(deltaWithUpgrade)
    }
  )

  it('TLS PQC adds an op for hybrid X25519MLKEM768 (3 ops/tx vs. 2 classical)', () => {
    const tls = USE_CASES.find((u) => u.id === 'tls')!
    const sumClassical = Object.values(tls.classicalOps).reduce((s, v) => s + (v as number), 0)
    const sumPqc = Object.values(tls.pqcOps).reduce((s, v) => s + (v as number), 0)
    expect(sumClassical).toBe(2)
    expect(sumPqc).toBe(3)
  })

  it('every non-TLS use case preserves op count under PQC (algorithm substitution only)', () => {
    for (const uc of USE_CASES) {
      if (uc.id === 'tls') continue
      const sumC = Object.values(uc.classicalOps).reduce((s, v) => s + (v as number), 0)
      const sumP = Object.values(uc.pqcOps).reduce((s, v) => s + (v as number), 0)
      expect(sumP).toBe(sumC)
    }
  })

  it('2N redundancy at multiple locations doubles each site (not the global count)', () => {
    // medium × 3 locations, 2N: requiredRaw=37, perLocRaw=⌈37/3⌉=13, perLocReq=13×2=26,
    // total=3×26=78. A "global 2N" interpretation would give 37×2=74 — the per-location model
    // is strictly more conservative (+4 HSMs).
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateForSize('medium'),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: '2n',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 3,
    })
    const tm = r[1]
    expect(tm.requiredRaw).toBe(37)
    expect(tm.perLocationRaw).toBe(13)
    expect(tm.perLocationRequired).toBe(26) // 13 × 2 — applied per location
    expect(tm.requiredWithRedundancy).toBe(78) // 3 × 26
    // Global 2N would be 74; site-local 2N is strictly larger.
    expect(tm.requiredWithRedundancy).toBeGreaterThan(tm.requiredRaw * 2)
  })

  it('per-location utilization splits load by numLocations (equal split assumption)', () => {
    // Same per-location HSM count and same workload, but 1 location vs. 4 locations:
    // per-location utilization should be exactly 1/4 with 4 locations.
    const baseArgs = {
      useCases: USE_CASES,
      state: stateWith(['tls'], 4_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1' as const,
      hsmsPerLocation: { today: 1, tomorrow: 27, upgraded: 1 },
    }
    const single = computeScenarios({ ...baseArgs, numLocations: 1 })
    const four = computeScenarios({ ...baseArgs, numLocations: 4 })
    const sML = single[1].perAlgoHsms.find((x) => x.algo === 'ml-dsa-65')!
    const fML = four[1].perAlgoHsms.find((x) => x.algo === 'ml-dsa-65')!
    expect(sML.utilizationPct).toBeCloseTo((4_000 / (150 * 27)) * 100, 5)
    expect(fML.utilizationPct).toBeCloseTo(sML.utilizationPct / 4, 5)
  })

  it('site-local N+1 buys L spare HSMs across the fleet (stricter than global N+1)', () => {
    // medium × 5 locations, N+1: R=37, perLocRaw=⌈37/5⌉=8, perLocReq=9, total=5×9=45.
    // Spares relative to "just enough per site": 45 − (5×8) = 5 = L. Exactly one spare per site.
    // Global N+1 (the alternative interpretation) would be 37+1=38 — strictly fewer.
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateForSize('medium'),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 5,
    })
    const tm = r[1]
    expect(tm.requiredRaw).toBe(37)
    expect(tm.perLocationRaw).toBe(8)
    expect(tm.perLocationRequired).toBe(9)
    expect(tm.requiredWithRedundancy).toBe(45)
    const spares = tm.requiredWithRedundancy - tm.numLocations * tm.perLocationRaw
    expect(spares).toBe(tm.numLocations) // exactly L spares — one per site
    expect(tm.requiredWithRedundancy).toBeGreaterThan(tm.requiredRaw + 1) // > global N+1
  })

  it('20-location N+1 floor: trivial loads collapse to (locations × 2)', () => {
    // small/today raw=1 → perLoc=1, +1=2, ×20=40
    // small/upgraded raw=1 → same → 40
    // small/tomorrow raw=4 → ceil(4/20)=1, +1=2, ×20=40 — collapses to floor too
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateForSize('small'),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 20,
    })
    expect(r[0].requiredWithRedundancy).toBe(40)
    expect(r[1].requiredWithRedundancy).toBe(40)
    expect(r[2].requiredWithRedundancy).toBe(40)
  })
})

// ---------------------------------------------------------------------------
// Phase 2 — Coverage Extension
// (1) Symmetric 2N matrix mirroring the N+1 matrix
// (2) Single-DC at all 3 sizes, both redundancy modes
// (3) Bottleneck-switching test (KMS-only at large)
// (4) Model invariants across a 30-case grid
// ---------------------------------------------------------------------------

const MATRIX_2N: MatrixCase[] = [
  // small (R: today=1, tomorrow=4, upgraded=1)
  {
    size: 'small',
    locations: 2,
    today: { requiredRaw: 1, perLocationRaw: 1, perLocationRequired: 2, requiredWithRedundancy: 4 },
    tomorrow: {
      requiredRaw: 4,
      perLocationRaw: 2,
      perLocationRequired: 4, // 2 × 2
      requiredWithRedundancy: 8,
      bottleneck: 'ml-dsa-65',
    },
    upgraded: {
      requiredRaw: 1,
      perLocationRaw: 1,
      perLocationRequired: 2,
      requiredWithRedundancy: 4,
    },
    deltaExistingFleet: 3,
    deltaWithUpgrade: 0,
  },
  {
    size: 'small',
    locations: 3,
    today: { requiredRaw: 1, perLocationRaw: 1, perLocationRequired: 2, requiredWithRedundancy: 6 },
    tomorrow: {
      requiredRaw: 4,
      perLocationRaw: 2, // ceil(4/3)
      perLocationRequired: 4,
      requiredWithRedundancy: 12,
      bottleneck: 'ml-dsa-65',
    },
    upgraded: {
      requiredRaw: 1,
      perLocationRaw: 1,
      perLocationRequired: 2,
      requiredWithRedundancy: 6,
    },
    deltaExistingFleet: 3,
    deltaWithUpgrade: 0,
  },
  {
    size: 'small',
    locations: 20,
    today: {
      requiredRaw: 1,
      perLocationRaw: 1,
      perLocationRequired: 2,
      requiredWithRedundancy: 40,
    },
    tomorrow: {
      requiredRaw: 4,
      perLocationRaw: 1,
      perLocationRequired: 2,
      requiredWithRedundancy: 40,
      bottleneck: 'ml-dsa-65',
    },
    upgraded: {
      requiredRaw: 1,
      perLocationRaw: 1,
      perLocationRequired: 2,
      requiredWithRedundancy: 40,
    },
    deltaExistingFleet: 3,
    deltaWithUpgrade: 0,
  },
  // medium (R: today=1, tomorrow=37, upgraded=1)
  {
    size: 'medium',
    locations: 2,
    today: { requiredRaw: 1, perLocationRaw: 1, perLocationRequired: 2, requiredWithRedundancy: 4 },
    tomorrow: {
      requiredRaw: 37,
      perLocationRaw: 19,
      perLocationRequired: 38, // 19 × 2
      requiredWithRedundancy: 76,
      bottleneck: 'ml-dsa-65',
    },
    upgraded: {
      requiredRaw: 1,
      perLocationRaw: 1,
      perLocationRequired: 2,
      requiredWithRedundancy: 4,
    },
    deltaExistingFleet: 36,
    deltaWithUpgrade: 0,
  },
  {
    size: 'medium',
    locations: 3,
    today: { requiredRaw: 1, perLocationRaw: 1, perLocationRequired: 2, requiredWithRedundancy: 6 },
    tomorrow: {
      requiredRaw: 37,
      perLocationRaw: 13,
      perLocationRequired: 26, // 13 × 2
      requiredWithRedundancy: 78,
      bottleneck: 'ml-dsa-65',
    },
    upgraded: {
      requiredRaw: 1,
      perLocationRaw: 1,
      perLocationRequired: 2,
      requiredWithRedundancy: 6,
    },
    deltaExistingFleet: 36,
    deltaWithUpgrade: 0,
  },
  {
    size: 'medium',
    locations: 20,
    today: {
      requiredRaw: 1,
      perLocationRaw: 1,
      perLocationRequired: 2,
      requiredWithRedundancy: 40,
    },
    tomorrow: {
      requiredRaw: 37,
      perLocationRaw: 2,
      perLocationRequired: 4, // 2 × 2
      requiredWithRedundancy: 80,
      bottleneck: 'ml-dsa-65',
    },
    upgraded: {
      requiredRaw: 1,
      perLocationRaw: 1,
      perLocationRequired: 2,
      requiredWithRedundancy: 40,
    },
    deltaExistingFleet: 36,
    deltaWithUpgrade: 0,
  },
  // large (R: today=6, tomorrow=370, upgraded=7)
  {
    size: 'large',
    locations: 2,
    today: {
      requiredRaw: 6,
      perLocationRaw: 3,
      perLocationRequired: 6, // 3 × 2
      requiredWithRedundancy: 12,
    },
    tomorrow: {
      requiredRaw: 370,
      perLocationRaw: 185,
      perLocationRequired: 370, // 185 × 2
      requiredWithRedundancy: 740, // == R × 2 because L evenly divides R
      bottleneck: 'ml-dsa-65',
    },
    upgraded: {
      requiredRaw: 7,
      perLocationRaw: 4,
      perLocationRequired: 8,
      requiredWithRedundancy: 16,
    },
    deltaExistingFleet: 364,
    deltaWithUpgrade: 1,
  },
  {
    size: 'large',
    locations: 3,
    today: {
      requiredRaw: 6,
      perLocationRaw: 2,
      perLocationRequired: 4,
      requiredWithRedundancy: 12,
    },
    tomorrow: {
      requiredRaw: 370,
      perLocationRaw: 124,
      perLocationRequired: 248,
      requiredWithRedundancy: 744, // > R × 2 = 740 (L doesn't evenly divide R)
      bottleneck: 'ml-dsa-65',
    },
    upgraded: {
      requiredRaw: 7,
      perLocationRaw: 3,
      perLocationRequired: 6,
      requiredWithRedundancy: 18,
    },
    deltaExistingFleet: 364,
    deltaWithUpgrade: 1,
  },
  {
    size: 'large',
    locations: 20,
    today: {
      requiredRaw: 6,
      perLocationRaw: 1,
      perLocationRequired: 2,
      requiredWithRedundancy: 40,
    },
    tomorrow: {
      requiredRaw: 370,
      perLocationRaw: 19,
      perLocationRequired: 38,
      requiredWithRedundancy: 760,
      bottleneck: 'ml-dsa-65',
    },
    upgraded: {
      requiredRaw: 7,
      perLocationRaw: 1,
      perLocationRequired: 2,
      requiredWithRedundancy: 40,
    },
    deltaExistingFleet: 364,
    deltaWithUpgrade: 1,
  },
]

describe('HSM capacity — size × locations matrix (2N redundancy)', () => {
  it.each(MATRIX_2N)(
    '$size × $locations locations (2N): matches hand-derived model',
    ({ size, locations, today, tomorrow, upgraded, deltaExistingFleet, deltaWithUpgrade }) => {
      const r = computeScenarios({
        useCases: USE_CASES,
        state: stateForSize(size),
        classical: CLASSICAL_HSM_DEFAULT,
        pqc: PQC_HSM_DEFAULT,
        redundancy: '2n',
        hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
        numLocations: locations,
      })
      const [t, tm, up] = r

      expect(t.requiredRaw).toBe(today.requiredRaw)
      expect(t.perLocationRaw).toBe(today.perLocationRaw)
      expect(t.perLocationRequired).toBe(today.perLocationRequired)
      expect(t.requiredWithRedundancy).toBe(today.requiredWithRedundancy)

      expect(tm.requiredRaw).toBe(tomorrow.requiredRaw)
      expect(tm.perLocationRaw).toBe(tomorrow.perLocationRaw)
      expect(tm.perLocationRequired).toBe(tomorrow.perLocationRequired)
      expect(tm.requiredWithRedundancy).toBe(tomorrow.requiredWithRedundancy)
      if (tomorrow.bottleneck) expect(tm.bottleneck).toBe(tomorrow.bottleneck)

      expect(up.requiredRaw).toBe(upgraded.requiredRaw)
      expect(up.perLocationRaw).toBe(upgraded.perLocationRaw)
      expect(up.perLocationRequired).toBe(upgraded.perLocationRequired)
      expect(up.requiredWithRedundancy).toBe(upgraded.requiredWithRedundancy)

      expect(tm.requiredRaw - t.requiredRaw).toBe(deltaExistingFleet)
      expect(up.requiredRaw - t.requiredRaw).toBe(deltaWithUpgrade)

      // 2N per-location identity: perLocationRequired = perLocationRaw × 2
      for (const s of [t, tm, up]) {
        if (s.perLocationRaw > 0) {
          expect(s.perLocationRequired).toBe(s.perLocationRaw * 2)
        }
      }
    }
  )

  it('large × 2 × tomorrow: per-location 2N equals global 2N when L evenly divides R', () => {
    // R=370, L=2, perLocRaw=185, perLocReq=370, total=740 = R × 2.
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateForSize('large'),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: '2n',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 2,
    })
    expect(r[1].requiredWithRedundancy).toBe(r[1].requiredRaw * 2) // 740 = 370 × 2
  })

  it('large × 3 × tomorrow: per-location 2N is strictly larger than global 2N when L doesn’t divide R', () => {
    // R=370, L=3, perLocRaw=124 (ceil), perLocReq=248, total=744 > 370 × 2 = 740.
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateForSize('large'),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: '2n',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 3,
    })
    expect(r[1].requiredWithRedundancy).toBeGreaterThan(r[1].requiredRaw * 2)
    expect(r[1].requiredWithRedundancy).toBe(744)
  })
})

describe('HSM capacity — single-DC (numLocations = 1) at all sizes, both redundancy modes', () => {
  const SINGLE_DC: Array<{
    size: DeploymentSize
    redundancy: 'n+1' | '2n'
    today: number // requiredWithRedundancy
    tomorrow: number
    upgraded: number
  }> = [
    // N+1 at L=1: perLocReq = R + 1. Total = R + 1.
    { size: 'small', redundancy: 'n+1', today: 2, tomorrow: 5, upgraded: 2 },
    { size: 'medium', redundancy: 'n+1', today: 2, tomorrow: 38, upgraded: 2 },
    { size: 'large', redundancy: 'n+1', today: 7, tomorrow: 371, upgraded: 8 },
    // 2N at L=1: perLocReq = R × 2. Total = R × 2.
    { size: 'small', redundancy: '2n', today: 2, tomorrow: 8, upgraded: 2 },
    { size: 'medium', redundancy: '2n', today: 2, tomorrow: 74, upgraded: 2 },
    { size: 'large', redundancy: '2n', today: 12, tomorrow: 740, upgraded: 14 },
  ]

  it.each(SINGLE_DC)(
    '$size, $redundancy, L=1: total = R for redundancy applied directly',
    ({ size, redundancy, today, tomorrow, upgraded }) => {
      const r = computeScenarios({
        useCases: USE_CASES,
        state: stateForSize(size),
        classical: CLASSICAL_HSM_DEFAULT,
        pqc: PQC_HSM_DEFAULT,
        redundancy,
        hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
        numLocations: 1,
      })
      expect(r[0].requiredWithRedundancy).toBe(today)
      expect(r[1].requiredWithRedundancy).toBe(tomorrow)
      expect(r[2].requiredWithRedundancy).toBe(upgraded)
      // At L=1 the per-location raw equals the global raw.
      expect(r[1].perLocationRaw).toBe(r[1].requiredRaw)
    }
  )
})

describe('HSM capacity — bottleneck switching', () => {
  it('KMS-only at large scale: bottleneck flips to ML-KEM-768 (no ML-DSA load)', () => {
    // KMS PQC ops: { 'aes-256': 1, 'ml-kem-768': 0.2 }. No ML-DSA at all.
    // At 10,000 TPS: ML-KEM-768 = 2,000 ops/s; AES-256 = 10,000 ops/s.
    // Classical HSM: ml-kem-768 cap=500 → ⌈2000/500⌉=4; aes-256 cap=20000 → 1.
    // Bottleneck: ml-kem-768; requiredRaw = 4.
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['kms'], 10_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
    })
    const tomorrow = r[1]
    expect(tomorrow.bottleneck).toBe('ml-kem-768')
    expect(tomorrow.requiredRaw).toBe(4)
    // ML-DSA load is exactly zero
    const mlDsa = tomorrow.perAlgoHsms.find((x) => x.algo === 'ml-dsa-65')!
    expect(mlDsa.load).toBe(0)
    expect(mlDsa.hsms).toBe(0)
  })
})

describe('HSM capacity — model invariants', () => {
  const SIZES: DeploymentSize[] = ['small', 'medium', 'large']
  const LOCATIONS = [1, 2, 3, 5, 20]
  const MODES = ['n+1', '2n'] as const

  const GRID: Array<{
    size: DeploymentSize
    locations: number
    mode: 'n+1' | '2n'
  }> = []
  for (const size of SIZES) {
    for (const locations of LOCATIONS) {
      for (const mode of MODES) {
        GRID.push({ size, locations, mode })
      }
    }
  }

  it.each(GRID)('$size × L=$locations × $mode: invariants hold', ({ size, locations, mode }) => {
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateForSize(size),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: mode,
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: locations,
    })
    for (const s of r) {
      // Invariant 1: total identity
      expect(s.requiredWithRedundancy).toBe(s.numLocations * s.perLocationRequired)
      // Invariant 2: redundancy never reduces per-site count
      expect(s.perLocationRequired).toBeGreaterThanOrEqual(s.perLocationRaw)
      // Invariant 3: redundancy formula contract
      if (s.perLocationRaw > 0) {
        if (mode === 'n+1') {
          expect(s.perLocationRequired).toBe(s.perLocationRaw + 1)
        } else {
          expect(s.perLocationRequired).toBe(s.perLocationRaw * 2)
        }
      } else {
        expect(s.perLocationRequired).toBe(0)
      }
    }
  })
})
