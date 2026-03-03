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
  algorithms: string[]
  status: 'Active' | 'Pending' | 'Planned'
  date: string
  level?: string
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
    id: 'ckm-ecdsa',
    name: 'CKM_ECDSA',
    type: 'classical',
    mechanismCode: '0x00001041',
    description: 'ECDSA sign/verify operations',
    keySize: '256-384 bits',
    pkcs11Version: 'v2.40+',
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
    description: 'Pre-hash ML-DSA sign/verify (HashML-DSA with context)',
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
    description: 'SLH-DSA sign/verify via C_Sign/C_Verify',
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
  {
    vendorId: 'thales-luna',
    vendorName: 'Thales Luna K7',
    certType: 'ACVP',
    certId: 'A7358',
    algorithms: ['ML-KEM', 'ML-DSA', 'LMS'],
    status: 'Active',
    date: '2025-09-02',
  },
  {
    vendorId: 'thales-luna',
    vendorName: 'Thales Luna T7 Firmware',
    certType: 'ACVP',
    certId: 'A7879',
    algorithms: ['ML-KEM', 'ML-DSA', 'LMS'],
    status: 'Active',
    date: '2026-01-16',
  },
  {
    vendorId: 'entrust-nshield',
    vendorName: 'Entrust nShield PQSDK',
    certType: 'ACVP',
    certId: 'A7990',
    algorithms: ['LMS'],
    status: 'Active',
    date: '2026-01-30',
  },
  {
    vendorId: 'utimaco',
    vendorName: 'Utimaco ESKM/SecurityServer',
    certType: 'ACVP',
    certId: 'A7401',
    algorithms: ['LMS'],
    status: 'Active',
    date: '2025-09-17',
  },
  {
    vendorId: 'aws-cloudhsm',
    vendorName: 'AWS-LC (CloudHSM backend)',
    certType: 'ACVP',
    certId: 'A7917',
    algorithms: ['ML-KEM', 'ML-DSA'],
    status: 'Active',
    date: '2026-01-21',
  },
  {
    vendorId: 'entrust-nshield',
    vendorName: 'Entrust nShield 5',
    certType: 'FIPS 140-3',
    certId: 'Submitted',
    algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA'],
    status: 'Pending',
    date: '2025-09-01',
    level: 'Level 3',
  },
  {
    vendorId: 'thales-luna',
    vendorName: 'Thales Luna 7',
    certType: 'FIPS 140-3',
    certId: 'Active',
    algorithms: ['ML-KEM', 'ML-DSA', 'LMS'],
    status: 'Active',
    date: '2025-01-01',
    level: 'Level 3',
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
    recertificationTimeline: 'FIPS 140-3 pending — Level 4 recertification (18-24 months)',
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
    targetFirmware: 'Thales Luna 7.9.2+ (customer-requested)',
    pqcAlgorithmsAdded: ['ML-KEM', 'ML-DSA', 'LMS/HSS'],
    upgradeComplexity: 'high',
    estimatedDowntime: '2-4 hours (coordinated with Azure support)',
    recertificationRequired: false,
    recertificationTimeline: 'N/A — Thales covers FIPS validation',
    notes:
      'Customer must request firmware upgrade through Azure support. Azure does not auto-upgrade dedicated HSMs. Backup/restore required before upgrade. Azure Managed HSM (Marvell LS2 backend) has a separate PQC roadmap.',
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
