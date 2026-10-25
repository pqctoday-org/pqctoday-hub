// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Key and signature sizes for the size comparison tables in the Stateful Hash
 * Signatures module (workshop step 4) and the SLH-DSA module (workshop step 4),
 * so both modules print the same numbers for the same parameter set.
 *
 * LMS and XMSS sizes are computed from the byte layouts in the standards, not
 * typed in; signatureSizes.test.ts checks them against published test data.
 *
 *  - LMS public key, RFC 8554 Section 5.3: u32str(type) || u32str(otstype) || I || T[1]
 *    = 4 + 4 + 16 + m bytes (I is the 16-byte key identifier, T[1] is m bytes).
 *  - LMS signature, RFC 8554 Section 5.4: u32str(q) || lmots_signature || u32str(type) || path,
 *    with lmots_signature = u32str(type) || C || y[0..p-1] (Section 4.5) = 4 + n + p*n bytes
 *    and path = h values of m bytes: 12 + n*(p+1) + m*h bytes.
 *  - n, m and p come from the LM-OTS and LMS tables of NIST SP 800-208 Section 4
 *    (RFC 8554 defines only n = m = 32).
 *  - XMSS public key, RFC 8391 Section 4.1.7: OID || root || SEED = 4 + 2n bytes.
 *  - XMSS signature, RFC 8391 Section 4.1.8: idx_sig || r || sig_ots || auth
 *    = 4 + n + len*n + h*n bytes (len from SP 800-208 Tables 10-17).
 *
 * A PKCS#11 HSS key with one level (what this module's engine signs with) is the
 * LMS key with a 4-byte level count in front, and its signature carries a 4-byte
 * count of signed public keys (Nspk = 0): public key 60 B and signature +4 B for
 * n = 32. The values here are for the bare LMS and XMSS objects the standards define.
 *
 * SLH-DSA sizes are FIPS 205 Table 2 and ML-DSA sizes are FIPS 204 Table 2; both
 * are fixed by those tables.
 */

/** LMS public key bytes for hash output length m (RFC 8554 Section 5.3). */
export const lmsPublicKeyBytes = (m: number): number => 4 + 4 + 16 + m

/** LMS signature bytes (RFC 8554 Section 5.4): n = LM-OTS hash length, p = chain count, m = LMS hash length, h = tree height. */
export const lmsSignatureBytes = (n: number, p: number, m: number, h: number): number =>
  12 + n * (p + 1) + m * h

/**
 * HSS signature bytes (RFC 8554 Section 6.2): u32str(Nspk) || signed_public_key[0..Nspk-1] || sig[Nspk],
 * where each signed_public_key is an LMS signature followed by the next level's LMS public key.
 * `levelSignatureBytes` is the LMS signature size of each level, top level first (lmsSignatureBytes);
 * m is the hash output length of the LMS public keys.
 */
export const hssSignatureBytes = (levelSignatureBytes: readonly number[], m: number): number =>
  4 +
  levelSignatureBytes.slice(0, -1).reduce((sum, sig) => sum + sig + lmsPublicKeyBytes(m), 0) +
  levelSignatureBytes[levelSignatureBytes.length - 1]

/** XMSS public key bytes for hash output length n (RFC 8391 Section 4.1.7). */
export const xmssPublicKeyBytes = (n: number): number => 4 + 2 * n

/** XMSS signature bytes (RFC 8391 Section 4.1.8). */
export const xmssSignatureBytes = (n: number, len: number, h: number): number =>
  4 + n + len * n + h * n

/** The LMS set the comparison tables use: SHA-256/192, 1,024 signatures, W = 4 (SP 800-208 Tables 3 and 4). */
export const COMPARED_LMS = {
  name: 'LMS_SHA256_M24_H10 / LMOTS_SHA256_N24_W4',
  n: 24,
  p: 51,
  m: 24,
  h: 10,
} as const

/** The XMSS set the comparison tables use: SHA-256/192, 1,024 signatures (SP 800-208 Table 12). */
export const COMPARED_XMSS = {
  name: 'XMSS-SHA2_10_192',
  n: 24,
  len: 51,
  h: 10,
} as const

export interface KeySizes {
  publicKey: number
  signature: number
}

export const COMPARED_SIZES = {
  lms: {
    publicKey: lmsPublicKeyBytes(COMPARED_LMS.m),
    signature: lmsSignatureBytes(COMPARED_LMS.n, COMPARED_LMS.p, COMPARED_LMS.m, COMPARED_LMS.h),
  },
  xmss: {
    publicKey: xmssPublicKeyBytes(COMPARED_XMSS.n),
    signature: xmssSignatureBytes(COMPARED_XMSS.n, COMPARED_XMSS.len, COMPARED_XMSS.h),
  },
  /** FIPS 205 Table 2, category 3 (192-bit) sets; the -s and -f sets share a public key size. */
  slhdsa192s: { publicKey: 48, signature: 16_224 },
  slhdsa192f: { publicKey: 48, signature: 35_664 },
  /** FIPS 204 Table 2: ML-DSA-65 is category 3; ML-DSA-87 (category 5) is the only ML-DSA set CNSA 2.0 accepts. */
  mldsa65: { publicKey: 1_952, signature: 3_309 },
  mldsa87: { publicKey: 2_592, signature: 4_627 },
} as const satisfies Record<string, KeySizes>

/** "1,500 B" */
export const bytesLabel = (n: number): string => `${n.toLocaleString('en-US')} B`
