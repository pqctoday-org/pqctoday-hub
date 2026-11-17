// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Independently transcribed stateful hash-based signature (LMS/HSS, XMSS/XMSS^MT)
 * and NIST Round-3 / Round-4 / On-Ramp PQC candidate object sizes.
 *
 * Standards referenced:
 * - RFC 8554 (2019) §5.4.1, §5.4.2, §6: Leighton-Micali Hash-Based Signatures (LMS & HSS)
 * - RFC 9858 (2025): SHAKE256 and Truncated SHA-256 (M24/N24) Parameter Sets for LMS/HSS
 * - NIST SP 800-208 (2020) §4, §5: Recommendation for Stateful Hash-Based Signature Schemes
 * - RFC 8391 (2018) §4.1.12, §4.2.4: XMSS: eXtended Merkle Signature Scheme
 * - Falcon Round-3 Specification (2020) / Draft FIPS 206: FN-DSA-512 & FN-DSA-1024
 * - NIST PQC Round 4 (2025): HQC, BIKE, Classic McEliece; ISO/IEC 18033-2 FrodoKEM
 * - NIST PQC Additional Digital Signatures Round 2 (2025-2026): FAEST v3.0, MQOM v2,
 *   SDitH v2, UOV, MAYO, QR-UOV, SNOVA, SQIsign, HAWK, CROSS
 * - RFC 9976: Streamlined NTRU Prime sntrup761
 */

export type WinternitzWidth = 1 | 2 | 4 | 8

/** LMOTS chain count p per RFC 8554 Table 1 (n=32) and RFC 9858 / SP 800-208 Table 2 (n=24) */
export function lmotsChainCount(n: 24 | 32, w: WinternitzWidth): number {
  if (n === 32) {
    switch (w) {
      case 1:
        return 265
      case 2:
        return 133
      case 4:
        return 67
      case 8:
        return 34
    }
  }
  switch (w) {
    case 1:
      return 200
    case 2:
      return 101
    case 4:
      return 51
    case 8:
      return 26
  }
}

/**
 * RFC 8554 §5.4.1 & §5.4.2 bare LMS public key and signature lengths:
 * - Public key: u32str(type) || u32str(otstype) || I (16 B) || T[1] (m B) = 24 + m bytes
 * - Signature: u32str(q) || lmots_sig (4 + n*(p+1)) || u32str(type) || path (m*h)
 *   = 12 + n * (p + 1) + m * h bytes
 */
export function computeBareLmsSizes(
  m: 24 | 32,
  h: number,
  w: WinternitzWidth
): { publicKeyBytes: number; signatureBytes: number; privateKeySeedBytes: number } {
  const p = lmotsChainCount(m, w)
  return {
    publicKeyBytes: 24 + m,
    signatureBytes: 12 + m * (p + 1) + m * h,
    privateKeySeedBytes: 64,
  }
}

/**
 * RFC 8554 §6 HSS (Hierarchical Signature System) public key and signature lengths:
 * - Public key: u32str(L) || pub[0] = 4 + (24 + m) = 28 + m bytes
 * - Signature: u32str(Nspk = L - 1) || signed_pub_key[0..L-2] || sig[L-1]
 *   = 4 + sum_{i=0..L-1}(bare_lms_sig(h_i, w_i)) + (L - 1) * bare_lms_pub(m)
 */
export function computeHssSizes(
  m: 24 | 32,
  levelHeights: readonly number[],
  w: WinternitzWidth
): { publicKeyBytes: number; signatureBytes: number } {
  const L = levelHeights.length
  const barePub = 24 + m
  let sigSum = 0
  for (const h of levelHeights) {
    sigSum += computeBareLmsSizes(m, h, w).signatureBytes
  }
  return {
    publicKeyBytes: 4 + barePub,
    signatureBytes: 4 + sigSum + (L - 1) * barePub,
  }
}

export interface StatefulLmsHssSpec {
  id: string
  m: 24 | 32
  levelHeights: readonly number[]
  w: WinternitzWidth
  barePublicKeyBytes: number
  hssPublicKeyBytes: number
  bareSignatureBytes: number
  hssSignatureBytes: number
  privateKeyBytes: number
  standard: string
}

const LMS_HSS_DEFS: ReadonlyArray<{
  id: string
  m: 24 | 32
  levelHeights: readonly number[]
  w: WinternitzWidth
  standard: string
}> = [
  { id: 'lms-h5-w1', m: 32, levelHeights: [5], w: 1, standard: 'RFC 8554 / SP 800-208' },
  { id: 'lms-h5-w2', m: 32, levelHeights: [5], w: 2, standard: 'RFC 8554 / SP 800-208' },
  { id: 'lms-h5-w4', m: 32, levelHeights: [5], w: 4, standard: 'RFC 8554 / SP 800-208' },
  { id: 'lms-h5-w8', m: 32, levelHeights: [5], w: 8, standard: 'RFC 8554 / SP 800-208' },
  { id: 'lms-h10-w2', m: 32, levelHeights: [10], w: 2, standard: 'RFC 8554 / SP 800-208' },
  { id: 'lms-h10-w4', m: 32, levelHeights: [10], w: 4, standard: 'RFC 8554 / SP 800-208' },
  { id: 'lms-h10-w8', m: 32, levelHeights: [10], w: 8, standard: 'RFC 8554 / SP 800-208' },
  { id: 'lms-h15-w2', m: 32, levelHeights: [15], w: 2, standard: 'RFC 8554 / SP 800-208' },
  { id: 'lms-h15-w4', m: 32, levelHeights: [15], w: 4, standard: 'RFC 8554 / SP 800-208' },
  { id: 'lms-h20-w2', m: 32, levelHeights: [20], w: 2, standard: 'RFC 8554 / SP 800-208' },
  { id: 'lms-h20-w4', m: 32, levelHeights: [20], w: 4, standard: 'RFC 8554 / SP 800-208' },
  { id: 'lms-h20-w8', m: 32, levelHeights: [20], w: 8, standard: 'RFC 8554 / SP 800-208' },
  { id: 'lms-h25-w1', m: 32, levelHeights: [25], w: 1, standard: 'RFC 8554 / SP 800-208' },
  { id: 'lms-h25-w2', m: 32, levelHeights: [25], w: 2, standard: 'RFC 8554 / SP 800-208' },
  { id: 'lms-h25-w4', m: 32, levelHeights: [25], w: 4, standard: 'RFC 8554 / SP 800-208' },
  {
    id: 'hss-l2-h20-w4',
    m: 32,
    levelHeights: [10, 10],
    w: 4,
    standard: 'RFC 8554 §6 / SP 800-208',
  },
  {
    id: 'hss-l2-h20-w8',
    m: 32,
    levelHeights: [10, 10],
    w: 8,
    standard: 'RFC 8554 §6 / SP 800-208',
  },
  {
    id: 'lms-sha256-m24-h10-w4',
    m: 24,
    levelHeights: [10],
    w: 4,
    standard: 'RFC 9858 / SP 800-208',
  },
  {
    id: 'lms-sha256-m24-h10-w8',
    m: 24,
    levelHeights: [10],
    w: 8,
    standard: 'RFC 9858 / SP 800-208',
  },
  {
    id: 'lms-sha256-m24-h20-w4',
    m: 24,
    levelHeights: [20],
    w: 4,
    standard: 'RFC 9858 / SP 800-208',
  },
  {
    id: 'lms-sha256-m24-h20-w8',
    m: 24,
    levelHeights: [20],
    w: 8,
    standard: 'RFC 9858 / SP 800-208',
  },
  {
    id: 'lms-shake-m32-h10-w4',
    m: 32,
    levelHeights: [10],
    w: 4,
    standard: 'RFC 9858 / SP 800-208',
  },
  {
    id: 'lms-shake-m32-h10-w8',
    m: 32,
    levelHeights: [10],
    w: 8,
    standard: 'RFC 9858 / SP 800-208',
  },
  {
    id: 'lms-shake-m32-h20-w4',
    m: 32,
    levelHeights: [20],
    w: 4,
    standard: 'RFC 9858 / SP 800-208',
  },
  {
    id: 'lms-shake-m32-h20-w8',
    m: 32,
    levelHeights: [20],
    w: 8,
    standard: 'RFC 9858 / SP 800-208',
  },
  {
    id: 'lms-shake-m24-h10-w4',
    m: 24,
    levelHeights: [10],
    w: 4,
    standard: 'RFC 9858 / SP 800-208',
  },
  {
    id: 'lms-shake-m24-h10-w8',
    m: 24,
    levelHeights: [10],
    w: 8,
    standard: 'RFC 9858 / SP 800-208',
  },
  {
    id: 'lms-shake-m24-h20-w4',
    m: 24,
    levelHeights: [20],
    w: 4,
    standard: 'RFC 9858 / SP 800-208',
  },
  {
    id: 'lms-shake-m24-h20-w8',
    m: 24,
    levelHeights: [20],
    w: 8,
    standard: 'RFC 9858 / SP 800-208',
  },
]

export const STATEFUL_LMS_HSS_SIZES: Record<string, StatefulLmsHssSpec> = Object.fromEntries(
  LMS_HSS_DEFS.map((def) => {
    const bare = computeBareLmsSizes(def.m, def.levelHeights[0], def.w)
    const hss = computeHssSizes(def.m, def.levelHeights, def.w)
    return [
      def.id,
      {
        ...def,
        barePublicKeyBytes: bare.publicKeyBytes,
        hssPublicKeyBytes: hss.publicKeyBytes,
        bareSignatureBytes: bare.signatureBytes,
        hssSignatureBytes: hss.signatureBytes,
        privateKeyBytes: 64 * def.levelHeights.length,
      },
    ]
  })
)

/**
 * RFC 8391 §4.1.12 / §4.2.4 XMSS & XMSS^MT sizes for n=32, w=16 (len=67):
 * - Public key with 4-byte OID header: 4 + 2n = 68 bytes (bare root || SEED is 64 bytes)
 * - Single-tree (d=1) signature: 4 (idx_sig) + n (r) + len*n (sig_ots) + h*n (auth)
 *   = 4 + 32 + 2144 + 32*h = 2180 + 32*h bytes
 * - Multi-tree (d > 1) signature: ceil(h/8) (idx_sig) + n (r) + d * (len + h/d) * n
 */
export function computeXmssSizes(
  h: number,
  d = 1,
  n = 32,
  len = 67
): { publicKeyWithOidBytes: number; barePublicKeyBytes: number; signatureBytes: number } {
  const idxBytes = d === 1 ? 4 : Math.ceil(h / 8)
  const treeHeightPerLayer = h / d
  const reducedSigBytes = (len + treeHeightPerLayer) * n
  return {
    publicKeyWithOidBytes: 4 + 2 * n,
    barePublicKeyBytes: 2 * n,
    signatureBytes: idxBytes + n + d * reducedSigBytes,
  }
}

export interface StatefulXmssSpec {
  id: string
  name: string
  h: number
  d: number
  publicKeyBytes: number
  signatureBytes: number
  standard: string
}

export const STATEFUL_XMSS_SIZES: Record<string, StatefulXmssSpec> = {
  'xmss-sha2-10': {
    id: 'xmss-sha2-10',
    name: 'XMSS-SHA2_10_256',
    h: 10,
    d: 1,
    ...(() => {
      const s = computeXmssSizes(10, 1)
      return { publicKeyBytes: s.publicKeyWithOidBytes, signatureBytes: s.signatureBytes }
    })(),
    standard: 'RFC 8391 §5.3 / SP 800-208',
  },
  'xmss-sha2-16': {
    id: 'xmss-sha2-16',
    name: 'XMSS-SHA2_16_256',
    h: 16,
    d: 1,
    ...(() => {
      const s = computeXmssSizes(16, 1)
      return { publicKeyBytes: s.publicKeyWithOidBytes, signatureBytes: s.signatureBytes }
    })(),
    standard: 'RFC 8391 §5.3 / SP 800-208',
  },
  'xmss-sha2-20': {
    id: 'xmss-sha2-20',
    name: 'XMSS-SHA2_20_256',
    h: 20,
    d: 1,
    ...(() => {
      const s = computeXmssSizes(20, 1)
      return { publicKeyBytes: s.publicKeyWithOidBytes, signatureBytes: s.signatureBytes }
    })(),
    standard: 'RFC 8391 §5.3 / SP 800-208',
  },
  'xmss-shake-10': {
    id: 'xmss-shake-10',
    name: 'XMSS-SHAKE_10_256',
    h: 10,
    d: 1,
    ...(() => {
      const s = computeXmssSizes(10, 1)
      return { publicKeyBytes: s.publicKeyWithOidBytes, signatureBytes: s.signatureBytes }
    })(),
    standard: 'RFC 8391 §5.3',
  },
  'xmss-shake-16': {
    id: 'xmss-shake-16',
    name: 'XMSS-SHAKE_16_256',
    h: 16,
    d: 1,
    ...(() => {
      const s = computeXmssSizes(16, 1)
      return { publicKeyBytes: s.publicKeyWithOidBytes, signatureBytes: s.signatureBytes }
    })(),
    standard: 'RFC 8391 §5.3',
  },
  'xmss-shake-20': {
    id: 'xmss-shake-20',
    name: 'XMSS-SHAKE_20_256',
    h: 20,
    d: 1,
    ...(() => {
      const s = computeXmssSizes(20, 1)
      return { publicKeyBytes: s.publicKeyWithOidBytes, signatureBytes: s.signatureBytes }
    })(),
    standard: 'RFC 8391 §5.3',
  },
  'xmss-shake256-16': {
    id: 'xmss-shake256-16',
    name: 'XMSS-SHAKE256_16_256',
    h: 16,
    d: 1,
    ...(() => {
      const s = computeXmssSizes(16, 1)
      return { publicKeyBytes: s.publicKeyWithOidBytes, signatureBytes: s.signatureBytes }
    })(),
    standard: 'NIST SP 800-208 Tables 14 & 16',
  },
  'xmss-shake256-20': {
    id: 'xmss-shake256-20',
    name: 'XMSS-SHAKE256_20_256',
    h: 20,
    d: 1,
    ...(() => {
      const s = computeXmssSizes(20, 1)
      return { publicKeyBytes: s.publicKeyWithOidBytes, signatureBytes: s.signatureBytes }
    })(),
    standard: 'NIST SP 800-208 Tables 14 & 16',
  },
  'xmssmt-sha2-20-2': {
    id: 'xmssmt-sha2-20-2',
    name: 'XMSS^MT-SHA2_20/2_256',
    h: 20,
    d: 2,
    ...(() => {
      const s = computeXmssSizes(20, 2)
      return { publicKeyBytes: s.publicKeyWithOidBytes, signatureBytes: s.signatureBytes }
    })(),
    standard: 'RFC 8391 §5.4 / SP 800-208',
  },
  'xmssmt-sha2-40-4': {
    id: 'xmssmt-sha2-40-4',
    name: 'XMSS^MT-SHA2_40/4_256',
    h: 40,
    d: 4,
    ...(() => {
      const s = computeXmssSizes(40, 4)
      return { publicKeyBytes: s.publicKeyWithOidBytes, signatureBytes: s.signatureBytes }
    })(),
    standard: 'RFC 8391 §5.4 / SP 800-208',
  },
  'xmssmt-sha2-60-6': {
    id: 'xmssmt-sha2-60-6',
    name: 'XMSS^MT-SHA2_60/6_256',
    h: 60,
    d: 6,
    ...(() => {
      const s = computeXmssSizes(60, 6)
      return { publicKeyBytes: s.publicKeyWithOidBytes, signatureBytes: s.signatureBytes }
    })(),
    standard: 'RFC 8391 §5.4 / SP 800-208',
  },
} as const

export interface CandidateObjectSizeSpec {
  name: string
  publicKeyBytes: number
  privateKeyBytes: number
  signatureOrCiphertextBytes: number
  standard: string
}

export const CANDIDATE_OBJECT_SIZES: Record<string, CandidateObjectSizeSpec> = {
  // FN-DSA / Falcon (Draft FIPS 206 / Falcon Round-3 spec)
  'FN-DSA-512': {
    name: 'FN-DSA-512',
    publicKeyBytes: 897,
    privateKeyBytes: 1281,
    signatureOrCiphertextBytes: 666,
    standard: 'Falcon Round-3 Spec / Draft FIPS 206',
  },
  'FN-DSA-1024': {
    name: 'FN-DSA-1024',
    publicKeyBytes: 1793,
    privateKeyBytes: 2305,
    signatureOrCiphertextBytes: 1280,
    standard: 'Falcon Round-3 Spec / Draft FIPS 206',
  },

  // HQC (NIST Round-4 selected KEM, 2025)
  'HQC-128': {
    name: 'HQC-128',
    publicKeyBytes: 2241,
    privateKeyBytes: 2321,
    signatureOrCiphertextBytes: 4433,
    standard: 'HQC Round-4 Spec (2025)',
  },
  'HQC-192': {
    name: 'HQC-192',
    publicKeyBytes: 4514,
    privateKeyBytes: 4602,
    signatureOrCiphertextBytes: 8978,
    standard: 'HQC Round-4 Spec (2025)',
  },
  'HQC-256': {
    name: 'HQC-256',
    publicKeyBytes: 7237,
    privateKeyBytes: 7333,
    signatureOrCiphertextBytes: 14421,
    standard: 'HQC Round-4 Spec (2025)',
  },

  // BIKE (NIST Round-4 KEM candidate)
  'BIKE-L1': {
    name: 'BIKE-L1',
    publicKeyBytes: 1541,
    privateKeyBytes: 5223,
    signatureOrCiphertextBytes: 1573,
    standard: 'BIKE Round-4 v5.1 Spec',
  },
  'BIKE-L3': {
    name: 'BIKE-L3',
    publicKeyBytes: 3083,
    privateKeyBytes: 10105,
    signatureOrCiphertextBytes: 3115,
    standard: 'BIKE Round-4 v5.1 Spec',
  },
  'BIKE-L5': {
    name: 'BIKE-L5',
    publicKeyBytes: 5122,
    privateKeyBytes: 16494,
    signatureOrCiphertextBytes: 5154,
    standard: 'BIKE Round-4 v5.1 Spec',
  },

  // Classic McEliece (ISO/IEC CD 18033-2 / NIST Round-4)
  'Classic-McEliece-348864': {
    name: 'Classic-McEliece-348864',
    publicKeyBytes: 261120,
    privateKeyBytes: 6492,
    signatureOrCiphertextBytes: 96,
    standard: 'Classic McEliece Round-4 Spec',
  },
  'Classic-McEliece-460896': {
    name: 'Classic-McEliece-460896',
    publicKeyBytes: 524160,
    privateKeyBytes: 13608,
    signatureOrCiphertextBytes: 156,
    standard: 'Classic McEliece Round-4 Spec',
  },
  'Classic-McEliece-8192128': {
    name: 'Classic-McEliece-8192128',
    publicKeyBytes: 1357824,
    privateKeyBytes: 14120,
    signatureOrCiphertextBytes: 208,
    standard: 'Classic McEliece Round-4 Spec',
  },

  // FrodoKEM (ISO/IEC 18033-2)
  'FrodoKEM-640': {
    name: 'FrodoKEM-640',
    publicKeyBytes: 9616,
    privateKeyBytes: 19888,
    signatureOrCiphertextBytes: 9752,
    standard: 'FrodoKEM Preliminary Spec / ISO/IEC 18033-2',
  },
  'FrodoKEM-976': {
    name: 'FrodoKEM-976',
    publicKeyBytes: 15632,
    privateKeyBytes: 31296,
    signatureOrCiphertextBytes: 15792,
    standard: 'FrodoKEM Preliminary Spec / ISO/IEC 18033-2',
  },
  'FrodoKEM-1344': {
    name: 'FrodoKEM-1344',
    publicKeyBytes: 21520,
    privateKeyBytes: 43088,
    signatureOrCiphertextBytes: 21696,
    standard: 'FrodoKEM Preliminary Spec / ISO/IEC 18033-2',
  },

  // Streamlined NTRU Prime & Kyber (Round 3)
  sntrup761: {
    name: 'sntrup761',
    publicKeyBytes: 1158,
    privateKeyBytes: 1763,
    signatureOrCiphertextBytes: 1039,
    standard: 'RFC 9976 (Streamlined NTRU Prime sntrup761)',
  },
  'Kyber-512': {
    name: 'Kyber-512',
    publicKeyBytes: 800,
    privateKeyBytes: 1632,
    signatureOrCiphertextBytes: 768,
    standard: 'CRYSTALS-Kyber Round-3 Spec (Rosenpass epki/ecti)',
  },
  'Kyber-768': {
    name: 'Kyber-768',
    publicKeyBytes: 1184,
    privateKeyBytes: 2400,
    signatureOrCiphertextBytes: 1088,
    standard: 'CRYSTALS-Kyber Round-3 Spec',
  },
  'Kyber-1024': {
    name: 'Kyber-1024',
    publicKeyBytes: 1568,
    privateKeyBytes: 3168,
    signatureOrCiphertextBytes: 1568,
    standard: 'CRYSTALS-Kyber Round-3 Spec',
  },

  // NIST PQC Additional Digital Signatures Round-2 -> Round-3 Candidates
  faest: {
    name: 'FAEST (FAEST-128f v3.0)',
    publicKeyBytes: 32,
    privateKeyBytes: 32,
    signatureOrCiphertextBytes: 5170,
    standard: 'FAEST v3.0 Spec (FAEST-128f)',
  },
  mqom: {
    name: 'MQOM (MQOM2-L1-gf256-short-3r)',
    publicKeyBytes: 80,
    privateKeyBytes: 128,
    signatureOrCiphertextBytes: 3540,
    standard: 'MQOM v2 Round-2 Spec (MQOM2-L1-gf256-short-3r)',
  },
  sdith: {
    name: 'SDitH (SDitH2-L1-gf2-short)',
    publicKeyBytes: 70,
    privateKeyBytes: 163,
    signatureOrCiphertextBytes: 3705,
    standard: 'SDitH v2 Round-2 Spec (SDitH2-L1-gf2-short)',
  },
  uov: {
    name: 'UOV (uov-Ip rounded)',
    publicKeyBytes: 66000,
    privateKeyBytes: 237000,
    signatureOrCiphertextBytes: 96,
    standard: 'UOV Round-2 Spec (uov-Ip Category 1)',
  },
  mayo: {
    name: 'MAYO (MAYO-1 / Cat 1)',
    publicKeyBytes: 1168,
    privateKeyBytes: 24,
    signatureOrCiphertextBytes: 321,
    standard: 'MAYO Round-2 Spec',
  },
  'qr-uov': {
    name: 'QR-UOV (Cat 1 q=127,v=156,m=54,l=3)',
    publicKeyBytes: 24255,
    privateKeyBytes: 32,
    signatureOrCiphertextBytes: 200,
    standard: 'QR-UOV Round-2 Spec',
  },
  snova: {
    name: 'SNOVA (Cat 1)',
    publicKeyBytes: 1016,
    privateKeyBytes: 48,
    signatureOrCiphertextBytes: 248,
    standard: 'SNOVA Round-2 Spec',
  },
  sqisign: {
    name: 'SQIsign (SQIsign-I)',
    publicKeyBytes: 65,
    privateKeyBytes: 353,
    signatureOrCiphertextBytes: 148,
    standard: 'SQIsign Round-2 Spec',
  },
  hawk: {
    name: 'HAWK (HAWK-512)',
    publicKeyBytes: 1024,
    privateKeyBytes: 2480,
    signatureOrCiphertextBytes: 555,
    standard: 'HAWK Round-2 Spec (HAWK-512)',
  },
  cross: {
    name: 'CROSS (CROSS-rsdp-128-small)',
    publicKeyBytes: 77,
    privateKeyBytes: 32,
    signatureOrCiphertextBytes: 12432,
    standard: 'CROSS Round-2 Spec',
  },
} as const
