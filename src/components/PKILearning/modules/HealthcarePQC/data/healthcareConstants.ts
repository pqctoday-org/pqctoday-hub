// SPDX-License-Identifier: GPL-3.0-only

// ── Biometric Data Types ─────────────────────────────────────────────────

export type BiometricType =
  | 'fingerprint'
  | 'iris'
  | 'facial-geometry'
  | 'voiceprint'
  | 'dna-snp'
  | 'retinal'

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
      'Minutiae-based representation of fingerprint ridge patterns (ISO/IEC 19794-2). Used in hospital staff authentication, patient ID, and national health registries.',
    templateSizeBytes: 512,
    storageLocations: ['Hospital DB', 'National ID Registry', 'Smart Card', 'Cloud IAM'],
    revocability: 'irreplaceable',
    commonEncryption: ['AES-128-GCM', 'RSA-2048 wrapped', 'None (plaintext)'],
    hndlSeverity: 'critical',
    pqcRecommendation: {
      kem: 'ML-KEM-768',
      signature: 'ML-DSA-65',
      rationale:
        'Fingerprint templates are permanently compromised once decrypted. Immediate migration to ML-KEM-768 for storage encryption and ML-DSA-65 for enrollment authentication.',
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
        'Iris patterns are stable from age 2 through death. Once decrypted, an iris code enables identity theft for the lifetime of the individual and cannot be reissued.',
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
        'Facial geometry changes slowly over decades. A quantum-decrypted embedding can be used for deepfake generation and identity impersonation long after the breach.',
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
        'Voice patterns change gradually with age but remain matchable for 20+ years. Compromised voiceprints enable spoofing of voice-authenticated medical commands.',
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
        'Retinal vessel patterns are unique, stable from birth, and cannot be surgically altered. Any compromise is permanent.',
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
    quantumImpact: 'Critical — permanent compromise, no remediation',
  },
]

// ── Pharmaceutical IP Types ──────────────────────────────────────────────

export type DrugPhase =
  | 'discovery'
  | 'preclinical'
  | 'phase-1'
  | 'phase-2'
  | 'phase-3'
  | 'fda-review'
  | 'post-market'

export interface PharmaPhaseConfig {
  id: DrugPhase
  label: string
  avgYearsToExpiry: number
  typicalDataTypes: string[]
  sensitivity: 'high' | 'critical'
}

export const PHARMA_PHASE_CONFIGS: PharmaPhaseConfig[] = [
  {
    id: 'discovery',
    label: 'Discovery',
    avgYearsToExpiry: 20,
    typicalDataTypes: ['Molecular structure', 'Target identification', 'In-silico models'],
    sensitivity: 'critical',
  },
  {
    id: 'preclinical',
    label: 'Preclinical',
    avgYearsToExpiry: 18,
    typicalDataTypes: ['Animal study data', 'Toxicology', 'Formulation', 'Manufacturing process'],
    sensitivity: 'critical',
  },
  {
    id: 'phase-1',
    label: 'Phase I Trial',
    avgYearsToExpiry: 15,
    typicalDataTypes: ['Safety data', 'Dosing', 'Pharmacokinetics', 'Patient records'],
    sensitivity: 'critical',
  },
  {
    id: 'phase-2',
    label: 'Phase II Trial',
    avgYearsToExpiry: 12,
    typicalDataTypes: ['Efficacy data', 'Patient outcomes', 'Biomarkers', 'Protocol design'],
    sensitivity: 'critical',
  },
  {
    id: 'phase-3',
    label: 'Phase III Trial',
    avgYearsToExpiry: 8,
    typicalDataTypes: [
      'Large-scale trial data',
      'Statistical analysis',
      'Manufacturing scale-up',
      'Regulatory submission drafts',
    ],
    sensitivity: 'critical',
  },
  {
    id: 'fda-review',
    label: 'FDA Review',
    avgYearsToExpiry: 5,
    typicalDataTypes: [
      'NDA/BLA submission',
      'Clinical study reports',
      'Chemistry/Manufacturing/Controls',
    ],
    sensitivity: 'high',
  },
  {
    id: 'post-market',
    label: 'Post-Market',
    avgYearsToExpiry: 2,
    typicalDataTypes: [
      'Adverse event reports',
      'Post-market surveillance',
      'Manufacturing batch records',
    ],
    sensitivity: 'high',
  },
]

export interface DrugPipelineEntry {
  id: string
  compoundName: string
  phase: DrugPhase
  commercialValueM: number
  currentEncryption: string
}

export const DEFAULT_DRUG_PIPELINE: DrugPipelineEntry[] = [
  {
    id: 'compound-1',
    compoundName: 'PQC-7291',
    phase: 'discovery',
    commercialValueM: 800,
    currentEncryption: 'RSA-2048',
  },
  {
    id: 'compound-2',
    compoundName: 'ABX-4415',
    phase: 'phase-2',
    commercialValueM: 3200,
    currentEncryption: 'AES-256-GCM',
  },
  {
    id: 'compound-3',
    compoundName: 'NRO-1182',
    phase: 'phase-3',
    commercialValueM: 5500,
    currentEncryption: 'ECDH P-256',
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
  hipaaMinimumYears: number
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
    hipaaMinimumYears: 6,
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
    hipaaMinimumYears: 6,
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
    hipaaMinimumYears: 6,
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
    hipaaMinimumYears: 6,
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
    hipaaMinimumYears: 6,
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
    hipaaMinimumYears: 6,
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
    hipaaMinimumYears: 6,
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
    hipaaMinimumYears: 6,
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
    hipaaMinimumYears: 6,
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
    hipaaMinimumYears: 6,
    stigmaFactors: ['Disability type', 'Functional limitations', 'Workplace accommodations'],
    applicableRegulations: ['HIPAA', 'ADA', 'State disability laws'],
    hndlExposure: 'high',
    pqcPriority: 6,
  },
]

// ── Medical Device Types ─────────────────────────────────────────────────

export type DeviceClass = 'I' | 'II' | 'III'

export type CommunicationProtocol =
  | 'bluetooth-le'
  | 'wifi'
  | 'zigbee'
  | 'wired-ethernet'
  | 'proprietary-rf'
  | 'nfc'

export type AttackVector =
  | 'firmware-forgery'
  | 'command-injection'
  | 'data-exfiltration'
  | 'denial-of-service'
  | 'replay-attack'

export type PatientImpact = 'nuisance' | 'injury' | 'life-threatening' | 'fatal'

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
        vector: 'command-injection',
        vectorLabel: 'Command Injection',
        patientImpact: 'fatal',
        quantumMechanism: 'Shor',
        currentDefense: 'Proprietary challenge-response (weak)',
        attackDescription:
          'Forged authentication allows malicious pacing commands — altering heart rate or disabling therapy.',
      },
      {
        vector: 'firmware-forgery',
        vectorLabel: 'Firmware Forgery',
        patientImpact: 'fatal',
        quantumMechanism: 'Shor',
        currentDefense: 'ECDSA P-256 firmware signature',
        attackDescription:
          'A quantum computer forges the firmware signature, enabling installation of malicious firmware during a clinic visit.',
      },
      {
        vector: 'data-exfiltration',
        vectorLabel: 'Data Exfiltration',
        patientImpact: 'nuisance',
        quantumMechanism: 'Shor',
        currentDefense: 'AES-CCM-128 encrypted telemetry',
        attackDescription:
          'Patient cardiac data intercepted during device interrogation. Privacy breach but no immediate physical harm.',
      },
    ],
    pqcFeasibility: [
      {
        algorithm: 'ML-DSA-44',
        feasible: false,
        rationale:
          'Signature verification exceeds available RAM on Cortex-M0+. Key size (1.3 KB public key) also strains flash.',
      },
      {
        algorithm: 'LMS (H5/W8)',
        feasible: true,
        rationale:
          'Hash-based signature verification needs only ~4 KB RAM. Suitable for firmware signing with limited update count.',
      },
      {
        algorithm: 'XMSS (H10)',
        feasible: true,
        rationale:
          'Similar to LMS with ~5 KB RAM for verification. State management is handled by the signing server, not the device.',
      },
      {
        algorithm: 'FN-DSA',
        feasible: true,
        rationale:
          'Fast signature verification with small key sizes and minimal RAM usage. Highly suitable for constrained Cortex-M0+ environments.',
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
        vectorLabel: 'Command Injection',
        patientImpact: 'fatal',
        quantumMechanism: 'Shor',
        currentDefense: 'BLE pairing with ECDH P-256',
        attackDescription:
          'Quantum-broken BLE pairing allows injection of lethal insulin bolus commands.',
      },
      {
        vector: 'replay-attack',
        vectorLabel: 'Replay Attack',
        patientImpact: 'life-threatening',
        quantumMechanism: 'Shor',
        currentDefense: 'Nonce-based AES-CCM',
        attackDescription:
          'Captured and replayed dose delivery commands could cause dangerous insulin stacking.',
      },
    ],
    pqcFeasibility: [
      {
        algorithm: 'ML-KEM-512',
        feasible: true,
        rationale:
          'BLE pairing can use ML-KEM-512 for key exchange. Cortex-M4 has sufficient RAM (256 KB) and compute.',
      },
      {
        algorithm: 'ML-DSA-44',
        feasible: true,
        rationale:
          'Cortex-M4 with 256 KB RAM can handle ML-DSA-44 signature verification for firmware updates.',
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
        vectorLabel: 'Drug Library Manipulation',
        patientImpact: 'life-threatening',
        quantumMechanism: 'Shor',
        currentDefense: 'TLS 1.2 with RSA-2048',
        attackDescription:
          'Man-in-the-middle attack modifies drug concentration limits in the infusion library, allowing dangerous over- or under-dosing.',
      },
      {
        vector: 'denial-of-service',
        vectorLabel: 'Denial of Service',
        patientImpact: 'injury',
        quantumMechanism: 'Shor',
        currentDefense: 'TLS session management',
        attackDescription:
          'Disrupting the TLS handshake prevents the pump from receiving updated drug libraries or reporting alarms to the nurse station.',
      },
    ],
    pqcFeasibility: [
      {
        algorithm: 'ML-KEM-768',
        feasible: true,
        rationale:
          'Cortex-A7 with 512 MB RAM can easily handle ML-KEM-768 TLS handshake. No resource constraints.',
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
        vectorLabel: 'Firmware Forgery',
        patientImpact: 'fatal',
        quantumMechanism: 'Shor',
        currentDefense: 'ECDSA P-256 code signing',
        attackDescription:
          'Forged firmware could alter ventilator pressure/volume settings, causing barotrauma or oxygen deprivation.',
      },
      {
        vector: 'data-exfiltration',
        vectorLabel: 'Patient Data Exfiltration',
        patientImpact: 'nuisance',
        quantumMechanism: 'Shor',
        currentDefense: 'TLS 1.2 channel encryption',
        attackDescription:
          'Intercepted HL7 messages reveal patient vitals, ventilator mode, and treatment parameters.',
      },
    ],
    pqcFeasibility: [
      {
        algorithm: 'ML-KEM-768',
        feasible: true,
        rationale: 'No resource constraints on Cortex-A53. Full ML-KEM-768 + ML-DSA-65 supported.',
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
        vectorLabel: 'Instrument Command Hijack',
        patientImpact: 'fatal',
        quantumMechanism: 'Shor',
        currentDefense: 'TLS 1.3 + mutual authentication',
        attackDescription:
          'Compromised TLS session allows injection of instrument movement commands during active surgery.',
      },
      {
        vector: 'denial-of-service',
        vectorLabel: 'Teleoperation Disruption',
        patientImpact: 'life-threatening',
        quantumMechanism: 'Shor',
        currentDefense: 'Dedicated network segment',
        attackDescription:
          'Disrupting the encrypted link between surgeon console and robot arms during a procedure.',
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
          'Highest security parameters recommended due to life-critical nature. No resource constraints.',
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
        vectorLabel: 'DICOM Image Interception',
        patientImpact: 'nuisance',
        quantumMechanism: 'Shor',
        currentDefense: 'DICOM TLS (RSA-2048)',
        attackDescription:
          'Intercepted medical images reveal diagnoses (tumors, fractures) and patient identity embedded in DICOM metadata.',
      },
      {
        vector: 'firmware-forgery',
        vectorLabel: 'Calibration Manipulation',
        patientImpact: 'injury',
        quantumMechanism: 'Shor',
        currentDefense: 'Vendor code signing',
        attackDescription:
          'Forged calibration firmware could cause incorrect imaging parameters, leading to misdiagnosis or excessive radiation (CT).',
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
      'Requires cryptographic risk assessment and Software Bill of Materials for new device submissions. Devices with 10-20 year lifecycles deploying now will operate into the CRQC era.',
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
      'No explicit PQC timeline yet, but healthcare data has long sensitivity periods making HNDL risk significant for long-lived ePHI. HITECH mandates strong encryption.',
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
      'Transition guidance recommending deprecation of 112-bit classical asymmetric algorithms by 2030 and disallowance by 2035.',
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

export const PHASE_COLORS: Record<DrugPhase, string> = {
  discovery: 'bg-secondary/20 text-secondary',
  preclinical: 'bg-primary/20 text-primary',
  'phase-1': 'bg-status-info/20 text-status-info',
  'phase-2': 'bg-status-warning/20 text-status-warning',
  'phase-3': 'bg-status-error/20 text-status-error',
  'fda-review': 'bg-status-success/20 text-status-success',
  'post-market': 'bg-muted text-muted-foreground',
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

export function computePharmaExposure(
  commercialValueM: number,
  yearsToExpiry: number,
  crqcYear: number
): { exposureM: number; atRisk: boolean } {
  const currentYear = new Date().getFullYear()
  const expiryYear = currentYear + yearsToExpiry
  const atRisk = expiryYear > crqcYear
  const prob = atRisk ? Math.min(1, (expiryYear - crqcYear) / 10) : 0
  const exposureM = Math.round(commercialValueM * prob * 100) / 100
  return { exposureM, atRisk }
}

export function scoreMigrationPriority(layer: HospitalLayerConfig): number {
  const sensitivityScore = { critical: 3, high: 2, medium: 1 }[layer.dataSensitivity]
  const internetScore = layer.internetFacing ? 3 : 1
  const vendorScore = { available: 1, preview: 2, planned: 3, none: 4 }[layer.vendorReadiness]
  return sensitivityScore * 2 + internetScore * 2 + vendorScore
}
