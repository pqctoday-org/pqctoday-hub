// SPDX-License-Identifier: AGPL-3.0-only
import {
  CKP_LMS_SHA256_M32_H5,
  CKP_LMS_SHA256_M32_H10,
  CKP_LMS_SHA256_M32_H15,
  CKP_LMS_SHA256_M32_H20,
  CKP_LMS_SHA256_M32_H25,
  CKP_LMOTS_SHA256_N32_W1,
  CKP_LMOTS_SHA256_N32_W2,
  CKP_LMOTS_SHA256_N32_W4,
  CKP_LMOTS_SHA256_N32_W8,
  CKP_LMS_SHA256_M24_H10,
  CKP_LMS_SHA256_M24_H20,
  CKP_LMOTS_SHA256_N24_W4,
  CKP_LMOTS_SHA256_N24_W8,
  CKP_LMS_SHAKE_M32_H10,
  CKP_LMS_SHAKE_M32_H20,
  CKP_LMOTS_SHAKE_N32_W4,
  CKP_LMOTS_SHAKE_N32_W8,
  CKP_LMS_SHAKE_M24_H10,
  CKP_LMS_SHAKE_M24_H20,
  CKP_LMOTS_SHAKE_N24_W4,
  CKP_LMOTS_SHAKE_N24_W8,
} from '@/wasm/softhsm/constants'

/**
 * Bytes the PKCS#11 HSS wrapper adds in front of a bare RFC 8554 LMS public key (the 4-byte level
 * count L) and in front of a bare LMS signature (the 4-byte count of signed public keys, Nspk).
 */
export const HSS_FRAMING_BYTES = 4

export interface LMSParameterSet {
  id: string
  name: string
  /** Total height across all levels. For multi-tree this is the SUM of
   *  `levelHeights` — it is NOT a single tree's height, and must never be
   *  mapped back to one LMS ordinal (doing so collapsed L2(2x h10) into a
   *  single h20 tree, ~1000x the keygen work — fixed 2026-09-03). */
  treeHeight: number
  winternitzParam: number
  /** Bytes of the signature the engine returns: the one-level (or multi-level) HSS signature, which
   *  for a single-tree set is the bare RFC 8554 signature plus HSS_FRAMING_BYTES. */
  signatureSize: number
  /** Bytes of the public key the engine returns: the HSS public key, which for a single-tree set is
   *  the bare RFC 8554 key (24 + m bytes) plus HSS_FRAMING_BYTES. Same framing as signatureSize. */
  publicKeySize: number
  /** Implementation-defined state blob size; omitted where not measured. */
  privateKeySize?: number
  maxSignatures: number
  /** Hash output length n and the generic-collision bound SP 800-208 §9.2 gives for it. SP 800-208
   *  assigns no NIST security category to LMS or XMSS, so none is shown. */
  securityLevel: string
  hashFunction: string
  variant?: 'single-tree' | 'multi-tree'
  /**
   * Per-level heights, innermost-to-outermost. Length IS the HSS level
   * count. Stored explicitly rather than derived from `treeHeight` so a
   * hierarchy can never be silently flattened into one tall tree.
   */
  levelHeights: number[]
  /**
   * The exact CKP_LMS_* ordinal per level, sent as-is to the engine. Kept
   * here rather than re-derived at the call site: deriving it from height
   * is what produced the collapse bug. Values are IANA-registered
   * (RFC 8554 / RFC 9858) — SP 800-208 itself marks these "TBD".
   */
  lmsParams: number[]
  /** The exact CKP_LMOTS_* ordinal per level. Same length as `lmsParams` —
   *  the Rust engine rejects the call unless both match the level count. */
  lmotsParams: number[]
  /** Which document defines this set, for the UI's provenance label. */
  provenance: 'RFC 8554' | 'RFC 9858'
}

export interface XMSSParameterSet {
  id: string
  name: string
  treeHeight: number
  signatureSize: number
  publicKeySize: number
  privateKeySize: number
  maxSignatures: number
  securityLevel: string
  hashFunction: string
  variant: 'single-tree' | 'multi-tree'
}

/**
 * One row of the "Which scheme for which use" section: a use case, one example parameter set, and
 * the sourced text beside it. The number of signatures is never typed here: it is computed from the
 * parameter set (schemeForUseCapacity), so it cannot drift from the set it describes.
 */
export interface SchemeForUseRow {
  id: string
  useCase: string
  /** The example set, by id in LMS_PARAMETER_SETS or XMSS_PARAMETER_SETS */
  paramSet: { family: 'lms' | 'xmss'; id: string }
  /** Where the signing state lives (SP 800-208 section 8.1; CNSA 2.0 FAQ v2.2, p. 12) */
  state: string
  /** What the NSA CNSA 2.0 FAQ v2.2 says about the scheme (pp. 7, 8, 11) */
  cnsa: string
}

export interface TreeNode {
  level: number
  index: number
  label: string
  isLeaf: boolean
  isHighlighted: boolean
  isAuthPath: boolean
}

export const LMS_PARAMETER_SETS: LMSParameterSet[] = [
  {
    id: 'lms-h5-w1',
    name: 'LMS_SHA256_M32_H5 / W1',
    treeHeight: 5,
    winternitzParam: 1,
    signatureSize: 8688,
    publicKeySize: 60,
    privateKeySize: 64,
    maxSignatures: 32,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    levelHeights: [5],
    lmsParams: [CKP_LMS_SHA256_M32_H5],
    lmotsParams: [CKP_LMOTS_SHA256_N32_W1],
    provenance: 'RFC 8554',
  },
  {
    id: 'lms-h5-w2',
    name: 'LMS_SHA256_M32_H5 / W2',
    treeHeight: 5,
    winternitzParam: 2,
    signatureSize: 4464,
    publicKeySize: 60,
    privateKeySize: 64,
    maxSignatures: 32,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    levelHeights: [5],
    lmsParams: [CKP_LMS_SHA256_M32_H5],
    lmotsParams: [CKP_LMOTS_SHA256_N32_W2],
    provenance: 'RFC 8554',
  },
  {
    id: 'lms-h5-w4',
    name: 'LMS_SHA256_M32_H5 / W4',
    treeHeight: 5,
    winternitzParam: 4,
    signatureSize: 2352,
    publicKeySize: 60,
    privateKeySize: 64,
    maxSignatures: 32,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    levelHeights: [5],
    lmsParams: [CKP_LMS_SHA256_M32_H5],
    lmotsParams: [CKP_LMOTS_SHA256_N32_W4],
    provenance: 'RFC 8554',
  },
  {
    id: 'lms-h5-w8',
    name: 'LMS_SHA256_M32_H5 / W8',
    treeHeight: 5,
    winternitzParam: 8,
    signatureSize: 1296,
    publicKeySize: 60,
    privateKeySize: 64,
    maxSignatures: 32,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    levelHeights: [5],
    lmsParams: [CKP_LMS_SHA256_M32_H5],
    lmotsParams: [CKP_LMOTS_SHA256_N32_W8],
    provenance: 'RFC 8554',
  },
  {
    id: 'lms-h10-w2',
    name: 'LMS_SHA256_M32_H10 / W2',
    treeHeight: 10,
    winternitzParam: 2,
    signatureSize: 4624,
    publicKeySize: 60,
    privateKeySize: 64,
    maxSignatures: 1024,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    levelHeights: [10],
    lmsParams: [CKP_LMS_SHA256_M32_H10],
    lmotsParams: [CKP_LMOTS_SHA256_N32_W2],
    provenance: 'RFC 8554',
  },
  {
    id: 'lms-h10-w4',
    name: 'LMS_SHA256_M32_H10 / W4',
    treeHeight: 10,
    winternitzParam: 4,
    signatureSize: 2512,
    publicKeySize: 60,
    privateKeySize: 64,
    maxSignatures: 1024,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    levelHeights: [10],
    lmsParams: [CKP_LMS_SHA256_M32_H10],
    lmotsParams: [CKP_LMOTS_SHA256_N32_W4],
    provenance: 'RFC 8554',
  },
  {
    id: 'lms-h10-w8',
    name: 'LMS_SHA256_M32_H10 / W8',
    treeHeight: 10,
    winternitzParam: 8,
    signatureSize: 1456,
    publicKeySize: 60,
    privateKeySize: 64,
    maxSignatures: 1024,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    levelHeights: [10],
    lmsParams: [CKP_LMS_SHA256_M32_H10],
    lmotsParams: [CKP_LMOTS_SHA256_N32_W8],
    provenance: 'RFC 8554',
  },
  {
    id: 'lms-h15-w2',
    name: 'LMS_SHA256_M32_H15 / W2',
    treeHeight: 15,
    winternitzParam: 2,
    signatureSize: 4784,
    publicKeySize: 60,
    privateKeySize: 64,
    maxSignatures: 32768,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    levelHeights: [15],
    lmsParams: [CKP_LMS_SHA256_M32_H15],
    lmotsParams: [CKP_LMOTS_SHA256_N32_W2],
    provenance: 'RFC 8554',
  },
  {
    id: 'lms-h15-w4',
    name: 'LMS_SHA256_M32_H15 / W4',
    treeHeight: 15,
    winternitzParam: 4,
    signatureSize: 2672,
    publicKeySize: 60,
    privateKeySize: 64,
    maxSignatures: 32768,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    levelHeights: [15],
    lmsParams: [CKP_LMS_SHA256_M32_H15],
    lmotsParams: [CKP_LMOTS_SHA256_N32_W4],
    provenance: 'RFC 8554',
  },
  {
    id: 'lms-h20-w2',
    name: 'LMS_SHA256_M32_H20 / W2',
    treeHeight: 20,
    winternitzParam: 2,
    signatureSize: 4944,
    publicKeySize: 60,
    privateKeySize: 64,
    maxSignatures: 1048576,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    levelHeights: [20],
    lmsParams: [CKP_LMS_SHA256_M32_H20],
    lmotsParams: [CKP_LMOTS_SHA256_N32_W2],
    provenance: 'RFC 8554',
  },
  {
    id: 'lms-h20-w4',
    name: 'LMS_SHA256_M32_H20 / W4',
    treeHeight: 20,
    winternitzParam: 4,
    signatureSize: 2832,
    publicKeySize: 60,
    privateKeySize: 64,
    maxSignatures: 1048576,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    levelHeights: [20],
    lmsParams: [CKP_LMS_SHA256_M32_H20],
    lmotsParams: [CKP_LMOTS_SHA256_N32_W4],
    provenance: 'RFC 8554',
  },
  {
    id: 'lms-h25-w1',
    name: 'LMS_SHA256_M32_H25 / W1',
    treeHeight: 25,
    winternitzParam: 1,
    signatureSize: 9328,
    publicKeySize: 60,
    privateKeySize: 64,
    maxSignatures: 33554432,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    levelHeights: [25],
    lmsParams: [CKP_LMS_SHA256_M32_H25],
    lmotsParams: [CKP_LMOTS_SHA256_N32_W1],
    provenance: 'RFC 8554',
  },
  {
    id: 'lms-h25-w2',
    name: 'LMS_SHA256_M32_H25 / W2',
    treeHeight: 25,
    winternitzParam: 2,
    signatureSize: 5104,
    publicKeySize: 60,
    privateKeySize: 64,
    maxSignatures: 33554432,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    levelHeights: [25],
    lmsParams: [CKP_LMS_SHA256_M32_H25],
    lmotsParams: [CKP_LMOTS_SHA256_N32_W2],
    provenance: 'RFC 8554',
  },
  {
    id: 'lms-h25-w4',
    name: 'LMS_SHA256_M32_H25 / W4',
    treeHeight: 25,
    winternitzParam: 4,
    signatureSize: 2992,
    publicKeySize: 60,
    privateKeySize: 64,
    maxSignatures: 33554432,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    levelHeights: [25],
    lmsParams: [CKP_LMS_SHA256_M32_H25],
    lmotsParams: [CKP_LMOTS_SHA256_N32_W4],
    provenance: 'RFC 8554',
  },
  {
    id: 'hss-l2-h20-w4',
    name: 'HSS-L2 (H10x2) / W4',
    treeHeight: 20,
    winternitzParam: 4,
    signatureSize: 5076,
    publicKeySize: 60,
    privateKeySize: 128,
    maxSignatures: 1048576,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    variant: 'multi-tree',
    levelHeights: [10, 10],
    lmsParams: [CKP_LMS_SHA256_M32_H10, CKP_LMS_SHA256_M32_H10],
    lmotsParams: [CKP_LMOTS_SHA256_N32_W4, CKP_LMOTS_SHA256_N32_W4],
    provenance: 'RFC 8554',
  },
  {
    id: 'hss-l2-h20-w8',
    name: 'HSS-L2 (H10x2) / W8',
    treeHeight: 20,
    winternitzParam: 8,
    signatureSize: 2964,
    publicKeySize: 60,
    privateKeySize: 128,
    maxSignatures: 1048576,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    variant: 'multi-tree',
    levelHeights: [10, 10],
    lmsParams: [CKP_LMS_SHA256_M32_H10, CKP_LMS_SHA256_M32_H10],
    lmotsParams: [CKP_LMOTS_SHA256_N32_W8, CKP_LMOTS_SHA256_N32_W8],
    provenance: 'RFC 8554',
  },
  {
    id: 'lms-sha256-m24-h10-w4',
    name: 'LMS_SHA256_M24_H10 / W4',
    treeHeight: 10,
    winternitzParam: 4,
    signatureSize: 1504,
    publicKeySize: 52,
    maxSignatures: 1024,
    securityLevel: 'n = 24 (generic collision bound 2^96)',
    hashFunction: 'SHA-256/192',
    levelHeights: [10],
    lmsParams: [CKP_LMS_SHA256_M24_H10],
    lmotsParams: [CKP_LMOTS_SHA256_N24_W4],
    provenance: 'RFC 9858',
  },
  {
    id: 'lms-sha256-m24-h10-w8',
    name: 'LMS_SHA256_M24_H10 / W8',
    treeHeight: 10,
    winternitzParam: 8,
    signatureSize: 904,
    publicKeySize: 52,
    maxSignatures: 1024,
    securityLevel: 'n = 24 (generic collision bound 2^96)',
    hashFunction: 'SHA-256/192',
    levelHeights: [10],
    lmsParams: [CKP_LMS_SHA256_M24_H10],
    lmotsParams: [CKP_LMOTS_SHA256_N24_W8],
    provenance: 'RFC 9858',
  },
  {
    id: 'lms-sha256-m24-h20-w4',
    name: 'LMS_SHA256_M24_H20 / W4',
    treeHeight: 20,
    winternitzParam: 4,
    signatureSize: 1744,
    publicKeySize: 52,
    maxSignatures: 1048576,
    securityLevel: 'n = 24 (generic collision bound 2^96)',
    hashFunction: 'SHA-256/192',
    levelHeights: [20],
    lmsParams: [CKP_LMS_SHA256_M24_H20],
    lmotsParams: [CKP_LMOTS_SHA256_N24_W4],
    provenance: 'RFC 9858',
  },
  {
    id: 'lms-sha256-m24-h20-w8',
    name: 'LMS_SHA256_M24_H20 / W8',
    treeHeight: 20,
    winternitzParam: 8,
    signatureSize: 1144,
    publicKeySize: 52,
    maxSignatures: 1048576,
    securityLevel: 'n = 24 (generic collision bound 2^96)',
    hashFunction: 'SHA-256/192',
    levelHeights: [20],
    lmsParams: [CKP_LMS_SHA256_M24_H20],
    lmotsParams: [CKP_LMOTS_SHA256_N24_W8],
    provenance: 'RFC 9858',
  },
  {
    id: 'lms-shake-m32-h10-w4',
    name: 'LMS_SHAKE_M32_H10 / W4',
    treeHeight: 10,
    winternitzParam: 4,
    signatureSize: 2512,
    publicKeySize: 60,
    maxSignatures: 1024,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHAKE256',
    levelHeights: [10],
    lmsParams: [CKP_LMS_SHAKE_M32_H10],
    lmotsParams: [CKP_LMOTS_SHAKE_N32_W4],
    provenance: 'RFC 9858',
  },
  {
    id: 'lms-shake-m32-h10-w8',
    name: 'LMS_SHAKE_M32_H10 / W8',
    treeHeight: 10,
    winternitzParam: 8,
    signatureSize: 1456,
    publicKeySize: 60,
    maxSignatures: 1024,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHAKE256',
    levelHeights: [10],
    lmsParams: [CKP_LMS_SHAKE_M32_H10],
    lmotsParams: [CKP_LMOTS_SHAKE_N32_W8],
    provenance: 'RFC 9858',
  },
  {
    id: 'lms-shake-m32-h20-w4',
    name: 'LMS_SHAKE_M32_H20 / W4',
    treeHeight: 20,
    winternitzParam: 4,
    signatureSize: 2832,
    publicKeySize: 60,
    maxSignatures: 1048576,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHAKE256',
    levelHeights: [20],
    lmsParams: [CKP_LMS_SHAKE_M32_H20],
    lmotsParams: [CKP_LMOTS_SHAKE_N32_W4],
    provenance: 'RFC 9858',
  },
  {
    id: 'lms-shake-m32-h20-w8',
    name: 'LMS_SHAKE_M32_H20 / W8',
    treeHeight: 20,
    winternitzParam: 8,
    signatureSize: 1776,
    publicKeySize: 60,
    maxSignatures: 1048576,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHAKE256',
    levelHeights: [20],
    lmsParams: [CKP_LMS_SHAKE_M32_H20],
    lmotsParams: [CKP_LMOTS_SHAKE_N32_W8],
    provenance: 'RFC 9858',
  },
  {
    id: 'lms-shake-m24-h10-w4',
    name: 'LMS_SHAKE_M24_H10 / W4',
    treeHeight: 10,
    winternitzParam: 4,
    signatureSize: 1504,
    publicKeySize: 52,
    maxSignatures: 1024,
    securityLevel: 'n = 24 (generic collision bound 2^96)',
    hashFunction: 'SHAKE256/192',
    levelHeights: [10],
    lmsParams: [CKP_LMS_SHAKE_M24_H10],
    lmotsParams: [CKP_LMOTS_SHAKE_N24_W4],
    provenance: 'RFC 9858',
  },
  {
    id: 'lms-shake-m24-h10-w8',
    name: 'LMS_SHAKE_M24_H10 / W8',
    treeHeight: 10,
    winternitzParam: 8,
    signatureSize: 904,
    publicKeySize: 52,
    maxSignatures: 1024,
    securityLevel: 'n = 24 (generic collision bound 2^96)',
    hashFunction: 'SHAKE256/192',
    levelHeights: [10],
    lmsParams: [CKP_LMS_SHAKE_M24_H10],
    lmotsParams: [CKP_LMOTS_SHAKE_N24_W8],
    provenance: 'RFC 9858',
  },
  {
    id: 'lms-shake-m24-h20-w4',
    name: 'LMS_SHAKE_M24_H20 / W4',
    treeHeight: 20,
    winternitzParam: 4,
    signatureSize: 1744,
    publicKeySize: 52,
    maxSignatures: 1048576,
    securityLevel: 'n = 24 (generic collision bound 2^96)',
    hashFunction: 'SHAKE256/192',
    levelHeights: [20],
    lmsParams: [CKP_LMS_SHAKE_M24_H20],
    lmotsParams: [CKP_LMOTS_SHAKE_N24_W4],
    provenance: 'RFC 9858',
  },
  {
    id: 'lms-shake-m24-h20-w8',
    name: 'LMS_SHAKE_M24_H20 / W8',
    treeHeight: 20,
    winternitzParam: 8,
    signatureSize: 1144,
    publicKeySize: 52,
    maxSignatures: 1048576,
    securityLevel: 'n = 24 (generic collision bound 2^96)',
    hashFunction: 'SHAKE256/192',
    levelHeights: [20],
    lmsParams: [CKP_LMS_SHAKE_M24_H20],
    lmotsParams: [CKP_LMOTS_SHAKE_N24_W8],
    provenance: 'RFC 9858',
  },
]

export const XMSS_PARAMETER_SETS: XMSSParameterSet[] = [
  {
    id: 'xmss-sha2-10',
    name: 'XMSS-SHA2_10_256',
    treeHeight: 10,
    signatureSize: 2500,
    publicKeySize: 68,
    privateKeySize: 1373,
    maxSignatures: 1024,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    variant: 'single-tree',
  },
  {
    id: 'xmss-sha2-16',
    name: 'XMSS-SHA2_16_256',
    treeHeight: 16,
    signatureSize: 2692,
    publicKeySize: 68,
    privateKeySize: 2093,
    maxSignatures: 65536,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    variant: 'single-tree',
  },
  {
    id: 'xmss-sha2-20',
    name: 'XMSS-SHA2_20_256',
    treeHeight: 20,
    signatureSize: 2820,
    publicKeySize: 68,
    privateKeySize: 2573,
    maxSignatures: 1048576,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    variant: 'single-tree',
  },
  {
    id: 'xmss-shake-10',
    name: 'XMSS-SHAKE_10_256',
    treeHeight: 10,
    signatureSize: 2500,
    publicKeySize: 68,
    privateKeySize: 1373,
    maxSignatures: 1024,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHAKE-128',
    variant: 'single-tree',
  },
  {
    id: 'xmss-shake-16',
    name: 'XMSS-SHAKE_16_256',
    treeHeight: 16,
    signatureSize: 2692,
    publicKeySize: 68,
    privateKeySize: 2093,
    maxSignatures: 65536,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHAKE-128',
    variant: 'single-tree',
  },
  {
    id: 'xmss-shake-20',
    name: 'XMSS-SHAKE_20_256',
    treeHeight: 20,
    signatureSize: 2820,
    publicKeySize: 68,
    privateKeySize: 2573,
    maxSignatures: 1048576,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHAKE-128',
    variant: 'single-tree',
  },
  // SP 800-208 Tables 14/16 SHAKE256 sets — the only SHAKE parameter sets NIST
  // approves. Same n=32 / w=16 shape as the SHA-256 sets, so the sizes match
  // those rows exactly. Only the heights the Rust engine implements are listed
  // (it supports 0x11/0x12; XMSS-SHAKE256_10_256 = 0x10 is C++-engine-only).
  {
    id: 'xmss-shake256-16',
    name: 'XMSS-SHAKE256_16_256',
    treeHeight: 16,
    signatureSize: 2692,
    publicKeySize: 68,
    privateKeySize: 2093,
    maxSignatures: 65536,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHAKE256',
    variant: 'single-tree',
  },
  {
    id: 'xmss-shake256-20',
    name: 'XMSS-SHAKE256_20_256',
    treeHeight: 20,
    signatureSize: 2820,
    publicKeySize: 68,
    privateKeySize: 2573,
    maxSignatures: 1048576,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHAKE256',
    variant: 'single-tree',
  },
  {
    id: 'xmssmt-sha2-20-2',
    name: 'XMSS^MT-SHA2_20/2_256',
    treeHeight: 20,
    signatureSize: 4963,
    publicKeySize: 68,
    privateKeySize: 5998,
    maxSignatures: 1048576,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    variant: 'multi-tree',
  },
  {
    id: 'xmssmt-sha2-40-4',
    name: 'XMSS^MT-SHA2_40/4_256',
    treeHeight: 40,
    signatureSize: 9893,
    publicKeySize: 68,
    privateKeySize: 12718,
    maxSignatures: 1099511627776,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    variant: 'multi-tree',
  },
  {
    id: 'xmssmt-sha2-60-6',
    name: 'XMSS^MT-SHA2_60/6_256',
    treeHeight: 60,
    signatureSize: 14824,
    publicKeySize: 68,
    privateKeySize: 19438,
    maxSignatures: 1152921504606846976,
    securityLevel: 'n = 32 (generic collision bound 2^128)',
    hashFunction: 'SHA-256',
    variant: 'multi-tree',
  },
]

const SIGNING_HSM_STATE = 'Signing HSM, backups must prevent state re-use (CNSA 2.0 FAQ p. 12).'
const MULTI_TREE_CNSA =
  'XMSS^MT not allowed, LMS and XMSS approved for firmware and software only, ML-DSA-87 approved for every use.'

export const SCHEME_FOR_USE_ROWS: SchemeForUseRow[] = [
  {
    id: 'firmware-signing',
    useCase: 'Firmware signing',
    paramSet: { family: 'lms', id: 'lms-sha256-m24-h20-w4' },
    state: 'Signing HSM, the device holds none.',
    cnsa: 'LMS allowed for firmware and software, SHA-256/192 recommended, HSS not allowed.',
  },
  {
    id: 'code-signing',
    useCase: 'Code signing',
    paramSet: { family: 'xmss', id: 'xmss-sha2-20' },
    state: 'Signing HSM.',
    cnsa: 'XMSS allowed for software, XMSS^MT not allowed.',
  },
  {
    id: 'secure-boot',
    useCase: 'Secure boot',
    paramSet: { family: 'lms', id: 'lms-sha256-m24-h10-w4' },
    state: "The vendor's signing HSM, the device holds only the public key.",
    cnsa: 'LMS allowed; note that a larger Winternitz w makes signatures smaller but slows key generation, signing and verification (RFC 8554).',
  },
  {
    id: 'document-signing',
    useCase: 'Document signing',
    paramSet: { family: 'xmss', id: 'xmssmt-sha2-40-4' },
    state: SIGNING_HSM_STATE,
    cnsa: MULTI_TREE_CNSA,
  },
  {
    id: 'timestamping',
    useCase: 'Timestamping',
    paramSet: { family: 'xmss', id: 'xmssmt-sha2-60-6' },
    state: SIGNING_HSM_STATE,
    cnsa: MULTI_TREE_CNSA,
  },
]

/** The parameter set a "Which scheme for which use" row shows. Throws on an unknown id. */
export function schemeForUseParamSet(row: SchemeForUseRow): LMSParameterSet | XMSSParameterSet {
  const sets: (LMSParameterSet | XMSSParameterSet)[] =
    row.paramSet.family === 'lms' ? LMS_PARAMETER_SETS : XMSS_PARAMETER_SETS
  const set = sets.find((s) => s.id === row.paramSet.id)
  if (!set) throw new Error(`Unknown ${row.paramSet.family} parameter set: ${row.paramSet.id}`)
  return set
}

/** Total tree height of the row's set: for a multi-tree set, the sum over all layers. */
export function schemeForUseTotalHeight(row: SchemeForUseRow): number {
  return schemeForUseParamSet(row).treeHeight
}

/** Layers of a multi-tree XMSS^MT set, read from its standard name (XMSS^MT-SHA2_40/4_256 has 4). */
export function xmssMtLayers(name: string): number | undefined {
  const match = /_(\d+)\/(\d+)_/.exec(name)
  return match ? Number(match[2]) : undefined
}

/**
 * Signatures the row's set can ever make: 2 to the power of its total tree height. Computed with
 * BigInt because 2^60 is past what a JavaScript number can print exactly.
 */
export function schemeForUseCapacity(row: SchemeForUseRow): bigint {
  return BigInt(1) << BigInt(schemeForUseTotalHeight(row))
}

/** A whole number with thousands separators, exact for any size. */
export function formatExactCount(count: bigint): string {
  return count.toLocaleString('en-US')
}

/** How the "Parameter set" column names the row's set. */
export function schemeForUseParamLabel(row: SchemeForUseRow): string {
  const set = schemeForUseParamSet(row)
  const height = schemeForUseTotalHeight(row)
  if (row.paramSet.family === 'lms') {
    const levels = (set as LMSParameterSet).levelHeights.length
    return levels === 1
      ? `LMS, one tree, height ${height}`
      : `HSS, total height ${height} in ${levels} layers`
  }
  const layers = xmssMtLayers(set.name)
  return layers === undefined
    ? `${set.name}, one tree, height ${height}`
    : `${set.name}, total height ${height} in ${layers} layers`
}

export const WORKSHOP_DISPLAY_PARAMS = {
  lms: [
    'lms-h5-w1',
    'lms-h5-w2',
    'lms-h5-w4',
    'lms-h5-w8',
    'lms-h10-w2',
    'lms-h10-w4',
    'lms-h10-w8',
    'hss-l2-h20-w4',
    'hss-l2-h20-w8',
  ] as const,
  xmss: ['xmss-sha2-10', 'xmss-shake-10'] as const,
}

export interface ThresholdConfig {
  n: number
  t: number
  lmsParamId: string
}

export interface CrvSizeRow {
  levels: number
  label: string
  twoOfThree: string
  threeOfFive: string
  fiveOfTen: string
  practical: boolean
}

export const CRV_SIZE_TABLE: CrvSizeRow[] = [
  {
    levels: 1,
    label: 'LMS (single-level)',
    twoOfThree: '~2 MB',
    threeOfFive: '~50 MB',
    fiveOfTen: '~500 MB',
    practical: true,
  },
  {
    levels: 2,
    label: 'HSS (2-level)',
    twoOfThree: '~1 GB',
    threeOfFive: '~20 GB',
    fiveOfTen: 'Impractical',
    practical: false,
  },
  {
    levels: 3,
    label: 'HSS (3+ levels)',
    twoOfThree: 'Impractical',
    threeOfFive: 'Impractical',
    fiveOfTen: 'Impractical',
    practical: false,
  },
]

export const THRESHOLD_DEMO_PARAMS = ['lms-h5-w1', 'lms-h5-w8', 'lms-h10-w4'] as const

export function formatSignatureCount(count: number): string {
  if (count >= 1_000_000_000_000) {
    return `${(count / 1_000_000_000_000).toFixed(0)}T`
  }
  if (count >= 1_000_000_000) {
    return `${(count / 1_000_000_000).toFixed(0)}B`
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(0)}K`
  }
  return count.toString()
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${bytes} B`
}
