// SPDX-License-Identifier: AGPL-3.0-only
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
      'V2X CA: PQC certificate issuance once a V2X PQC profile exists (none identified publicly; ETSI TR 103 949 suggests a hybrid mode is not adopted, subject to more detailed analysis)',
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
      'Hybrid TLS 1.3 (ML-KEM + X25519, RFC 10024) for telematics sessions',
      'V2X pseudonym certificate renewal with ML-DSA signatures, once a V2X PQC profile exists',
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
      'Ensure PQC key material is included in zeroization procedures, including keys held in secure elements, backups and backend escrow; destruction cannot reach copies that were exported or already compromised, and cannot recover anything retroactively',
      'Destroy ML-KEM decapsulation keys wherever they exist (device, backup, escrow). This limits what a scrapped or resold vehicle exposes about recorded sessions; it is key hygiene, not a defence against harvest-now-decrypt-later, which targets classical key exchange and is addressed by using PQC key exchange when the data is sent',
      'Revoke hybrid certificates from both classical and PQC CRLs/OCSP. Signature keys protect authenticity, so their risk is future forgery, not harvest-now-decrypt-later; revocation limits later misuse but does not undo forgeries already accepted',
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
    standard:
      'FIPS 140-3 Level 3 / CC EAL4 augmented (check the certificate for the named components)',
    fipsLevel: 'Level 3',
    pqcSupport: 'Available (firmware upgrade from major vendors)',
    typicalVendors: ['Thales Luna', 'Entrust nShield', 'Utimaco CryptoServer', 'AWS CloudHSM'],
    keyTypes: ['OEM root CA keys', 'Code signing keys', 'V2X CA keys', 'Fleet management keys'],
    operationsPerSecond: '10,000+ RSA/ECDSA signs/sec',
    quantumThreat:
      'Root CA keys are long-lived (10-20 years): signing keys, so the exposure is future forgery of everything chained to them, not harvest-now-decrypt-later',
  },
  {
    id: 'v2x-hsm',
    name: 'V2X Security Credential Management System (SCMS)',
    location: 'Regional V2X PKI infrastructure',
    standard:
      'IEEE 1609.2 / ETSI TS 102 941; EU C-ITS Certificate Policy 3.0 (Common Criteria, EAL4 or higher)',
    fipsLevel: 'Not required by EU C-ITS CP 3.0 (Common Criteria applies)',
    // CORRECTED 2026-08-23: read "IEEE 1609.2 PQC amendment in progress (ML-DSA + ML-KEM)".
    // No such amendment is identified in the public specifications: IEEE 1609.2-2025 and
    // ETSI TS 103 097 V2.2.1 (2026-03) specify ECC/ECDSA. ETSI TR 103 949 V1.1.1 (2023-05)
    // is a quantum-safe migration study for ITS and C-ITS, not a standard amendment.
    pqcSupport:
      'No public PQC amendment identified; IEEE 1609.2-2025 and ETSI TS 103 097 specify ECC/ECDSA. ETSI TR 103 949 (2023) is a quantum-safe migration study',
    typicalVendors: ['Qualcomm / Autotalks SCMS', 'CAMP LLC (US V2X PKI)', 'C-ITS (EU V2X PKI)'],
    keyTypes: ['Root CA', 'Enrollment CA', 'Pseudonym CA', 'Linkage Authority keys'],
    operationsPerSecond: '50,000+ ECDSA pseudonym certs/sec',
    quantumThreat: 'Pseudonym CA compromise enables mass V2X forgery — critical infrastructure',
  },
  {
    id: 'gateway-hsm',
    name: 'Vehicle Gateway ECU HSM',
    location: 'Central gateway ECU in vehicle',
    // ISO 11452 is the road-vehicle EMC immunity test series (ISO 11452-1: "Component test methods for
    // electrical disturbances from narrowband radiated electromagnetic energy"), not a security profile.
    standard:
      'Vendor hardware security profile (SHE-class module): the profile, scope and version come from the SoC vendor, so check its datasheet and certificates',
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
    pqcSupport:
      'TCG TPM 2.0 v185 (March 2026) includes ML-KEM (including endorsement keys) and ML-DSA (including attestation keys). Vendor-stated: Infineon OPTIGA TPM SLB 9672 and SLB 9673 use XMSS for firmware updates',
    typicalVendors: ['Infineon OPTIGA TPM', 'STMicro ST33', 'Nuvoton NPCT75x'],
    keyTypes: [
      'Platform identity key',
      'Storage root key',
      'Attestation key',
      'TLS client cert key',
    ],
    operationsPerSecond: '50-200 RSA-2048 signs/sec',
    quantumThreat:
      'Platform attestation keys are long-lived signing keys: the exposure is forged attestation. Telemetry sessions carry a separate harvest-now-decrypt-later risk if they use classical key exchange',
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
  /**
   * Canonical id in compliance_*.csv — for tooling cross-reference only.
   * year is a phase-specific deadline (more granular than the CSV top-level range)
   * and is maintained here, not derived from the CSV.
   */
  csvId?: string
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
    description:
      "UN Regulation No. 156 sets requirements for a Software Update Management System, including secure over-the-air updates, for vehicle type approval. The 2022 Q3 EU application date shown is this module's assumption and has not been checked against the regulation text.",
    pqcRelevance: 'indirect',
    confidence: 'published',
    affectedSystems: ['OTA gateway', 'Firmware signing', 'Update verification'],
  },
  {
    id: 'wp29-all-vehicles',
    name: 'EU: Cyberattack Protection Applies to All New Vehicles',
    authority: 'EU (Regulation 2019/2144)',
    region: 'eu',
    year: 2024,
    quarter: 'Q3',
    description:
      'Regulation (EU) 2019/2144, Annex II item D4 (protection of the vehicle against cyberattacks), lets authorities refuse EU type-approval of new vehicle types from 6 July 2022 and prohibit registration of non-compliant new vehicles from 7 July 2024, for the vehicle categories marked in that table. This is the EU rule only: other markets apply UN Regulations R155 and R156 through their own type-approval rules and dates.',
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
    description:
      'Cybersecurity engineering standard for road-vehicle E/E systems, from concept and development to production, operation, maintenance and decommissioning. It was published in 2021, before FIPS 203 and FIPS 204.',
    pqcRelevance: 'indirect',
    confidence: 'published',
    affectedSystems: ['All ECUs', 'Supply chain', 'Key management'],
  },
  {
    id: 'etsi-tr-103-949',
    name: 'ETSI TR 103 949 — Quantum-Safe Migration Study for ITS',
    authority: 'ETSI',
    region: 'eu',
    year: 2023,
    quarter: 'Q2',
    description:
      'ETSI TR 103 949 (V1.1.1, May 2023) is a technical report, not a standard: a quantum-safe migration study for ITS and C-ITS. The public V2X specifications still use ECC: IEEE 1609.2-2025 specifies ECC-based security services, ETSI TS 103 097 approves ECDSA, and no public post-quantum amendment is identified.',
    pqcRelevance: 'direct',
    confidence: 'published',
    affectedSystems: ['V2X module', 'V2X PKI/SCMS', 'Roadside units'],
  },
  {
    id: 'cnsa-2-firmware',
    csvId: 'CNSA-2',
    name: 'CNSA 2.0 — Firmware Signing Deadline (National Security Systems)',
    authority: 'NSA',
    region: 'us',
    year: 2030,
    quarter: 'Q4',
    description:
      'For National Security Systems (NSS), NSA’s CNSA 2.0 advisory anticipates 2025 to support and prefer CNSA 2.0 for software and firmware signing and 2030 to use it exclusively. LMS and XMSS from NIST SP 800-208 are approved for firmware signing (not HSS or XMSS^MT), and validated ML-DSA is approved for all signing use cases. CNSA 2.0 algorithms are required in all new NSS acquisitions from 1 January 2027. For vehicles outside NSS this is a reference timeline.',
    pqcRelevance: 'direct',
    confidence: 'published',
    affectedSystems: [
      'Firmware signing (NSS scope)',
      'OTA infrastructure (NSS scope)',
      'Secure boot (NSS scope)',
    ],
  },
  {
    id: 'cnsa-2-mandate',
    csvId: 'CNSA-2',
    name: 'CNSA 2.0 — General Algorithm Mandate (National Security Systems)',
    authority: 'NSA',
    region: 'us',
    year: 2031,
    quarter: 'Q4',
    description:
      'FAQ version 2.2 mandates CNSA 2.0 algorithms for NSS by 31 December 2031 unless otherwise noted, after the 2030 phase-out milestone for unsupported equipment and services. NSM-10 separately sets a broader 2035 quantum-risk objective. These dates apply to National Security Systems; for other vehicles this is a reference timeline.',
    pqcRelevance: 'direct',
    confidence: 'published',
    affectedSystems: [
      'Vehicle crypto (NSS scope)',
      'NSS supply chain',
      'Backend infrastructure (NSS scope)',
    ],
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
    name: 'VDA ISA2027 (TISAX catalogue)',
    authority: 'VDA / ENX',
    region: 'eu',
    year: 2027,
    quarter: 'Q1',
    description:
      'VDA published the next ISA catalogue, ISA2027, on 1 July 2026; it applies to TISAX assessments ordered from 1 January 2027, and ISA 6 (2023) remains current until then. Its cryptography control (5.1.1 in ISA2027.1) asks how the use of cryptographic procedures is managed; the catalogue contains no post-quantum criteria, so any PQC expectation from a customer is that customer\u2019s own requirement.',
    pqcRelevance: 'indirect',
    confidence: 'published',
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
