// SPDX-License-Identifier: GPL-3.0-only
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

export interface LMSParameterSet {
  id: string
  name: string
  /** Total height across all levels. For multi-tree this is the SUM of
   *  `levelHeights` — it is NOT a single tree's height, and must never be
   *  mapped back to one LMS ordinal (doing so collapsed L2(2x h10) into a
   *  single h20 tree, ~1000x the keygen work — fixed 2026-09-03). */
  treeHeight: number
  winternitzParam: number
  signatureSize: number
  publicKeySize: number
  /** Implementation-defined state blob size; omitted where not measured. */
  privateKeySize?: number
  maxSignatures: number
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

export interface UseCaseRecommendation {
  id: string
  useCase: string
  description: string
  recommendedScheme: 'LMS' | 'XMSS' | 'HSS' | 'XMSS^MT'
  recommendedParams: string
  rationale: string
  maxSignaturesNeeded: string
  stateStorageRequirement: string
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
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 32,
    securityLevel: 'NIST Level 1',
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
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 32,
    securityLevel: 'NIST Level 1',
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
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 32,
    securityLevel: 'NIST Level 1',
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
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 32,
    securityLevel: 'NIST Level 1',
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
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 1024,
    securityLevel: 'NIST Level 1',
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
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 1024,
    securityLevel: 'NIST Level 1',
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
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 1024,
    securityLevel: 'NIST Level 1',
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
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 32768,
    securityLevel: 'NIST Level 1',
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
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 32768,
    securityLevel: 'NIST Level 1',
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
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 1048576,
    securityLevel: 'NIST Level 1',
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
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 1048576,
    securityLevel: 'NIST Level 1',
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
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 33554432,
    securityLevel: 'NIST Level 1',
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
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 33554432,
    securityLevel: 'NIST Level 1',
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
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 33554432,
    securityLevel: 'NIST Level 1',
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
    securityLevel: 'NIST Level 1',
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
    securityLevel: 'NIST Level 1',
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
    publicKeySize: 48,
    maxSignatures: 1024,
    securityLevel: '192-bit (reduced margin)',
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
    publicKeySize: 48,
    maxSignatures: 1024,
    securityLevel: '192-bit (reduced margin)',
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
    publicKeySize: 48,
    maxSignatures: 1048576,
    securityLevel: '192-bit (reduced margin)',
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
    publicKeySize: 48,
    maxSignatures: 1048576,
    securityLevel: '192-bit (reduced margin)',
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
    publicKeySize: 56,
    maxSignatures: 1024,
    securityLevel: 'NIST Level 1',
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
    publicKeySize: 56,
    maxSignatures: 1024,
    securityLevel: 'NIST Level 1',
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
    publicKeySize: 56,
    maxSignatures: 1048576,
    securityLevel: 'NIST Level 1',
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
    publicKeySize: 56,
    maxSignatures: 1048576,
    securityLevel: 'NIST Level 1',
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
    publicKeySize: 48,
    maxSignatures: 1024,
    securityLevel: '192-bit (reduced margin)',
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
    publicKeySize: 48,
    maxSignatures: 1024,
    securityLevel: '192-bit (reduced margin)',
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
    publicKeySize: 48,
    maxSignatures: 1048576,
    securityLevel: '192-bit (reduced margin)',
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
    publicKeySize: 48,
    maxSignatures: 1048576,
    securityLevel: '192-bit (reduced margin)',
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
    securityLevel: 'NIST Level 1',
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
    securityLevel: 'NIST Level 1',
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
    securityLevel: 'NIST Level 1',
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
    securityLevel: 'NIST Level 1',
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
    securityLevel: 'NIST Level 1',
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
    securityLevel: 'NIST Level 1',
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
    securityLevel: 'NIST Level 1',
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
    securityLevel: 'NIST Level 1',
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
    securityLevel: 'NIST Level 1',
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
    securityLevel: 'NIST Level 1',
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
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
    variant: 'multi-tree',
  },
]

export const USE_CASE_RECOMMENDATIONS: UseCaseRecommendation[] = [
  {
    id: 'firmware-signing',
    useCase: 'Firmware Signing',
    description: 'Signing firmware images for embedded devices, IoT, and automotive ECUs.',
    recommendedScheme: 'LMS',
    recommendedParams: 'LMS H20/W4 or HSS (2-level, H10/W4)',
    rationale:
      'Firmware updates are infrequent. LMS simplicity suits resource-constrained devices. HSS extends capacity via hierarchy.',
    maxSignaturesNeeded: '~10,000 over device lifetime',
    stateStorageRequirement: 'Secure non-volatile storage (TPM, secure element)',
  },
  {
    id: 'code-signing',
    useCase: 'Code Signing',
    description: 'Signing software releases, packages, and build artifacts.',
    recommendedScheme: 'XMSS',
    recommendedParams: 'XMSS-SHA2_20_256 or XMSS^MT-SHA2_20/2_256',
    rationale:
      'Higher signing volume than firmware. XMSS multi-tree variant provides larger key space. Better state recovery mechanisms.',
    maxSignaturesNeeded: '~100,000 over key lifetime',
    stateStorageRequirement: 'HSM or secure key management system with atomic state updates',
  },
  {
    id: 'secure-boot',
    useCase: 'Secure Boot',
    description: 'Verifying boot chain integrity from ROM to OS kernel.',
    recommendedScheme: 'LMS',
    recommendedParams: 'LMS H10/W8 (small signatures)',
    rationale:
      'Verification speed is critical. Large W parameter (W=8) trades signing speed for compact signatures. Very few signatures needed.',
    maxSignaturesNeeded: '~100 (rarely re-signed)',
    stateStorageRequirement: 'OTP fuses or write-protected flash',
  },
  {
    id: 'document-signing',
    useCase: 'Document Signing',
    description: 'Long-lived digital signatures on legal, financial, or regulatory documents.',
    recommendedScheme: 'XMSS^MT',
    recommendedParams: 'XMSS^MT-SHA2_40/4_256',
    rationale:
      'Multi-tree structure provides massive signing capacity. Long-term security from hash-based assumptions. Suitable for PKI-integrated workflows.',
    maxSignaturesNeeded: '~1,000,000+ over organizational lifetime',
    stateStorageRequirement: 'Enterprise HSM with transactional state management',
  },
  {
    id: 'timestamping',
    useCase: 'Timestamping Authority',
    description: 'RFC 3161 timestamping services for non-repudiation.',
    recommendedScheme: 'XMSS^MT',
    recommendedParams: 'XMSS^MT-SHA2_60/6_256',
    rationale:
      'Highest signing volume requirement. 60-level tree provides effectively unlimited signatures. State management is paramount.',
    maxSignaturesNeeded: '~10,000,000+ per year',
    stateStorageRequirement:
      'Clustered HSMs with replicated, atomic state updates and audit logging',
  },
]

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
