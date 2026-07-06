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
    // TLS alone at 10,000 TPS in PQC workload = 10,000 ML-DSA sign/s + 10,000 ML-KEM-768 ops/s
    // + 10,000 ECDH P-256 ops/s. Shared-fleet model sums each algorithm's share of one HSM's
    // capacity: ML-DSA 10000/150=66.67 + ML-KEM 10000/500=20 + ECDH 10000/10000=1 = 87.67 → 88.
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
    expect(tomorrow.requiredRaw).toBe(88)
    expect(tomorrow.requiredWithRedundancy).toBe(89) // N+1 with 1 location: 88 + 1 = 89
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
    // Post-PQC on classical fleet needs 89 HSMs/location but only 5 are deployed.
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
      hsmsPerLocation: { today: 2, tomorrow: 89, upgraded: 3 },
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
    // Enable TLS (10k TPS) + SSH (10k TPS). PQC ops (both hybrid KEX): TLS = ml-dsa 1,
    // ml-kem 1, ecdh 1; SSH = ml-dsa 1, ml-kem 1, ecdh 1 (mlkem768x25519-style hybrid).
    // Loads: ml-dsa=20,000, ml-kem=20,000, ecdh=20,000.
    // Shared-fleet sum: 20000/150 + 20000/500 + 20000/10000 = 133.33+40+2=175.33 → 176.
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls', 'ssh'], 10_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
    })
    expect(r[1].requiredRaw).toBe(176)
  })

  it('replicates per-site load across locations (geo-redundant active-active)', () => {
    // 3 locations, N+1, TLS at 10k TPS → shared-fleet raw = 88 HSMs PER SITE (see above).
    // Under per-site model, perLocationRaw = R = 88 (no splitting).
    // perLocationRequired = 88 + 1 = 89 (N+1), total = 3 × 89 = 267.
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 10_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 89, upgraded: 1 },
      numLocations: 3,
    })
    const tomorrow = r[1]
    expect(tomorrow.requiredRaw).toBe(88)
    expect(tomorrow.perLocationRaw).toBe(88) // per-site model: each location runs full demand
    expect(tomorrow.perLocationRequired).toBe(89) // 88 + 1 (N+1)
    expect(tomorrow.requiredWithRedundancy).toBe(267) // 3 × 89
    expect(tomorrow.sufficient).toBe(true) // 89 HSMs/loc meets perLocationRequired=89
  })

  it('inventory mode: N=10 classical HSMs at TLS 5k PQC TPS — today sufficient, tomorrow overloaded', () => {
    // Inventory mode: user owns 10 classical HSMs.
    // TLS at 5,000 PQC TPS → ml-dsa=5,000, ml-kem=5,000, ecdh=5,000.
    // Shared-fleet sum: 5000/150 + 5000/500 + 5000/10000 = 33.33+10+0.5=43.83 → 44 raw → N+1=45.
    // With 10 deployed: tomorrow is overloaded (needs 45, has 10).
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
    expect(r[1].requiredRaw).toBe(44) // shared-fleet raw for TLS PQC load at 5k TPS
    expect(r[1].perLocationRequired).toBe(45) // 44+1 N+1
    expect(r[1].sufficient).toBe(false) // 10 deployed < 45 required
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
    // TLS at 5000 per-site TPS PQC → shared-fleet raw = 44 (see above) PER LOCATION
    // (each site runs full per-site demand).
    // perLocationRaw = 44, perLocationRequired (N+1) = 45
    // Total required = 10 × 45 = 450. With 100/location deployed: sufficient (100 ≥ 45).
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
    expect(r[1].perLocationRaw).toBe(44) // per-site model: full demand per location
    expect(r[1].perLocationRequired).toBe(45) // 44+1 N+1
    expect(r[1].requiredWithRedundancy).toBe(450) // 10 × 45
    expect(r[1].sufficient).toBe(true) // 100/loc ≥ 45 required/loc
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
 * Hand-derived raw-demand values per size (under the shared-fleet per-site model:
 * perLocationRaw = R = ⌈ Σ over algorithms of load ÷ capacity ⌉ — NOT the per-algorithm max).
 * Computed from the default org params via deriveUseCaseTps + classicalOps/pqcOps mapping,
 * summed across every algorithm actually loaded (any HSM in the fleet runs any algorithm).
 */
const RAW_BY_SIZE: Record<DeploymentSize, { today: number; tomorrow: number; upgraded: number }> = {
  small: { today: 1, tomorrow: 5, upgraded: 1 },
  medium: { today: 1, tomorrow: 49, upgraded: 2 },
  large: { today: 10, tomorrow: 487, upgraded: 13 },
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

  it('op counts under PQC: +1 classical KEX for hybrid-KEM protocols, unchanged otherwise', () => {
    // TLS, SSH, and IKEv2 are hybrid key exchange per their standards (the classical
    // (EC)DH op is retained alongside ML-KEM); every other use case is a pure
    // algorithm substitution with an identical op count.
    const HYBRID_KEM_USE_CASES = ['tls', 'ssh', 'vpn-ike']
    for (const uc of USE_CASES) {
      const sumC = Object.values(uc.classicalOps).reduce((s, v) => s + (v as number), 0)
      const sumP = Object.values(uc.pqcOps).reduce((s, v) => s + (v as number), 0)
      if (HYBRID_KEM_USE_CASES.includes(uc.id)) {
        expect(sumP, uc.id).toBe(sumC + 1)
        // The classical KEX op must be present alongside ML-KEM (hybrid, not pure).
        expect(uc.pqcOps['ecdh-p256'], uc.id).toBeGreaterThan(0)
        expect(uc.pqcOps['ml-kem-768'], uc.id).toBeGreaterThan(0)
      } else {
        expect(sumP, uc.id).toBe(sumC)
      }
    }
  })

  it('per-site model: 2N at L locations multiplies the per-site doubled count by L', () => {
    // medium × 3 locations, 2N: R=49 (shared-fleet), perLocRaw=R=49, perLocReq=98, total=3×98=294.
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
    expect(tm.requiredRaw).toBe(49)
    expect(tm.perLocationRaw).toBe(49) // per-site: each location runs full demand
    expect(tm.perLocationRequired).toBe(98) // 49 × 2
    expect(tm.requiredWithRedundancy).toBe(294) // 3 × 98
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
    // medium × 5 locations, N+1: R=49 (shared-fleet), perLocRaw=49, perLocReq=50, total=5×50=250.
    // Spares relative to "just enough per site": 250 − (5×49) = 5 = L.
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
    expect(tm.requiredRaw).toBe(49)
    expect(tm.perLocationRaw).toBe(49) // per-site model
    expect(tm.perLocationRequired).toBe(50)
    expect(tm.requiredWithRedundancy).toBe(250)
    const spares = tm.requiredWithRedundancy - tm.numLocations * tm.perLocationRaw
    expect(spares).toBe(tm.numLocations)
  })

  it('per-site N+1 at L=20: totals scale linearly with raw demand × L', () => {
    // small × 20 × N+1 (shared-fleet raw): today R=1 → 20×(1+1)=40;
    // tomorrow R=5 → 20×(5+1)=120; upgraded R=1 → 40.
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
    expect(r[1].requiredWithRedundancy).toBe(120)
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
    // R=487 (shared-fleet), 2N → perLocRaw=487, perLocReq=974, total = L × 974.
    const r2 = computeScenarios({
      useCases: USE_CASES,
      state: stateForSize('large'),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: '2n',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 2,
    })
    expect(r2[1].requiredWithRedundancy).toBe(2 * 487 * 2) // 1948

    const r3 = computeScenarios({
      useCases: USE_CASES,
      state: stateForSize('large'),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: '2n',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 3,
    })
    expect(r3[1].requiredWithRedundancy).toBe(3 * 487 * 2) // 2922
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
    // N+1 at L=1: perLocReq = R + 1. Total = R + 1. (R = shared-fleet raw, see RAW_BY_SIZE.)
    { size: 'small', redundancy: 'n+1', today: 2, tomorrow: 6, upgraded: 2 },
    { size: 'medium', redundancy: 'n+1', today: 2, tomorrow: 50, upgraded: 3 },
    { size: 'large', redundancy: 'n+1', today: 11, tomorrow: 488, upgraded: 14 },
    // 2N at L=1: perLocReq = R × 2. Total = R × 2.
    { size: 'small', redundancy: '2n', today: 2, tomorrow: 10, upgraded: 2 },
    { size: 'medium', redundancy: '2n', today: 2, tomorrow: 98, upgraded: 4 },
    { size: 'large', redundancy: '2n', today: 20, tomorrow: 974, upgraded: 26 },
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
    // Classical HSM shared-fleet sum: 2000/500 + 10000/20000 = 4 + 0.5 = 4.5 → ceil = 5.
    // Bottleneck: ml-kem-768 (largest fraction, 4 vs aes-256's 0.5); requiredRaw = 5.
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
    expect(tomorrow.requiredRaw).toBe(5)
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
      // Invariant 4: shared-fleet sum is never less than any single algorithm's own
      // dedicated-pool count — sizing for a shared fleet can only need as many or more
      // HSMs than sizing the bottleneck algorithm alone.
      const maxPerAlgo = s.perAlgoHsms.reduce((m, r) => Math.max(m, r.hsms), 0)
      expect(s.perLocationRaw).toBeGreaterThanOrEqual(maxPerAlgo)
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

describe('HSM capacity — shared-fleet sum-model regression (2026-07-05 accuracy fix)', () => {
  it('medium org, all default use cases: post-PQC-on-classical raw is 49, not 37', () => {
    // Prior to this fix, computeScenario sized the fleet on the WORST single algorithm only
    // (max), which contradicts the model's own "any HSM can run any algorithm" assumption.
    // On a shared fleet every op consumes device time, so the correct raw count sums each
    // algorithm's share: 37 (bottleneck-only) undercounts the true requirement by 24%.
    // See docs/platform/ux/playground-audit/PT-026-hsm-capacity-accuracy-2026-07-05.md §A1.
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateForSize('medium'),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
    })
    expect(r[1].requiredRaw).toBe(49)
    expect(r[1].requiredRaw).not.toBe(37) // the old (incorrect) bottleneck-only figure
  })
})

describe('HSM capacity — target-utilization headroom', () => {
  it('defaults to 100% (no headroom) — identical to omitting the parameter', () => {
    const withDefault = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 10_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
    })
    const withExplicit100 = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 10_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
      targetUtilizationPct: 100,
    })
    expect(withExplicit100[1].requiredRaw).toBe(withDefault[1].requiredRaw)
  })

  it('70% target inflates the raw count by 1/0.7 relative to 100%', () => {
    const full = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 10_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
      targetUtilizationPct: 100,
    })
    const headroom = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 10_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
      targetUtilizationPct: 70,
    })
    // requiredRaw(full)=88 (see earlier test); at 70% target: ceil(87.67 / 0.7) = 126.
    expect(full[1].requiredRaw).toBe(88)
    expect(headroom[1].requiredRaw).toBe(126)
    expect(headroom[1].requiredRaw).toBeGreaterThan(full[1].requiredRaw)
  })

  it('headroom does not change fleetUtilizationPct reporting (true-capacity basis)', () => {
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 10_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 126, upgraded: 1 },
      numLocations: 1,
      targetUtilizationPct: 70,
    })
    // Deployed exactly at the headroom-inflated raw count → true utilization ≈ 70%, not 100%.
    expect(r[1].fleetUtilizationPct).toBeCloseTo(70, 0)
  })
})

describe('HSM capacity — transition-window hybrid signing', () => {
  it('defaults to off — identical to omitting the parameter', () => {
    const withDefault = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['code-signing'], 1_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
    })
    const withExplicitFalse = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['code-signing'], 1_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
      hybridSigningTransition: false,
    })
    expect(withExplicitFalse[1].requiredRaw).toBe(withDefault[1].requiredRaw)
  })

  it('adds classical RSA signing load on top of ML-DSA when enabled', () => {
    // code-signing: classicalOps={rsa-2048:1}, pqcOps={ml-dsa-65:1}. At 1,000 TPS:
    // off → ml-dsa=1000, rsa=0. on → ml-dsa=1000, rsa=1000 (dual-signed).
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['code-signing'], 1_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
      hybridSigningTransition: true,
    })
    const tomorrow = r[1]
    const rsaEntry = tomorrow.perAlgoHsms.find((x) => x.algo === 'rsa-2048')!
    const mlDsaEntry = tomorrow.perAlgoHsms.find((x) => x.algo === 'ml-dsa-65')!
    expect(rsaEntry.load).toBe(1_000)
    expect(mlDsaEntry.load).toBe(1_000)
  })

  it('does not add KEM load — signature-only practice', () => {
    // tls PQC ops include ml-kem-768 and ecdh-p256 already; hybrid signing must not
    // double-count ecdh-p256 beyond what pqcOps already specifies.
    const off = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 1_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
      hybridSigningTransition: false,
    })
    const on = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 1_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
      hybridSigningTransition: true,
    })
    const offEcdh = off[1].perAlgoHsms.find((x) => x.algo === 'ecdh-p256')!
    const onEcdh = on[1].perAlgoHsms.find((x) => x.algo === 'ecdh-p256')!
    expect(onEcdh.load).toBe(offEcdh.load) // unchanged — KEM load is not doubled
    const onEcdsa = on[1].perAlgoHsms.find((x) => x.algo === 'ecdsa-p256')!
    expect(onEcdsa.load).toBe(1_000) // classical signature added back on top
  })

  it('never decreases requiredRaw relative to the same load without the toggle', () => {
    const off = computeScenarios({
      useCases: USE_CASES,
      state: stateForSize('medium'),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
      hybridSigningTransition: false,
    })
    const on = computeScenarios({
      useCases: USE_CASES,
      state: stateForSize('medium'),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
      hybridSigningTransition: true,
    })
    expect(on[1].requiredRaw).toBeGreaterThanOrEqual(off[1].requiredRaw)
    expect(on[2].requiredRaw).toBeGreaterThanOrEqual(off[2].requiredRaw)
    // "today" (classical workload) is unaffected — the toggle only applies to pqc workload.
    expect(on[0].requiredRaw).toBe(off[0].requiredRaw)
  })
})

describe('HSM capacity — migration horizon (standards-today vs end-state)', () => {
  it("defaults to 'end-state' — identical to omitting the parameter", () => {
    const args = {
      useCases: USE_CASES,
      state: stateForSize('medium'),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1' as const,
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
    }
    const dflt = computeScenarios(args)
    const explicit = computeScenarios({ ...args, migrationHorizon: 'end-state' })
    expect(explicit[1].requiredRaw).toBe(dflt[1].requiredRaw)
  })

  it('standards-today: TLS keeps ECDSA signing (draft-ietf-tls-mldsa not yet RFC), hybrid ML-KEM on', () => {
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 1_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
      migrationHorizon: 'standards-today',
    })
    const tomorrow = r[1]
    const load = (a: string) => tomorrow.perAlgoHsms.find((x) => x.algo === a)!.load
    expect(load('ecdsa-p256')).toBe(1_000) // server sig stays classical today
    expect(load('ml-dsa-65')).toBe(0)
    expect(load('ml-kem-768')).toBe(1_000) // hybrid KEM is standardized/deployed
    expect(load('ecdh-p256')).toBe(1_000) // classical share of the hybrid KEX
  })

  it('standards-today: DNSSEC stays fully classical (no WG draft, no IANA code point)', () => {
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['dnssec'], 1_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
      migrationHorizon: 'standards-today',
    })
    const load = (a: string) => r[1].perAlgoHsms.find((x) => x.algo === a)!.load
    expect(load('ml-dsa-65')).toBe(0)
    expect(load('ecdsa-p256')).toBe(1_000)
  })

  it('standards-today: PKI CA signs with ML-DSA (RFC 9881 published)', () => {
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['pki-ca'], 1_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
      migrationHorizon: 'standards-today',
    })
    const load = (a: string) => r[1].perAlgoHsms.find((x) => x.algo === a)!.load
    expect(load('ml-dsa-65')).toBe(1_000)
    expect(load('rsa-2048')).toBe(0)
  })

  it('standards-today requires no more HSMs than end-state at default medium', () => {
    const args = {
      useCases: USE_CASES,
      state: stateForSize('medium'),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1' as const,
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
    }
    const today = computeScenarios({ ...args, migrationHorizon: 'standards-today' })
    const endState = computeScenarios({ ...args, migrationHorizon: 'end-state' })
    expect(today[1].requiredRaw).toBeLessThanOrEqual(endState[1].requiredRaw)
    // And the classical baseline scenario is unaffected by the horizon.
    expect(today[0].requiredRaw).toBe(endState[0].requiredRaw)
  })

  it('standards-today + hybrid-signing toggle: no dual-sign load for use cases still signing classically', () => {
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['tls'], 1_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
      migrationHorizon: 'standards-today',
      hybridSigningTransition: true,
    })
    // TLS signs classically under standards-today — the toggle must NOT double it.
    const load = (a: string) => r[1].perAlgoHsms.find((x) => x.algo === a)!.load
    expect(load('ecdsa-p256')).toBe(1_000)
  })
})

describe('HSM capacity — code-signing algorithm choice (SLH-DSA)', () => {
  it('SLH-DSA-128s swaps the code-signing signature and explodes the per-algo HSM need', () => {
    // 20 TPS on ML-DSA-65 (150 ops/s) is a rounding error; on SLH-DSA-128s
    // (2 sign/s firmware fallback) the same 20 TPS needs 10 HSMs of signing capacity.
    const args = {
      useCases: USE_CASES,
      state: stateWith(['code-signing'], 20),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1' as const,
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
    }
    const mlDsa = computeScenarios(args)
    const slhDsa = computeScenarios({ ...args, codeSigningAlg: 'slh-dsa-128s' })

    expect(mlDsa[1].requiredRaw).toBe(1) // 20/150 → rounds to 1
    const slhEntry = slhDsa[1].perAlgoHsms.find((x) => x.algo === 'slh-dsa-128s')!
    expect(slhEntry.load).toBe(20)
    expect(slhDsa[1].requiredRaw).toBe(10) // 20/2 = 10 — code signing becomes the constraint
    expect(slhDsa[1].bottleneck).toBe('slh-dsa-128s')
    const mlEntry = slhDsa[1].perAlgoHsms.find((x) => x.algo === 'ml-dsa-65')!
    expect(mlEntry.load).toBe(0) // swapped, not added
  })

  it('the choice only affects code-signing — other ML-DSA use cases are untouched', () => {
    const r = computeScenarios({
      useCases: USE_CASES,
      state: stateWith(['pki-ca'], 1_000),
      classical: CLASSICAL_HSM_DEFAULT,
      pqc: PQC_HSM_DEFAULT,
      redundancy: 'n+1',
      hsmsPerLocation: { today: 1, tomorrow: 1, upgraded: 1 },
      numLocations: 1,
      codeSigningAlg: 'slh-dsa-128s',
    })
    const load = (a: string) => r[1].perAlgoHsms.find((x) => x.algo === a)!.load
    expect(load('ml-dsa-65')).toBe(1_000)
    expect(load('slh-dsa-128s')).toBe(0)
  })
})

describe('HSM capacity — region presets', () => {
  it('REGION_PRESETS has enough entries to label the default panel size (8)', () => {
    expect(REGION_PRESETS.length).toBeGreaterThanOrEqual(8)
    expect(new Set(REGION_PRESETS).size).toBe(REGION_PRESETS.length) // no duplicates
  })
})
