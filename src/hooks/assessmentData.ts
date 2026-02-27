import type { AssessmentInput } from './assessmentTypes'

export const ALGORITHM_DB: Record<
  string,
  { quantumVulnerable: boolean; replacement: string; notes: string }
> = {
  'RSA-2048': {
    quantumVulnerable: true,
    replacement: 'ML-KEM-768 / ML-DSA-65',
    notes: "Broken by Shor's algorithm. NIST targets deprecation by 2030.",
  },
  'RSA-3072': {
    quantumVulnerable: true,
    replacement: 'ML-KEM-768 / ML-DSA-65',
    notes: "Broken by Shor's algorithm. Extended deprecation timeline over RSA-2048.",
  },
  'RSA-4096': {
    quantumVulnerable: true,
    replacement: 'ML-KEM-1024 / ML-DSA-87',
    notes: "Broken by Shor's algorithm. Larger key provides no quantum resistance.",
  },
  'ECDSA P-256': {
    quantumVulnerable: true,
    replacement: 'ML-DSA-44',
    notes: "Broken by Shor's algorithm. Used widely in TLS and code signing.",
  },
  'ECDSA P-384': {
    quantumVulnerable: true,
    replacement: 'ML-DSA-65',
    notes: "Broken by Shor's algorithm.",
  },
  'ECDSA P-521': {
    quantumVulnerable: true,
    replacement: 'ML-DSA-87',
    notes: "Broken by Shor's algorithm. Highest NIST curve.",
  },
  'ECDH P-256': {
    quantumVulnerable: true,
    replacement: 'ML-KEM-768 (hybrid: ML-KEM-768 + X25519)',
    notes:
      "ECDH on P-256 curve. Key agreement vulnerable to Shor's algorithm. NIST recommends hybrid key exchange during transition.",
  },
  'ECDH P-384': {
    quantumVulnerable: true,
    replacement: 'ML-KEM-768 (hybrid: ML-KEM-768 + X25519)',
    notes:
      "ECDH on P-384 curve. Key agreement vulnerable to Shor's algorithm. NIST recommends hybrid key exchange during transition.",
  },
  'ECDH P-521': {
    quantumVulnerable: true,
    replacement: 'ML-KEM-1024 (hybrid: ML-KEM-1024 + X448)',
    notes:
      "ECDH on P-521 curve. Key agreement vulnerable to Shor's algorithm. NIST recommends hybrid key exchange during transition.",
  },
  Ed25519: {
    quantumVulnerable: true,
    replacement: 'ML-DSA-44',
    notes: 'Used in SSH, Solana. Vulnerable to quantum attack.',
  },
  Ed448: {
    quantumVulnerable: true,
    replacement: 'ML-DSA-65',
    notes: 'EdDSA on Curve448. Vulnerable to quantum attack.',
  },
  'DH (Diffie-Hellman)': {
    quantumVulnerable: true,
    replacement: 'ML-KEM-768 (hybrid: ML-KEM-768 + X25519)',
    notes:
      'Classic key exchange. Fully broken by quantum computers. NIST recommends hybrid key exchange during transition.',
  },
  'AES-128': {
    quantumVulnerable: false,
    replacement: 'AES-256 (recommended upgrade)',
    notes: "Grover's algorithm reduces security to ~64-bit. Upgrade to AES-256.",
  },
  'AES-192': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: "Grover's reduces to ~96-bit — provides good quantum margin.",
  },
  'AES-256': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: "Quantum-safe. Grover's reduces to ~128-bit, still secure.",
  },
  'SHA-256': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: "Quantum-safe at current sizes. Grover's has limited impact on hash functions.",
  },
  'SHA-3': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: 'Quantum-safe. Modern hash function with strong security margins.',
  },
  '3DES': {
    quantumVulnerable: false,
    replacement: 'AES-256 (regardless of quantum)',
    notes: 'Already deprecated for classical security reasons. Migrate immediately.',
  },
  'ChaCha20-Poly1305': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: 'Symmetric stream cipher. Quantum-safe at current key sizes.',
  },
  'HMAC-SHA256': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: 'MAC function. Not affected by quantum computers.',
  },
  X25519: {
    quantumVulnerable: true,
    replacement: 'ML-KEM-768 (hybrid: ML-KEM-768 + X25519)',
    notes:
      "Curve25519 key exchange. Vulnerable to Shor's algorithm. Widely used in TLS 1.3; hybrid mode already deployed in Chrome/Firefox.",
  },
  X448: {
    quantumVulnerable: true,
    replacement: 'ML-KEM-1024 (hybrid: ML-KEM-1024 + X448)',
    notes: "Curve448 key exchange. Vulnerable to Shor's algorithm.",
  },
  secp256k1: {
    quantumVulnerable: true,
    replacement: 'ML-DSA-44',
    notes: 'Used in Bitcoin/Ethereum. Vulnerable to quantum attack.',
  },
  // ── NIST PQC Standards (FIPS 203/204/205) — quantum-safe ──
  'ML-KEM-512': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: 'FIPS 203 (2024). NIST Level 1 KEM. Quantum-safe key encapsulation.',
  },
  'ML-KEM-768': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: 'FIPS 203 (2024). NIST Level 3 KEM. Recommended default for most applications.',
  },
  'ML-KEM-1024': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: 'FIPS 203 (2024). NIST Level 5 KEM. Highest security level.',
  },
  'ML-DSA-44': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: 'FIPS 204 (2024). NIST Level 2 digital signature. Replaces ECDSA P-256 / Ed25519.',
  },
  'ML-DSA-65': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: 'FIPS 204 (2024). NIST Level 3 digital signature. Replaces ECDSA P-384 / RSA-3072.',
  },
  'ML-DSA-87': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: 'FIPS 204 (2024). NIST Level 5 digital signature. Replaces RSA-4096.',
  },
  'SLH-DSA-128': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: 'FIPS 205 (2024). Stateless hash-based signature. Conservative fallback to ML-DSA.',
  },
  'SLH-DSA-192': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: 'FIPS 205 (2024). NIST Level 3 hash-based signature.',
  },
  'SLH-DSA-256': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: 'FIPS 205 (2024). NIST Level 5 hash-based signature.',
  },
  'LMS/HSS': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes:
      'SP 800-208 (2020). Stateful hash-based signature for firmware/boot. Requires strict state management.',
  },
  'XMSS/XMSS^MT': {
    quantumVulnerable: false,
    replacement: 'No change needed',
    notes: 'RFC 8391 (2018). Stateful hash-based signature. Used in specialized firmware signing.',
  },
}
export const VULNERABLE_ALGORITHMS = new Set(
  Object.entries(ALGORITHM_DB)
    .filter(([, info]) => info.quantumVulnerable)
    .map(([name]) => name)
)
/** Signature algorithms vulnerable to Shor's algorithm (HNFL targets). */
export const SIGNING_ALGORITHMS = new Set([
  'RSA-2048',
  'RSA-3072',
  'RSA-4096',
  'ECDSA P-256',
  'ECDSA P-384',
  'ECDSA P-521',
  'Ed25519',
  'Ed448',
  'secp256k1',
])
// Compliance data now comes from the dedicated compliance CSV (single source of truth)
import { complianceDB } from '@/data/complianceData'
export const COMPLIANCE_DB: Record<
  string,
  { requiresPQC: boolean; deadline: string; notes: string }
> = complianceDB
/** Expose compliance deadline/notes for UI tooltips in the wizard. */
export const COMPLIANCE_DESCRIPTIONS: Record<string, { deadline: string; notes: string }> =
  Object.fromEntries(
    Object.entries(COMPLIANCE_DB).map(([k, v]) => [k, { deadline: v.deadline, notes: v.notes }])
  )
export const AVAILABLE_DATA_RETENTION: string[] = [
  'under-1y',
  '1-5y',
  '5-10y',
  '10-25y',
  '25-plus',
  'indefinite',
]
export const AVAILABLE_SYSTEM_COUNTS: AssessmentInput['systemCount'][] = [
  '1-10',
  '11-50',
  '51-200',
  '200-plus',
]
export const AVAILABLE_TEAM_SIZES: AssessmentInput['teamSize'][] = [
  '1-10',
  '11-50',
  '51-200',
  '200-plus',
]
/**
 * Industry quantum-threat base scores (0–30).
 * Derived from CISA critical infrastructure designations, sector-specific HNDL/HNFL
 * exposure profiles, and regulatory urgency timelines.
 * Sources: CISA Critical Infrastructure Sectors, NIST CNSA 2.0 (2022), EU NIS2 Directive (2022).
 */
export const INDUSTRY_THREAT: Record<string, number> = {
  'Finance & Banking': 25, // PCI DSS, SWIFT, DORA; high HNDL (transaction records) + HNFL (code signing)
  'Government & Defense': 30, // CNSA 2.0, CISA; highest: classified data HNDL + national security
  Healthcare: 20, // HIPAA, long patient data retention; high HNDL
  Telecommunications: 20, // 5G/SIM provisioning, NIS2; high infrastructure complexity
  Technology: 15, // Broad but less regulated; agile migration capability
  'Energy & Utilities': 20, // SCADA/OT, NERC CIP, NIS2; long-lived embedded systems
  Automotive: 15, // V2X, ECU secure boot; 15+ year vehicle lifetime HNFL
  Aerospace: 25, // 40+ year asset lifetime; extreme HNDL/HNFL exposure
  'Retail & E-Commerce': 10, // PCI DSS; shorter data retention, faster migration cycles
  Other: 10, // Baseline default
}
export const ALGORITHM_WEIGHTS: Record<string, number> = {
  'RSA-2048': 10,
  'RSA-3072': 9,
  'RSA-4096': 8,
  'ECDSA P-256': 10,
  'ECDSA P-384': 6,
  'ECDH P-256': 10,
  'ECDH P-384': 8,
  'ECDH P-521': 6,
  Ed25519: 6,
  'DH (Diffie-Hellman)': 4,
  X25519: 8,
  secp256k1: 6,
}
export const DEFAULT_ALGORITHM_WEIGHT = 8
export const DATA_SENSITIVITY_SCORES: Record<string, number> = {
  low: 0,
  medium: 5,
  high: 15,
  critical: 25,
}
export const MIGRATION_STATUS_SCORES: Record<string, number> = {
  started: -20,
  planning: -10,
  'not-started': 10,
  unknown: 15,
}
export const USE_CASE_WEIGHTS: Record<
  string,
  { hndlRelevance: number; migrationPriority: number; hnflRelevance: number }
> = {
  'TLS/HTTPS': { hndlRelevance: 6, migrationPriority: 10, hnflRelevance: 5 },
  'Data-at-rest encryption': { hndlRelevance: 9, migrationPriority: 7, hnflRelevance: 1 },
  'Digital signatures / code signing': {
    hndlRelevance: 3,
    migrationPriority: 8,
    hnflRelevance: 10,
  },
  'Key exchange / agreement': { hndlRelevance: 8, migrationPriority: 9, hnflRelevance: 2 },
  'Authentication / identity': { hndlRelevance: 4, migrationPriority: 7, hnflRelevance: 7 },
  'Blockchain / cryptocurrency': { hndlRelevance: 5, migrationPriority: 6, hnflRelevance: 8 },
  'Email encryption (S/MIME, PGP)': { hndlRelevance: 7, migrationPriority: 5, hnflRelevance: 6 },
  'VPN / IPSec': { hndlRelevance: 7, migrationPriority: 8, hnflRelevance: 4 },
  'IoT device communication': { hndlRelevance: 5, migrationPriority: 6, hnflRelevance: 5 },
  'Database encryption': { hndlRelevance: 8, migrationPriority: 7, hnflRelevance: 1 },
  // ── Industry-specific use cases (from pqcassessment CSV) ──
  'SIM/eSIM provisioning': { hndlRelevance: 8, migrationPriority: 9, hnflRelevance: 4 },
  '5G network slicing security': { hndlRelevance: 7, migrationPriority: 8, hnflRelevance: 4 },
  'SS7/Diameter protocol security': { hndlRelevance: 6, migrationPriority: 8, hnflRelevance: 3 },
  'SWIFT messaging integrity': { hndlRelevance: 9, migrationPriority: 9, hnflRelevance: 8 },
  'Trading system code signing': { hndlRelevance: 5, migrationPriority: 8, hnflRelevance: 9 },
  'Card payment encryption': { hndlRelevance: 6, migrationPriority: 7, hnflRelevance: 2 },
  'Medical device communication': { hndlRelevance: 8, migrationPriority: 9, hnflRelevance: 4 },
  'EHR/FHIR data exchange': { hndlRelevance: 9, migrationPriority: 8, hnflRelevance: 3 },
  'V2X communication': { hndlRelevance: 7, migrationPriority: 9, hnflRelevance: 6 },
  'OTA firmware updates': { hndlRelevance: 5, migrationPriority: 9, hnflRelevance: 9 },
  'ECU secure boot': { hndlRelevance: 4, migrationPriority: 8, hnflRelevance: 9 },
  'SCADA/OT system security': { hndlRelevance: 8, migrationPriority: 9, hnflRelevance: 5 },
  'Smart meter communication': { hndlRelevance: 7, migrationPriority: 7, hnflRelevance: 4 },
  'Avionics communication': { hndlRelevance: 8, migrationPriority: 10, hnflRelevance: 7 },
  'Satellite link encryption': { hndlRelevance: 10, migrationPriority: 9, hnflRelevance: 4 },
  'PKI / HSPD-12': { hndlRelevance: 6, migrationPriority: 9, hnflRelevance: 10 },
  'Classified data exchange': { hndlRelevance: 10, migrationPriority: 10, hnflRelevance: 7 },
  'DNS/DNSSEC': { hndlRelevance: 3, migrationPriority: 8, hnflRelevance: 9 },
  'Timestamping services': { hndlRelevance: 9, migrationPriority: 7, hnflRelevance: 9 },
  'Backup/archive encryption': { hndlRelevance: 9, migrationPriority: 6, hnflRelevance: 1 },
  'API gateway / microservices': { hndlRelevance: 5, migrationPriority: 8, hnflRelevance: 5 },
  'Secure boot (non-automotive)': { hndlRelevance: 4, migrationPriority: 8, hnflRelevance: 9 },
}
export const DATA_RETENTION_YEARS: Record<string, number> = {
  'under-1y': 1,
  '1-5y': 5,
  '5-10y': 10,
  '10-25y': 25,
  '25-plus': 30,
  indefinite: 50,
  // ── Industry-specific retention periods (from pqcassessment CSV) ──
  '2y': 2,
  '6y': 6,
  '7y': 7,
  '75y-plus': 75,
  permanent: 100,
}
/** Credential / signature lifetime → years (parallel to DATA_RETENTION_YEARS for HNFL). */
export const CREDENTIAL_LIFETIME_YEARS: Record<string, number> = {
  'under-1y': 1,
  '1-3y': 3,
  '3-10y': 10,
  '10-25y': 25,
  '25-plus': 30,
  indefinite: 100,
}
export const AGILITY_COMPLEXITY: Record<string, number> = {
  'fully-abstracted': 0.2,
  'partially-abstracted': 0.5,
  hardcoded: 0.9,
  unknown: 0.75, // conservative but not worst-case — softer than confirmed hardcoded
}
export const INFRA_COMPLEXITY: Record<string, number> = {
  Hardware: 15, // HSMs, Smart Cards, QRNG, Secure Boot — hardest to migrate
  'Security Stack': 12, // PKI, KMS, IAM, CLM
  OS: 11, // Operating Systems, Network OS
  Network: 10, // VPN, IPsec, 5G
  Application: 8, // TLS/SSL, SSH, PQC libraries, email, code signing
  Cloud: 6, // Cloud KMS/HSM — vendor-managed, easier path
  Database: 6, // Database encryption software
}
export const SYSTEM_SCALE: Record<string, number> = {
  '1-10': 1.0,
  '11-50': 1.3,
  '51-200': 1.6,
  '200-plus': 2.0,
}
export const TEAM_CAPACITY: Record<string, number> = {
  '1-10': 0.4,
  '11-50': 0.6,
  '51-200': 0.8,
  '200-plus': 1.0,
}
export const VENDOR_DEPENDENCY_WEIGHT: Record<string, number> = {
  'heavy-vendor': 20,
  mixed: 10,
  'open-source': 5,
  'in-house': 3,
}
export const TIMELINE_URGENCY: Record<string, number> = {
  'within-1y': 1.3,
  'within-2-3y': 1.15,
  'internal-deadline': 1.05,
  'no-deadline': 1.0,
  unknown: 1.2, // not knowing is worse than no deadline — assume near-term pressure
}
/**
 * Country-specific regulatory urgency scores (0–12) for risk scoring.
 * Based on published national PQC mandates, advisory timelines, and regulatory frameworks.
 * Sources: NSA CNSA 2.0 (Sept 2022), ANSSI Avis (Jan 2024), BSI TR-02102 (2023),
 * INCD Advisory (2024), NCSC White Paper (2023), ASD ISM (2024), CCCS ITSAP.00.017 (2023),
 * OSCCA NGCC Program (2023), MAS Circular (2024), CRYPTREC PQC Report (2023),
 * MSIT/KpqC Roadmap (2024), EU NIS2 Directive (2022), EU DORA (2023).
 */
export const COUNTRY_REGULATORY_URGENCY: Record<string, number> = {
  'United States': 12, // CNSA 2.0 mandates, FedRAMP, FIPS 140-3, OMB M-23-02
  France: 10, // ANSSI 2025 PQC readiness mandate, hybrid TLS requirement
  Germany: 8, // BSI TR-02102 PQC guidance, NIS2 transposition
  Israel: 10, // INCD 2027 planning deadline, BOI directive — urgency matches early horizon
  Netherlands: 7, // NIS2, AIVD quantum threat advisory (2023)
  'United Kingdom': 7, // NCSC PQC White Paper (Nov 2023)
  Australia: 6, // ASD ISM PQC controls (2024)
  Canada: 6, // CCCS ITSAP.00.017, CCCS-2023 PQC guidance
  China: 6, // OSCCA NGCC program (2027-2030 financial sector)
  'New Zealand': 6, // NZISM v3.9, Five Eyes aligned
  Singapore: 6, // MAS PQC advisory circular (2024)
  Spain: 6, // NIS2 transposition
  Italy: 6, // NIS2 transposition
  Belgium: 6, // NIS2 transposition
  Sweden: 6, // NIS2 transposition
  Japan: 5, // CRYPTREC PQC evaluation report (2023)
  'South Korea': 5, // KpqC standardization, MSIT roadmap (2024)
  Denmark: 5, // NIS2 transposition
  'Czech Republic': 6, // NIS2, DORA, eIDAS 2.0, EU-REC-2024-1101
  India: 4, // DSCI/CERT-In PQC awareness, no formal mandate yet
  Brazil: 3, // ITI/ICP-Brasil PQC study group, early stage
  'United Arab Emirates': 4, // NESA guidance, financial sector PQC pilot
  Switzerland: 6, // NCSC-CH PQC recommendations, aligned with EU NIS2
  Norway: 6, // NIS2 transposition via EEA
  Finland: 6, // NIS2 transposition
  Austria: 6, // NIS2 transposition
  Poland: 5, // NIS2 transposition, early adoption
  Taiwan: 5, // NICS PQC study, semiconductor supply chain focus
}
export const ESTIMATED_QUANTUM_THREAT_YEAR = 2035
/**
 * Country-specific regulatory planning horizons (earliest hard deadline year).
 * Sources same as COUNTRY_REGULATORY_URGENCY above.
 */
export const COUNTRY_PLANNING_HORIZON: Record<string, number> = {
  'United States': 2030, // CNSA 2.0 software deprecation by 2030
  Israel: 2027, // INCD inventory & planning phase ends 2027
  France: 2030, // ANSSI hybrid TLS mandate effective 2025, full migration by 2030
  Canada: 2030, // CCCS targets 2030 alignment with US CNSA 2.0
  China: 2030, // NGCC financial sector migration estimate
  'New Zealand': 2030, // NZISM transition phase target, Five Eyes aligned
  Singapore: 2030, // MAS advisory alignment with US/UK timelines
  'Czech Republic': 2030, // NIS2/DORA effective, EU critical systems deadline
  Switzerland: 2030, // Aligned with EU NIS2 critical systems
  Norway: 2030, // NIS2 via EEA, aligned with EU critical systems
  'South Korea': 2035, // KpqC full migration roadmap
  Germany: 2035, // BSI guidance
  'United Kingdom': 2035, // NCSC
  Australia: 2035, // ASD ISM
  Japan: 2035, // CRYPTREC guidelines
  Finland: 2030, // NIS2 critical infrastructure
  Austria: 2030, // NIS2 critical infrastructure
  Taiwan: 2035, // NICS study ongoing, no hard deadline yet
}
/** Industry-specific composite score weights (must sum to 1.0). */
export const INDUSTRY_COMPOSITE_WEIGHTS: Record<
  string,
  { qe: number; mc: number; rp: number; or: number }
> = {
  'Government & Defense': { qe: 0.3, mc: 0.15, rp: 0.3, or: 0.25 },
  'Finance & Banking': { qe: 0.3, mc: 0.2, rp: 0.3, or: 0.2 },
  Healthcare: { qe: 0.3, mc: 0.2, rp: 0.25, or: 0.25 },
  Telecommunications: { qe: 0.3, mc: 0.25, rp: 0.2, or: 0.25 },
  Technology: { qe: 0.35, mc: 0.2, rp: 0.15, or: 0.3 },
  'Energy & Utilities': { qe: 0.3, mc: 0.25, rp: 0.2, or: 0.25 },
  Automotive: { qe: 0.3, mc: 0.25, rp: 0.2, or: 0.25 },
  Aerospace: { qe: 0.3, mc: 0.25, rp: 0.25, or: 0.2 },
  'Retail & E-Commerce': { qe: 0.35, mc: 0.2, rp: 0.2, or: 0.25 },
  Other: { qe: 0.35, mc: 0.2, rp: 0.2, or: 0.25 },
}
export const DEFAULT_COMPOSITE_WEIGHTS = { qe: 0.35, mc: 0.2, rp: 0.2, or: 0.25 }
export const AVAILABLE_INDUSTRIES = Object.keys(INDUSTRY_THREAT)
export const AVAILABLE_ALGORITHMS = Object.keys(ALGORITHM_DB)
export const AVAILABLE_COMPLIANCE = Object.keys(COMPLIANCE_DB)
export const AVAILABLE_USE_CASES = Object.keys(USE_CASE_WEIGHTS)
export const AVAILABLE_INFRASTRUCTURE = Object.keys(INFRA_COMPLEXITY)
export const AVAILABLE_CREDENTIAL_LIFETIME: string[] = [
  'under-1y',
  '1-3y',
  '3-10y',
  '10-25y',
  '25-plus',
  'indefinite',
]
