// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Fictional workloads and performance profiles for educational sensitivity analysis.
 * Values are not vendor measurements or standards-mandated transaction rates.
 */

export type AlgoId =
  | 'rsa-2048'
  | 'ecdsa-p256'
  | 'ecdh-p256'
  | 'ml-dsa-65'
  | 'ml-kem-768'
  | 'slh-dsa-128s'
  | 'aes-128'
  | 'aes-256'

export const ALGO_LABELS: Record<AlgoId, string> = {
  'rsa-2048': 'RSA-2048',
  'ecdsa-p256': 'ECDSA P-256',
  'ecdh-p256': 'ECDH P-256',
  'ml-dsa-65': 'ML-DSA-65',
  'ml-kem-768': 'ML-KEM-768',
  'slh-dsa-128s': 'SLH-DSA-128s',
  'aes-128': 'AES-128',
  'aes-256': 'AES-256',
}

/**
 * Which "post-PQC" op profile the calculator applies:
 *  - 'standards-today' — legacy scenario identifier for a partial transition recipe.
 *    Matrix context is not proof of product support or workload performance.
 *  - 'end-state' — every use case fully migrated (hypothetical final state).
 * Alignment between profiles and the matrix is enforced by
 * hsmCapacityMatrixLink.test.ts.
 */
export type MigrationHorizon = 'standards-today' | 'end-state'

/** Selectable signature algorithm for the code-signing use case (C3). */
export type CodeSigningAlg = 'ml-dsa-65' | 'slh-dsa-128s'

export type DeploymentSize = 'small' | 'medium' | 'large'

export interface UseCaseEstimation {
  /** Plain-language explanation of why the default TPS range was chosen. */
  rationale: string
  /** Operation recipe independent of the selected transaction rate. */
  math: string
  /** Scope and provenance of the fictional inputs. */
  sources: string[]
  /** How switching to PQC algorithms changes the ops count for this use case. */
  pqcImpact: string
}

export interface UseCase {
  id: string
  name: string
  description: string
  /** Ops per transaction under today's classical workload (RSA / ECDSA). */
  classicalOps: Partial<Record<AlgoId, number>>
  /** Ops per transaction under the FULL end-state PQC workload (every use case migrated). */
  pqcOps: Partial<Record<AlgoId, number>>
  /**
   * Legacy partial-transition recipe. Not proof of deployed product support.
   * Retained for saved-scenario compatibility; the UI uses the hypothetical end state.
   */
  pqcTodayOps: Partial<Record<AlgoId, number>>
  /** Default transactions/sec for each deployment size. */
  defaultTps: Record<DeploymentSize, number>
  defaultEnabled: boolean
  /** Methodology behind the TPS defaults and ops-per-transaction ratios. */
  estimation: UseCaseEstimation
}

type Recipe = Partial<Record<AlgoId, number>>
function example(
  id: string,
  name: string,
  description: string,
  classicalOps: Recipe,
  pqcOps: Recipe,
  pqcTodayOps: Recipe,
  rates: [number, number, number]
): UseCase {
  const recipe = (ops: Recipe) =>
    Object.entries(ops)
      .map(([a, n]) => `${n} × ${ALGO_LABELS[a as AlgoId]}`)
      .join(' + ')
  return {
    id,
    name,
    description,
    classicalOps,
    pqcOps,
    pqcTodayOps,
    defaultTps: { small: rates[0], medium: rates[1], large: rates[2] },
    defaultEnabled: true,
    estimation: {
      rationale:
        'Fictional per-site workload. Organization presets illustrate sensitivity; replace the transaction rate to explore your own assumptions.',
      math: `Classical recipe per transaction: ${recipe(classicalOps)}. Hypothetical PQC recipe: ${recipe(pqcOps)}. Multiply each recipe by per-site TPS.`,
      sources: [
        'Model assumptions, not measured workloads or mandated ratios. Algorithm definitions: FIPS 203 / 204 / 205. Protocol availability must be checked separately.',
      ],
      pqcImpact:
        'The rates and operation ratios are hypothetical. Encapsulation, decapsulation and signing are distinct operations; a generic KEM recipe uses an explicitly assumed effective exchange rate. A protocol specification does not establish product integration or HSM support.',
    },
  }
}

export const USE_CASES: UseCase[] = [
  example(
    'tls',
    'TLS / HTTPS termination',
    'Full server handshakes with signing and key exchange inside the HSM. One server signature, one classical exchange, plus one ML-KEM encapsulation in the PQC example. The classical exchange rate includes ephemeral key generation. PQC certificates use an entirely PQC chain; the exchange remains hybrid. CA issuance and peer verification are separate.',
    { 'ecdsa-p256': 1, 'ecdh-p256': 1 },
    { 'ml-dsa-65': 1, 'ml-kem-768': 1, 'ecdh-p256': 1 },
    { 'ecdsa-p256': 1, 'ml-kem-768': 1, 'ecdh-p256': 1 },
    [500, 5000, 50000]
  ),
  example(
    'code-signing',
    'Code signing',
    'One artifact signature per transaction. ML-DSA or SLH-DSA is a hypothetical algorithm choice, not CNSA or product-compliance advice. SP 800-208 specifies LMS/XMSS families, not SLH-DSA.',
    { 'rsa-2048': 1 },
    { 'ml-dsa-65': 1 },
    { 'ml-dsa-65': 1 },
    [2, 20, 200]
  ),
  example(
    'doc-signing',
    'Document signing',
    'One document signature per transaction. This model makes no qualified-signature or eIDAS status claim.',
    { 'rsa-2048': 1 },
    { 'ml-dsa-65': 1 },
    { 'ml-dsa-65': 1 },
    [1, 5, 50]
  ),
  example(
    'payment',
    'Payment / PIN translation',
    'Separate fictional payment fleet. Two symmetric operations per transaction and an illustrative 0.05 key-management operations per transaction. The ratio is not a PCI/EMV requirement; RSA-to-KEM mapping is a hypothetical key-delivery scenario.',
    { 'aes-128': 2, 'rsa-2048': 0.05 },
    { 'aes-256': 2, 'ml-kem-768': 0.05 },
    { 'aes-256': 2, 'rsa-2048': 0.05 },
    [50, 500, 5000]
  ),
  example(
    'tde',
    'Database key management',
    'Illustrative external key-service requests: one symmetric operation and 0.1 asymmetric key-delivery operations per request. This is not a claim that database connections directly cause TDE key operations.',
    { 'aes-256': 1, 'rsa-2048': 0.1 },
    { 'aes-256': 1, 'ml-kem-768': 0.1 },
    { 'aes-256': 1, 'ml-kem-768': 0.1 },
    [20, 200, 2000]
  ),
  example(
    'pki-ca',
    'PKI issuance / OCSP signing',
    'One new CA or responder signature per transaction. Use actual signing events, not certificate validations: cached OCSP responses do not require a fresh signature for every request.',
    { 'rsa-2048': 1 },
    { 'ml-dsa-65': 1 },
    { 'ml-dsa-65': 1 },
    [2, 20, 200]
  ),
  example(
    'kms',
    'KMS envelope encryption',
    'Illustrative recipe: one symmetric wrap/unwrap plus 0.2 key-delivery exchanges per request. ML-KEM needs an appropriate derivation and wrapping construction; it is not a direct replacement for an encryption API.',
    { 'aes-256': 1, 'ecdh-p256': 0.2 },
    { 'aes-256': 1, 'ml-kem-768': 0.2 },
    { 'aes-256': 1, 'ml-kem-768': 0.2 },
    [100, 1000, 10000]
  ),
  example(
    'vpn-ike',
    'VPN / IPsec IKE',
    'Fictional shared fleet operating both tunnel endpoints: two AUTH signatures and an assumed exchange service per tunnel. Remote-access clients may use a different fleet. This simplified recipe excludes peer verification and protocol processing costs.',
    { 'ecdh-p256': 1, 'ecdsa-p256': 2 },
    { 'ml-kem-768': 1, 'ecdh-p256': 1, 'ml-dsa-65': 2 },
    { 'ml-kem-768': 1, 'ecdh-p256': 1, 'ecdsa-p256': 2 },
    [10, 100, 1000]
  ),
  example(
    'ssh',
    'SSH session example',
    'Fictional HSM-resident host signing and hybrid exchange. The classical curve rate is a modelling proxy, not a measured X25519 rate or an SSH configuration recipe.',
    { 'ecdsa-p256': 1, 'ecdh-p256': 1 },
    { 'ml-dsa-65': 1, 'ml-kem-768': 1, 'ecdh-p256': 1 },
    { 'ecdsa-p256': 1, 'ml-kem-768': 1, 'ecdh-p256': 1 },
    [20, 200, 2000]
  ),
  example(
    'dnssec',
    'DNSSEC signing example',
    'One RRset signature per transaction. Input is a signing rate, not DNS request traffic. PQC signatures here are a hypothetical end state, not a deployable DNSSEC recommendation.',
    { 'ecdsa-p256': 1 },
    { 'ml-dsa-65': 1 },
    { 'ecdsa-p256': 1 },
    [10, 100, 1000]
  ),
]

export interface HsmProfile {
  id: 'classical' | 'pqc'
  name: string
  description: string
  /** Ops per second the HSM sustains for each algorithm. */
  opsPerSec: Record<AlgoId, number>
  /** Public source / reference class for these numbers. */
  sourceNote: string
}

export const CLASSICAL_HSM_DEFAULT: HsmProfile = {
  id: 'classical',
  name: 'Fictional profile A',
  description:
    'Educational general-purpose profile A. All rates are invented for sensitivity analysis.',
  opsPerSec: {
    'rsa-2048': 10000,
    'ecdsa-p256': 20000,
    'ecdh-p256': 10000,
    'ml-dsa-65': 150,
    'ml-kem-768': 500,
    'slh-dsa-128s': 2,
    'aes-128': 25000,
    'aes-256': 20000,
  },
  sourceNote:
    'Fictional inputs, not vendor measurements. Signature rates mean signing; ECDH means an exchange including ephemeral key generation; ML-KEM means server encapsulation for TLS and an assumed effective exchange rate for other recipes; AES means the selected recipe operation, not bulk bytes/s.',
}
export const PQC_HSM_DEFAULT: HsmProfile = {
  id: 'pqc',
  name: 'Fictional profile B',
  description:
    'Educational general-purpose profile B. It does not represent a product generation or upgrade guarantee.',
  opsPerSec: {
    'rsa-2048': 100000,
    'ecdsa-p256': 100000,
    'ecdh-p256': 100000,
    'ml-dsa-65': 8000,
    'ml-kem-768': 12000,
    'slh-dsa-128s': 40,
    'aes-128': 250000,
    'aes-256': 200000,
  },
  sourceNote: CLASSICAL_HSM_DEFAULT.sourceNote,
}
export const PAYMENT_HSM_DEFAULT: HsmProfile = {
  id: 'classical',
  name: 'Fictional payment profile',
  description: 'Separate educational payment fleet with independent rates and inventory.',
  opsPerSec: {
    'rsa-2048': 1000,
    'ecdsa-p256': 0,
    'ecdh-p256': 0,
    'ml-dsa-65': 0,
    'ml-kem-768': 100,
    'slh-dsa-128s': 0,
    'aes-128': 10000,
    'aes-256': 8000,
  },
  sourceNote:
    'Fictional payment operations and rates. Not a PCI/EMV recommendation or product measurement. Zero denotes an unsupported operation.',
}

export interface SizePreset {
  id: DeploymentSize
  name: string
  description: string
  /** Approximate aggregate transactions/sec across all default use cases. */
  aggregateTps: number
}

/**
 * `aggregateTps` is the sum of every use case's default per-site TPS at this
 * size (derived via `deriveUseCaseTps` over `ORG_PARAM_DEFAULTS`) — it must
 * match the "Checked TPS total" readout when all use cases are enabled.
 * Verified by the estimation-consistency test suite.
 */
export const SIZE_PRESETS: SizePreset[] = [
  {
    id: 'small',
    name: 'Small',
    description: 'Regional business, < 5k employees, single data center.',
    aggregateTps: 715,
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'National enterprise, 5k–50k employees, multi-region.',
    aggregateTps: 7_145,
  },
  {
    id: 'large',
    name: 'Large',
    description: 'Global enterprise, > 50k employees, global distribution.',
    aggregateTps: 71_447,
  },
]

/**
 * RSA-2048 is the canonical HSM capacity unit. Vendors (Thales Luna 7,
 * Entrust nShield 5c, Utimaco SecurityServer) all publish throughput in
 * RSA-2048 signs/sec; every other algorithm's TPS is most readable as a
 * ratio against that anchor.
 */
export const BASE_UNIT_ALGO: AlgoId = 'rsa-2048'

/**
 * How many RSA-2048-equivalent ops one op of `algo` "costs" on this HSM.
 * Cost > 1 means the algorithm is slower than the RSA-2048 baseline.
 */
export function algoCostRatio(profile: HsmProfile, algo: AlgoId): number {
  const base = profile.opsPerSec[BASE_UNIT_ALGO]
  const algoRate = profile.opsPerSec[algo]
  if (!algoRate || algoRate <= 0) return Infinity
  return base / algoRate
}

/**
 * Geographic region presets for the per-location distribution panel. Labels
 * are purely cosmetic — each location independently serves the full per-site
 * workload (no splitting). Ordered so the first N defaults sketch a
 * plausible global active-active deployment.
 */
export const REGION_PRESETS: string[] = [
  'Frankfurt',
  'Virginia',
  'Singapore',
  'Dublin',
  'Oregon',
  'Tokyo',
  'São Paulo',
  'Sydney',
  'London',
  'Paris',
  'Mumbai',
  'Toronto',
]

export const ALGO_IDS: AlgoId[] = [
  'rsa-2048',
  'ecdsa-p256',
  'ecdh-p256',
  'ml-dsa-65',
  'ml-kem-768',
  'slh-dsa-128s',
  'aes-128',
  'aes-256',
]

/**
 * Classical signature algorithms — used by the "hybrid signature transition" toggle
 * to add classical signing load back onto the PQC workload (RSA/ECDSA + ML-DSA on
 * every artifact), modelling operators who dual-sign during the migration window.
 * KEM/symmetric algorithms are excluded: transition-window hybrid signing is a
 * signature-only practice.
 */
export const SIGNATURE_ALGOS: AlgoId[] = ['rsa-2048', 'ecdsa-p256']

/**
 * PQC signature algorithms — used to gate the hybrid-signing toggle (dual-sign
 * load is only meaningful for use cases whose selected PQC ops actually contain
 * a PQC signature) and by the matrix-alignment drift test.
 */
export const PQC_SIG_ALGOS: AlgoId[] = ['ml-dsa-65', 'slh-dsa-128s']

/**
 * Per-algorithm slider ranges for the HSM performance panel.
 * Step size matches the order of magnitude so sliders feel responsive.
 */
export const ALGO_SLIDER_RANGES: Record<AlgoId, { min: number; max: number; step: number }> = {
  'rsa-2048': { min: 0, max: 200_000, step: 100 },
  'ecdsa-p256': { min: 0, max: 200_000, step: 100 },
  'ecdh-p256': { min: 0, max: 200_000, step: 100 },
  'ml-dsa-65': { min: 0, max: 50_000, step: 50 },
  'ml-kem-768': { min: 0, max: 200_000, step: 100 },
  'slh-dsa-128s': { min: 0, max: 2_000, step: 1 },
  'aes-128': { min: 0, max: 1_000_000, step: 1_000 },
  'aes-256': { min: 0, max: 1_000_000, step: 1_000 },
}

// ---------------------------------------------------------------------------
// Org-size parameters
// ---------------------------------------------------------------------------

/**
 * Organisation-level parameters that drive per-use-case TPS defaults.
 * Changing any of these re-derives TPS for the affected use cases via
 * `deriveUseCaseTps`.
 */
export interface OrgParams {
  employees: number
  developers: number
  servers: number
  databases: number
  microservices: number
  paymentTps: number
}

export const ORG_PARAM_DEFAULTS: Record<DeploymentSize, OrgParams> = {
  small: {
    employees: 1_000,
    developers: 100,
    servers: 200,
    databases: 2,
    microservices: 20,
    paymentTps: 50,
  },
  medium: {
    employees: 10_000,
    developers: 1_000,
    servers: 2_000,
    databases: 20,
    microservices: 200,
    paymentTps: 500,
  },
  large: {
    employees: 100_000,
    developers: 10_000,
    servers: 20_000,
    databases: 200,
    microservices: 2_000,
    paymentTps: 5_000,
  },
}

export const ORG_PARAM_RANGES: Record<
  keyof OrgParams,
  { min: number; max: number; step: number; label: string; description: string }
> = {
  employees: {
    min: 100,
    max: 200_000,
    step: 100,
    label: 'Employees',
    description: 'Drives TLS, PKI CA/OCSP, VPN, document signing',
  },
  developers: {
    min: 10,
    max: 50_000,
    step: 10,
    label: 'Developers',
    description: 'Drives code signing (CI/CD, containers)',
  },
  servers: {
    min: 10,
    max: 50_000,
    step: 10,
    label: 'Servers / infra nodes',
    description: 'Drives SSH authentication and DNSSEC zone count',
  },
  databases: {
    min: 1,
    max: 1_000,
    step: 1,
    label: 'Databases',
    description: 'Drives database TDE (DEK unwrap rate)',
  },
  microservices: {
    min: 5,
    max: 5_000,
    step: 5,
    label: 'Microservices',
    description: 'Drives KMS envelope encryption call rate',
  },
  paymentTps: {
    min: 0,
    max: 20_000,
    step: 50,
    label: 'Payment peak TPS',
    description: 'Peak payment transaction rate (0 if not applicable)',
  },
}

/**
 * Derives the default TPS for a single use case from org-level parameters.
 * Formulas reproduce the existing `defaultTps` values exactly at the default
 * `ORG_PARAM_DEFAULTS` values — verified against the estimation methodology
 * documented in each use case's `estimation` field.
 */
export function deriveUseCaseTps(ucId: string, p: OrgParams): number {
  switch (ucId) {
    case 'tls':
      // employees × 3 req/s × ~20% new handshakes (80% resumption), smoothed
      return Math.max(1, Math.round(p.employees * 0.5))
    case 'code-signing':
      // devs × 20 commits/day × 3 artifacts × 50% peak window × 2.4× surge / 3600s
      return Math.max(1, Math.round((p.developers * 20 * 3 * 0.5 * 2.4) / 3_600))
    case 'doc-signing':
      // ~1 contract-requiring employee in 2000 generates 1 doc signing/s at peak
      return Math.max(1, Math.round(p.employees / 2_000))
    case 'payment':
      return Math.max(0, p.paymentTps)
    case 'tde':
      // databases × 10 connection-pools × 100 connections / 100s DEK TTL
      return Math.max(1, Math.round(p.databases * 10))
    case 'pki-ca':
      // employees × 50 OCSP events/day × 3.4× peak / 86400s
      return Math.max(1, Math.round((p.employees * 50 * 3.4) / 86_400))
    case 'kms':
      // microservices × 5 KMS calls/sec each
      return Math.max(1, p.microservices * 5)
    case 'vpn-ike':
      // 50% of employees connect in 50s peak window
      return Math.max(1, Math.round((p.employees * 0.5) / 50))
    case 'ssh':
      // servers polled every 10s by automation
      return Math.max(1, Math.round(p.servers / 10))
    case 'dnssec':
      // servers/20 ≈ DNS zones × 360 RRsets / 3600s RRSIG TTL
      return Math.max(1, Math.round(p.servers / 20))
    default:
      return 1
  }
}
