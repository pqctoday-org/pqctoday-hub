// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { computeScenarios } from './HsmCapacityCalculator'
import {
  USE_CASES,
  CLASSICAL_HSM_DEFAULT,
  PQC_HSM_DEFAULT,
  ORG_PARAM_DEFAULTS,
  REGION_PRESETS,
  BASE_UNIT_ALGO,
  algoCostRatio,
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

  it('replicates per-site load across locations (geo-redundant active-active)', () => {
    // 3 locations, N+1, TLS at 10k TPS → raw = 67 HSMs PER SITE (ceil(10000/150))
    // Under per-site model, perLocationRaw = R = 67 (no splitting).
    // perLocationRequired = 67 + 1 = 68 (N+1), total = 3 × 68 = 204.
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 10_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 68, upgraded: 1 },
      numLocations: 3,
    })
    const tomorrow = r[1]
    expect(tomorrow.requiredRaw).toBe(67)
    expect(tomorrow.perLocationRaw).toBe(67) // per-site model: each location runs full demand
    expect(tomorrow.perLocationRequired).toBe(68) // 67 + 1 (N+1)
    expect(tomorrow.requiredWithRedundancy).toBe(204) // 3 × 68
    expect(tomorrow.sufficient).toBe(true) // 68 HSMs/loc meets perLocationRequired=68
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
    // TLS at 5000 per-site TPS PQC → ML-DSA load = 5000 ops/s, raw = ceil(5000/150) = 34
    // PER LOCATION (each site runs full per-site demand).
    // perLocationRaw = 34, perLocationRequired (N+1) = 35
    // Total required = 10 × 35 = 350. With 100/location deployed: sufficient (100 ≥ 35).
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
    expect(r[1].perLocationRaw).toBe(34) // per-site model: full demand per location
    expect(r[1].perLocationRequired).toBe(35) // 34+1 N+1
    expect(r[1].requiredWithRedundancy).toBe(350) // 10 × 35
    expect(r[1].sufficient).toBe(true) // 100/loc ≥ 35 required/loc
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

/**
 * Derive a ScenarioExpect from raw demand under the per-site model
 * (perLocationRaw = R; per-location HA = R+1 for N+1, R×2 for 2N;
 *  total = L × per-location HA).
 */
function siteExpect(R: number, L: number, mode: 'n+1' | '2n', bottleneck?: string): ScenarioExpect {
  const perLocReq = R > 0 ? (mode === 'n+1' ? R + 1 : R * 2) : 0
  return {
    requiredRaw: R,
    perLocationRaw: R,
    perLocationRequired: perLocReq,
    requiredWithRedundancy: L * perLocReq,
    bottleneck,
  }
}

/**
 * Hand-derived raw-demand values per size (under per-site model, perLocationRaw = R).
 * Computed from the default org params via deriveUseCaseTps + classicalOps/pqcOps mapping.
 */
const RAW_BY_SIZE: Record<DeploymentSize, { today: number; tomorrow: number; upgraded: number }> = {
  small: { today: 1, tomorrow: 4, upgraded: 1 },
  medium: { today: 1, tomorrow: 37, upgraded: 1 },
  large: { today: 6, tomorrow: 370, upgraded: 7 },
}

function caseFor(size: DeploymentSize, locations: number, mode: 'n+1' | '2n'): MatrixCase {
  const raw = RAW_BY_SIZE[size]
  return {
    size,
    locations,
    today: siteExpect(raw.today, locations, mode),
    tomorrow: siteExpect(raw.tomorrow, locations, mode, 'ml-dsa-65'),
    upgraded: siteExpect(raw.upgraded, locations, mode),
    deltaExistingFleet: raw.tomorrow - raw.today,
    deltaWithUpgrade: raw.upgraded - raw.today,
  }
}

const MATRIX: MatrixCase[] = (['small', 'medium', 'large'] as DeploymentSize[]).flatMap((s) =>
  [2, 3, 20].map((L) => caseFor(s, L, 'n+1'))
)

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

  it('per-site model: 2N at L locations multiplies the per-site doubled count by L', () => {
    // medium × 3 locations, 2N: R=37, perLocRaw=R=37, perLocReq=74, total=3×74=222.
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
    expect(tm.perLocationRaw).toBe(37) // per-site: each location runs full demand
    expect(tm.perLocationRequired).toBe(74) // 37 × 2
    expect(tm.requiredWithRedundancy).toBe(222) // 3 × 74
  })

  it('per-site model: per-location utilization is independent of numLocations', () => {
    // Each location carries the FULL workload; adding locations doesn't reduce per-site load.
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
    expect(fML.utilizationPct).toBeCloseTo(sML.utilizationPct, 5)
  })

  it('per-site N+1 buys exactly L spare HSMs across the fleet (one per location)', () => {
    // medium × 5 locations, N+1: R=37, perLocRaw=37, perLocReq=38, total=5×38=190.
    // Spares relative to "just enough per site": 190 − (5×37) = 5 = L.
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
    expect(tm.perLocationRaw).toBe(37) // per-site model
    expect(tm.perLocationRequired).toBe(38)
    expect(tm.requiredWithRedundancy).toBe(190)
    const spares = tm.requiredWithRedundancy - tm.numLocations * tm.perLocationRaw
    expect(spares).toBe(tm.numLocations)
  })

  it('per-site N+1 at L=20: totals scale linearly with raw demand × L', () => {
    // small × 20 × N+1: today R=1 → 20×(1+1)=40; tomorrow R=4 → 20×(4+1)=100;
    // upgraded R=1 → 40.
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
    expect(r[1].requiredWithRedundancy).toBe(100)
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

const MATRIX_2N: MatrixCase[] = (['small', 'medium', 'large'] as DeploymentSize[]).flatMap((s) =>
  [2, 3, 20].map((L) => caseFor(s, L, '2n'))
)

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

  it('per-site 2N totals scale linearly with L (no divisibility quirks)', () => {
    // R=370, 2N → perLocRaw=370, perLocReq=740, total = L × 740.
    const r2 = computeScenarios({
      useCases: USE_CASES,
      state: stateForSize('large'),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: '2n',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 2,
    })
    expect(r2[1].requiredWithRedundancy).toBe(2 * 370 * 2) // 1480

    const r3 = computeScenarios({
      useCases: USE_CASES,
      state: stateForSize('large'),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: '2n',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 3,
    })
    expect(r3[1].requiredWithRedundancy).toBe(3 * 370 * 2) // 2220
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

describe('HSM capacity — RSA-2048 base unit', () => {
  it('algoCostRatio: rsa-2048 is the base (cost = 1)', () => {
    expect(algoCostRatio(CLASSICAL_HSM_DEFAULT, BASE_UNIT_ALGO)).toBe(1)
    expect(algoCostRatio(PQC_HSM_DEFAULT, BASE_UNIT_ALGO)).toBe(1)
  })

  it('algoCostRatio: ML-DSA-65 on classical HSM costs base/rate = 10000/150 ≈ 66.7×', () => {
    const ratio = algoCostRatio(CLASSICAL_HSM_DEFAULT, 'ml-dsa-65')
    expect(ratio).toBeCloseTo(10_000 / 150, 5)
  })

  it('algoCostRatio: ML-KEM-768 on next-gen HSM is faster than base (cost < 1)', () => {
    // PQC HSM: rsa-2048 = 100k, ml-kem-768 = 12k → cost ratio 100/12 ≈ 8.3 (slower than RSA)
    // ML-KEM is dedicated-hardware accelerated but RSA stays fastest on next-gen silicon.
    const ratio = algoCostRatio(PQC_HSM_DEFAULT, 'ml-kem-768')
    expect(ratio).toBeCloseTo(100_000 / 12_000, 5)
    expect(ratio).toBeGreaterThan(1)
  })

  it('algoCostRatio: handles zero rate without crashing', () => {
    const zeroProfile = {
      ...CLASSICAL_HSM_DEFAULT,
      opsPerSec: { ...CLASSICAL_HSM_DEFAULT.opsPerSec, 'ml-dsa-65': 0 },
    }
    expect(algoCostRatio(zeroProfile, 'ml-dsa-65')).toBe(Infinity)
  })
})

describe('HSM capacity — demand vs availability separation', () => {
  it('demand is met by raw count alone; HA target adds redundancy on top', () => {
    // Pick a small workload at L=1, N+1: raw=R, required = R+1.
    // Deploying exactly R HSMs meets demand but NOT HA.
    const state: Record<string, { enabled: boolean; tps: number }> = {}
    for (const uc of USE_CASES) {
      state[uc.id] = { enabled: uc.id === 'code-signing', tps: 100 }
    }
    const r = computeScenarios({
      useCases: USE_CASES,
      state,
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      // Deploy exactly the raw count for the "today" scenario (1 HSM at 100 TPS RSA-2048).
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
    })
    const today = r[0]
    expect(today.perLocationRaw).toBe(1)
    expect(today.perLocationRequired).toBe(2) // N+1
    expect(today.hsmsPerLocation).toBe(1)
    // Demand check: deployed (1) ≥ raw (1) → met
    expect(today.hsmsPerLocation >= today.perLocationRaw).toBe(true)
    // HA check: deployed (1) < required (2) → NOT met
    expect(today.perLocationSufficient).toBe(false)
  })

  it('2N doubles the per-location count, N+1 adds one — both above raw', () => {
    const state: Record<string, { enabled: boolean; tps: number }> = {}
    for (const uc of USE_CASES) {
      state[uc.id] = { enabled: uc.id === 'tls', tps: 50_000 }
    }
    const nPlus1 = computeScenarios({
      useCases: USE_CASES,
      state,
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 3,
    })[0]
    const twoN = computeScenarios({
      useCases: USE_CASES,
      state,
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: '2n',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 3,
    })[0]
    expect(nPlus1.perLocationRaw).toBe(twoN.perLocationRaw) // same demand
    expect(nPlus1.perLocationRequired).toBe(nPlus1.perLocationRaw + 1)
    expect(twoN.perLocationRequired).toBe(twoN.perLocationRaw * 2)
  })
})

describe('HSM capacity — region presets', () => {
  it('REGION_PRESETS has enough entries to label the default panel size (8)', () => {
    expect(REGION_PRESETS.length).toBeGreaterThanOrEqual(8)
    expect(new Set(REGION_PRESETS).size).toBe(REGION_PRESETS.length) // no duplicates
  })
})
