// SPDX-License-Identifier: AGPL-3.0-only

// ── Biometric Data Types ─────────────────────────────────────────────────

export type BiometricType =
  'fingerprint' | 'iris' | 'facial-geometry' | 'voiceprint' | 'dna-snp' | 'retinal'

export type RevocabilityLevel = 'irreplaceable' | 'replaceable-with-cost' | 'easily-replaceable'

export interface BiometricDataProfile {
  id: BiometricType
  name: string
  description: string
  templateSizeBytes: number
  storageLocations: string[]
  revocability: RevocabilityLevel
  commonEncryption: string[]
  hndlSeverity: 'critical' | 'high'
  pqcRecommendation: { kem: string; signature: string; rationale: string }
}

export const BIOMETRIC_PROFILES: BiometricDataProfile[] = [
  {
    id: 'fingerprint',
    name: 'Fingerprint Template',
    description:
      'Minutiae-based representation of fingerprint ridge patterns (ISO/IEC 19794-2). Used in hospital staff authentication, patient ID, and national health registries (not sourced in the Library).',
    templateSizeBytes: 512,
    storageLocations: ['Hospital DB', 'National ID Registry', 'Smart Card', 'Cloud IAM'],
    revocability: 'irreplaceable',
    commonEncryption: ['AES-128-GCM', 'RSA-2048 wrapped', 'None (plaintext)'],
    hndlSeverity: 'critical',
    pqcRecommendation: {
      kem: 'ML-KEM-768',
      signature: 'ML-DSA-65',
      rationale:
        'A fingerprint cannot be reissued like a password, so a decrypted template stays sensitive for as long as it is kept. Whether it lets anyone authenticate depends on template protection, presentation attack detection (PAD) and a second factor. Early migration to ML-KEM-768 for storage encryption and ML-DSA-65 for enrollment authentication protects the confidentiality side.',
    },
  },
  {
    id: 'iris',
    name: 'Iris Code',
    description:
      'Binary template encoding iris texture patterns (256-byte IrisCode). Higher accuracy than fingerprints with false accept rate <1 in 1.2M.',
    templateSizeBytes: 256,
    storageLocations: ['Hospital DB', 'National ID Registry', 'Border Systems'],
    revocability: 'irreplaceable',
    commonEncryption: ['AES-256-GCM', 'ECDH P-256 wrapped'],
    hndlSeverity: 'critical',
    pqcRecommendation: {
      kem: 'ML-KEM-768',
      signature: 'ML-DSA-65',
      rationale:
        'An iris cannot be reissued, so a decrypted iris code stays sensitive for as long as it can be matched. Whether it enables impersonation depends on PAD and a second factor; NIST SP 800-63B-4 expects PAD for iris and fingerprint systems.',
    },
  },
  {
    id: 'facial-geometry',
    name: 'Facial Geometry Vector',
    description:
      'Deep learning embedding vector (128-512 dimensions) representing facial features. Used in patient check-in kiosks and access control.',
    templateSizeBytes: 2048,
    storageLocations: ['Cloud PACS', 'Hospital DB', 'Edge Device'],
    revocability: 'irreplaceable',
    commonEncryption: ['AES-128-GCM', 'TLS 1.2 in transit only', 'None (edge cache)'],
    hndlSeverity: 'critical',
    pqcRecommendation: {
      kem: 'ML-KEM-768',
      signature: 'ML-DSA-65',
      rationale:
        'A face cannot be reissued, so a decrypted embedding stays sensitive for years. Whether it can be used to impersonate someone depends on PAD, which NIST SP 800-63B-4 requires for facial recognition, and on a second factor.',
    },
  },
  {
    id: 'voiceprint',
    name: 'Voiceprint',
    description:
      'Spectral analysis of vocal characteristics (MFCC features). Used in telehealth authentication and voice-activated medical devices.',
    templateSizeBytes: 4096,
    storageLocations: ['Cloud IAM', 'Telehealth Platform', 'Hospital DB'],
    revocability: 'irreplaceable',
    commonEncryption: ['AES-128-GCM', 'RSA-2048 wrapped'],
    hndlSeverity: 'high',
    pqcRecommendation: {
      kem: 'ML-KEM-768',
      signature: 'ML-DSA-44',
      rationale:
        'A voice cannot be reissued. A decrypted voiceprint can be used in attempts to spoof voice-authenticated commands; NIST SP 800-63B-4 does not allow voice comparison for authentication, so a voiceprint should not be the only control over a medical command.',
    },
  },
  {
    id: 'dna-snp',
    name: 'DNA SNP Profile',
    description:
      'Single Nucleotide Polymorphism array (500K-5M variants). Used in pharmacogenomics, disease risk prediction, and forensic identification.',
    templateSizeBytes: 5_000_000,
    storageLocations: [
      'Genomics Lab DB',
      'Biobank',
      'Cloud Research Platform',
      'National Registry',
    ],
    revocability: 'irreplaceable',
    commonEncryption: ['AES-256-GCM', 'ECDH P-256 wrapped', 'RSA-4096 wrapped'],
    hndlSeverity: 'critical',
    pqcRecommendation: {
      kem: 'ML-KEM-1024',
      signature: 'ML-DSA-87',
      rationale:
        'DNA is immutable across a lifetime and shared with biological relatives. Compromised genomic data reveals hereditary disease risk, ethnicity, and family relationships for multiple generations. Requires highest security parameters.',
    },
  },
  {
    id: 'retinal',
    name: 'Retinal Scan',
    description:
      'Blood vessel pattern mapping of the retina. Highest biometric uniqueness (even identical twins differ) but requires specialized hardware.',
    templateSizeBytes: 384,
    storageLocations: ['Hospital DB', 'High-Security Facility', 'Government Registry'],
    revocability: 'irreplaceable',
    commonEncryption: ['AES-256-GCM', 'ECDH P-384 wrapped'],
    hndlSeverity: 'critical',
    pqcRecommendation: {
      kem: 'ML-KEM-768',
      signature: 'ML-DSA-65',
      rationale:
        'A retinal pattern cannot be reissued, so a decrypted template stays sensitive for as long as it can be matched. Whether it enables impersonation depends on PAD and a second factor.',
    },
  },
]

// ── Revocability Comparison ──────────────────────────────────────────────

export interface RevocabilityItem {
  category: string
  examples: string[]
  revocability: RevocabilityLevel
  reissueCost: string
  quantumImpact: string
}

export const REVOCABILITY_MATRIX: RevocabilityItem[] = [
  {
    category: 'Passwords & PINs',
    examples: ['Login password', 'ATM PIN', 'MFA code'],
    revocability: 'easily-replaceable',
    reissueCost: 'Minutes, zero cost',
    quantumImpact: 'Low — reset and rotate immediately',
  },
  {
    category: 'Certificates & Keys',
    examples: ['TLS certificate', 'Code signing key', 'SSH key'],
    revocability: 'replaceable-with-cost',
    reissueCost: 'Hours to days, operational disruption',
    quantumImpact: 'Medium — revoke, reissue with PQC algorithms',
  },
  {
    category: 'Government ID Numbers',
    examples: ['Social Security Number', 'National Health ID'],
    revocability: 'replaceable-with-cost',
    reissueCost: 'Weeks to months, bureaucratic process',
    quantumImpact: 'High — identity theft possible during reissue window',
  },
  {
    category: 'Biometric Data',
    examples: ['Fingerprint', 'Iris', 'DNA', 'Facial geometry', 'Retina'],
    revocability: 'irreplaceable',
    reissueCost: 'Impossible — cannot change biology',
    quantumImpact:
      'Critical — a biometric cannot be reissued, so exposed data stays sensitive; whether it enables impersonation depends on template protection, presentation attack detection and a second factor',
  },
]

// ── Patient Privacy & Data Lifecycle Types ────────────────────────────────

export type HealthcareDataCategory =
  | 'pediatric-ehr'
  | 'adult-ehr'
  | 'mental-health'
  | 'reproductive-health'
  | 'genomic'
  | 'longitudinal-research'
  | 'cancer-registry'
  | 'transplant'
  | 'substance-abuse'
  | 'disability'

export interface HealthcareDataProfile {
  id: HealthcareDataCategory
  name: string
  description: string
  trueRetentionYears: number
  stigmaFactors: string[]
  applicableRegulations: string[]
  hndlExposure: 'critical' | 'high' | 'medium'
  pqcPriority: number
}

export const HEALTHCARE_DATA_PROFILES: HealthcareDataProfile[] = [
  {
    id: 'pediatric-ehr',
    name: 'Pediatric EHR',
    description:
      'Electronic health records for minors. Most states require retention until age of majority plus statute of limitations period.',
    trueRetentionYears: 25,
    stigmaFactors: ['Developmental disorders', 'Child abuse documentation', 'Behavioral health'],
    applicableRegulations: ['HIPAA', 'COPPA', 'State pediatric record laws'],
    hndlExposure: 'critical',
    pqcPriority: 10,
  },
  {
    id: 'adult-ehr',
    name: 'Adult EHR',
    description:
      'Standard electronic health records for adult patients. Retained for continuity of care and legal defense.',
    trueRetentionYears: 10,
    stigmaFactors: ['Chronic conditions', 'Surgery history'],
    applicableRegulations: ['HIPAA', 'HITECH', 'State retention laws'],
    hndlExposure: 'high',
    pqcPriority: 7,
  },
  {
    id: 'mental-health',
    name: 'Mental Health Records',
    description:
      'Psychotherapy notes, psychiatric evaluations, and treatment plans. Subject to heightened privacy protections under HIPAA.',
    trueRetentionYears: 50,
    stigmaFactors: [
      'Psychiatric diagnosis',
      'Suicidal ideation',
      'Court-ordered treatment',
      'Involuntary commitment',
    ],
    applicableRegulations: ['HIPAA psychotherapy notes provision', 'State mental health laws'],
    hndlExposure: 'critical',
    pqcPriority: 10,
  },
  {
    id: 'reproductive-health',
    name: 'Reproductive Health Records',
    description:
      'Fertility treatment, pregnancy records, contraceptive history, and family planning data.',
    trueRetentionYears: 30,
    stigmaFactors: [
      'Pregnancy termination',
      'Fertility treatment',
      'Genetic testing outcomes',
      'STI history',
    ],
    applicableRegulations: ['HIPAA', 'State reproductive privacy laws', 'GINA'],
    hndlExposure: 'critical',
    pqcPriority: 9,
  },
  {
    id: 'genomic',
    name: 'Genomic / Pharmacogenomic Data',
    description:
      'DNA sequencing, SNP arrays, and pharmacogenomic profiles. Immutable data relevant across generations.',
    trueRetentionYears: 100,
    stigmaFactors: [
      'Hereditary disease risk',
      'Ancestry/ethnicity',
      'Predisposition to addiction',
      'Carrier status',
    ],
    applicableRegulations: ['HIPAA', 'GINA', 'GDPR Art. 9', 'State genetic privacy laws'],
    hndlExposure: 'critical',
    pqcPriority: 10,
  },
  {
    id: 'longitudinal-research',
    name: 'Longitudinal Research Studies',
    description:
      'Multi-decade cohort studies tracking disease progression, drug efficacy, and population health outcomes.',
    trueRetentionYears: 50,
    stigmaFactors: ['Research subject identity', 'Experimental treatment outcomes'],
    applicableRegulations: ['HIPAA', 'Common Rule (45 CFR 46)', 'IRB requirements'],
    hndlExposure: 'high',
    pqcPriority: 8,
  },
  {
    id: 'cancer-registry',
    name: 'Cancer Registry',
    description:
      'Population-based cancer surveillance data mandated by federal and state law. Used for epidemiology and treatment effectiveness research.',
    trueRetentionYears: 75,
    stigmaFactors: ['Cancer diagnosis', 'Treatment outcomes', 'Survival data'],
    applicableRegulations: ['HIPAA', 'National Cancer Act', 'State cancer reporting laws'],
    hndlExposure: 'high',
    pqcPriority: 7,
  },
  {
    id: 'transplant',
    name: 'Transplant Records',
    description:
      'Organ/tissue donor and recipient data, crossmatch results, and long-term follow-up. Critical for donor matching and immunosuppression management.',
    trueRetentionYears: 40,
    stigmaFactors: ['Donor identity', 'Rejection episodes', 'Compliance data'],
    applicableRegulations: ['HIPAA', 'NOTA (National Organ Transplant Act)', 'UNOS policies'],
    hndlExposure: 'high',
    pqcPriority: 7,
  },
  {
    id: 'substance-abuse',
    name: 'Substance Abuse Records',
    description:
      'Treatment records for alcohol and drug use disorders. Subject to stricter federal protections than standard health records.',
    trueRetentionYears: 30,
    stigmaFactors: [
      'Substance type',
      'Relapse history',
      'Criminal justice involvement',
      'Employment impact',
    ],
    applicableRegulations: ['42 CFR Part 2', 'HIPAA', 'State substance abuse laws'],
    hndlExposure: 'critical',
    pqcPriority: 9,
  },
  {
    id: 'disability',
    name: 'Disability Records',
    description:
      'Physical and cognitive disability assessments, accommodations history, and long-term care plans.',
    trueRetentionYears: 40,
    stigmaFactors: ['Disability type', 'Functional limitations', 'Workplace accommodations'],
    applicableRegulations: ['HIPAA', 'ADA', 'State disability laws'],
    hndlExposure: 'high',
    pqcPriority: 6,
  },
]

// ── Medical Device Types ─────────────────────────────────────────────────

export type DeviceClass = 'I' | 'II' | 'III'

export type CommunicationProtocol =
  'bluetooth-le' | 'wifi' | 'zigbee' | 'wired-ethernet' | 'proprietary-rf' | 'nfc'

export type AttackVector =
  | 'firmware-forgery'
  | 'command-injection'
  | 'data-exfiltration'
  | 'denial-of-service'
  | 'replay-attack'

export type PatientImpact = 'nuisance' | 'injury' | 'life-threatening' | 'fatal'

/**
 * Each scenario describes a hypothetical device and names the cryptographic
 * primitive a quantum algorithm would have to break, plus the prerequisites.
 * Ordinary failures that need no broken primitive (replay or denial of service
 * against a protocol that is otherwise intact, a weak proprietary
 * authentication scheme) are not listed here, because neither Shor's nor
 * Grover's algorithm causes them. The real pacemaker advisory is described
 * separately in the lesson text.
 */
export interface DeviceAttackScenario {
  vector: AttackVector
  vectorLabel: string
  patientImpact: PatientImpact
  quantumMechanism: 'Shor' | 'Grover'
  currentDefense: string
  attackDescription: string
}

export interface PQCFeasibility {
  algorithm: string
  feasible: boolean
  rationale: string
}

export interface MedicalDeviceProfile {
  id: string
  name: string
  category: string
  fdaClass: DeviceClass
  communicationProtocol: CommunicationProtocol
  protocolLabel: string
  currentCrypto: string
  firmwareUpdateMethod: 'ota' | 'clinic-only' | 'manufacturer-only'
  cpuProfile: string
  ramKB: number
  flashMB: number
  deviceLifetimeYears: number
  attackScenarios: DeviceAttackScenario[]
  pqcFeasibility: PQCFeasibility[]
}

export const MEDICAL_DEVICE_CATALOG: MedicalDeviceProfile[] = [
  {
    id: 'pacemaker',
    name: 'Cardiac Pacemaker (CIED)',
    category: 'Cardiac Implantable Electronic Devices',
    fdaClass: 'III',
    communicationProtocol: 'proprietary-rf',
    protocolLabel: 'Proprietary RF (MICS band)',
    currentCrypto: 'Proprietary symmetric (vendor-specific)',
    firmwareUpdateMethod: 'clinic-only',
    cpuProfile: 'Cortex-M0+',
    ramKB: 32,
    flashMB: 0.256,
    deviceLifetimeYears: 12,
    attackScenarios: [
      {
        vector: 'firmware-forgery',
        vectorLabel: 'Firmware Forgery (hypothetical device)',
        patientImpact: 'fatal',
        quantumMechanism: 'Shor',
        currentDefense: 'ECDSA P-256 firmware signature (assumed for this hypothetical device)',
        attackDescription:
          "Hypothetical device that installs any firmware image carrying a valid ECDSA P-256 signature. Primitive: ECDSA over P-256. Prerequisites: a quantum computer able to run Shor's algorithm recovers the signing private key from the public key, and the attacker can present the forged image during a clinic programming session. A device that also requires a post-quantum signature does not have this dependency.",
      },
      {
        vector: 'data-exfiltration',
        vectorLabel: 'Data Exfiltration (hypothetical device)',
        patientImpact: 'nuisance',
        quantumMechanism: 'Grover',
        currentDefense: 'AES-CCM-128 encrypted telemetry (assumed for this hypothetical device)',
        attackDescription:
          "Hypothetical device whose interrogation telemetry is protected by AES-CCM-128. Primitive: AES-128 key search. Prerequisites: the attacker recorded the telemetry and has a quantum computer able to run Grover's algorithm at very large scale. Grover's algorithm gives only a quadratic speed-up and is hard to parallelise; NIST's PQC FAQ judges it quite likely to give little or no advantage against AES-128. This is the weakest quantum path listed here. The harm is a privacy breach with no immediate physical harm.",
      },
    ],
    pqcFeasibility: [
      {
        algorithm: 'ML-DSA-44',
        feasible: false,
        rationale:
          "This module's model assumes a portable ML-DSA-44 verifier whose working memory exceeds the 32 KB available on this hypothetical Cortex-M0+ build (a planning assumption, not a measurement). The outcome depends on the implementation chosen: pqm4 measured 36,308 B of verify stack for its portable ('clean') ML-DSA-44 and 2,712 B for its stack-optimised build, both on a Cortex-M4F (stack only; key and signature buffers excluded; not measured on a Cortex-M0+).",
      },
      {
        algorithm: 'LMS (H5/W8)',
        feasible: true,
        rationale:
          "This module's model assumes hash-based signature verification needs only a few KB of RAM (a planning assumption, not a measurement). The device only verifies. The signer's state is a separate matter: an LMS tree of height 5 holds 2^5 = 32 one-time keys (RFC 8554), so the signing system can issue at most 32 signatures per key pair, and NIST SP 800-208 states that the signer needs to ensure that no individual one-time key is ever used to sign more than one message.",
      },
      {
        algorithm: 'XMSS (H10)',
        feasible: true,
        rationale:
          "This module's model assumes verification needs a few KB of RAM, similar to LMS (a planning assumption, not a measurement). The device only verifies. State management is handled by the signing system, not the device: the signer must update its stored state before it exports each signature, so that a crash or power loss cannot lead to a one-time key being used twice (NIST SP 800-208). A firmware version counter that refuses older images (anti-rollback) is a different mechanism that a device may keep in addition.",
      },
      {
        algorithm: 'FN-DSA',
        feasible: true,
        rationale:
          "In a firmware update the pacemaker only verifies; the manufacturer's signing system signs. FN-DSA (Falcon) signing needs floating-point arithmetic, which the Falcon specification names as a limitation for devices without an FPU, but that cost falls on the signer. Verification uses integer arithmetic modulo q = 12289, with a 897 B public key and a 666 B signature for Falcon-512. Modelled from pqm4 measurements of its provisional FN-DSA-512 code on a Cortex-M4F (not measured on this Cortex-M0+, so the device-side time is unknown here): about 0.4 million cycles and 2,976 B of stack to verify, against about 22.5 million cycles and 41,952 B of stack to sign. The feasible flag is a modelled outcome for this hypothetical build; confirm it with a measurement on the target core.",
      },
    ],
  },
  {
    id: 'insulin-pump',
    name: 'Insulin Delivery System',
    category: 'Insulin Delivery Systems',
    fdaClass: 'III',
    communicationProtocol: 'bluetooth-le',
    protocolLabel: 'Bluetooth Low Energy 5.0',
    currentCrypto: 'AES-CCM-128 (BLE standard)',
    firmwareUpdateMethod: 'ota',
    cpuProfile: 'Cortex-M4',
    ramKB: 256,
    flashMB: 1,
    deviceLifetimeYears: 7,
    attackScenarios: [
      {
        vector: 'command-injection',
        vectorLabel: 'Command Injection (hypothetical device)',
        patientImpact: 'fatal',
        quantumMechanism: 'Shor',
        currentDefense: 'BLE pairing with ECDH P-256 (assumed LE Secure Connections)',
        attackDescription:
          "Hypothetical pump whose link key comes from a BLE LE Secure Connections pairing (ECDH on P-256). Primitive: elliptic-curve Diffie-Hellman. Prerequisites: the attacker recorded the pairing exchange, later has a quantum computer able to run Shor's algorithm on P-256 to recover the key agreed during pairing, and is within radio range while the pump still uses that bond; only then could forged commands such as a lethal insulin bolus be sent. Pairing without man-in-the-middle protection (Just Works) is a separate, classical weakness that needs no quantum computer.",
      },
    ],
    pqcFeasibility: [
      {
        algorithm: 'ML-KEM-512',
        feasible: true,
        rationale:
          'BLE pairing can use ML-KEM-512 for key exchange. Cortex-M4 has sufficient RAM (256 KB) and compute (not sourced in the Library).',
      },
      {
        algorithm: 'ML-DSA-44',
        feasible: true,
        rationale:
          "This module's model assumes a Cortex-M4 with 256 KB RAM can handle ML-DSA-44 signature verification for firmware updates.",
      },
    ],
  },
  {
    id: 'infusion-pump',
    name: 'IV Infusion Pump',
    category: 'Infusion Pumps',
    fdaClass: 'II',
    communicationProtocol: 'wifi',
    protocolLabel: 'Wi-Fi 802.11ac',
    currentCrypto: 'TLS 1.2 (RSA-2048)',
    firmwareUpdateMethod: 'ota',
    cpuProfile: 'Cortex-A7',
    ramKB: 512_000,
    flashMB: 256,
    deviceLifetimeYears: 10,
    attackScenarios: [
      {
        vector: 'command-injection',
        vectorLabel: 'Drug Library Manipulation (hypothetical device)',
        patientImpact: 'life-threatening',
        quantumMechanism: 'Shor',
        currentDefense: 'TLS 1.2 with RSA-2048 (assumed for this hypothetical device)',
        attackDescription:
          "Hypothetical pump that accepts a drug library from any server presenting a valid RSA-2048 certificate over TLS 1.2, with no pinned server key and no separate signature on the library. Primitive: RSA-2048. Prerequisites: the attacker is on the network path and has a quantum computer able to run Shor's algorithm to recover the server's private key, so it can impersonate the server and change drug concentration limits, allowing dangerous over- or under-dosing.",
      },
    ],
    pqcFeasibility: [
      {
        algorithm: 'ML-KEM-768',
        feasible: true,
        rationale:
          "This module's model assumes a Cortex-A7 with 512 MB RAM has ample memory for an ML-KEM-768 TLS handshake (an estimate, not a benchmark).",
      },
      {
        algorithm: 'ML-DSA-65',
        feasible: true,
        rationale: 'Full PQC TLS 1.3 support feasible. Primary barrier is vendor firmware update.',
      },
    ],
  },
  {
    id: 'ventilator',
    name: 'ICU Ventilator',
    category: 'Ventilators',
    fdaClass: 'II',
    communicationProtocol: 'wired-ethernet',
    protocolLabel: 'Wired Ethernet (HL7)',
    currentCrypto: 'TLS 1.2 (ECDH P-256)',
    firmwareUpdateMethod: 'manufacturer-only',
    cpuProfile: 'Cortex-A53',
    ramKB: 1_024_000,
    flashMB: 512,
    deviceLifetimeYears: 15,
    attackScenarios: [
      {
        vector: 'firmware-forgery',
        vectorLabel: 'Firmware Forgery (hypothetical device)',
        patientImpact: 'fatal',
        quantumMechanism: 'Shor',
        currentDefense: 'ECDSA P-256 code signing (assumed for this hypothetical device)',
        attackDescription:
          "Hypothetical ventilator that accepts firmware carrying a valid ECDSA P-256 code-signing signature. Primitive: ECDSA over P-256. Prerequisites: a quantum computer able to run Shor's algorithm recovers the signing private key, and the forged image reaches the device through the manufacturer's update path. Forged firmware could alter ventilator pressure/volume settings, causing barotrauma or oxygen deprivation.",
      },
      {
        vector: 'data-exfiltration',
        vectorLabel: 'Patient Data Exfiltration (hypothetical device)',
        patientImpact: 'nuisance',
        quantumMechanism: 'Shor',
        currentDefense: 'TLS 1.2 channel encryption with ECDH P-256 (assumed)',
        attackDescription:
          "Hypothetical ventilator that sends HL7 messages over TLS 1.2 with an ECDH P-256 key exchange. Primitive: elliptic-curve Diffie-Hellman. Prerequisites: the attacker recorded the traffic and later has a quantum computer able to run Shor's algorithm to recover the session keys from the recorded handshakes. The recovered HL7 messages reveal patient vitals, ventilator mode, and treatment parameters.",
      },
    ],
    pqcFeasibility: [
      {
        algorithm: 'ML-KEM-768',
        feasible: true,
        rationale:
          "This module's model assumes no resource constraints on Cortex-A53, so full ML-KEM-768 + ML-DSA-65 is supported (an estimate, not a benchmark).",
      },
      {
        algorithm: 'ML-DSA-65',
        feasible: true,
        rationale:
          'Firmware signing migration to ML-DSA-65 is straightforward. Main barrier: manufacturer update cycle (15-year device lifetime).',
      },
    ],
  },
  {
    id: 'surgical-robot',
    name: 'Surgical Robot',
    category: 'Surgical Robotics',
    fdaClass: 'III',
    communicationProtocol: 'wired-ethernet',
    protocolLabel: 'Dedicated Ethernet + Fiber',
    currentCrypto: 'TLS 1.3 (ECDH X25519)',
    firmwareUpdateMethod: 'manufacturer-only',
    cpuProfile: 'x86-64 (Multi-core)',
    ramKB: 16_000_000,
    flashMB: 32_000,
    deviceLifetimeYears: 10,
    attackScenarios: [
      {
        vector: 'command-injection',
        vectorLabel: 'Instrument Command Hijack (hypothetical device)',
        patientImpact: 'fatal',
        quantumMechanism: 'Shor',
        currentDefense:
          'TLS 1.3 + mutual authentication with classical certificates (assumed for this hypothetical device)',
        attackDescription:
          'Hypothetical robot whose console-to-arm link uses TLS 1.3 with mutual authentication by classical certificates. Primitive: the certificate signature algorithm (for example RSA or ECDSA). Prerequisites: the attacker is on the link and has a quantum computer fast enough to recover a certificate private key during the procedure, so that it is accepted as the console and can inject instrument movement commands. A quantum attack that only decrypts recorded traffic would reveal data after the fact but would not by itself inject commands into a live procedure.',
      },
    ],
    pqcFeasibility: [
      {
        algorithm: 'ML-KEM-1024',
        feasible: true,
        rationale:
          'x86 platform with ample resources. Can run ML-KEM-1024 + ML-DSA-87 without performance impact.',
      },
      {
        algorithm: 'ML-DSA-87',
        feasible: true,
        rationale:
          "Highest security parameters recommended due to life-critical nature; this module's model assumes no resource constraints.",
      },
    ],
  },
  {
    id: 'imaging-system',
    name: 'MRI / CT Imaging System',
    category: 'Medical Imaging',
    fdaClass: 'II',
    communicationProtocol: 'wired-ethernet',
    protocolLabel: 'DICOM over TLS',
    currentCrypto: 'TLS 1.2 (RSA-2048)',
    firmwareUpdateMethod: 'manufacturer-only',
    cpuProfile: 'x86-64 (Workstation)',
    ramKB: 32_000_000,
    flashMB: 1_000_000,
    deviceLifetimeYears: 20,
    attackScenarios: [
      {
        vector: 'data-exfiltration',
        vectorLabel: 'DICOM Image Interception (hypothetical device)',
        patientImpact: 'nuisance',
        quantumMechanism: 'Shor',
        currentDefense: 'DICOM TLS (RSA-2048) (assumed for this hypothetical device)',
        attackDescription:
          "Hypothetical imaging system that sends DICOM over TLS 1.2 with RSA-2048. Primitive: the RSA or Diffie-Hellman key exchange that protects the session keys. Prerequisites: the attacker recorded the sessions and later has a quantum computer able to run Shor's algorithm to recover those keys. The images then reveal diagnoses (tumors, fractures) and patient identity embedded in DICOM metadata.",
      },
      {
        vector: 'firmware-forgery',
        vectorLabel: 'Calibration Manipulation (hypothetical device)',
        patientImpact: 'injury',
        quantumMechanism: 'Shor',
        currentDefense: 'Vendor code signing (RSA or ECDSA assumed for this hypothetical device)',
        attackDescription:
          "Hypothetical imaging system whose calibration firmware is accepted on a classical vendor signature (RSA or ECDSA). Primitive: that signature algorithm. Prerequisites: a quantum computer able to run Shor's algorithm recovers the vendor's signing key, and the forged package reaches the system through the vendor's update path. Forged calibration firmware could cause incorrect imaging parameters, leading to misdiagnosis or excessive radiation (CT).",
      },
    ],
    pqcFeasibility: [
      {
        algorithm: 'ML-KEM-768',
        feasible: true,
        rationale:
          'Workstation-class hardware. Full PQC TLS support feasible. Primary challenge: 20-year device lifecycle and DICOM interoperability.',
      },
      {
        algorithm: 'ML-DSA-65',
        feasible: true,
        rationale:
          'Firmware signing migration straightforward. Legacy DICOM archives remain on classical crypto until re-encrypted.',
      },
    ],
  },
]

// ── Hospital Network Migration Types ─────────────────────────────────────

export type HospitalLayer =
  | 'patient-portal'
  | 'clinical-workstations'
  | 'medical-imaging'
  | 'lab-systems'
  | 'pharmacy'
  | 'medical-devices'
  | 'research-genomics'

export interface HospitalLayerConfig {
  id: HospitalLayer
  level: number
  name: string
  description: string
  typicalEndpoints: number
  dataSensitivity: 'medium' | 'high' | 'critical'
  internetFacing: boolean
  defaultCrypto: string
  pqcPriority: 'critical' | 'high' | 'medium' | 'low'
  estimatedCostPerEndpoint: number
  vendorReadiness: 'available' | 'preview' | 'planned' | 'none'
  complianceRequirements: string[]
  interopProtocols: string[]
}

export const HOSPITAL_LAYERS: HospitalLayerConfig[] = [
  {
    id: 'patient-portal',
    level: 1,
    name: 'Patient Portal & Telehealth',
    description:
      'Patient-facing web/mobile applications for scheduling, messaging, video visits, and health record access.',
    typicalEndpoints: 50,
    dataSensitivity: 'high',
    internetFacing: true,
    defaultCrypto: 'TLS 1.2 (RSA-2048)',
    pqcPriority: 'critical',
    estimatedCostPerEndpoint: 5000,
    vendorReadiness: 'available',
    complianceRequirements: ['HIPAA', 'HITECH', 'ADA Section 508'],
    interopProtocols: ['FHIR R4', 'OAuth 2.0', 'SMART on FHIR'],
  },
  {
    id: 'clinical-workstations',
    level: 2,
    name: 'Clinical Workstations & EHR',
    description:
      'Physician/nurse workstations running EHR software (Epic, Cerner, MEDITECH). Internal network but with cloud EHR connectivity.',
    typicalEndpoints: 500,
    dataSensitivity: 'critical',
    internetFacing: false,
    defaultCrypto: 'TLS 1.2 (ECDH P-256)',
    pqcPriority: 'high',
    estimatedCostPerEndpoint: 2000,
    vendorReadiness: 'planned',
    complianceRequirements: ['HIPAA', 'Joint Commission', 'CMS CoP'],
    interopProtocols: ['HL7 v2', 'FHIR R4', 'CDA'],
  },
  {
    id: 'medical-imaging',
    level: 3,
    name: 'Medical Imaging (PACS/DICOM)',
    description:
      'Imaging acquisition, storage (PACS), and distribution. Long-term archive of CT, MRI, X-ray, ultrasound images.',
    typicalEndpoints: 100,
    dataSensitivity: 'high',
    internetFacing: false,
    defaultCrypto: 'DICOM TLS (RSA-2048)',
    pqcPriority: 'high',
    estimatedCostPerEndpoint: 15000,
    vendorReadiness: 'none',
    complianceRequirements: ['HIPAA', 'FDA 21 CFR Part 11', 'IHE profiles'],
    interopProtocols: ['DICOM', 'DICOMweb', 'HL7 v2 (ORM/ORU)'],
  },
  {
    id: 'lab-systems',
    level: 4,
    name: 'Laboratory Information Systems',
    description:
      'LIS/LIMS managing lab orders, results, instruments, and quality control. Interfaces with EHR and reference labs.',
    typicalEndpoints: 80,
    dataSensitivity: 'high',
    internetFacing: false,
    defaultCrypto: 'TLS 1.2 (RSA-2048)',
    pqcPriority: 'medium',
    estimatedCostPerEndpoint: 8000,
    vendorReadiness: 'planned',
    complianceRequirements: ['HIPAA', 'CLIA', 'CAP accreditation'],
    interopProtocols: ['HL7 v2 (ORM/ORU)', 'ASTM E1394', 'FHIR DiagnosticReport'],
  },
  {
    id: 'pharmacy',
    level: 5,
    name: 'Pharmacy Systems',
    description:
      'Medication dispensing, drug interaction checking, controlled substance tracking (DEA), and e-prescribing.',
    typicalEndpoints: 60,
    dataSensitivity: 'high',
    internetFacing: false,
    defaultCrypto: 'TLS 1.2 (RSA-2048)',
    pqcPriority: 'medium',
    estimatedCostPerEndpoint: 6000,
    vendorReadiness: 'planned',
    complianceRequirements: ['HIPAA', 'DEA EPCS', 'State pharmacy board'],
    interopProtocols: ['NCPDP SCRIPT', 'HL7 v2 (RDE/RDS)', 'FHIR MedicationRequest'],
  },
  {
    id: 'medical-devices',
    level: 6,
    name: 'Medical Devices & IoMT',
    description:
      'Connected medical devices: patient monitors, infusion pumps, ventilators, wearables. Diverse protocols and constrained hardware.',
    typicalEndpoints: 2000,
    dataSensitivity: 'critical',
    internetFacing: false,
    defaultCrypto: 'Mixed (BLE AES-CCM / TLS 1.2 / None)',
    pqcPriority: 'critical',
    estimatedCostPerEndpoint: 500,
    vendorReadiness: 'none',
    complianceRequirements: ['HIPAA', 'FDA premarket cybersecurity', 'IEC 80001'],
    interopProtocols: ['IEEE 11073', 'Bluetooth LE', 'Wi-Fi', 'HL7 v2 (ADT)'],
  },
  {
    id: 'research-genomics',
    level: 7,
    name: 'Research & Genomics Infrastructure',
    description:
      'Biobanks, genomic sequencing pipelines, clinical research databases, and data sharing with external collaborators.',
    typicalEndpoints: 30,
    dataSensitivity: 'critical',
    internetFacing: true,
    defaultCrypto: 'TLS 1.3 (ECDH X25519)',
    pqcPriority: 'critical',
    estimatedCostPerEndpoint: 25000,
    vendorReadiness: 'preview',
    complianceRequirements: ['HIPAA', 'GINA', 'Common Rule', 'NIH data sharing policy'],
    interopProtocols: ['GA4GH', 'FHIR Genomics', 'VCF', 'CRAM/BAM'],
  },
]

export interface ComplianceMilestone {
  id: string
  name: string
  authority: string
  year: number
  quarter: string
  description: string
  affectedLayers: HospitalLayer[]
  pqcRelevance: 'direct' | 'indirect' | 'informational'
}

export const COMPLIANCE_MILESTONES: ComplianceMilestone[] = [
  {
    id: 'fda-premarket-2023',
    name: 'FDA Premarket Cybersecurity Guidance',
    authority: 'FDA',
    year: 2023,
    quarter: 'Q3',
    description:
      'First issued September 2023; the current edition is dated 3 February 2026. A nonbinding guidance that recommends cryptography expected to stay strong throughout the device service life; the Software Bill of Materials duty for cyber devices comes from section 524B of the FD&C Act. Devices with 10-20 year lifecycles deploying now will operate into the CRQC era.',
    affectedLayers: ['medical-devices'],
    pqcRelevance: 'direct',
  },
  {
    id: 'fda-21-cfr-part-11',
    name: 'FDA 21 CFR Part 11',
    authority: 'FDA',
    year: 2026,
    quarter: 'Ongoing',
    description:
      'Electronic records and signatures in FDA-regulated industries. Signature integrity requirements applicable to PQC migration for regulated medical software.',
    affectedLayers: ['clinical-workstations', 'medical-imaging', 'lab-systems', 'pharmacy'],
    pqcRelevance: 'indirect',
  },
  {
    id: 'hipaa-hitech-ongoing',
    name: 'HIPAA & HITECH Act',
    authority: 'HHS OCR',
    year: 2026,
    quarter: 'Ongoing',
    description:
      'The Security Rule sets no post-quantum date, but healthcare data has long sensitivity periods making HNDL risk significant for long-lived ePHI. The Security Rule treats encryption of ePHI as an addressable specification.',
    affectedLayers: [
      'patient-portal',
      'clinical-workstations',
      'medical-imaging',
      'lab-systems',
      'pharmacy',
      'research-genomics',
    ],
    pqcRelevance: 'informational',
  },
  {
    id: 'nist-ir-8547',
    name: 'NIST IR 8547 Transition Guidance',
    authority: 'NIST',
    year: 2030,
    quarter: 'Q1',
    description:
      'Transition guidance: NIST will deprecate quantum-vulnerable public-key cryptography after 2030 and disallow its use under NIST standards and guidelines after 2035.',
    affectedLayers: [
      'patient-portal',
      'clinical-workstations',
      'medical-imaging',
      'lab-systems',
      'pharmacy',
      'medical-devices',
      'research-genomics',
    ],
    pqcRelevance: 'direct',
  },
]

// ── UI Helper Constants ──────────────────────────────────────────────────

export const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-status-error/20 text-status-error border-status-error/50',
  high: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  medium: 'bg-primary/20 text-primary border-primary/50',
  low: 'bg-muted text-muted-foreground border-border',
}

export const REVOCABILITY_COLORS: Record<RevocabilityLevel, string> = {
  irreplaceable: 'bg-status-error/20 text-status-error',
  'replaceable-with-cost': 'bg-status-warning/20 text-status-warning',
  'easily-replaceable': 'bg-status-success/20 text-status-success',
}

export const PATIENT_IMPACT_COLORS: Record<PatientImpact, string> = {
  fatal: 'bg-status-error/20 text-status-error border-status-error/50',
  'life-threatening': 'bg-status-error/10 text-status-error border-status-error/30',
  injury: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  nuisance: 'bg-muted text-muted-foreground border-border',
}

export const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-status-error/20 text-status-error border-status-error/50',
  high: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  medium: 'bg-status-info/20 text-status-info border-status-info/50',
  low: 'bg-muted text-muted-foreground border-border',
}

// ── Calculation Helpers ──────────────────────────────────────────────────

export function computeCrqcProbability(year: number, crqcYear: number): number {
  if (year <= crqcYear) return 1
  const diff = year - crqcYear
  return Math.max(0, 1 - diff * 0.15)
}

export function scoreMigrationPriority(layer: HospitalLayerConfig): number {
  const sensitivityScore = { critical: 3, high: 2, medium: 1 }[layer.dataSensitivity]
  const internetScore = layer.internetFacing ? 3 : 1
  const vendorScore = { available: 1, preview: 2, planned: 3, none: 4 }[layer.vendorReadiness]
  return sensitivityScore * 2 + internetScore * 2 + vendorScore
}
