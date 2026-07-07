// SPDX-License-Identifier: GPL-3.0-only
//
// hsmKeyStorageDefaults.ts — data + math for the "Memory space required" section
// of HsmCapacityCalculator. Models HSM key-object storage (private key + the
// certificate that carries the public key), NOT throughput — see
// hsmCapacityDefaults.ts for the ops/sec model. Byte sizes are drawn from
// algoFacts.ts (FIPS 203/204/205 tables + textbook classical sizes) so all PQC
// calculators in this app share one source of truth for key/signature sizes.
import { ALGO_FACTS } from '@/components/Playground/kmip/kmip3/algoFacts'

export type KeyStorageMode = 'classical' | 'hybrid' | 'pure-pqc'
export type PqcFamily = 'ML-DSA' | 'ML-KEM' | 'SLH-DSA'
export type RsaAlg = 'RSA-2048' | 'RSA-3072'

export interface CapacityOption {
  label: string
  bytes: number
}

export const CAPACITY_OPTIONS: CapacityOption[] = [
  { label: '16 MB', bytes: 16 * 1024 * 1024 },
  { label: '64 MB', bytes: 64 * 1024 * 1024 },
  { label: '128 MB', bytes: 128 * 1024 * 1024 },
  { label: '1 GB', bytes: 1024 * 1024 * 1024 },
]

export const RSA_ALGS: RsaAlg[] = ['RSA-2048', 'RSA-3072']

export const PQC_FAMILIES: PqcFamily[] = ['ML-DSA', 'ML-KEM', 'SLH-DSA']

export const PQC_VARIANTS: Record<PqcFamily, string[]> = {
  'ML-DSA': ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'],
  'ML-KEM': ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024'],
  'SLH-DSA': ['SLH-DSA-SHA2-128s', 'SLH-DSA-SHA2-192s', 'SLH-DSA-SHA2-256s'],
}

export const PQC_FAMILY_DEFAULT_VARIANT: Record<PqcFamily, string> = {
  'ML-DSA': 'ML-DSA-65',
  'ML-KEM': 'ML-KEM-768',
  'SLH-DSA': 'SLH-DSA-SHA2-192s',
}

/**
 * FIPS 203/204 private keys are typically stored as both the compact seed
 * (used to regenerate the expanded key) and the expanded key material (used
 * for fast sign/decaps) — so HSM storage is expanded-key size + seed size.
 * ML-KEM seed = d‖z (FIPS 203 sec 7.2), ML-DSA seed = ξ (FIPS 204 sec 6.1).
 * SLH-DSA's "private key" is already just a seed — nothing to add.
 */
export const SEED_OVERHEAD_BYTES: Record<PqcFamily, number> = {
  'ML-DSA': 32,
  'ML-KEM': 64,
  'SLH-DSA': 0,
}

/**
 * ML-KEM keys cannot sign their own certificate (KEM, not a signature
 * scheme), so a cert carrying an ML-KEM public key is signed by a CA using
 * the ML-DSA variant at the matching NIST security category (1/3/5).
 */
export const ML_KEM_TO_ML_DSA: Record<string, string> = {
  'ML-KEM-512': 'ML-DSA-44',
  'ML-KEM-768': 'ML-DSA-65',
  'ML-KEM-1024': 'ML-DSA-87',
}

/** Enterprise-PKI leaf cert: issuer/subject DN, validity, serial, extensions (key usage, SAN, AIA/CRL/OCSP, policy OIDs), algorithm-identifier OIDs — everything in the TBS besides the SPKI and the signature itself. */
export const CERT_TEMPLATE_BYTES = 600
/** SubjectPublicKeyInfo's AlgorithmIdentifier/OID wrapper around the raw public key bytes. */
export const SPKI_WRAPPER_BYTES = 24

export const DEFAULT_BLOB_OVERHEAD_PCT = 5

function sizeOf(algoKey: string): { pub: number; priv: number; sig: number } {
  const facts = ALGO_FACTS[algoKey]
  return { pub: facts?.pub ?? 0, priv: facts?.priv ?? 0, sig: facts?.sig ?? 0 }
}

export interface KeyStorageParams {
  mode: KeyStorageMode
  capacityBytes: number
  rsaAlg: RsaAlg
  pqcFamily: PqcFamily
  pqcVariant: string
  overheadPct: number
  /** Count the seed alongside the expanded key for ML-DSA/ML-KEM private-key storage — see SEED_OVERHEAD_BYTES. Default true. */
  includeSeedOverhead?: boolean
  /** Editable override for CERT_TEMPLATE_BYTES. */
  certTemplateBytes?: number
  /** Editable override for SPKI_WRAPPER_BYTES. */
  spkiWrapperBytes?: number
}

export interface KeyStorageResult {
  privBytes: number
  certPubBytes: number
  certSigBytes: number
  certBytes: number
  perKeyBytes: number
  effectivePerKeyBytes: number
  numKeys: number
  usedBytes: number
  remainderBytes: number
}

export function computeKeyStorage(params: KeyStorageParams): KeyStorageResult {
  const {
    mode,
    capacityBytes,
    rsaAlg,
    pqcFamily,
    pqcVariant,
    overheadPct,
    includeSeedOverhead = true,
    certTemplateBytes = CERT_TEMPLATE_BYTES,
    spkiWrapperBytes = SPKI_WRAPPER_BYTES,
  } = params

  const rsa = sizeOf(rsaAlg)
  const pqc = sizeOf(pqcVariant)
  const pqcPriv = pqc.priv + (includeSeedOverhead ? SEED_OVERHEAD_BYTES[pqcFamily] : 0)
  const pqcCertSig = pqcFamily === 'ML-KEM' ? sizeOf(ML_KEM_TO_ML_DSA[pqcVariant]).sig : pqc.sig

  let privBytes = 0
  let certPubBytes = 0
  let certSigBytes = 0

  if (mode === 'classical') {
    privBytes = rsa.priv
    certPubBytes = rsa.pub
    certSigBytes = rsa.sig
  } else if (mode === 'pure-pqc') {
    privBytes = pqcPriv
    certPubBytes = pqc.pub
    certSigBytes = pqcCertSig
  } else {
    // Hybrid: composite key + dual-signature certificate (both algorithms present).
    privBytes = rsa.priv + pqcPriv
    certPubBytes = rsa.pub + pqc.pub
    certSigBytes = rsa.sig + pqcCertSig
  }

  const certBytes = certTemplateBytes + spkiWrapperBytes + certPubBytes + certSigBytes
  const perKeyBytes = privBytes + certBytes
  const effectivePerKeyBytes = perKeyBytes * (1 + overheadPct / 100)
  const numKeys = Math.floor(capacityBytes / effectivePerKeyBytes)
  const usedBytes = numKeys * effectivePerKeyBytes
  const remainderBytes = capacityBytes - usedBytes

  return {
    privBytes,
    certPubBytes,
    certSigBytes,
    certBytes,
    perKeyBytes,
    effectivePerKeyBytes,
    numKeys,
    usedBytes,
    remainderBytes,
  }
}
