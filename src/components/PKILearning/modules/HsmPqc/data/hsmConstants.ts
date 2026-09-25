// SPDX-License-Identifier: GPL-3.0-only

export interface PKCS11Mechanism {
  id: string
  name: string
  type: 'classical' | 'pqc'
  mechanismCode: string
  description: string
  keySize: string
  pkcs11Version: string
}

export interface FipsValidationEntry {
  vendorId: string
  vendorName: string
  certType: 'FIPS 140-3' | 'FIPS 140-2' | 'ACVP' | 'CAVP' | 'Common Criteria'
  certId: string
  /**
   * For ACVP/CAVP: PQC algorithms on the algorithm certificate. For FIPS 140-x: PQC algorithms in
   * the module certificate's Approved Algorithms list (empty when there are none).
   */
  algorithms: string[]
  /** 'Historical' = on the CMVP Historical list: existing systems only, not new procurement. */
  status: 'Active' | 'Pending' | 'Planned' | 'Historical'
  date: string
  level?: string
  /** Direct link to NIST CMVP or ACVP certificate page */
  certLink?: string
  /** Contextual note shown in the UI */
  note?: string
}

export interface SideChannelVector {
  id: string
  name: string
  affectedAlgorithms: string[]
  attackType: string
  description: string
  countermeasure: string
  hsmRelevance: 'high' | 'medium' | 'low'
}

export interface FirmwareUpgradePath {
  vendorId: string
  vendorName: string
  currentFirmware: string
  targetFirmware: string
  pqcAlgorithmsAdded: string[]
  upgradeComplexity: 'low' | 'medium' | 'high'
  estimatedDowntime: string
  notes: string
}

export interface KeySizeComparison {
  algorithm: string
  type: 'classical' | 'pqc'
  publicKeyBytes: number
  privateKeyBytes: number
  signatureOrCiphertextBytes: number
  nistLevel: string
  quantumSafe: boolean
}

export const PKCS11_MECHANISMS: PKCS11Mechanism[] = [
  // Classical
  {
    id: 'ckm-rsa-pkcs-key-pair-gen',
    name: 'CKM_RSA_PKCS_KEY_PAIR_GEN',
    type: 'classical',
    mechanismCode: '0x00000000',
    description: 'Generate RSA key pair (2048/3072/4096 bits)',
    keySize: '2048-4096 bits',
    pkcs11Version: 'v2.40+',
  },
  {
    id: 'ckm-ec-key-pair-gen',
    name: 'CKM_EC_KEY_PAIR_GEN',
    type: 'classical',
    mechanismCode: '0x00001040',
    description: 'Generate ECDSA key pair on P-256/P-384',
    keySize: '256-384 bits',
    pkcs11Version: 'v2.40+',
  },
  {
    id: 'ckm-rsa-pkcs-oaep',
    name: 'CKM_RSA_PKCS_OAEP',
    type: 'classical',
    mechanismCode: '0x00000009',
    description: 'RSA OAEP encryption/decryption for key wrapping',
    keySize: '2048-4096 bits',
    pkcs11Version: 'v2.40+',
  },
  {
    id: 'ckm-aes-ecb',
    name: 'CKM_AES_ECB',
    type: 'classical',
    mechanismCode: '0x00001081',
    description: 'AES ECB encrypt/decrypt — used by MILENAGE f1–f5 (3GPP TS 35.206)',
    keySize: '128/192/256 bits',
    pkcs11Version: 'v2.40+',
  },
  {
    id: 'ckm-aes-ctr',
    name: 'CKM_AES_CTR',
    type: 'classical',
    mechanismCode: '0x00001086',
    description: 'AES CTR stream cipher — SUCI MSIN encryption (3GPP TS 33.501 §6.12.2)',
    keySize: '128/256 bits',
    pkcs11Version: 'v2.40+',
  },
  {
    id: 'ckm-ecdsa',
    name: 'CKM_ECDSA',
    type: 'classical',
    mechanismCode: '0x00001041',
    description: 'ECDSA sign/verify operations',
    keySize: '256-384 bits',
    pkcs11Version: 'v2.40+',
  },
  {
    id: 'ckm-ecdsa-sha3-224',
    name: 'CKM_ECDSA_SHA3_224',
    type: 'classical',
    mechanismCode: '0x00001047',
    description: 'ECDSA with SHA3-224 prehash (PKCS#11 v3.2 §6.3)',
    keySize: '256-521 bits',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-ecdsa-sha3-256',
    name: 'CKM_ECDSA_SHA3_256',
    type: 'classical',
    mechanismCode: '0x00001048',
    description: 'ECDSA with SHA3-256 prehash (PKCS#11 v3.2 §6.3)',
    keySize: '256-521 bits',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-ecdsa-sha3-384',
    name: 'CKM_ECDSA_SHA3_384',
    type: 'classical',
    mechanismCode: '0x00001049',
    description: 'ECDSA with SHA3-384 prehash (PKCS#11 v3.2 §6.3)',
    keySize: '384-521 bits',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-ecdsa-sha3-512',
    name: 'CKM_ECDSA_SHA3_512',
    type: 'classical',
    mechanismCode: '0x0000104a',
    description: 'ECDSA with SHA3-512 prehash (PKCS#11 v3.2 §6.3)',
    keySize: '521 bits',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-pkcs5-pbkd2',
    name: 'CKM_PKCS5_PBKD2',
    type: 'classical',
    mechanismCode: '0x000003b0',
    description: 'PBKDF2 key derivation (BIP39 seed generation, PKCS#11 v3.2 §5.7.3.1)',
    keySize: 'Variable (1–512 bytes)',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hkdf-derive',
    name: 'CKM_HKDF_DERIVE',
    type: 'classical',
    mechanismCode: '0x0000402a',
    description:
      'HKDF key derivation via Extract+Expand (SUCI Profile C hybrid key combination, TLS 1.3, Signal)',
    keySize: 'Variable (1–512 bytes)',
    pkcs11Version: 'v3.0+',
  },
  {
    id: 'ckm-sp800-108-counter-kdf',
    name: 'CKM_SP800_108_COUNTER_KDF',
    type: 'classical',
    mechanismCode: '0x000003ac',
    description:
      'NIST SP 800-108 Counter mode KBKDF — PRF(Ki, [i]_r ∥ Label ∥ Context). Supports HMAC-SHA2/SHA3 and AES-CMAC PRFs.',
    keySize: 'Variable (1–512 bytes)',
    pkcs11Version: 'v3.2',
  },
  {
    id: 'ckm-sp800-108-feedback-kdf',
    name: 'CKM_SP800_108_FEEDBACK_KDF',
    type: 'classical',
    mechanismCode: '0x000003ad',
    description:
      'NIST SP 800-108 Feedback mode KBKDF — K(i) = PRF(Ki, K(i−1) ∥ Label ∥ Context). Optional IV seed for initial K(0).',
    keySize: 'Variable (1–512 bytes)',
    pkcs11Version: 'v3.2',
  },
  {
    id: 'ckm-ecdh1-cofactor-derive',
    name: 'CKM_ECDH1_COFACTOR_DERIVE',
    type: 'classical',
    mechanismCode: '0x00001051',
    description:
      'Cofactor ECDH key agreement — multiplies shared secret by curve cofactor before KDF. Eliminates small-subgroup attacks on non-prime-order curves.',
    keySize: 'EC curve order (P-256/384/521)',
    pkcs11Version: 'v3.2',
  },
  // PQC — PKCS#11 v3.2 CSD01 mechanisms (OASIS pkcs11t.h)
  {
    id: 'ckm-ml-kem-key-pair-gen',
    name: 'CKM_ML_KEM_KEY_PAIR_GEN',
    type: 'pqc',
    mechanismCode: '0x0000000f',
    description: 'Generate ML-KEM key pair (FIPS 203)',
    keySize: 'ML-KEM-512/768/1024',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-ml-kem',
    name: 'CKM_ML_KEM',
    type: 'pqc',
    mechanismCode: '0x00000017',
    description: 'ML-KEM encapsulate/decapsulate via C_EncapsulateKey/C_DecapsulateKey',
    keySize: 'ML-KEM-512/768/1024',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-ml-dsa-key-pair-gen',
    name: 'CKM_ML_DSA_KEY_PAIR_GEN',
    type: 'pqc',
    mechanismCode: '0x0000001c',
    description: 'Generate ML-DSA key pair (FIPS 204)',
    keySize: 'ML-DSA-44/65/87',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-ml-dsa',
    name: 'CKM_ML_DSA',
    type: 'pqc',
    mechanismCode: '0x0000001d',
    description: 'Pure ML-DSA sign/verify via C_Sign/C_Verify',
    keySize: 'ML-DSA-44/65/87',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-ml-dsa',
    name: 'CKM_HASH_ML_DSA',
    type: 'pqc',
    mechanismCode: '0x0000001f',
    description:
      'HashML-DSA (generic): hash algorithm specified in CK_HASH_SIGN_ADDITIONAL_CONTEXT',
    keySize: 'ML-DSA-44/65/87',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-ml-dsa-sha224',
    name: 'CKM_HASH_ML_DSA_SHA224',
    type: 'pqc',
    mechanismCode: '0x00000023',
    description: 'HashML-DSA pre-hash with SHA-224 (FIPS 204 HashML-DSA)',
    keySize: 'ML-DSA-44/65/87',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-ml-dsa-sha256',
    name: 'CKM_HASH_ML_DSA_SHA256',
    type: 'pqc',
    mechanismCode: '0x00000024',
    description: 'HashML-DSA pre-hash with SHA-256 (FIPS 204 HashML-DSA)',
    keySize: 'ML-DSA-44/65/87',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-ml-dsa-sha384',
    name: 'CKM_HASH_ML_DSA_SHA384',
    type: 'pqc',
    mechanismCode: '0x00000025',
    description: 'HashML-DSA pre-hash with SHA-384 (FIPS 204 HashML-DSA)',
    keySize: 'ML-DSA-44/65/87',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-ml-dsa-sha512',
    name: 'CKM_HASH_ML_DSA_SHA512',
    type: 'pqc',
    mechanismCode: '0x00000026',
    description: 'HashML-DSA pre-hash with SHA-512 (FIPS 204 HashML-DSA)',
    keySize: 'ML-DSA-44/65/87',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-ml-dsa-sha3-224',
    name: 'CKM_HASH_ML_DSA_SHA3_224',
    type: 'pqc',
    mechanismCode: '0x00000027',
    description: 'HashML-DSA pre-hash with SHA3-224 (FIPS 204 HashML-DSA)',
    keySize: 'ML-DSA-44/65/87',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-ml-dsa-sha3-256',
    name: 'CKM_HASH_ML_DSA_SHA3_256',
    type: 'pqc',
    mechanismCode: '0x00000028',
    description: 'HashML-DSA pre-hash with SHA3-256 (FIPS 204 HashML-DSA)',
    keySize: 'ML-DSA-44/65/87',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-ml-dsa-sha3-384',
    name: 'CKM_HASH_ML_DSA_SHA3_384',
    type: 'pqc',
    mechanismCode: '0x00000029',
    description: 'HashML-DSA pre-hash with SHA3-384 (FIPS 204 HashML-DSA)',
    keySize: 'ML-DSA-44/65/87',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-ml-dsa-sha3-512',
    name: 'CKM_HASH_ML_DSA_SHA3_512',
    type: 'pqc',
    mechanismCode: '0x0000002a',
    description: 'HashML-DSA pre-hash with SHA3-512 (FIPS 204 HashML-DSA)',
    keySize: 'ML-DSA-44/65/87',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-ml-dsa-shake128',
    name: 'CKM_HASH_ML_DSA_SHAKE128',
    type: 'pqc',
    mechanismCode: '0x0000002b',
    description: 'HashML-DSA pre-hash with SHAKE-128 XOF (FIPS 204 HashML-DSA)',
    keySize: 'ML-DSA-44/65/87',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-ml-dsa-shake256',
    name: 'CKM_HASH_ML_DSA_SHAKE256',
    type: 'pqc',
    mechanismCode: '0x0000002c',
    description: 'HashML-DSA pre-hash with SHAKE-256 XOF (FIPS 204 HashML-DSA)',
    keySize: 'ML-DSA-44/65/87',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-slh-dsa-key-pair-gen',
    name: 'CKM_SLH_DSA_KEY_PAIR_GEN',
    type: 'pqc',
    mechanismCode: '0x0000002d',
    description: 'Generate SLH-DSA key pair (FIPS 205)',
    keySize: 'SLH-DSA-128s/128f/192s/192f/256s/256f',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-slh-dsa',
    name: 'CKM_SLH_DSA',
    type: 'pqc',
    mechanismCode: '0x0000002e',
    description: 'Pure SLH-DSA sign/verify via C_MessageSignInit/C_SignMessage (FIPS 205)',
    keySize: 'SLH-DSA-128s/128f/192s/192f/256s/256f (SHA2 + SHAKE variants)',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-slh-dsa',
    name: 'CKM_HASH_SLH_DSA',
    type: 'pqc',
    mechanismCode: '0x00000034',
    description:
      'HashSLH-DSA (generic): hash algorithm specified in CK_HASH_SIGN_ADDITIONAL_CONTEXT',
    keySize: 'SLH-DSA-128s/128f/192s/192f/256s/256f',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-slh-dsa-sha224',
    name: 'CKM_HASH_SLH_DSA_SHA224',
    type: 'pqc',
    mechanismCode: '0x00000036',
    description: 'HashSLH-DSA pre-hash with SHA-224 (FIPS 205 HashSLH-DSA)',
    keySize: 'SLH-DSA-128s/128f/192s/192f/256s/256f',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-slh-dsa-sha256',
    name: 'CKM_HASH_SLH_DSA_SHA256',
    type: 'pqc',
    mechanismCode: '0x00000037',
    description: 'HashSLH-DSA pre-hash with SHA-256 (FIPS 205 HashSLH-DSA)',
    keySize: 'SLH-DSA-128s/128f/192s/192f/256s/256f',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-slh-dsa-sha384',
    name: 'CKM_HASH_SLH_DSA_SHA384',
    type: 'pqc',
    mechanismCode: '0x00000038',
    description: 'HashSLH-DSA pre-hash with SHA-384 (FIPS 205 HashSLH-DSA)',
    keySize: 'SLH-DSA-128s/128f/192s/192f/256s/256f',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-slh-dsa-sha512',
    name: 'CKM_HASH_SLH_DSA_SHA512',
    type: 'pqc',
    mechanismCode: '0x00000039',
    description: 'HashSLH-DSA pre-hash with SHA-512 (FIPS 205 HashSLH-DSA)',
    keySize: 'SLH-DSA-128s/128f/192s/192f/256s/256f',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-slh-dsa-sha3-224',
    name: 'CKM_HASH_SLH_DSA_SHA3_224',
    type: 'pqc',
    mechanismCode: '0x0000003a',
    description: 'HashSLH-DSA pre-hash with SHA3-224 (FIPS 205 HashSLH-DSA)',
    keySize: 'SLH-DSA-128s/128f/192s/192f/256s/256f',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-slh-dsa-sha3-256',
    name: 'CKM_HASH_SLH_DSA_SHA3_256',
    type: 'pqc',
    mechanismCode: '0x0000003b',
    description: 'HashSLH-DSA pre-hash with SHA3-256 (FIPS 205 HashSLH-DSA)',
    keySize: 'SLH-DSA-128s/128f/192s/192f/256s/256f',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-slh-dsa-sha3-384',
    name: 'CKM_HASH_SLH_DSA_SHA3_384',
    type: 'pqc',
    mechanismCode: '0x0000003c',
    description: 'HashSLH-DSA pre-hash with SHA3-384 (FIPS 205 HashSLH-DSA)',
    keySize: 'SLH-DSA-128s/128f/192s/192f/256s/256f',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-slh-dsa-sha3-512',
    name: 'CKM_HASH_SLH_DSA_SHA3_512',
    type: 'pqc',
    mechanismCode: '0x0000003d',
    description: 'HashSLH-DSA pre-hash with SHA3-512 (FIPS 205 HashSLH-DSA)',
    keySize: 'SLH-DSA-128s/128f/192s/192f/256s/256f',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-slh-dsa-shake128',
    name: 'CKM_HASH_SLH_DSA_SHAKE128',
    type: 'pqc',
    mechanismCode: '0x0000003e',
    description: 'HashSLH-DSA pre-hash with SHAKE-128 XOF (FIPS 205 HashSLH-DSA)',
    keySize: 'SLH-DSA-128s/128f/192s/192f/256s/256f',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hash-slh-dsa-shake256',
    name: 'CKM_HASH_SLH_DSA_SHAKE256',
    type: 'pqc',
    mechanismCode: '0x0000003f',
    description: 'HashSLH-DSA pre-hash with SHAKE-256 XOF (FIPS 205 HashSLH-DSA)',
    keySize: 'SLH-DSA-128s/128f/192s/192f/256s/256f',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hss-key-pair-gen',
    name: 'CKM_HSS_KEY_PAIR_GEN',
    type: 'pqc',
    mechanismCode: '0x00004032',
    description: 'Generate HSS/LMS stateful hash-based key pair (NIST SP 800-208)',
    keySize: 'LMS (H=5/10/15/20/25)',
    pkcs11Version: 'v3.2 (CSD01)',
  },
  {
    id: 'ckm-hss',
    name: 'CKM_HSS',
    type: 'pqc',
    mechanismCode: '0x00004033',
    description: 'HSS/LMS stateful sign/verify via C_Sign/C_Verify',
    keySize: 'LMS (H=5/10/15/20/25)',
    pkcs11Version: 'v3.2 (CSD01)',
  },
]

/**
 * Certificate data below was checked against the NIST CMVP and CAVP certificate pages on
 * 2026-09-24. It is a static snapshot: re-check the linked page before relying on an entry.
 *
 * It is deliberately NOT derived from public/data/compliance-data.json: on 2026-09-24 that file
 * listed ML-KEM/ML-DSA for CMVP #5300 and #5502, whose certificate pages do not include them in
 * the approved-algorithm list, and still showed #4250, #4765 and #4086 as Active.
 */
export const FIPS_VALIDATIONS_AS_OF = '2026-09-24'

export const FIPS_VALIDATIONS: FipsValidationEntry[] = [
  // === CAVP (tested via ACVP) — algorithm validations ===
  // An algorithm certificate says an identified implementation passed the NIST tests for the
  // listed algorithms. It is not a module certificate.
  {
    vendorId: 'thales-luna',
    vendorName: 'Thales Luna K7 Cryptographic Library',
    certType: 'ACVP',
    certId: 'A7358',
    algorithms: ['ML-KEM', 'ML-DSA', 'LMS'],
    status: 'Active',
    date: '2025-09-02',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?product=20110',
  },
  {
    vendorId: 'thales-luna',
    vendorName: 'Thales Luna T7 Firmware Cryptographic Library',
    certType: 'ACVP',
    certId: 'A7879',
    algorithms: ['ML-KEM', 'ML-DSA', 'LMS'],
    status: 'Active',
    date: '2026-01-16',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?product=20680',
  },
  {
    vendorId: 'entrust-nshield',
    vendorName: 'Entrust nShield 5 Algorithm Library - nCore',
    certType: 'ACVP',
    certId: 'A7285',
    algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA'],
    status: 'Active',
    date: '2025-07-30',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?product=20056',
    note: 'CAVP describes this implementation as providing cryptographic functionality for Entrust nShield HSMs.',
  },
  {
    vendorId: 'entrust-nshield',
    vendorName: 'Entrust nShield PQSDK',
    certType: 'ACVP',
    certId: 'A7990',
    algorithms: ['LMS'],
    status: 'Active',
    date: '2026-01-30',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?product=20796',
    note: 'LMS only. ML-KEM, ML-DSA and SLH-DSA for nShield are on A7285.',
  },
  {
    vendorId: 'utimaco',
    vendorName: 'Utimaco Lattice Module - ML',
    certType: 'ACVP',
    certId: 'A7400',
    algorithms: ['ML-KEM', 'ML-DSA'],
    status: 'Active',
    date: '2025-09-17',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?product=20181',
    note: 'CAVP describes it as the lattice PQC module for the containerized HSM (cHSM) on u.trust Anchor.',
  },
  {
    vendorId: 'utimaco',
    vendorName: 'Utimaco Stateful hash based Module - HBS',
    certType: 'ACVP',
    certId: 'A7401',
    algorithms: ['LMS'],
    status: 'Active',
    date: '2025-09-17',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?product=20182',
  },
  {
    vendorId: 'aws-cloudhsm',
    vendorName: 'AWS-LC Cryptographic Module (CloudHSM backend)',
    certType: 'ACVP',
    certId: 'A7917',
    algorithms: ['ML-KEM', 'ML-DSA'],
    status: 'Active',
    date: '2026-01-21',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?product=20709',
    note: 'ACVP validation is for the AWS-LC software library used by CloudHSM SDK — not for the HSM firmware itself.',
  },
  {
    vendorId: 'futurex-cryptohub',
    vendorName: 'Futurex GSP4000 Hardware Security Module',
    certType: 'ACVP',
    certId: 'A7998',
    algorithms: ['ML-KEM', 'ML-DSA'],
    status: 'Active',
    date: '2026-02-04',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?product=20805',
  },
  {
    vendorId: 'crypto4a-qxhsm',
    vendorName: 'Crypto4A QASM Cryptographic Module',
    certType: 'ACVP',
    certId: 'A5631',
    algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'LMS'],
    status: 'Active',
    date: '2024-08-14',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?product=18297',
  },
  // === CMVP — module certificates ===
  // `algorithms` lists the PQC algorithms that appear in the certificate's Approved Algorithms
  // list. Apart from a few vendor-affirmed functions, each is backed by a CAVP certificate. An empty list means the certificate
  // lists no PQC algorithm as approved.
  {
    vendorId: 'thales-luna',
    vendorName: 'Thales Luna T7',
    certType: 'FIPS 140-3',
    certId: '5450',
    algorithms: ['ML-KEM', 'ML-DSA', 'LMS'],
    status: 'Active',
    date: '2026-07-29',
    level: 'Level 3',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/5450',
    note: 'Hardware module. Sunset date 7/28/2031. The approved-algorithm list includes ML-KEM, ML-DSA and LMS.',
  },
  {
    vendorId: 'thales-luna',
    vendorName: 'Thales Luna M7 Cryptographic Module',
    certType: 'FIPS 140-3',
    certId: '5300',
    algorithms: ['LMS'],
    status: 'Active',
    date: '2026-06-03',
    level: 'Level 3',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/5300',
    note: 'LMS is the only PQC algorithm in the approved list. The Security Policy lists pre-standard DILITHIUM, FALCON and KYBER as non-approved, not allowed.',
  },
  {
    vendorId: 'thales-luna',
    vendorName: 'Thales Luna K7 Cryptographic Module',
    certType: 'FIPS 140-3',
    certId: '4684',
    algorithms: [],
    status: 'Active',
    date: '2024-04-02',
    level: 'Level 3',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4684',
    note: 'No PQC algorithm in the approved list. The K7 library passed CAVP testing for ML-KEM, ML-DSA and LMS (A7358), but this module certificate does not include them.',
  },
  {
    vendorId: 'entrust-nshield',
    vendorName: 'Entrust nShield 5s Hardware Security Module',
    certType: 'FIPS 140-3',
    certId: '5329',
    algorithms: [],
    status: 'Active',
    date: '2026-06-15',
    level: 'Level 3',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/5329',
    note: 'Replaces #4765, now Historical. No PQC algorithm in the approved list.',
  },
  {
    vendorId: 'entrust-nshield',
    vendorName: 'Entrust nShield 5s Hardware Security Module (Modules in Process)',
    certType: 'FIPS 140-3',
    certId: 'MIP',
    algorithms: [],
    status: 'Pending',
    date: '2026-07-30',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/modules-in-process/modules-in-process-list',
    note: 'On the CMVP Modules in Process list with status "Review" (7/30/2026). The list does not show firmware version, algorithms or level. A queue position is not evidence of the outcome.',
  },
  {
    vendorId: 'utimaco',
    vendorName: 'Utimaco CryptoServer Se-Series Gen2',
    certType: 'FIPS 140-2',
    certId: '3925',
    algorithms: [],
    status: 'Historical',
    date: '2021-05-10',
    level: 'Level 3',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/3925',
    note: 'A FIPS 140-2 certificate. CMVP moved it to the Historical list at sunset: usable only in existing systems, not for new procurement.',
  },
  {
    vendorId: 'marvell-ls2',
    vendorName: 'Marvell LS2 HSM Family',
    certType: 'FIPS 140-3',
    certId: '5502',
    algorithms: [],
    status: 'Active',
    date: '2026-08-25',
    level: 'Level 3',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/5502',
    note: 'No PQC algorithm in the approved list. The Security Policy names ML-DSA/ML-KEM keys and lists a hybrid ML-DSA + ECDSA signature as non-approved, not allowed.',
  },
  {
    vendorId: 'marvell-ls2',
    vendorName: 'Marvell LS2 HSM Family',
    certType: 'FIPS 140-3',
    certId: '4703',
    algorithms: [],
    status: 'Active',
    date: '2024-06-06',
    level: 'Level 3',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4703',
    note: 'Powers Azure Managed HSM backend. No PQC algorithm in the approved list.',
  },
  {
    vendorId: 'futurex-cryptohub',
    vendorName: 'Futurex EXP1000 Hardware Security Module',
    certType: 'FIPS 140-2',
    certId: '4086',
    algorithms: [],
    status: 'Historical',
    date: '2021-11-30',
    level: 'Level 3',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4086',
    note: 'A FIPS 140-2 certificate, moved to the Historical list at sunset. A Futurex GSP4000 module is on the Modules in Process list ("Pending Resubmission", 7/17/2026).',
  },
  {
    vendorId: 'crypto4a-qxhsm',
    vendorName: 'Crypto4A QASM Cryptographic Module',
    certType: 'FIPS 140-3',
    certId: '5497',
    algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'LMS'],
    status: 'Active',
    date: '2026-08-19',
    level: 'Level 3',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/5497',
    note: 'Hardware module. Sunset date 8/18/2031. The approved-algorithm list includes ML-KEM, ML-DSA, SLH-DSA and LMS.',
  },
  {
    vendorId: 'crypto4a-qxhsm',
    vendorName: 'Crypto4A QASM Cryptographic Module',
    certType: 'FIPS 140-2',
    certId: '4250',
    algorithms: [],
    status: 'Historical',
    date: '2022-06-13',
    level: 'Level 3',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4250',
    note: 'A FIPS 140-2 certificate, moved to the Historical list at sunset. The current FIPS 140-3 certificate for the QASM module is #5497.',
  },
  {
    vendorId: 'kryptus',
    vendorName: 'Kryptus ASI-HSM AHX5 kNET Cryptographic Module',
    certType: 'FIPS 140-3',
    certId: '5282',
    algorithms: ['ML-KEM', 'ML-DSA'],
    status: 'Active',
    date: '2026-05-20',
    level: 'Level 3',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/5282',
    note: 'Hardware module. Sunset date 5/19/2031. The approved-algorithm list includes ML-KEM and ML-DSA.',
  },
  {
    vendorId: 'sansec',
    vendorName: 'Sansec HSM Cryptographic Module',
    certType: 'FIPS 140-3',
    certId: '5503',
    algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA'],
    status: 'Active',
    date: '2026-08-25',
    level: 'Level 3',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/5503',
    note: 'Hardware module. Sunset date 8/24/2031. The approved-algorithm list includes ML-KEM, ML-DSA and SLH-DSA.',
  },
]

export const SIDE_CHANNEL_VECTORS: SideChannelVector[] = [
  {
    id: 'ntt-power',
    name: 'NTT Power Analysis',
    affectedAlgorithms: ['ML-KEM', 'ML-DSA'],
    attackType: 'Simple/Differential Power Analysis (SPA/DPA)',
    description:
      'Number Theoretic Transform (NTT) operations in lattice-based algorithms show data-dependent power consumption patterns. An attacker with physical access can measure power traces to recover secret coefficients.',
    countermeasure:
      'Constant-time NTT implementation, power noise injection, algorithmic masking. All production HSMs (Thales, Entrust, Utimaco) implement constant-time NTT.',
    hsmRelevance: 'high',
  },
  {
    id: 'em-emanation',
    name: 'EM Emanation Analysis',
    affectedAlgorithms: ['ML-KEM', 'ML-DSA'],
    attackType: 'Electromagnetic Side-Channel',
    description:
      'Polynomial multiplication in lattice operations generates electromagnetic emanations that correlate with secret data. Near-field EM probes can extract information even through shielding.',
    countermeasure:
      'EM shielding in HSM enclosure, randomized operation scheduling, hardware masking. FIPS 140-3 Level 3+ requires physical tamper evidence and environmental protection.',
    hsmRelevance: 'high',
  },
  {
    id: 'hash-timing',
    name: 'Hash Function Timing',
    affectedAlgorithms: ['SLH-DSA', 'LMS', 'XMSS'],
    attackType: 'Timing Attack',
    description:
      'Hash-based signature schemes rely heavily on hash function calls. Variable-time hash implementations can leak information about the message or key through timing measurements.',
    countermeasure:
      'Constant-time hash implementations (SHA-256, SHAKE). HSMs typically use hardware-accelerated constant-time hash units.',
    hsmRelevance: 'medium',
  },
  {
    id: 'cache-attack',
    name: 'Cache-Timing Attack',
    affectedAlgorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA'],
    attackType: 'Microarchitectural Side-Channel',
    description:
      'Table lookups in NTT or hash operations can be observed through CPU cache timing. Flush+Reload or Prime+Probe attacks can recover secret values in shared-hardware environments.',
    countermeasure:
      'HSMs use dedicated crypto processors (no shared cache). On-prem HSMs are immune to cache-timing attacks. Cloud HSMs use dedicated hardware per customer (AWS Nitro, Azure confidential computing).',
    hsmRelevance: 'low',
  },
  {
    id: 'fault-injection',
    name: 'Fault Injection (ML-DSA)',
    affectedAlgorithms: ['ML-DSA'],
    attackType: 'Active Fault Attack',
    description:
      'Inducing faults during ML-DSA signing (e.g., voltage glitching, laser fault injection) can cause the signer to produce a faulty signature that leaks the secret key. This is why ML-DSA uses hedged signing.',
    countermeasure:
      'ML-DSA hedged signing mode (FIPS 204 §3.4): rnd parameter is random, not zero. This makes the signing output non-deterministic, preventing fault attacks from producing exploitable faulty signatures. FIPS 140-3 Level 3+ HSMs also have tamper-responsive enclosures.',
    hsmRelevance: 'high',
  },
  {
    id: 'state-loss',
    name: 'Stateful Signature State Loss',
    affectedAlgorithms: ['LMS', 'XMSS'],
    attackType: 'Operational Failure',
    description:
      'If an HSM loses track of which one-time signature leaves have been used (e.g., power failure during NVRAM write), the same leaf may be used twice. Two signatures from the same leaf completely compromise the key.',
    countermeasure:
      'Atomic NVRAM state updates, write-ahead logging, pre-reservation of signature indices. HSMs are the only safe platform for stateful signatures because they provide atomic state persistence.',
    hsmRelevance: 'high',
  },
]

export const FIRMWARE_UPGRADE_PATHS: FirmwareUpgradePath[] = [
  {
    vendorId: 'thales-luna',
    vendorName: 'Thales Luna 7',
    currentFirmware: '7.8.x or earlier',
    targetFirmware: '7.9.2+',
    pqcAlgorithmsAdded: ['ML-KEM-512/768/1024', 'ML-DSA-44/65/87', 'LMS/HSS'],
    upgradeComplexity: 'low',
    estimatedDowntime: '30-60 minutes per HSM',
    notes:
      'PQC integrated into core firmware. Luna Client must also be upgraded to 10.9.2+. Existing keys are preserved during upgrade. CBOM REST API available after upgrade. FIPS 140-3 CMVP resubmission required for v7.9.2 — all vendors adding PQC to existing certified modules must resubmit.',
  },
  {
    vendorId: 'entrust-nshield',
    vendorName: 'Entrust nShield 5',
    currentFirmware: '13.6.x or earlier',
    targetFirmware: '13.8.0+',
    pqcAlgorithmsAdded: ['ML-KEM-512/768/1024', 'ML-DSA-44/65/87', 'SLH-DSA', 'LMS/HSS', 'XMSS'],
    upgradeComplexity: 'low',
    estimatedDowntime: '1-2 hours per HSM',
    notes:
      'ML-KEM, ML-DSA, and SLH-DSA are native in firmware v13.8.0 via standard PKCS#11 — no additional packages required for core PQC. LMS/XMSS available via optional PQSDK C API. ML-KEM, ML-DSA and SLH-DSA are on CAVP certificate A7285. An nShield 5s module is on the CMVP Modules in Process list (Review, 30 Jul 2026); that is a queue position, not an outcome. nShield as a Service receives automatic updates.',
  },
  {
    vendorId: 'utimaco',
    vendorName: 'Utimaco SecurityServer',
    currentFirmware: '4.x',
    targetFirmware: 'Q-safe extension',
    pqcAlgorithmsAdded: ['ML-KEM-512/768/1024', 'ML-DSA-44/65/87', 'LMS', 'XMSS'],
    upgradeComplexity: 'low',
    estimatedDowntime: '1-3 hours per HSM (firmware + Q-safe extension)',
    notes:
      'Q-safe is a firmware extension installed on top of the base firmware. Existing keys preserved. Free PQC simulator available for pre-upgrade testing. SLH-DSA on roadmap for a future Q-safe update. Cert #3925 is a FIPS 140-2 Level 3 certificate, now Historical (sunset).',
  },
  {
    vendorId: 'aws-cloudhsm',
    vendorName: 'AWS CloudHSM',
    currentFirmware: 'Current (classical)',
    targetFirmware: 'SDK update (provider-managed)',
    pqcAlgorithmsAdded: ['ML-DSA-44/65/87 (preview)'],
    upgradeComplexity: 'low',
    estimatedDowntime: 'Zero — SDK update only',
    notes:
      'PQC delivered via AWS-LC SDK, not HSM firmware change — hardware FIPS boundary unchanged. Customers update SDK dependency only. No downtime required. ML-DSA (all 3 variants) in preview; ML-KEM not yet in CloudHSM hardware. ACVP certificates required for new algorithm implementations.',
  },
  {
    vendorId: 'azure-dhsm',
    vendorName: 'Azure Dedicated HSM',
    currentFirmware: 'Thales Luna 7.8.x',
    targetFirmware: 'Thales Luna 7.9.2+ (same as on-prem)',
    pqcAlgorithmsAdded: ['ML-KEM-512/768/1024', 'ML-DSA-44/65/87', 'LMS/HSS'],
    upgradeComplexity: 'low',
    estimatedDowntime: '30-60 minutes per HSM (same as Thales Luna 7)',
    notes:
      'Azure Dedicated HSM is the same Thales Luna Network HSM 7 hardware — identical PQC upgrade path. Customer initiates via Azure Support portal (not auto-applied). Backup/restore recommended before upgrade. Note: Azure Dedicated HSM is retiring — no new customers after August 2025. FIPS 140-3 CMVP resubmission follows Thales Luna 7 resubmission timeline.',
  },
  {
    vendorId: 'crypto4a-qxhsm',
    vendorName: 'Crypto4A QxHSM',
    currentFirmware: 'v4.3 or earlier',
    targetFirmware: 'v4.4+ (PQC production)',
    pqcAlgorithmsAdded: ['ML-KEM-512/768/1024', 'ML-DSA-44/65/87', 'SLH-DSA', 'LMS/HSS', 'XMSS'],
    upgradeComplexity: 'low',
    estimatedDowntime: '30-60 minutes per HSM (FPGA firmware update)',
    notes:
      'FPGA-based design enables algorithm agility via firmware update — no hardware replacement needed. CAVP A5631 covers ML-KEM, ML-DSA, SLH-DSA and LMS. FIPS 140-3 Level 3 certificate #5497 (19 Aug 2026) lists all four as approved; the FIPS 140-2 certificate #4250 is Historical.',
  },
]

export const KEY_SIZE_COMPARISONS: KeySizeComparison[] = [
  {
    algorithm: 'RSA-2048',
    type: 'classical',
    publicKeyBytes: 256,
    privateKeyBytes: 1192,
    signatureOrCiphertextBytes: 256,
    nistLevel: 'Level 1 (classical)',
    quantumSafe: false,
  },
  {
    algorithm: 'ECDSA P-256',
    type: 'classical',
    publicKeyBytes: 65,
    privateKeyBytes: 32,
    signatureOrCiphertextBytes: 64,
    nistLevel: 'Level 1 (classical)',
    quantumSafe: false,
  },
  {
    algorithm: 'ML-KEM-768',
    type: 'pqc',
    publicKeyBytes: 1184,
    privateKeyBytes: 2400,
    signatureOrCiphertextBytes: 1088,
    nistLevel: 'NIST Level 3',
    quantumSafe: true,
  },
  {
    algorithm: 'ML-DSA-65',
    type: 'pqc',
    publicKeyBytes: 1952,
    privateKeyBytes: 4032,
    signatureOrCiphertextBytes: 3309,
    nistLevel: 'NIST Level 3',
    quantumSafe: true,
  },
  {
    algorithm: 'SLH-DSA-128f',
    type: 'pqc',
    publicKeyBytes: 32,
    privateKeyBytes: 64,
    signatureOrCiphertextBytes: 17088,
    nistLevel: 'NIST Level 1',
    quantumSafe: true,
  },
  {
    algorithm: 'LMS (H=20)',
    type: 'pqc',
    publicKeyBytes: 56,
    privateKeyBytes: 64,
    signatureOrCiphertextBytes: 4588,
    nistLevel: 'NIST Level 1',
    quantumSafe: true,
  },
]
