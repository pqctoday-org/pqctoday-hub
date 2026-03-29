// SPDX-License-Identifier: GPL-3.0-only
import type {
  VehicleLifecyclePhase,
  RegulationRegion,
  RegulationConfidence,
} from './automotiveConstants'

// ---------------------------------------------------------------------------
// Vehicle Lifecycle Phases with HSM Role
// ---------------------------------------------------------------------------

export interface LifecyclePhaseConfig {
  id: VehicleLifecyclePhase
  label: string
  typicalYears: number
  description: string
  cryptoActions: string[]
  hsmRole: string[]
  pqcRequirements: string[]
}

export const LIFECYCLE_PHASES: LifecyclePhaseConfig[] = [
  {
    id: 'production',
    label: 'Production & Provisioning',
    typicalYears: 1,
    description:
      'Vehicle assembly line: chip provisioning, key injection, certificate enrollment, ECU personalization. HSMs are critical at the factory for secure key generation and injection.',
    cryptoActions: [
      'Root key generation in OEM factory HSM (FIPS 140-3 Level 3)',
      'ECU identity key pair injection via secure key injection facility (KIF)',
      'V2X pseudonym certificate batch enrollment (IEEE 1609.2)',
      'Digital car key root certificate provisioning',
      'Immobilizer secret key programming',
      'OTA root-of-trust key installation',
    ],
    hsmRole: [
      'Factory HSM (nShield, Luna, Utimaco) generates and stores OEM root keys',
      'Key Injection Facility (KIF) HSM injects per-ECU keys via secure channel',
      'V2X Certificate Authority HSM signs pseudonym certificates in bulk',
      'Secure element (SE) in each ECU stores device-unique key pair',
      'Infotainment SoC embeds TPM 2.0 for measured boot and key storage',
    ],
    pqcRequirements: [
      'Generate ML-DSA key pairs in factory HSM for new vehicles (2027+)',
      'Dual-provision classical + PQC root keys for crypto-agility',
      'V2X CA must support hybrid ECDSA + ML-DSA certificate issuance',
    ],
  },
  {
    id: 'road-life',
    label: 'Road Life (In Service)',
    typicalYears: 18,
    description:
      'Vehicle on the road: daily authentication, OTA updates, telematics, V2X communication. In-vehicle HSMs/secure elements protect runtime keys and perform crypto operations.',
    cryptoActions: [
      'V2X message signing (10 signatures/sec per vehicle)',
      'Digital car key authentication (multiple daily)',
      'OTA firmware verification and installation',
      'Telematics TLS sessions to OEM cloud',
      'In-vehicle payment transactions (EV charging, tolling)',
      'ECU secure boot on every ignition cycle',
      'Pseudonym certificate rotation (weekly/monthly)',
      'Key rotation via OTA for compromised algorithms',
    ],
    hsmRole: [
      'ECU secure element (SHE 2.0 / EVITA Full) performs signing and verification',
      'Gateway ECU HSM verifies OTA firmware signatures before distribution',
      'V2X module HSM stores pseudonym private keys and performs real-time signing',
      'Infotainment TPM 2.0 manages payment credentials and app signing keys',
      'Central compute unit HSM aggregates sensor authentication for ADAS',
      'Body control module SE manages digital car key credentials',
    ],
    pqcRequirements: [
      'OTA crypto upgrade: push PQC firmware to HSM-capable ECUs',
      'Hybrid TLS 1.3 (ML-KEM + X25519) for telematics sessions',
      'V2X pseudonym certificate renewal with ML-DSA signatures',
      'Key rotation from ECDSA → ML-DSA via staged OTA campaign',
      'Monitor CRQC threat level; escalate migration timeline if needed',
    ],
  },
  {
    id: 'end-of-life',
    label: 'End of Life & Decommission',
    typicalYears: 1,
    description:
      'Vehicle retirement: secure key destruction, data sanitization, certificate revocation. HSMs ensure cryptographic material is properly destroyed.',
    cryptoActions: [
      'Revoke all V2X certificates at regional Certificate Authority',
      'Wipe ECU key material via secure erase command to secure elements',
      'Revoke digital car key credentials at OEM server',
      'Sanitize telematics data (GDPR right to erasure)',
      'Deregister vehicle identity from OEM fleet management',
      'Archive audit logs for regulatory compliance (7+ years)',
    ],
    hsmRole: [
      'ECU secure elements perform cryptographic key zeroization (NIST SP 800-88)',
      'OEM server HSM processes certificate revocation requests',
      'Factory HSM archives decommission audit trail',
      'Vehicle gateway HSM confirms key destruction before releasing chassis for recycling',
    ],
    pqcRequirements: [
      'Ensure PQC key material is included in zeroization procedures',
      'Verify all ML-KEM decapsulation keys are destroyed (prevents future decryption of HNDL data)',
      'Revoke hybrid certificates from both classical and PQC CRLs/OCSP',
    ],
  },
]

// ---------------------------------------------------------------------------
// Automotive HSM Tiers
// ---------------------------------------------------------------------------

export interface AutomotiveHSMTier {
  id: string
  name: string
  location: string
  standard: string
  fipsLevel: string
  pqcSupport: string
  typicalVendors: string[]
  keyTypes: string[]
  operationsPerSecond: string
  quantumThreat: string
}

export const AUTOMOTIVE_HSM_TIERS: AutomotiveHSMTier[] = [
  {
    id: 'factory-hsm',
    name: 'Factory / OEM Backend HSM',
    location: 'OEM data center & manufacturing facility',
    standard: 'FIPS 140-3 Level 3 / CC EAL4+',
    fipsLevel: 'Level 3',
    pqcSupport: 'Available (firmware upgrade from major vendors)',
    typicalVendors: ['Thales Luna', 'Entrust nShield', 'Utimaco CryptoServer', 'AWS CloudHSM'],
    keyTypes: ['OEM root CA keys', 'Code signing keys', 'V2X CA keys', 'Fleet management keys'],
    operationsPerSecond: '10,000+ RSA/ECDSA signs/sec',
    quantumThreat: 'Root CA keys are long-lived (10-20 years) — highest HNDL exposure',
  },
  {
    id: 'v2x-hsm',
    name: 'V2X Security Credential Management System (SCMS)',
    location: 'Regional V2X PKI infrastructure',
    standard: 'IEEE 1609.2 / ETSI TS 102 941',
    fipsLevel: 'Level 3',
    pqcSupport: 'IEEE 1609.2 PQC amendment in progress (ML-DSA + ML-KEM)',
    typicalVendors: ['Qualcomm / Autotalks SCMS', 'CAMP LLC (US V2X PKI)', 'C-ITS (EU V2X PKI)'],
    keyTypes: ['Root CA', 'Enrollment CA', 'Pseudonym CA', 'Linkage Authority keys'],
    operationsPerSecond: '50,000+ ECDSA pseudonym certs/sec',
    quantumThreat: 'Pseudonym CA compromise enables mass V2X forgery — critical infrastructure',
  },
  {
    id: 'gateway-hsm',
    name: 'Vehicle Gateway ECU HSM',
    location: 'Central gateway ECU in vehicle',
    standard: 'EVITA Full / SHE 2.0 / ISO 11452',
    fipsLevel: 'N/A (automotive-grade, not FIPS)',
    pqcSupport: 'Limited — depends on SoC vendor (NXP S32G, Infineon AURIX TC4x)',
    typicalVendors: ['NXP S32G (HSE)', 'Infineon AURIX TC4x (HSM)', 'Renesas R-Car (ICUMHA)'],
    keyTypes: [
      'OTA verification key',
      'Inter-ECU auth keys',
      'Telematics TLS key',
      'Secure boot key',
    ],
    operationsPerSecond: '1,000-5,000 ECDSA verifications/sec',
    quantumThreat:
      'OTA verification key compromise enables fleet-wide malicious firmware injection',
  },
  {
    id: 'ecu-se',
    name: 'ECU Secure Element (SE)',
    location: 'Individual ECU (embedded in SoC or discrete chip)',
    standard: 'SHE (Secure Hardware Extension) / EVITA Medium',
    fipsLevel: 'N/A',
    pqcSupport: 'Not yet — SHE spec limited to AES-128/CMAC; EVITA Medium adds ECDSA',
    typicalVendors: ['Infineon SLI 97', 'NXP SE050', 'Microchip ATECC608B'],
    keyTypes: ['Device-unique symmetric key', 'Secure boot hash', 'SecOC CMAC key'],
    operationsPerSecond: '100-500 AES-CMAC/sec',
    quantumThreat: 'Symmetric keys (AES) quantum-resistant. ECDSA-capable SEs need PQC upgrade.',
  },
  {
    id: 'tpm',
    name: 'TPM 2.0 (Infotainment / Telematics)',
    location: 'Infotainment head unit, telematics control unit',
    standard: 'TCG TPM 2.0 / ISO/IEC 11889',
    fipsLevel: 'Level 1-2 (varies)',
    pqcSupport: 'TCG PQC profile draft (2025) — ML-DSA + ML-KEM support planned',
    typicalVendors: ['Infineon OPTIGA TPM', 'STMicro ST33', 'Nuvoton NPCT75x'],
    keyTypes: [
      'Platform identity key',
      'Storage root key',
      'Attestation key',
      'TLS client cert key',
    ],
    operationsPerSecond: '50-200 RSA-2048 signs/sec',
    quantumThreat: 'Platform attestation keys are long-lived; HNDL risk for telemetry sessions',
  },
]

// ---------------------------------------------------------------------------
// Regulatory Compliance Milestones
// ---------------------------------------------------------------------------

export interface AutomotiveComplianceMilestone {
  id: string
  name: string
  authority: string
  region: RegulationRegion
  year: number
  quarter: string
  description: string
  pqcRelevance: 'direct' | 'indirect' | 'informational'
  confidence: RegulationConfidence
  affectedSystems: string[]
}

export const AUTOMOTIVE_COMPLIANCE_MILESTONES: AutomotiveComplianceMilestone[] = [
  {
    id: 'wp29-r155',
    name: 'UN ECE WP.29 R155 (Cybersecurity)',
    authority: 'UNECE',
    region: 'eu',
    year: 2022,
    quarter: 'Q3',
    description: 'Cybersecurity Management System mandatory for new vehicle type approvals in EU.',
    pqcRelevance: 'indirect',
    confidence: 'published',
    affectedSystems: ['All ECUs', 'OTA infrastructure', 'Telematics'],
  },
  {
    id: 'wp29-r156',
    name: 'UN ECE WP.29 R156 (Software Updates)',
    authority: 'UNECE',
    region: 'eu',
    year: 2022,
    quarter: 'Q3',
    description: 'Software Update Management System mandatory — secure OTA process required.',
    pqcRelevance: 'indirect',
    confidence: 'published',
    affectedSystems: ['OTA gateway', 'Firmware signing', 'Update verification'],
  },
  {
    id: 'wp29-all-vehicles',
    name: 'WP.29 R155/R156 Extended to All New Vehicles',
    authority: 'UNECE',
    region: 'eu',
    year: 2024,
    quarter: 'Q3',
    description: 'All new vehicles sold in EU must comply, not just new type approvals.',
    pqcRelevance: 'indirect',
    confidence: 'published',
    affectedSystems: ['All vehicles in production'],
  },
  {
    id: 'iso-sae-21434',
    name: 'ISO/SAE 21434 Cybersecurity Engineering',
    authority: 'ISO/SAE',
    region: 'eu',
    year: 2021,
    quarter: 'Q3',
    description: 'Full vehicle cybersecurity lifecycle standard — production to decommission.',
    pqcRelevance: 'direct',
    confidence: 'published',
    affectedSystems: ['All ECUs', 'Supply chain', 'Key management'],
  },
  {
    id: 'ieee-1609-pqc',
    name: 'IEEE 1609.2 PQC Amendment',
    authority: 'IEEE',
    region: 'us',
    year: 2025,
    quarter: 'Q4',
    description:
      'V2X security standard adds ML-KEM and ML-DSA support for post-quantum readiness. Amendment P1609.2/D1.2 in development; ratification expected Q4 2025–Q2 2026.',
    pqcRelevance: 'direct',
    confidence: 'in-development',
    affectedSystems: ['V2X module', 'V2X PKI/SCMS', 'Roadside units'],
  },
  {
    id: 'cnsa-2-firmware',
    name: 'CNSA 2.0 — Firmware Signing Deadline',
    authority: 'NSA',
    region: 'us',
    year: 2030,
    quarter: 'Q4',
    description:
      'All firmware/software signing must use LMS, XMSS, or ML-DSA by 2030. (Note: 2025 was set as a preference target).',
    pqcRelevance: 'direct',
    confidence: 'published',
    affectedSystems: ['ECU firmware signing', 'OTA infrastructure', 'Secure boot'],
  },
  {
    id: 'cnsa-2-full',
    name: 'CNSA 2.0 — Full PQC Transition',
    authority: 'NSA',
    region: 'us',
    year: 2033,
    quarter: 'Q4',
    description: 'All cryptographic operations must use PQC algorithms exclusively.',
    pqcRelevance: 'direct',
    confidence: 'published',
    affectedSystems: ['All vehicle crypto', 'Supply chain', 'Backend infrastructure'],
  },
  {
    id: 'china-gbt-pqc',
    name: 'China GB/T PQC Standard Release (Projected)',
    authority: 'TC 260 / OSCCA',
    region: 'china',
    year: 2026,
    quarter: 'Q4',
    description:
      'National PQC standard anticipated based on government roadmap signals — no official timeline published. Will drive PQC requirements for vehicles sold in China.',
    pqcRelevance: 'direct',
    confidence: 'projected',
    affectedSystems: ['All vehicles for China market', 'SM2 → national PQC migration'],
  },
  {
    id: 'japan-nisc-pqc',
    name: 'Japan NISC PQC Guidelines (Projected)',
    authority: 'NISC',
    region: 'japan',
    year: 2026,
    quarter: 'Q2',
    description:
      'Cybersecurity guidelines for critical infrastructure including connected vehicles. No official timeline published; date is an estimate based on Japan CRYPTREC activity.',
    pqcRelevance: 'indirect',
    confidence: 'projected',
    affectedSystems: ['Connected vehicle services', 'V2I infrastructure'],
  },
  {
    id: 'tisax-v7',
    name: 'TISAX v7 (Projected PQC Criteria)',
    authority: 'VDA / ENX',
    region: 'eu',
    year: 2027,
    quarter: 'Q1',
    description:
      'Automotive supply chain assessment anticipated to add PQC readiness criteria. VDA has not published a v7 roadmap; current version is TISAX v6 (2023).',
    pqcRelevance: 'direct',
    confidence: 'projected',
    affectedSystems: ['Tier-1/Tier-2 supplier crypto', 'Key management', 'Code signing'],
  },
]

// ---------------------------------------------------------------------------
// CRQC Vulnerability Window Calculator
// ---------------------------------------------------------------------------

export function computeVulnerabilityWindow(
  modelYear: number,
  roadLifeYears: number,
  crqcArrivalYear: number
): {
  vehicleEndYear: number
  vulnerableYears: number
  isVulnerable: boolean
  otaUpgradeWindows: number
  phases: { label: string; startYear: number; endYear: number; color: string }[]
} {
  const vehicleEndYear = modelYear + roadLifeYears
  const vulnerableYears = Math.max(0, vehicleEndYear - crqcArrivalYear)
  const isVulnerable = vulnerableYears > 0

  // OTA crypto upgrades typically every 3-5 years
  const otaUpgradeWindows = Math.floor(roadLifeYears / 4)

  const phases = [
    {
      label: 'Production',
      startYear: modelYear - 1,
      endYear: modelYear,
      color: 'bg-primary/30',
    },
    {
      label: 'Pre-CRQC Road Life',
      startYear: modelYear,
      endYear: Math.min(crqcArrivalYear, vehicleEndYear),
      color: 'bg-status-success/30',
    },
  ]

  if (isVulnerable) {
    phases.push({
      label: 'Post-CRQC Vulnerable',
      startYear: crqcArrivalYear,
      endYear: vehicleEndYear,
      color: 'bg-status-error/30',
    })
  }

  phases.push({
    label: 'End of Life',
    startYear: vehicleEndYear,
    endYear: vehicleEndYear + 1,
    color: 'bg-muted',
  })

  return { vehicleEndYear, vulnerableYears, isVulnerable, otaUpgradeWindows, phases }
}
