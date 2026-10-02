// SPDX-License-Identifier: GPL-3.0-only
/**
 * Firmware & Project Signing Lab data (workshop Step 6, new).
 *
 * Sizes:
 *  - LMS / HSS are COMPUTED from RFC 8554 §4–§6 with n = 32 (SHA-256/256):
 *      LM-OTS signature = 4 + n + p·n
 *      LMS signature    = 4 + LM-OTS signature + 4 + h·n
 *      LMS public key   = 4 + 4 + 16 + n = 56
 *      HSS signature    = 4 + (L−1)·(LMS signature + LMS public key) + LMS signature
 *      HSS public key   = 4 + 56 = 60
 *    p (n = 32) per RFC 8554 Table 1: W1 = 265, W2 = 133, W4 = 67, W8 = 34.
 *    The unit test checks H20/W8 against the hub algorithm registry (1,776 B / 60 B).
 *  - ML-DSA sizes come from the algorithm registry (FIPS 204 Table 2).
 *  - XMSS is size-only (registry, RFC 8391); no XMSS code runs here.
 *
 * No LMS or XMSS signature is computed for the lab's own parameter sets. The
 * hub's HSS/LMS verifier is checked by the RFC 8554 Appendix F KAT (lms-sigver,
 * Test Cases 1-2) in the step's KAT panel; XMSS rows stay "Simulated — sizes per
 * RFC 8391". ML-DSA is checked by the NIST ACVP ML-DSA sigVer KAT.
 */
import { getAlgorithm } from '@/data/algorithmProperties'

export type LmsW = 1 | 2 | 4 | 8

export const LMOTS_P_N32: Record<LmsW, number> = { 1: 265, 2: 133, 4: 67, 8: 34 }
const N = 32
export const LMS_PUBLIC_KEY_BYTES = 4 + 4 + 16 + N // 56
export const HSS_PUBLIC_KEY_BYTES = 4 + LMS_PUBLIC_KEY_BYTES // 60

export function lmotsSignatureBytes(w: LmsW): number {
  return 4 + N + LMOTS_P_N32[w] * N
}

export function lmsSignatureBytes(h: number, w: LmsW): number {
  return 4 + lmotsSignatureBytes(w) + 4 + h * N
}

/** HSS signature with one LMS tree per level (all levels use the same h, w). */
export function hssSignatureBytes(levels: number, h: number, w: LmsW): number {
  const lms = lmsSignatureBytes(h, w)
  return 4 + (levels - 1) * (lms + LMS_PUBLIC_KEY_BYTES) + lms
}

export type SchemeId =
  | 'lms-h10-w8'
  | 'lms-h15-w8'
  | 'lms-h20-w8'
  | 'lms-h25-w8'
  | 'hss-l2-h10-w8'
  | 'hss-l2-h20-w8'
  | 'xmss-h20'
  | 'ml-dsa-65'
  | 'ml-dsa-87'

export interface SigningScheme {
  id: SchemeId
  label: string
  family: 'LMS/HSS' | 'XMSS' | 'ML-DSA'
  stateful: boolean
  signatureBytes: number
  publicKeyBytes: number
  /** total signatures one key can ever make; Infinity for stateless */
  capacity: number
  cnsa2: 'firmware-signing' | 'general-signature' | 'not-cnsa'
  validation: 'acvp-kat' | 'rfc8554-kat' | 'simulated'
  note: string
}

function lmsScheme(h: number, levels: 1 | 2): SigningScheme {
  const id = (levels === 1 ? `lms-h${h}-w8` : `hss-l2-h${h}-w8`) as SchemeId
  return {
    id,
    label: levels === 1 ? `LMS H${h}/W8 (HSS L=1)` : `HSS L=2, H${h}+H${h}/W8`,
    family: 'LMS/HSS',
    stateful: true,
    signatureBytes: hssSignatureBytes(levels, h, 8),
    publicKeyBytes: HSS_PUBLIC_KEY_BYTES,
    capacity: 2 ** (h * levels),
    cnsa2: 'firmware-signing',
    validation: 'rfc8554-kat',
    note:
      levels === 1
        ? 'One tree: every signature consumes one one-time key, tracked by a counter that must never repeat.'
        : 'Two levels: the top tree signs bottom trees, so new bottom trees can be made without a new root of trust.',
  }
}

const mldsa65 = getAlgorithm('ML-DSA-65')
const mldsa87 = getAlgorithm('ML-DSA-87')
const xmss = getAlgorithm('XMSS-SHA2_20')

export const SIGNING_SCHEMES: SigningScheme[] = [
  lmsScheme(10, 1),
  lmsScheme(15, 1),
  lmsScheme(20, 1),
  lmsScheme(25, 1),
  lmsScheme(10, 2),
  lmsScheme(20, 2),
  {
    id: 'xmss-h20',
    label: 'XMSS-SHA2_20_256',
    family: 'XMSS',
    stateful: true,
    signatureBytes: xmss.signatureOrCiphertextBytes,
    publicKeyBytes: xmss.publicKeyBytes,
    capacity: 2 ** 20,
    cnsa2: 'firmware-signing',
    validation: 'simulated',
    note: 'Stateful like LMS, with larger signatures. Size-only here.',
  },
  {
    id: 'ml-dsa-65',
    label: 'ML-DSA-65',
    family: 'ML-DSA',
    stateful: false,
    signatureBytes: mldsa65.signatureOrCiphertextBytes,
    publicKeyBytes: mldsa65.publicKeyBytes,
    capacity: Infinity,
    cnsa2: 'not-cnsa',
    validation: 'acvp-kat',
    note: 'Stateless. Category 3 — fine for most commercial OT, but CNSA 2.0 requires ML-DSA-87.',
  },
  {
    id: 'ml-dsa-87',
    label: 'ML-DSA-87',
    family: 'ML-DSA',
    stateful: false,
    signatureBytes: mldsa87.signatureOrCiphertextBytes,
    publicKeyBytes: mldsa87.publicKeyBytes,
    capacity: Infinity,
    cnsa2: 'general-signature',
    validation: 'acvp-kat',
    note: 'Stateless; the CNSA 2.0 signature parameter set. No counter to protect.',
  },
]

export const getScheme = (id: SchemeId): SigningScheme =>
  SIGNING_SCHEMES.find((s) => s.id === id) ?? SIGNING_SCHEMES[0]

export type SigningUse = 'firmware' | 'project'

export interface SigningPlanInputs {
  scheme: SchemeId
  use: SigningUse
  /** signatures per year across the whole key */
  signaturesPerYear: number
  /** HSMs / sites the key's state is split across (stateful only) */
  statePartitions: number
  /** years the key must keep signing */
  serviceYears: number
}

export const DEFAULT_SIGNING_PLAN: SigningPlanInputs = {
  scheme: 'lms-h20-w8',
  use: 'firmware',
  signaturesPerYear: 200,
  statePartitions: 2,
  serviceYears: 20,
}

export interface SigningPlanResult {
  scheme: SigningScheme
  /** signatures available to each partition */
  perPartitionCapacity: number
  /** years until the busiest partition runs out (Infinity for stateless) */
  yearsToExhaustion: number
  coversServiceLife: boolean
  /** extra bytes per signed image compared with ECDSA P-256 (64 B) */
  extraBytesVsEcdsa: number
  warnings: string[]
}

const ECDSA_P256_SIG = getAlgorithm('ECDSA P-256').signatureOrCiphertextBytes

export function planSigning(inputs: SigningPlanInputs): SigningPlanResult {
  const scheme = getScheme(inputs.scheme)
  const partitions = scheme.stateful ? Math.max(1, Math.round(inputs.statePartitions)) : 1
  const perPartitionCapacity = scheme.stateful ? Math.floor(scheme.capacity / partitions) : Infinity
  // Load spread evenly across partitions.
  const perPartitionRate = inputs.signaturesPerYear / partitions
  const yearsToExhaustion =
    !scheme.stateful || perPartitionRate <= 0
      ? Infinity
      : Math.round((perPartitionCapacity / perPartitionRate) * 10) / 10
  const coversServiceLife = yearsToExhaustion >= inputs.serviceYears

  const warnings: string[] = []
  if (scheme.stateful && !coversServiceLife)
    warnings.push(
      `Key runs out after ${yearsToExhaustion} years — before the ${inputs.serviceYears}-year service life. Use a taller tree or HSS.`
    )
  if (scheme.stateful && inputs.use === 'project')
    warnings.push(
      'Project signing happens on many engineering workstations, often offline. Keeping a stateful counter consistent there is hard — a stateless scheme (ML-DSA) fits better.'
    )
  if (scheme.stateful && partitions > 1)
    warnings.push(
      'Each HSM gets its own disjoint range of one-time keys. Restoring an HSM from an old backup would reuse indices — NIST SP 800-208 requires that state never be cloned or rolled back.'
    )
  if (scheme.cnsa2 === 'not-cnsa')
    warnings.push(
      'Not a CNSA 2.0 parameter set — fine for commercial OT, not for National Security Systems.'
    )

  return {
    scheme,
    perPartitionCapacity,
    yearsToExhaustion,
    coversServiceLife,
    extraBytesVsEcdsa: scheme.signatureBytes - ECDSA_P256_SIG,
    warnings,
  }
}
