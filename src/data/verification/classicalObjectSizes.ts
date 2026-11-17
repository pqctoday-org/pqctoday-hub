// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Independently transcribed classical cryptographic object lengths from primary
 * IETF RFCs, NIST FIPS, and SECG standards.
 *
 * Standards referenced:
 * - FIPS 186-5 (2023): Digital Signature Standard (DSS) — ECDSA & EdDSA
 * - SEC 1 v2.0 (2009) §2.3.3: Elliptic-Curve-Point-to-Octet-String Conversion
 * - RFC 5480 (2009) §2.2: Elliptic Curve Cryptography SubjectPublicKeyInfo Format
 * - RFC 3279 (2002) §2.2.3 / §2.3.1: ASN.1 DER ECDSA-Sig-Value & RSAPublicKey
 * - RFC 8017 (2016) §A.1.1 / §A.1.2: PKCS #1 v2.2 RSA Cryptography Specifications
 * - RFC 8032 (2017) §5.1.5 / §5.2.5: Edwards-Curve Digital Signature Algorithm (EdDSA)
 * - RFC 7748 (2016) §5 / §6: Elliptic Curves for Security (X25519 & X448)
 * - RFC 3526 (2003) / SP 800-56A Rev. 3: MODP Diffie-Hellman groups
 */

export interface EcdsaCurveSpec {
  curve: string
  coordinateBytes: number
  /** SEC 1 v2.0 §2.3.3 compressed point: 0x02/0x03 || X (1 + coordinateBytes) */
  compressedPublicKeyBytes: number
  /** Raw concatenated coordinates X || Y (2 * coordinateBytes), e.g. RFC 5903 IKEv2 / WebCrypto raw */
  rawCoordinatePairBytes: number
  /** SEC 1 v2.0 §2.3.3 uncompressed point: 0x04 || X || Y (1 + 2 * coordinateBytes) */
  uncompressedPublicKeyBytes: number
  /** RFC 5480 ASN.1 DER SubjectPublicKeyInfo (uncompressed point) */
  spkiDerBytes: number
  /** Private scalar d in octets */
  privateKeyBytes: number
  /** IEEE P1363 / RFC 7518 JWS fixed-width raw signature: r || s (2 * coordinateBytes) */
  rawSignatureBytes: number
  /** RFC 3279 §2.2.3 ASN.1 DER ECDSA-Sig-Value maximum length (SEQUENCE of two signed INTEGERs) */
  derSignatureMaxBytes: number
  standard: string
}

export const CLASSICAL_ECDSA_SIZES: Record<string, EcdsaCurveSpec> = {
  'ECDSA P-256': {
    curve: 'secp256r1 / prime256v1 (NIST P-256)',
    coordinateBytes: 32,
    compressedPublicKeyBytes: 33,
    rawCoordinatePairBytes: 64,
    uncompressedPublicKeyBytes: 65,
    spkiDerBytes: 91,
    privateKeyBytes: 32,
    rawSignatureBytes: 64,
    derSignatureMaxBytes: 72,
    standard: 'FIPS 186-5 / SEC 1 v2.0 / RFC 5480 / RFC 3279',
  },
  'ECDSA P-384': {
    curve: 'secp384r1 (NIST P-384)',
    coordinateBytes: 48,
    compressedPublicKeyBytes: 49,
    rawCoordinatePairBytes: 96,
    uncompressedPublicKeyBytes: 97,
    spkiDerBytes: 120,
    privateKeyBytes: 48,
    rawSignatureBytes: 96,
    derSignatureMaxBytes: 104,
    standard: 'FIPS 186-5 / SEC 1 v2.0 / RFC 5480 / RFC 3279',
  },
  'ECDSA P-521': {
    curve: 'secp521r1 (NIST P-521)',
    coordinateBytes: 66,
    compressedPublicKeyBytes: 67,
    rawCoordinatePairBytes: 132,
    uncompressedPublicKeyBytes: 133,
    spkiDerBytes: 158,
    privateKeyBytes: 66,
    rawSignatureBytes: 132,
    derSignatureMaxBytes: 141,
    standard: 'FIPS 186-5 / SEC 1 v2.0 / RFC 5480 / RFC 3279',
  },
} as const

export interface RsaSpec {
  modulusBits: number
  /** Raw modulus n length k = modulusBits / 8 (used in EMV Book 2, raw key tables) */
  rawModulusBytes: number
  /** RFC 8017 §A.1.1 PKCS#1 RSAPublicKey DER (with e = 65537) */
  pkcs1PublicKeyDerBytes: number
  /** RFC 5280 / RFC 3279 X.509 SubjectPublicKeyInfo DER (with e = 65537) */
  spkiDerBytes: number
  /**
   * RFC 8017 §A.1.2 PKCS#1 RSAPrivateKey DER nominal lengths (varies by ~2-4 bytes
   * depending on high-bit sign-padding octets on CRT components d, p, q, dP, dQ, qInv).
   */
  pkcs1PrivateKeyDerBytes: readonly number[]
  /** RFC 8017 §8.1 / §8.2 signature or OAEP/PKCS#1 v1.5 ciphertext length (k octets) */
  signatureOrCiphertextBytes: number
  standard: string
}

export const CLASSICAL_RSA_SIZES: Record<string, RsaSpec> = {
  'RSA-1024': {
    modulusBits: 1024,
    rawModulusBytes: 128,
    pkcs1PublicKeyDerBytes: 140,
    spkiDerBytes: 162,
    pkcs1PrivateKeyDerBytes: [608, 609, 610],
    signatureOrCiphertextBytes: 128,
    standard: 'RFC 8017 / EMV Book 2 (legacy SDA)',
  },
  'RSA-2048': {
    modulusBits: 2048,
    rawModulusBytes: 256,
    pkcs1PublicKeyDerBytes: 270,
    spkiDerBytes: 294,
    pkcs1PrivateKeyDerBytes: [1190, 1192, 1193],
    signatureOrCiphertextBytes: 256,
    standard: 'RFC 8017 / FIPS 186-5 / RFC 5280',
  },
  'RSA-3072': {
    modulusBits: 3072,
    rawModulusBytes: 384,
    pkcs1PublicKeyDerBytes: 398,
    spkiDerBytes: 422,
    pkcs1PrivateKeyDerBytes: [1766, 1768, 1770],
    signatureOrCiphertextBytes: 384,
    standard: 'RFC 8017 / FIPS 186-5 / RFC 5280',
  },
  'RSA-4096': {
    modulusBits: 4096,
    rawModulusBytes: 512,
    pkcs1PublicKeyDerBytes: 526,
    spkiDerBytes: 550,
    pkcs1PrivateKeyDerBytes: [2348, 2350],
    signatureOrCiphertextBytes: 512,
    standard: 'RFC 8017 / FIPS 186-5 / RFC 5280',
  },
  'RSA-7680': {
    modulusBits: 7680,
    rawModulusBytes: 960,
    pkcs1PublicKeyDerBytes: 974,
    spkiDerBytes: 998,
    pkcs1PrivateKeyDerBytes: [4364, 4366],
    signatureOrCiphertextBytes: 960,
    standard: 'RFC 8017 / NIST SP 800-57 Part 1 Rev. 5 Table 2 (192-bit classical)',
  },
  'RSA-15360': {
    modulusBits: 15360,
    rawModulusBytes: 1920,
    pkcs1PublicKeyDerBytes: 1934,
    spkiDerBytes: 1958,
    pkcs1PrivateKeyDerBytes: [8684, 8686],
    signatureOrCiphertextBytes: 1920,
    standard: 'RFC 8017 / NIST SP 800-57 Part 1 Rev. 5 Table 2 (256-bit classical)',
  },
} as const

export interface EddsaSpec {
  publicKeyBytes: number
  privateSeedBytes: number
  expandedPrivateKeyBytes: number
  signatureBytes: number
  standard: string
}

export const CLASSICAL_EDDSA_SIZES: Record<string, EddsaSpec> = {
  Ed25519: {
    publicKeyBytes: 32,
    privateSeedBytes: 32,
    expandedPrivateKeyBytes: 64,
    signatureBytes: 64,
    standard: 'RFC 8032 §5.1.5 / FIPS 186-5',
  },
  Ed448: {
    publicKeyBytes: 57,
    privateSeedBytes: 57,
    expandedPrivateKeyBytes: 114,
    signatureBytes: 114,
    standard: 'RFC 8032 §5.2.5 / FIPS 186-5',
  },
} as const

export interface XdhAndDhSpec {
  publicKeyBytes: number
  privateKeyBytes: number
  sharedSecretBytes: number
  /** Server key-share / peer public value length in TLS 1.3 key_share (32 B for X25519) or 0 when pure DH has no KEM ciphertext */
  peerShareOrZeroCiphertextBytes: readonly number[]
  standard: string
}

export const CLASSICAL_KEX_SIZES: Record<string, XdhAndDhSpec> = {
  X25519: {
    publicKeyBytes: 32,
    privateKeyBytes: 32,
    sharedSecretBytes: 32,
    peerShareOrZeroCiphertextBytes: [0, 32],
    standard: 'RFC 7748 §5 / RFC 8446 §4.2.8.2 / RFC 8731',
  },
  X448: {
    publicKeyBytes: 56,
    privateKeyBytes: 56,
    sharedSecretBytes: 56,
    peerShareOrZeroCiphertextBytes: [0, 56],
    standard: 'RFC 7748 §5 / RFC 8446 §4.2.8.2',
  },
  'ECDH P-256': {
    publicKeyBytes: 64,
    privateKeyBytes: 32,
    sharedSecretBytes: 32,
    peerShareOrZeroCiphertextBytes: [0, 64, 65],
    standard: 'RFC 5903 (IKEv2 DH Group 19, 64-octet x||y) / SP 800-56A Rev. 3',
  },
  'DH-2048': {
    publicKeyBytes: 256,
    privateKeyBytes: 40,
    sharedSecretBytes: 256,
    peerShareOrZeroCiphertextBytes: [0, 256],
    standard: 'RFC 3526 Group 14 / RFC 7919 ffdhe2048 / SP 800-56A Rev. 3',
  },
  'DH-3072': {
    publicKeyBytes: 384,
    privateKeyBytes: 53,
    sharedSecretBytes: 384,
    peerShareOrZeroCiphertextBytes: [0, 384],
    standard: 'RFC 3526 Group 15 / RFC 7919 ffdhe3072 / SP 800-56A Rev. 3',
  },
  'DH-4096': {
    publicKeyBytes: 512,
    privateKeyBytes: 60,
    sharedSecretBytes: 512,
    peerShareOrZeroCiphertextBytes: [0, 512],
    standard: 'RFC 3526 Group 16 / RFC 7919 ffdhe4096 / SP 800-56A Rev. 3',
  },
} as const
