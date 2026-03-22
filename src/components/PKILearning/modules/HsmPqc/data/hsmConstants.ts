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
  certType: 'FIPS 140-3' | 'ACVP' | 'CAVP' | 'Common Criteria'
  certId: string
  /** For ACVP: PQC algorithms validated. For FIPS 140-3: empty — module certs do not include PQC. */
  algorithms: string[]
  status: 'Active' | 'Pending' | 'Planned'
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
  recertificationRequired: boolean
  recertificationTimeline: string
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

export const FIPS_VALIDATIONS: FipsValidationEntry[] = [
  // === ACVP — Algorithm-level PQC validations (NIST CAVP/ACVP program) ===
  // ACVP validates individual algorithm implementations, not the hardware module.
  // These are the ONLY validated PQC certifications that exist for HSMs as of early 2026.
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
    vendorName: 'Entrust nShield PQSDK',
    certType: 'ACVP',
    certId: 'A7990',
    algorithms: ['LMS'],
    status: 'Active',
    date: '2026-01-30',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?product=20796',
    note: 'LMS validated. ML-KEM and ML-DSA ACVP validations pending for nShield 5 firmware v13.8.0+.',
  },
  {
    vendorId: 'utimaco',
    vendorName: 'Utimaco SecurityServer — Stateful HBS Module',
    certType: 'ACVP',
    certId: 'A7401',
    algorithms: ['LMS'],
    status: 'Active',
    date: '2025-09-17',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/details?product=20182',
    note: 'LMS validated. ML-KEM and ML-DSA ACVP validations pending for Q-safe extension v5.0.',
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
  // === FIPS 140-3 — Module certifications (hardware + classical algorithms only) ===
  // IMPORTANT: No HSM has a FIPS 140-3 module certificate that includes PQC algorithm certification.
  // FIPS 140-3 certifies the hardware security boundary and classical algorithms (AES, SHA, RSA, ECDH).
  // All entries below show "No PQC Mechanisms Detected" in the NIST CMVP database.
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
    note: 'Certifies hardware module + classical algorithms. PQC algorithm validations are in ACVP A7358 and A7879.',
  },
  {
    vendorId: 'entrust-nshield',
    vendorName: 'Entrust nShield 5s Hardware Security Module',
    certType: 'FIPS 140-3',
    certId: '4765',
    algorithms: [],
    status: 'Active',
    date: '2024-08-19',
    level: 'Level 3',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4765',
    note: 'Certifies hardware module + classical algorithms. PQC firmware v13.8.0+ is undergoing FIPS 140-3 resubmission; ACVP A7990 covers LMS.',
  },
  {
    vendorId: 'entrust-nshield',
    vendorName: 'Entrust nShield 5 — PQC firmware v13.8.0+ (resubmission)',
    certType: 'FIPS 140-3',
    certId: 'Pending',
    algorithms: [],
    status: 'Pending',
    date: '2025-09-01',
    level: 'Level 3',
    note: 'FIPS 140-3 resubmission in progress for firmware v13.8.0+. Module cert will not include PQC algorithm validation — use ACVP for PQC.',
  },
  {
    vendorId: 'utimaco',
    vendorName: 'Utimaco CryptoServer Se-Series Gen2',
    certType: 'FIPS 140-3',
    certId: '3925',
    algorithms: [],
    status: 'Active',
    date: '2021-05-10',
    level: 'Level 3',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/3925',
    note: 'Certifies hardware module + classical algorithms. FIPS 140-3 recertification pending for Q-safe v5.0. ACVP A7401 covers LMS.',
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
    note: 'Powers Azure Managed HSM backend. Module cert covers classical algorithms only.',
  },
  {
    vendorId: 'futurex-cryptohub',
    vendorName: 'Futurex EXP1000 Hardware Security Module',
    certType: 'FIPS 140-3',
    certId: '4086',
    algorithms: [],
    status: 'Active',
    date: '2021-11-30',
    level: 'Level 3',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4086',
    note: 'FIPS 140-3 for classical algorithms. No PQC ACVP validations found as of early 2026 — beta firmware PQC claims are not yet ACVP-validated.',
  },
  {
    vendorId: 'crypto4a-qxhsm',
    vendorName: 'Crypto4A QASM Cryptographic Module',
    certType: 'FIPS 140-3',
    certId: '4250',
    algorithms: [],
    status: 'Active',
    date: '2022-06-13',
    level: 'Level 3',
    certLink:
      'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/4250',
    note: 'Certifies hardware module + classical algorithms. FIPS 140-3 v5.0 (PQC firmware) resubmission in progress. ACVP A5631 covers ML-KEM, ML-DSA, SLH-DSA, and LMS.',
  },
  {
    vendorId: 'crypto4a-qxhsm',
    vendorName: 'Crypto4A QASM v5.0 — PQC firmware resubmission',
    certType: 'FIPS 140-3',
    certId: 'Pending',
    algorithms: [],
    status: 'Pending',
    date: '2024-01-01',
    level: 'Level 3',
    note: 'FIPS 140-3 v5.0 submission in progress. Module cert will not include PQC algorithm validation — use ACVP A5631 for PQC.',
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
      'ML-DSA hedged signing mode (FIPS 204 §3.5.2): rnd parameter is random, not zero. This makes the signing output non-deterministic, preventing fault attacks from producing exploitable faulty signatures. FIPS 140-3 Level 3+ HSMs also have tamper-responsive enclosures.',
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
    recertificationRequired: false,
    recertificationTimeline: 'N/A — existing FIPS 140-3 covers PQC firmware',
    notes:
      'PQC integrated into core firmware, not an external module. Luna Client must also be upgraded to 10.9.2+. Existing keys are preserved during upgrade. CBOM REST API available after upgrade.',
  },
  {
    vendorId: 'entrust-nshield',
    vendorName: 'Entrust nShield 5',
    currentFirmware: '13.6.x or earlier',
    targetFirmware: '13.8.0+',
    pqcAlgorithmsAdded: ['ML-KEM-768/1024', 'ML-DSA-44/65/87', 'SLH-DSA', 'LMS/HSS', 'XMSS'],
    upgradeComplexity: 'medium',
    estimatedDowntime: '1-2 hours per HSM',
    recertificationRequired: true,
    recertificationTimeline: 'FIPS 140-3 Level 3 resubmitted — estimated 12-18 months',
    notes:
      'PQSDK v1.2.1+ must be installed alongside firmware. CAVP validation achieved. Full FIPS 140-3 resubmission in progress. nShield as a Service receives automatic updates.',
  },
  {
    vendorId: 'utimaco',
    vendorName: 'Utimaco SecurityServer',
    currentFirmware: '4.x',
    targetFirmware: '5.0+ (Q-safe extension)',
    pqcAlgorithmsAdded: ['ML-KEM-512/768/1024', 'ML-DSA-44/65/87', 'LMS', 'XMSS'],
    upgradeComplexity: 'medium',
    estimatedDowntime: '1-3 hours per HSM (firmware + Q-safe extension)',
    recertificationRequired: true,
    recertificationTimeline:
      'Base FIPS 140-3 Level 3 cert #3925 Active (2021); Q-safe v5.0 firmware resubmission in progress (12–18 months est.)',
    notes:
      'Q-safe is a firmware extension (not a full firmware replacement). Existing keys preserved. Free PQC simulator available for pre-upgrade testing. SLH-DSA on roadmap for future extension update.',
  },
  {
    vendorId: 'aws-cloudhsm',
    vendorName: 'AWS CloudHSM',
    currentFirmware: 'Current (classical)',
    targetFirmware: 'SDK update (provider-managed)',
    pqcAlgorithmsAdded: ['ML-DSA-65 (preview)'],
    upgradeComplexity: 'low',
    estimatedDowntime: 'Zero — SDK update only',
    recertificationRequired: false,
    recertificationTimeline: 'N/A — AWS manages FIPS validation',
    notes:
      'PQC delivered via AWS-LC SDK, not HSM firmware change. Customers update SDK dependency. No downtime required. ML-DSA in preview; additional algorithms expected as AWS-LC adds support.',
  },
  {
    vendorId: 'azure-dhsm',
    vendorName: 'Azure Dedicated HSM',
    currentFirmware: 'Thales Luna 7.8.x',
    targetFirmware: 'Thales Luna 7.9.2+ (same as on-prem)',
    pqcAlgorithmsAdded: ['ML-KEM-512/768/1024', 'ML-DSA-44/65/87', 'LMS/HSS'],
    upgradeComplexity: 'low',
    estimatedDowntime: '30-60 minutes per HSM (same as Thales Luna 7)',
    recertificationRequired: false,
    recertificationTimeline: 'N/A — Thales Luna 7 FIPS cert covers PQC firmware (same as on-prem)',
    notes:
      'Azure Dedicated HSM is the same Thales Luna Network HSM 7 hardware — identical PQC capabilities and FIPS coverage once firmware is upgraded to v7.9.2+. Customer initiates the upgrade via Azure Support portal (Microsoft does not auto-upgrade dedicated HSMs). Backup/restore recommended before upgrade per Azure HSM documentation.',
  },
  {
    vendorId: 'crypto4a-qxhsm',
    vendorName: 'Crypto4A QxHSM',
    currentFirmware: 'v4.3 or earlier',
    targetFirmware: 'v4.4+ (PQC production)',
    pqcAlgorithmsAdded: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'LMS/HSS', 'XMSS', 'Classic McEliece'],
    upgradeComplexity: 'low',
    estimatedDowntime: '30-60 minutes per HSM (FPGA firmware update)',
    recertificationRequired: false,
    recertificationTimeline:
      'N/A — FIPS 140-3 Level 3 cert #4250 (Active) covers the hardware module; v5.0 FIPS 140-3 resubmission in progress for PQC firmware',
    notes:
      "FPGA-based design enables algorithm agility via firmware update — no hardware replacement needed. World's first FIPS 140-3 Level 3 validated PQC-capable HSM (cert #4250, Active). v5.0 FIPS 140-3 resubmission in progress for PQC firmware. Classic McEliece support is unique among HSM vendors.",
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
