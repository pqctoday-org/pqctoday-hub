// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Scenario 39 is the current common CPU/PKCS#11 comparison.  It is deliberately
 * separate from measurements.ts: the latter is a historical Arm/KV260 experiment
 * with algorithm-specific FPGA paths.  The values here are a reviewed snapshot of
 * the dashboard evidence, not a live scrape of the generated dashboard.
 */

export type Scenario39PlatformId =
  'x1Pro' | 'mx95Pro' | 'mx95' | 'kv260' | 'ventunoQ' | 'm4Pro' | 'm5Max'

export type Scenario39OperationId =
  | 'ecdsaP256Sign'
  | 'x25519Derive'
  | 'mlDsa65Sign'
  | 'mlKem768Encap'
  | 'hybridSignatureSign'
  | 'hybridKemEncap'

export type Scenario39Category = 'classical' | 'pqc' | 'hybrid'
export type Scenario39Profile = 'oneWorker' | 'wholePlatform'

export interface Scenario39Platform {
  id: Scenario39PlatformId
  label: string
  cpu: string
  workers: number
  note: string
}

export interface Scenario39Operation {
  id: Scenario39OperationId
  label: string
  category: Scenario39Category
  explanation: string
  /** Operations per second, one selected tenant; tenants are never summed. */
  oneWorker: Record<Scenario39PlatformId, number>
  /** Operations per second, whole configured machine, one selected tenant. */
  wholePlatform: Record<Scenario39PlatformId, number>
}

export const SCENARIO39_SOURCE = {
  dataset: 'Scenario 39 common PKCS#11 benchmark',
  recordedAt: '2026-10-25',
  dashboard: 'pqctoday-sandbox/pqc-performance-dashboard/dist/index.html',
  evidence: 'pqctoday-sandbox/evidence/scenario39/20261025-oneworker-gap-closure/',
  note: 'One-active-worker uses two harness threads split over two tenants; the displayed tenant has one active worker. Whole-platform profiles use the worker count shown for that target. Results are TPS for one selected tenant, never a sum of tenant outputs.',
} as const

export const SCENARIO39_PLATFORM_ORDER: Scenario39PlatformId[] = [
  'x1Pro',
  'mx95Pro',
  'mx95',
  'kv260',
  'ventunoQ',
  'm4Pro',
  'm5Max',
]

export const SCENARIO39_PLATFORMS: Record<Scenario39PlatformId, Scenario39Platform> = {
  x1Pro: {
    id: 'x1Pro',
    label: 'AI X1 Pro',
    cpu: 'AMD64 VM on Ryzen AI 9 HX 370 · 12 exposed workers',
    workers: 12,
    note: 'Native release profile; AWS-LC size mode disabled.',
  },
  mx95Pro: {
    id: 'mx95Pro',
    label: 'i.MX95 Pro',
    cpu: 'NXP FRDM-i.MX95 Pro · 6 Cortex-A55 workers',
    workers: 6,
    note: 'ARM64 CPU PKCS#11 path.',
  },
  mx95: {
    id: 'mx95',
    label: 'i.MX95',
    cpu: 'NXP FRDM-i.MX95 · 6 Cortex-A55 workers',
    workers: 6,
    note: 'ARM64 CPU PKCS#11 path.',
  },
  kv260: {
    id: 'kv260',
    label: 'AMD Kria KV260',
    cpu: 'ZynqMP · 4 Cortex-A53 workers',
    workers: 4,
    note: 'CPU PKCS#11 path only; this dataset does not use FPGA offload.',
  },
  ventunoQ: {
    id: 'ventunoQ',
    label: 'Ventuno Q',
    cpu: 'Qualcomm QCS8275 · 4 Cortex-A78C + 4 Cortex-A55 workers',
    workers: 8,
    note: 'CPU PKCS#11 container path only; GPU/NPU is not measured here.',
  },
  m4Pro: {
    id: 'm4Pro',
    label: 'Apple M4 Pro',
    cpu: 'Apple silicon · 14 exposed CPU workers',
    workers: 14,
    note: 'Native ARM64 benchmark sidecar.',
  },
  m5Max: {
    id: 'm5Max',
    label: 'Apple M5 Max',
    cpu: 'Apple silicon · 18 exposed CPU workers',
    workers: 18,
    note: 'Native ARM64 benchmark sidecar.',
  },
}

export const SCENARIO39_OPERATIONS: Scenario39Operation[] = [
  {
    id: 'ecdsaP256Sign',
    label: 'ECDSA P-256 signing',
    category: 'classical',
    explanation: 'Classical signature control used to interpret the hybrid-signature result.',
    oneWorker: {
      x1Pro: 5424.68,
      mx95Pro: 606.18,
      mx95: 605.38,
      kv260: 446.99,
      ventunoQ: 2297.42,
      m4Pro: 5785.34,
      m5Max: 6308.71,
    },
    wholePlatform: {
      x1Pro: 48415.74,
      mx95Pro: 3594.74,
      mx95: 3636.73,
      kv260: 1749.78,
      ventunoQ: 10837.65,
      m4Pro: 58081.11,
      m5Max: 87766.82,
    },
  },
  {
    id: 'x25519Derive',
    label: 'X25519 key agreement',
    category: 'classical',
    explanation: 'Classical key-agreement control used to interpret the hybrid-KEM result.',
    oneWorker: {
      x1Pro: 28846.3,
      mx95Pro: 2392.73,
      mx95: 2387.73,
      kv260: 1678.95,
      ventunoQ: 12635.58,
      m4Pro: 39759.48,
      m5Max: 41880.32,
    },
    wholePlatform: {
      x1Pro: 164229.61,
      mx95Pro: 13613.79,
      mx95: 13621.99,
      kv260: 6253.51,
      ventunoQ: 42673.25,
      m4Pro: 234754.36,
      m5Max: 210884.48,
    },
  },
  {
    id: 'mlDsa65Sign',
    label: 'ML-DSA-65 signing',
    category: 'pqc',
    explanation: 'Pure post-quantum signature.',
    oneWorker: {
      x1Pro: 8581.86,
      mx95Pro: 1173.56,
      mx95: 1143.76,
      kv260: 842.64,
      ventunoQ: 3996.64,
      m4Pro: 15273.66,
      m5Max: 15416.44,
    },
    wholePlatform: {
      x1Pro: 73787.02,
      mx95Pro: 6754.06,
      mx95: 6733.64,
      kv260: 3359.35,
      ventunoQ: 18972.13,
      m4Pro: 154868.31,
      m5Max: 206446.78,
    },
  },
  {
    id: 'mlKem768Encap',
    label: 'ML-KEM-768 encapsulation',
    category: 'pqc',
    explanation: 'Pure post-quantum key encapsulation.',
    oneWorker: {
      x1Pro: 23246.47,
      mx95Pro: 2913.5,
      mx95: 2885.7,
      kv260: 2007.94,
      ventunoQ: 10758.8,
      m4Pro: 32665.45,
      m5Max: 34658.92,
    },
    wholePlatform: {
      x1Pro: 86262.3,
      mx95Pro: 16177.95,
      mx95: 16242.12,
      kv260: 7387.29,
      ventunoQ: 27866.07,
      m4Pro: 146933.79,
      m5Max: 146213.54,
    },
  },
  {
    id: 'hybridSignatureSign',
    label: 'ML-DSA-65 + ECDSA P-256 signing',
    category: 'hybrid',
    explanation:
      'PKCS#11 v3.3 hybrid signature; the two signature components are combined inside the HSM.',
    oneWorker: {
      x1Pro: 2970.74,
      mx95Pro: 354.79,
      mx95: 350.99,
      kv260: 257.99,
      ventunoQ: 1270.67,
      m4Pro: 3923.73,
      m5Max: 4099.24,
    },
    wholePlatform: {
      x1Pro: 25606.05,
      mx95Pro: 2087.35,
      mx95: 2062.15,
      kv260: 1036.58,
      ventunoQ: 6006.85,
      m4Pro: 38916.12,
      m5Max: 56912.55,
    },
  },
  {
    id: 'hybridKemEncap',
    label: 'ML-KEM-768 + X25519 encapsulation',
    category: 'hybrid',
    explanation: 'PKCS#11 v3.3 hybrid KEM; the component secrets are combined inside the HSM.',
    oneWorker: {
      x1Pro: 9056,
      mx95Pro: 979.57,
      mx95: 983.76,
      kv260: 687.76,
      ventunoQ: 4080.97,
      m4Pro: 13395.32,
      m5Max: 14295.82,
    },
    wholePlatform: {
      x1Pro: 31481.12,
      mx95Pro: 5277.28,
      mx95: 5305.9,
      kv260: 2607.56,
      ventunoQ: 8196.98,
      m4Pro: 48177.24,
      m5Max: 40451.61,
    },
  },
]

export const getScenario39Ranked = (operation: Scenario39Operation, profile: Scenario39Profile) =>
  SCENARIO39_PLATFORM_ORDER.map((platformId) => ({
    platform: SCENARIO39_PLATFORMS[platformId], // eslint-disable-line security/detect-object-injection
    tps: operation[profile][platformId], // eslint-disable-line security/detect-object-injection
  })).sort((a, b) => b.tps - a.tps)

export const getScenario39Scaling = (
  operation: Scenario39Operation,
  platformId: Scenario39PlatformId
) => operation.wholePlatform[platformId] / operation.oneWorker[platformId] // eslint-disable-line security/detect-object-injection

export interface X1IsaResult {
  feature: string
  result: string
  status: 'verified' | 'measured' | 'rejected' | 'not-applicable'
}

export const X1_ISA_RESULTS: X1IsaResult[] = [
  {
    feature: 'AVX2 / AVX-512F / IFMA',
    result:
      'The VM exposes them. AWS-LC RSA-PSS-2048 signing was 2.08× faster with IFMA at one worker and 1.99× faster whole-platform than the deliberately masked comparison.',
    status: 'measured',
  },
  {
    feature: 'AES-NI and SHA-NI',
    result: 'The deployed runtime dispatch uses these on relevant AES and SHA paths.',
    status: 'verified',
  },
  {
    feature: 'ML-DSA / ML-KEM',
    result:
      'Measure the dispatched implementation: ML-DSA already used an AWS-LC AVX2 path; an additional AVX2 ML-KEM candidate did not improve saturated whole-platform throughput.',
    status: 'measured',
  },
  {
    feature: 'VAES-256 and VAES-512',
    result:
      'Both candidate builds were correct but slower for tested AES paths; VAES-512 also regressed whole-platform hybrid KEM. Neither is deployed.',
    status: 'rejected',
  },
  {
    feature: 'ECDSA P-256 and X25519',
    result:
      'The selected Rust implementations do not gain an AWS-LC IFMA path simply because the CPU exposes IFMA.',
    status: 'not-applicable',
  },
]
