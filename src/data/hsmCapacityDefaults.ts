// SPDX-License-Identifier: GPL-3.0-only
/**
 * HSM Capacity Calculator defaults.
 *
 * Models the top 10 enterprise HSM use cases and how much work each one
 * places on a fleet, in two scenarios:
 *   - Classical workload  (today: RSA-2048 / ECDSA P-256 for signatures)
 *   - PQC workload        (post-migration: ML-DSA-65 replaces RSA/ECDSA
 *                          signatures; key-exchange / symmetric stay the same)
 *
 * HSM performance numbers are illustrative reference values derived from
 * publicly available vendor datasheets (Thales Luna 7 PCIe, Entrust nShield 5c,
 * Utimaco SecurityServer Se Gen2). No public vendor currently publishes
 * ML-DSA hardware-accelerated TPS — the "next-gen PQC HSM" ML-DSA number is
 * an estimate based on FPGA / ASIC prototype measurements in NIST PQC
 * evaluation reports. All values are exposed as sliders so operators can
 * replace them with their own benchmarked numbers.
 */

export type AlgoId = 'rsa-2048' | 'ecdsa-p256' | 'ecdh-p256' | 'ml-dsa-65' | 'aes-128' | 'aes-256'

export const ALGO_LABELS: Record<AlgoId, string> = {
  'rsa-2048': 'RSA-2048',
  'ecdsa-p256': 'ECDSA P-256',
  'ecdh-p256': 'ECDH P-256',
  'ml-dsa-65': 'ML-DSA-65',
  'aes-128': 'AES-128',
  'aes-256': 'AES-256',
}

export type DeploymentSize = 'small' | 'medium' | 'large'

export interface UseCase {
  id: string
  name: string
  description: string
  /** Ops per transaction under today's classical workload (RSA / ECDSA). */
  classicalOps: Partial<Record<AlgoId, number>>
  /** Ops per transaction under PQC workload (ML-DSA replaces RSA/ECDSA signs). */
  pqcOps: Partial<Record<AlgoId, number>>
  /** Default transactions/sec for each deployment size. */
  defaultTps: Record<DeploymentSize, number>
  defaultEnabled: boolean
}

export const USE_CASES: UseCase[] = [
  {
    id: 'tls',
    name: 'TLS / HTTPS termination',
    description:
      'Web tier and API gateway TLS handshakes. 1 server signature + 1 ECDH per handshake.',
    classicalOps: { 'ecdsa-p256': 1, 'ecdh-p256': 1 },
    pqcOps: { 'ml-dsa-65': 1, 'ecdh-p256': 1 },
    defaultTps: { small: 500, medium: 5_000, large: 50_000 },
    defaultEnabled: true,
  },
  {
    id: 'code-signing',
    name: 'Code signing (CI/CD, containers)',
    description: 'Release artifact, container image, and SBOM signatures. 1 signature per build.',
    classicalOps: { 'rsa-2048': 1 },
    pqcOps: { 'ml-dsa-65': 1 },
    defaultTps: { small: 2, medium: 20, large: 200 },
    defaultEnabled: true,
  },
  {
    id: 'doc-signing',
    name: 'Document / PDF signing (eIDAS)',
    description:
      'Advanced / qualified electronic signatures on documents. 1 signature per document.',
    classicalOps: { 'rsa-2048': 1 },
    pqcOps: { 'ml-dsa-65': 1 },
    defaultTps: { small: 5, medium: 50, large: 500 },
    defaultEnabled: true,
  },
  {
    id: 'payment',
    name: 'Payment / PIN translation (PCI, EMV)',
    description:
      'PIN block encrypt and MAC for cardholder transactions. Mostly symmetric, occasional RSA.',
    classicalOps: { 'aes-128': 2, 'rsa-2048': 0.05 },
    pqcOps: { 'aes-128': 2, 'ml-dsa-65': 0.05 },
    defaultTps: { small: 50, medium: 500, large: 5_000 },
    defaultEnabled: true,
  },
  {
    id: 'tde',
    name: 'Database TDE (Oracle / SQL Server)',
    description:
      'Transparent data encryption. AES-256 DEK unwrap per key rotation + RSA master key wrap.',
    classicalOps: { 'aes-256': 1, 'rsa-2048': 0.1 },
    pqcOps: { 'aes-256': 1, 'ml-dsa-65': 0.1 },
    defaultTps: { small: 20, medium: 200, large: 2_000 },
    defaultEnabled: true,
  },
  {
    id: 'pki-ca',
    name: 'PKI CA issuance / OCSP',
    description:
      'Certificate issuance and OCSP response signing. 1 signature per cert or OCSP reply.',
    classicalOps: { 'rsa-2048': 1 },
    pqcOps: { 'ml-dsa-65': 1 },
    defaultTps: { small: 2, medium: 20, large: 200 },
    defaultEnabled: true,
  },
  {
    id: 'kms',
    name: 'KMS envelope encryption',
    description: 'Cloud KMS pattern — AES-256 key wrap for data keys, ECDH for recipient delivery.',
    classicalOps: { 'aes-256': 1, 'ecdh-p256': 0.2 },
    pqcOps: { 'aes-256': 1, 'ecdh-p256': 0.2 },
    defaultTps: { small: 100, medium: 1_000, large: 10_000 },
    defaultEnabled: true,
  },
  {
    id: 'vpn-ike',
    name: 'VPN / IPsec IKE',
    description:
      'Site-to-site and remote-access IKEv2 tunnel negotiation. 1 ECDH + 1 ECDSA per setup.',
    classicalOps: { 'ecdh-p256': 1, 'ecdsa-p256': 1 },
    pqcOps: { 'ecdh-p256': 1, 'ml-dsa-65': 1 },
    defaultTps: { small: 10, medium: 100, large: 1_000 },
    defaultEnabled: true,
  },
  {
    id: 'ssh',
    name: 'SSH user / host authentication',
    description: 'Privileged access and machine-to-machine SSH. 1 ECDSA sign + 1 ECDH per session.',
    classicalOps: { 'ecdsa-p256': 1, 'ecdh-p256': 1 },
    pqcOps: { 'ml-dsa-65': 1, 'ecdh-p256': 1 },
    defaultTps: { small: 20, medium: 200, large: 2_000 },
    defaultEnabled: true,
  },
  {
    id: 'dnssec',
    name: 'DNSSEC zone signing',
    description:
      'Authoritative DNSSEC zone and RRset signing. 1 signature per record on zone re-sign.',
    classicalOps: { 'ecdsa-p256': 1 },
    pqcOps: { 'ml-dsa-65': 1 },
    defaultTps: { small: 10, medium: 100, large: 1_000 },
    defaultEnabled: true,
  },
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

/**
 * Classical HSM — no PQC hardware acceleration. ML-DSA is handled in software
 * on the HSM firmware controller, which is 1–2 orders of magnitude slower
 * than classical signature primitives with dedicated modular-arithmetic
 * engines.
 */
export const CLASSICAL_HSM_DEFAULT: HsmProfile = {
  id: 'classical',
  name: 'Classical HSM',
  description:
    'General-purpose network HSM without PQC hardware acceleration. ML-DSA runs in firmware (software fallback).',
  opsPerSec: {
    'rsa-2048': 10_000,
    'ecdsa-p256': 20_000,
    'ecdh-p256': 10_000,
    'ml-dsa-65': 500,
    'aes-128': 200_000,
    'aes-256': 150_000,
  },
  sourceNote:
    'Reference class: Thales Luna 7 PCIe / Entrust nShield 5c / Utimaco SecurityServer Se Gen2 public datasheets.',
}

/**
 * Next-gen PQC HSM — dedicated ML-KEM / ML-DSA hardware engine.
 */
export const PQC_HSM_DEFAULT: HsmProfile = {
  id: 'pqc',
  name: 'Next-gen PQC HSM',
  description:
    'Next-generation HSM with dedicated ML-DSA / ML-KEM hardware accelerator. Classical TPS unchanged or improved.',
  opsPerSec: {
    'rsa-2048': 10_000,
    'ecdsa-p256': 20_000,
    'ecdh-p256': 10_000,
    'ml-dsa-65': 8_000,
    'aes-128': 250_000,
    'aes-256': 200_000,
  },
  sourceNote:
    'Illustrative estimate. No vendor publishes production ML-DSA HW-accel TPS as of 2026-04; number extrapolated from NIST PQC FPGA/ASIC prototype benchmarks.',
}

export interface SizePreset {
  id: DeploymentSize
  name: string
  description: string
  /** Approximate aggregate transactions/sec across all default use cases. */
  aggregateTps: number
}

export const SIZE_PRESETS: SizePreset[] = [
  {
    id: 'small',
    name: 'Small',
    description: 'Regional business, < 5k employees, single data center.',
    aggregateTps: 2_000,
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'National enterprise, 5k–50k employees, multi-region.',
    aggregateTps: 20_000,
  },
  {
    id: 'large',
    name: 'Large',
    description: 'Global enterprise, > 50k employees, global distribution.',
    aggregateTps: 200_000,
  },
]

export const ALGO_IDS: AlgoId[] = [
  'rsa-2048',
  'ecdsa-p256',
  'ecdh-p256',
  'ml-dsa-65',
  'aes-128',
  'aes-256',
]

/**
 * Per-algorithm slider ranges for the HSM performance panel.
 * Step size matches the order of magnitude so sliders feel responsive.
 */
export const ALGO_SLIDER_RANGES: Record<AlgoId, { min: number; max: number; step: number }> = {
  'rsa-2048': { min: 100, max: 50_000, step: 100 },
  'ecdsa-p256': { min: 100, max: 100_000, step: 100 },
  'ecdh-p256': { min: 100, max: 50_000, step: 100 },
  'ml-dsa-65': { min: 50, max: 50_000, step: 50 },
  'aes-128': { min: 1_000, max: 1_000_000, step: 1_000 },
  'aes-256': { min: 1_000, max: 1_000_000, step: 1_000 },
}
